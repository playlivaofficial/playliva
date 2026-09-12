import test from 'node:test'
import assert from 'node:assert/strict'
import engineModule from '../lib/originals/crash/engine.ts'
import walletModule from '../lib/originals/session.ts'
import timingModule from '../lib/originals/crash/timing.ts'
const { createCrashEngine, generateCrashPoint, multiplierAt, timeToMultiplier, payoutFor,
  MAX_MULTIPLIER, PREPARING_MS, KICK_MS } = engineModule
const { fallDurationMs, IMPACT_BEAT_MS } = timingModule
const { createDemoSessionStore, MAX_CREDIT_UNITS: MAX_CREDITS, INITIAL_CREDIT_UNITS: INITIAL } = walletModule
const flight = PREPARING_MS + KICK_MS
function fixture(point = 500, storage = null) {
  let time = 0, ids = 0, samples = 0
  const wallet = createDemoSessionStore(() => storage, () => 1000 + time)
  const sample = Math.ceil((1 - 97 / point) * 0x1_0000_0000)
  const random = { uint32: () => { samples++; return sample } }
  assert.equal(generateCrashPoint(random), point)
  const engine = createCrashEngine(wallet, { now: () => time, random, id: () => `round-${++ids}` })
  return { wallet, engine, set: t => { time = t }, at: t => { time = t; engine.tick() },
    balance: () => wallet.getSnapshot().session.balance, snapshot: engine.getSnapshot, samples: () => samples }
}

