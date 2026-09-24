import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import juggleModule from '../lib/originals/embaixadinha/juggle.ts'
import engineModule from '../lib/originals/embaixadinha/engine.ts'
import motionModule from '../components/originals/embaixadinha/juggle-motion.ts'
import sessionModule from '../lib/originals/session.ts'
import definitionModule from '../lib/originals/embaixadinha/definition.ts'
import copyModule from '../lib/originals/embaixadinha/copy.ts'

const { TOUCHES, LAST_TOUCH, MAX_MULTIPLIER, GROWTH_MS, SURVIVAL, PREPARING_MS, DROP_MS, touchIndexAt, survivalTo, failingTouch, expectedReturn, failVariant, multiplierAt, timeToMultiplier, FAIL_VARIANTS } = juggleModule
const { createJuggleEngine, payoutFor } = engineModule
const { ballInFlight, simulateEscape, sampleEscape, poseAt, BALL_REST, BALL_RADIUS, CONTACT_POSES } = motionModule
const { createDemoSessionStore } = sessionModule
const { EMBAIXADINHA, EMBAIXADINHA_ASSETS } = definitionModule
const { embaixadinhaCopy, parseAutoInput } = copyModule

/** Uniform 32-bit sample that makes `index` the failing touch. */
const sampleFor = index => Math.floor((1 - SURVIVAL * Math.exp(-(TOUCHES[index].at + 1) / GROWTH_MS)) * 2 ** 32)
function harness(fail, options = {}) {
  let at = 0, id = 0
  const wallet = createDemoSessionStore(() => null)
  const engine = createJuggleEngine(wallet, { now: () => at, random: { uint32: () => sampleFor(fail) }, id: () => `juggle-${++id}`, ...options })
  const advance = ms => { at += ms; engine.tick() }
  return { wallet, engine, advance, set: ms => { at = ms; engine.tick() }, time: () => at }
}

test('embaixadinha: one public touch schedule from 1.00× to the 100× cap', () => {
  assert.equal(TOUCHES[0].at, 0); assert.equal(TOUCHES[0].kind, 'flick'); assert.equal(TOUCHES[0].multiplier, 100)
  for (let i = 1; i < TOUCHES.length; i++) {
    assert.ok(TOUCHES[i].at > TOUCHES[i - 1].at); assert.equal(TOUCHES[i].at - TOUCHES[i - 1].at, TOUCHES[i - 1].hang)
    assert.equal(TOUCHES[i].multiplier, multiplierAt(TOUCHES[i].at))
  }
  assert.equal(TOUCHES[LAST_TOUCH].multiplier, MAX_MULTIPLIER)
  assert.ok(Object.isFrozen(TOUCHES) && Object.isFrozen(TOUCHES[3]))
  // Early touches are simple right-foot controls; later tiers mix feet and thighs with higher arcs.
  assert.ok(TOUCHES.slice(1, 9).every(t => t.kind === 'right-foot' && t.tier === 0))
  assert.ok(TOUCHES.slice(9, 23).some(t => t.kind.endsWith('thigh')) && TOUCHES.slice(9, 23).some(t => t.kind === 'left-foot'))
  assert.ok(TOUCHES.slice(23).some(t => t.hang >= 600) && TOUCHES.slice(23).every(t => t.tier === 2))
  assert.equal(touchIndexAt(-1), -1); assert.equal(touchIndexAt(0), 0)
  for (const t of TOUCHES) { assert.equal(touchIndexAt(t.at), t.index); if (t.index) assert.equal(touchIndexAt(t.at - 1), t.index - 1) }
})

test('embaixadinha: failing-touch sampling matches the survival curve and never exceeds the cap', () => {
  assert.equal(failingTouch(0), 0)
  assert.equal(failingTouch(0xffff_ffff), LAST_TOUCH)
  for (const k of [0, 1, 5, 20, 40, LAST_TOUCH - 1]) assert.equal(failingTouch(sampleFor(k)), k)
  let previous = 0
  for (let s = 0; s < 2 ** 32; s += 2 ** 26) { const k = failingTouch(s); assert.ok(k >= previous); previous = k }
  for (const bad of [-1, 1.5, NaN, 2 ** 32]) assert.throws(() => failingTouch(bad))
  // P(juggle still alive at touch k) = 0.99 · e^(−t_k / G).
  assert.equal(survivalTo(0), 1)
  assert.ok(Math.abs(survivalTo(10) - 0.99 * Math.exp(-TOUCHES[10].at / GROWTH_MS)) < 1e-12)
  let seed = 7
  const next = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0 }
  let reached = 0
  for (let i = 0; i < 200000; i++) if (failingTouch(next()) >= 12) reached++
  assert.ok(Math.abs(reached / 200000 - survivalTo(12)) < 0.005)
})

test('embaixadinha: every auto-cashout target returns below 99%, around 96% on average', () => {
  let sum = 0, weight = 0, max = 0, min = 1
  for (let a = 101; a <= MAX_MULTIPLIER; a++) {
    const r = expectedReturn(a)
    max = Math.max(max, r); min = Math.min(min, r); sum += r / a; weight += 1 / a
  }
  assert.ok(max <= SURVIVAL + 1e-12, `max ${max}`); assert.ok(min > 0.9, `min ${min}`)
  const average = sum / weight
  assert.ok(average > 0.95 && average < 0.97, `average ${average}`)
  assert.ok(Math.abs(1 - survivalTo(1) - 0.0723) < 0.001, 'first touch fails ~7.2%')
})

test('embaixadinha: the crash is ONE event at the failing touch deadline, never disclosed early', () => {
  const { engine, set, wallet } = harness(20)
  const balance = wallet.getSnapshot().session.balance
  assert.equal(engine.start(1000).ok, true)
  const flightAt = engine.getSnapshot().flightAt
  assert.equal(flightAt, PREPARING_MS)
  const crashAt = flightAt + TOUCHES[20].at
  set(crashAt - 1)
  const before = engine.getSnapshot()
  assert.equal(before.phase, 'juggling'); assert.equal(before.crashAt, 0); assert.equal(before.failTouch, null); assert.equal(before.variant, null)
  set(crashAt)
  const after = engine.getSnapshot()
  assert.equal(after.phase, 'dropped'); assert.equal(after.crashAt, crashAt); assert.equal(after.failTouch, 20)
  assert.equal(after.multiplier, TOUCHES[20].multiplier)
  assert.equal(after.variant, failVariant(after.roundId, 20)); assert.ok(FAIL_VARIANTS.includes(after.variant))
  // HUD, motion and audio all resolve the same touch from the same timestamp.
  assert.equal(touchIndexAt(after.crashAt - after.flightAt), after.failTouch)
  assert.equal(after.result.won, false); assert.equal(wallet.getSnapshot().session.balance, balance - 1000)
  assert.equal(engine.cashOut(after.roundId), false, 'no cashout after the authoritative crash')
  set(crashAt + DROP_MS - 1); assert.equal(engine.getSnapshot().phase, 'dropped')
  set(crashAt + DROP_MS); assert.equal(engine.getSnapshot().phase, 'ready')
})

test('embaixadinha: cashout pays stake × live multiplier exactly once; late clicks cannot pay', () => {
  const { engine, set, wallet } = harness(30)
  engine.start(2500)
  const { flightAt, roundId } = engine.getSnapshot()
  set(flightAt + 6000)
  const multiplier = engine.getSnapshot().multiplier
  assert.equal(multiplier, multiplierAt(6000))
  assert.equal(engine.cashOut(roundId), true); assert.equal(engine.cashOut(roundId), false)
  const credits = wallet.getSnapshot().session.transactions.filter(t => t.kind === 'credit')
  assert.equal(credits.length, 1); assert.equal(credits[0].amount, payoutFor(2500, multiplier))
  assert.equal(engine.getSnapshot().phase, 'juggling', 'the juggle continues to its fixed failure after a cashout')
  set(flightAt + TOUCHES[30].at)
  assert.equal(engine.getSnapshot().phase, 'dropped'); assert.equal(engine.getSnapshot().result.won, true)
  assert.equal(wallet.getSnapshot().session.transactions.filter(t => t.kind === 'credit').length, 1)
})