test('secure outcome interface bounds distribution and rejects invalid samples', () => {
  assert.equal(generateCrashPoint({ uint32: () => 0 }), 100)
  assert.equal(generateCrashPoint({ uint32: () => 0xffff_ffff }), MAX_MULTIPLIER)
  for (const sample of [-1, NaN, 0x1_0000_0000, 2.5]) assert.throws(() => generateCrashPoint({ uint32: () => sample }))
  const points = Array.from({ length: 10000 }, (_, i) => generateCrashPoint({ uint32: () => Math.floor(i / 10000 * 0x1_0000_0000) }))
  assert.ok(points.filter(p => p < 200).length > 5000)
  assert.ok(points.filter(p => p >= 1000).length < 1000)
  assert.ok(points.every(Number.isInteger))
})
test('fixed-point payouts floor fractional subunits and stay integer-safe', () => {
  assert.equal(payoutFor(101, 247), 249)
  assert.equal(payoutFor(MAX_CREDITS, MAX_MULTIPLIER), 10_000_000_000_000)
  for (const amount of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => payoutFor(amount, 200))
  for (const multiplier of [99, 10001, 247.5, NaN]) assert.throws(() => payoutFor(100, multiplier))
  assert.equal(multiplierAt(0), 100)
  assert.equal(multiplierAt(-500), 100)
  assert.equal(multiplierAt(1e8), MAX_MULTIPLIER)
  assert.equal(multiplierAt(timeToMultiplier(247) + .001), 247)
})
test('stake/auto validation never debits on rejection; payout capacity is reserved', () => {
  const f = fixture()
  for (const stake of [0, -1, 1.5, NaN, Infinity, '100']) assert.equal(f.engine.start(stake).reason, 'invalid-amount')
  assert.equal(f.engine.start(INITIAL + 1).reason, 'insufficient-credits')
  for (const auto of [100, 10001, 201.1, NaN]) assert.equal(f.engine.start(100, auto).reason, 'invalid-auto')
  assert.equal(f.balance(), INITIAL)
  f.wallet.credit(MAX_CREDITS - INITIAL)
  assert.equal(f.engine.start(100).reason, 'balance-limit')
})
test('preparing/kick/flight are timed; repeated start and early cashout cannot mutate twice', () => {
  const f = fixture()
  assert.equal(f.engine.start(100).ok, true)
  assert.equal(f.snapshot().phase, 'preparing')
  for (let i = 0; i < 20; i++) { assert.equal(f.engine.start(100).ok, false); assert.equal(f.engine.cashOut(), false) }
  assert.equal(f.balance(), INITIAL - 100)
  f.at(PREPARING_MS); assert.equal(f.snapshot().phase, 'kick')
  f.at(flight); assert.equal(f.snapshot().phase, 'flying')
  assert.equal(f.wallet.getSnapshot().session.transactions.length, 1)
})
test('manual cashout credits once, keeps flying to original crash, rejects spam/stale callbacks, then returns ready', () => {
  const f = fixture()
  f.engine.start(100)
  f.at(flight + timeToMultiplier(247) + .001)
  assert.equal(f.engine.cashOut(), true)
  assert.equal(f.balance(), INITIAL + 147)
  assert.equal(f.snapshot().phase, 'flying')
  assert.equal(f.snapshot().wager, 'cashed_out')
  const id = f.snapshot().roundId
  for (let i = 0; i < 20; i++) { assert.equal(f.engine.cashOut(id), false); f.engine.tick() }
  assert.equal(f.balance(), INITIAL + 147)
  const locked = f.snapshot().result
  f.at(flight + timeToMultiplier(400) + .001)
  assert.equal(f.snapshot().phase, 'flying')
  assert.equal(f.snapshot().multiplier, 400)
  assert.equal(f.engine.start(50).ok, false)
  const crashAt = flight + timeToMultiplier(500)
  const duration = fallDurationMs(timeToMultiplier(500))
  f.at(crashAt)
  assert.equal(f.snapshot().phase, 'falling')
  assert.equal(f.snapshot().multiplier, 500)
  assert.equal(f.snapshot().result, locked)
  assert.equal(f.snapshot().history.length, 1)
  assert.equal(f.balance(), INITIAL + 147)
  f.at(crashAt + duration)
  assert.equal(f.snapshot().phase, 'impact')
  f.at(crashAt + duration + IMPACT_BEAT_MS - .001)
  assert.equal(f.snapshot().phase, 'impact')
  f.at(crashAt + duration + IMPACT_BEAT_MS)
  assert.equal(f.snapshot().phase, 'ready')
  f.engine.start(50)
  assert.equal(f.engine.cashOut(id), false)
})
test('crash deadline wins equality and rejects late cashout without requiring a timer tick', () => {
  for (const delay of [0, .001, 10000]) {
    const f = fixture(247)
    f.engine.start(100)
    f.set(flight + timeToMultiplier(247) + delay)
    assert.equal(f.engine.cashOut(), false)
    assert.equal(f.snapshot().phase, 'falling')
    assert.equal(f.snapshot().wager, 'lost')
    assert.equal(f.balance(), INITIAL - 100)
  }
})
test('auto settlement uses logical deadlines even after a throttled tab misses the entire flight', () => {
  const f = fixture(500)
  f.engine.start(100, 200)
  f.at(flight + 100000)
  assert.equal(f.snapshot().phase, 'falling')
  assert.equal(f.snapshot().wager, 'cashed_out')
  assert.equal(f.snapshot().multiplier, 500)
  assert.equal(f.snapshot().result.multiplier, 200)
  assert.equal(f.balance(), INITIAL + 100)
  assert.equal(f.engine.cashOut(), false)
  for (const point of [100, 150, 200]) {
    const loss = fixture(point)
    loss.engine.start(100, 200); loss.at(flight + 100000)
    assert.equal(loss.snapshot().result.won, false)
    assert.equal(loss.balance(), INITIAL - 100)
  }
})
test('manual/auto race, wallet re-entrancy and double notifications settle exactly once', () => {
  const g = fixture()
  g.wallet.hydrate()
  g.wallet.subscribe(() => { g.engine.start(100); g.engine.cashOut(); g.engine.tick() })
  g.engine.start(100, 200)
  g.set(flight + timeToMultiplier(200))
  g.engine.cashOut(); g.engine.tick(); g.engine.cashOut()
  assert.equal(g.balance(), INITIAL + 100)
  assert.equal(g.wallet.getSnapshot().session.transactions.length, 2)
})
test('M4 wallet rejects reset and unrelated mutation during active round, allows settings', () => {
  const f = fixture()
  f.engine.start(100)
  assert.equal(f.wallet.reset().reason, 'round-active')
  assert.equal(f.wallet.credit(100).reason, 'round-active')
  assert.equal(f.wallet.debit(100).reason, 'round-active')
  assert.equal(f.wallet.setSettings({ sound: true, haptics: false }), true)
  f.at(flight); f.engine.cashOut()
  assert.equal(f.wallet.reset().reason, 'round-active')
  f.at(flight + timeToMultiplier(500))
  f.at(flight + timeToMultiplier(500) + fallDurationMs(timeToMultiplier(500)) + IMPACT_BEAT_MS)
  assert.equal(f.wallet.reset().ok, true)
})
test('reload starts ready, keeps spent stake/history/settings, never resumes/refunds', () => {
  const data = new Map(), storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  const f = fixture(500, storage)
  f.engine.start(250)
  f.at(flight + 500)
  const next = fixture(500, storage)
  next.wallet.hydrate()
  assert.equal(next.snapshot().phase, 'ready')
  assert.equal(next.balance(), INITIAL - 250)
  next.engine.tick(); assert.equal(next.engine.cashOut(), false)
  assert.equal(next.wallet.getSnapshot().session.transactions.length, 1)
  assert.equal(next.wallet.reset().ok, true)
})
test('RNG failure does not spend credits; duplicate round IDs are rejected', () => {
  const wallet = createDemoSessionStore(() => null)
  const failed = createCrashEngine(wallet, { random: { uint32() { throw new Error('Unavailable') } } })
  assert.equal(failed.start(100).reason, 'random-unavailable')
  assert.equal(wallet.getSnapshot().session.balance, INITIAL)
  let t = 0
  const engine = createCrashEngine(wallet, { now: () => t, random: { uint32: () => 0 }, id: () => 'same-id' })
  engine.start(100); t = flight; engine.tick()
  t += fallDurationMs(0) + IMPACT_BEAT_MS; engine.tick()
  assert.equal(engine.start(100).ok, false)
})

test('auto cashout keeps the original 5.73x deadline and locks 200.00 through fall/impact', () => {
  const f = fixture(573)
  f.engine.start(10000, 200)
  f.at(flight + timeToMultiplier(200))
  assert.equal(f.snapshot().phase, 'flying')
  assert.equal(f.snapshot().wager, 'cashed_out')
  assert.equal(f.snapshot().result.payout, 20000)
  const locked = f.snapshot().result, balance = f.balance()
  f.at(flight + timeToMultiplier(450) + .001)
  assert.equal(f.snapshot().multiplier, 450)
  assert.equal(f.snapshot().phase, 'flying')
  assert.equal(f.snapshot().result, locked)
  const deadline = flight + timeToMultiplier(573), fall = fallDurationMs(timeToMultiplier(573))
  f.at(deadline - .001); assert.equal(f.snapshot().phase, 'flying')
  f.at(deadline); assert.equal(f.snapshot().phase, 'falling')
  assert.equal(f.snapshot().multiplier, 573)
  f.at(deadline + fall); assert.equal(f.snapshot().phase, 'impact')
  assert.equal(f.snapshot().result, locked)
  assert.equal(f.balance(), balance)
  assert.equal(f.wallet.getSnapshot().session.transactions.filter(item => item.kind === 'credit').length, 1)
  f.at(deadline + fall + IMPACT_BEAT_MS); assert.equal(f.snapshot().phase, 'ready')
})

test('early manual cashout cannot change high outcome, RNG calls or final crash timing', () => {
  const active = fixture(10000), paid = fixture(10000)
  active.engine.start(1000); paid.engine.start(1000)
  active.at(flight + 100); paid.at(flight + 100); paid.engine.cashOut()
  const payout = paid.snapshot().result.payout
  for (const multiplier of [150, 500, 2000, 9999, 10000]) {
    const at = flight + timeToMultiplier(multiplier) + .001
    active.at(at); paid.at(at)
    assert.equal(paid.snapshot().multiplier, active.snapshot().multiplier)
    assert.equal(paid.snapshot().phase, active.snapshot().phase)
    assert.equal(paid.snapshot().result.payout, payout)
    assert.equal(paid.balance(), INITIAL - 1000 + payout)
  }
  assert.equal(active.snapshot().wager, 'lost')
  assert.equal(paid.snapshot().wager, 'cashed_out')
  assert.equal(paid.snapshot().finishedAt, active.snapshot().finishedAt)
  assert.equal(paid.samples(), 2, 'one fixture verification plus exactly one sample at round start')
  assert.equal(paid.samples(), active.samples())
})

test('1000 repeated fractional rounds never create a subunit by rounding, replay or final crash', () => {
  const f = fixture(250)
  let started = 0
  for (let i = 0; i < 1000; i++) {
    assert.equal(f.engine.start(101, 247).ok, true)
    const deadline = started + flight + timeToMultiplier(250)
    f.at(deadline)
    assert.equal(f.snapshot().result.payout, 249)
    assert.equal(f.balance(), INITIAL + (i + 1) * 148)
    for (let repeat = 0; repeat < 3; repeat++) { assert.equal(f.engine.cashOut(), false); f.engine.tick() }
    started = deadline + fallDurationMs(timeToMultiplier(250)) + IMPACT_BEAT_MS
    f.at(started)
    assert.equal(f.snapshot().phase, 'ready')
  }
  assert.equal(f.wallet.getSnapshot().session.sequence, 2000)
  assert.equal(f.wallet.getSnapshot().session.transactions.length, 50)
  assert.ok(walletModule.decodeSession(JSON.stringify(f.wallet.getSnapshot().session)))
})

test('reload after cashout preserves the locked return without resuming or re-crediting the flight', () => {
  const data = new Map(), storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  const f = fixture(500, storage)
  f.engine.start(1000); f.at(flight + timeToMultiplier(115) + .001); f.engine.cashOut()
  const next = fixture(500, storage); next.wallet.hydrate()
  assert.equal(next.balance(), INITIAL + 150)
  assert.equal(next.snapshot().phase, 'ready')
  next.at(1e6); assert.equal(next.engine.cashOut(), false)
  assert.equal(next.balance(), INITIAL + 150)
  assert.equal(next.wallet.getSnapshot().session.transactions.length, 2)
})