test('embaixadinha: auto cashout wins strictly before the failing touch and loses at it', () => {
  const win = harness(12)
  win.engine.start(1000, TOUCHES[12].multiplier - 1)
  win.set(win.engine.getSnapshot().flightAt + TOUCHES[12].at + 50)
  assert.equal(win.engine.getSnapshot().result.won, true)
  assert.equal(win.engine.getSnapshot().result.payout, payoutFor(1000, TOUCHES[12].multiplier - 1))
  const lose = harness(12)
  lose.engine.start(1000, TOUCHES[12].multiplier + 1)
  lose.set(lose.engine.getSnapshot().flightAt + TOUCHES[12].at)
  assert.equal(lose.engine.getSnapshot().result.won, false)
  // A target reached only after the failing touch's deadline can never win (throttled tab).
  const late = harness(3)
  late.engine.start(1000, 300)
  late.set(100000)
  assert.equal(late.engine.getSnapshot().result.won, false)
  assert.ok(timeToMultiplier(300) > TOUCHES[3].at)
})

test('embaixadinha: first-touch failure, cap, stakes, insufficient credits and rapid presses', () => {
  const first = harness(0)
  first.engine.start(100)
  first.set(PREPARING_MS)
  assert.equal(first.engine.getSnapshot().phase, 'dropped'); assert.equal(first.engine.getSnapshot().multiplier, 100)
  const cap = harness(LAST_TOUCH)
  cap.engine.start(100); cap.set(PREPARING_MS + TOUCHES[LAST_TOUCH].at)
  assert.equal(cap.engine.getSnapshot().multiplier, MAX_MULTIPLIER)
  const { engine, wallet } = harness(5)
  for (const stake of [0, -1, 1.5, NaN, '100']) assert.equal(engine.start(stake).ok, false)
  assert.equal(engine.start(100, 100).reason, 'invalid-auto'); assert.equal(engine.start(100, 10001).reason, 'invalid-auto')
  assert.equal(engine.start(1).ok, true, 'minimum stake is 0.01')
  assert.equal(engine.start(1).reason, 'round-active', 'a second press cannot start a parallel round')
  assert.equal(wallet.reset().ok, false, 'reset is locked mid-round')
  const poor = harness(5)
  poor.wallet.debit(poor.wallet.getSnapshot().session.balance - 50)
  assert.equal(poor.engine.start(100).reason, 'insufficient-credits')
  assert.equal(poor.wallet.getSnapshot().session.transactions.length, 1)
})

test('embaixadinha: 25 consecutive rounds reconcile the wallet exactly', () => {
  let sampleIndex = 0
  const fails = [0, 3, 8, 15, 2, 30, 1, 12, 44, 6]
  const wallet = createDemoSessionStore(() => null)
  let at = 0, id = 0
  const engine = createJuggleEngine(wallet, { now: () => at, random: { uint32: () => sampleFor(fails[sampleIndex++ % fails.length]) }, id: () => `r-${++id}` })
  let expected = wallet.getSnapshot().session.balance
  for (let round = 0; round < 25; round++) {
    assert.equal(engine.start(500).ok, true); expected -= 500
    const { flightAt, roundId } = engine.getSnapshot()
    at = flightAt + 900; engine.tick()
    if (round % 3 === 0 && engine.cashOut(roundId)) expected += engine.getSnapshot().result.payout
    at += 60000; engine.tick(); at += DROP_MS; engine.tick()
    assert.equal(engine.getSnapshot().phase, 'ready')
  }
  assert.equal(wallet.getSnapshot().session.balance, expected)
  assert.equal(engine.getSnapshot().history.length, 12)
})

test('embaixadinha: the ball meets each calibrated contact exactly at every touch time', () => {
  const contacts = { flick: BALL_REST, 'right-foot': [-0.1, 0.42, 0.3], 'left-foot': [0.1, 0.42, 0.3], 'right-thigh': [-0.08, 0.95, 0.28], 'left-thigh': [0.08, 0.95, 0.28] }
  assert.deepEqual(ballInFlight(-5, contacts).position, BALL_REST)
  for (const touch of TOUCHES.slice(1, 40)) {
    const at = ballInFlight(touch.at, contacts).position
    at.forEach((v, i) => assert.ok(Math.abs(v - contacts[touch.kind][i]) < 1e-9))
    const justBefore = ballInFlight(touch.at - 0.5, contacts).position
    assert.ok(Math.hypot(...justBefore.map((v, i) => v - contacts[touch.kind][i])) < 0.01, 'no teleport into a contact')
  }
  for (const kind of Object.keys(CONTACT_POSES)) assert.ok(['left', 'right'].includes(CONTACT_POSES[kind].leg))
})

test('embaixadinha: presentation branches only after the published failing touch', () => {
  const live = poseAt({ elapsed: TOUCHES[20].at + 300, sinceStart: 0, failTouch: null, variant: null })
  const failed = poseAt({ elapsed: TOUCHES[20].at + 300, sinceStart: 0, failTouch: 20, variant: 'sideways' })
  assert.notDeepEqual(live, failed)
  assert.deepEqual(poseAt({ elapsed: TOUCHES[20].at - 5, sinceStart: 0, failTouch: 20, variant: 'heel' }),
    poseAt({ elapsed: TOUCHES[20].at - 5, sinceStart: 0, failTouch: null, variant: null }), 'identical until the failing touch')
  const escape = simulateEscape([0, 0.5, 0.3], [2, 2, 1], 2.4)
  assert.ok(escape.bounceTimes.length >= 2 && escape.bounceTimes.every((t, i, all) => i === 0 || t > all[i - 1]))
  const end = sampleEscape(escape, 2.4)
  assert.ok(Math.abs(end[1] - BALL_RADIUS) < 1e-6, 'loose ball comes to rest on the court')
  assert.ok(sampleEscape(escape, 0).every((v, i) => Math.abs(v - [0, 0.5, 0.3][i]) < 1e-6), 'escape starts at the contact point')
  assert.equal(failVariant('same-round', 9), failVariant('same-round', 9), 'variant is a pure function of the round')
  assert.ok(FAIL_VARIANTS.includes(failVariant('same-round', 9)))
})

test('embaixadinha: definition, localized copy and runtime asset are consistent', async () => {
  assert.equal(EMBAIXADINHA.slug, 'embaixadinha'); assert.equal(EMBAIXADINHA.category, 'crash')
  const keys = Object.keys(embaixadinhaCopy('pt-BR'))
  for (const locale of ['en', 'pt-BR', 'es-MX']) {
    const copy = embaixadinhaCopy(locale)
    assert.deepEqual(Object.keys(copy), keys)
    assert.ok(copy.seoTitle.length <= 60 && copy.description.length <= 160, `${locale} SERP lengths`)
    assert.doesNotMatch(JSON.stringify(copy), /CBF|FIFA|Nike|Adidas|Neymar|Pel[ée]|Ronaldinho|Aviator|Spribe/i)
  }
  assert.match(embaixadinhaCopy('pt-BR').articleIntro, /jogo de futebol online grátis/)
  assert.match(embaixadinhaCopy('pt-BR').seoTitle, /jogo crash de futebol/)
  const strings = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(strings)
  assert.doesNotMatch(strings(embaixadinhaCopy('pt-BR')).join(' '), /\b(cash out|stake|keepie|round|touches)\b/i, 'no English leaks in PT-BR')
  assert.equal(parseAutoInput('2,50'), 250); assert.ok(Number.isNaN(parseAutoInput('abc')))
  const manifest = JSON.parse(await readFile(new URL('../public/originals/embaixadinha/runtime/manifest.json', import.meta.url), 'utf8'))
  const glb = await readFile(new URL('../public' + EMBAIXADINHA_ASSETS.craque.split('?')[0], import.meta.url))
  assert.equal(createHash('sha256').update(glb).digest('hex'), manifest.runtime.sha256)
  assert.ok(EMBAIXADINHA_ASSETS.craque.endsWith(`?v=${manifest.runtime.sha256.slice(0, 12)}`), 'cache-busted by content hash')
  assert.ok(glb.length < 1_800_000); assert.equal(manifest.runtime.clips, 0)
  const source = await readFile(new URL('../public/originals/crash/runtime/castaway.glb', import.meta.url))
  assert.equal(createHash('sha256').update(source).digest('hex'), manifest.source.sha256, 'derived only from the PlayLiva-owned castaway rig')
})
