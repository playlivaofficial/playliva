import test from 'node:test'
import assert from 'node:assert/strict'
import configModule from '../lib/originals/golaco/config.ts'
import mathModule from '../lib/originals/golaco/math.ts'
import engineModule from '../lib/originals/golaco/engine.ts'
import simModule from '../lib/originals/golaco/simulation.ts'
import sessionModule from '../lib/originals/session.ts'
import copyModule from '../lib/originals/golaco/copy.ts'
import definitionModule from '../lib/originals/golaco/definition.ts'

const { GOLACO_CONFIG: config, SYMBOLS, WAYS, REELS, ROWS, validateGolacoConfig } = configModule
const { generateGrid, evaluateWays, evaluateSpin, settleAmount, scatterAward, validateGrid } = mathModule
const { createGolacoEngine, SPIN_MS, FIRST_STOP_MS, STOP_GAP_MS, ANTICIPATION_GAP_MS, RESULT_MS, BONUS_RESULT_MS, BONUS_WIN_MS, BONUS_INTRO_MS, IDLE_GRID } = engineModule
const { seededRandom, simulate, exactBaseReturn, triggerProbabilities, playBonus, decompose } = simModule
const { createDemoSessionStore } = sessionModule
const { golacoCopy } = copyModule
const { GOLACO } = definitionModule

const loss = () => ['cone', 'chuteira', 'bandeira', 'luvas', 'apito'].map(s => Array(3).fill(s))
const win = (wilds = 0) => { const g = loss(); for (let i = 0; i < 3; i++) g[i][0] = i > 0 && i <= wilds ? 'camisa' : 'medalha'; return g }
const trophies = n => { const g = loss(); for (let i = 0; i < n; i++) g[i % 5][Math.floor(i / 5)] = 'taca'; return g }
function harness(draw = loss) {
  let at = 0, id = 0
  const wallet = createDemoSessionStore(() => null)
  const engine = createGolacoEngine(wallet, { now: () => at, id: () => `g-${++id}`, draw })
  const advance = ms => { at += ms; engine.tick() }
  const settle = () => { while (engine.getSnapshot().phase === 'spinning') advance(engine.getSnapshot().revealAt - at) }
  return { wallet, engine, advance, settle, time: () => at }
}

test('golaço: 5×3 / 243 ways with its own validated, frozen configuration', () => {
  assert.equal(WAYS, 243); assert.equal(REELS, 5); assert.equal(ROWS, 3)
  validateGolacoConfig(config)
  assert.throws(() => { config.paytable.cone[0] = 1 }, TypeError)
  assert.equal(config.weights.gol, 0, 'golden balls never appear on paid reels')
  assert.ok(config.bonusWeights.gol > 0)
  assert.deepEqual([config.scatterAwards, config.maxStreak, config.retriggerSpins, config.maxFreeSpins], [[8, 12, 20], 5, 1, 40])
  for (const patch of [{ scatterAwards: [8, 12] }, { maxFreeSpins: 19 }, { maxStreak: 0 }, { weights: { ...config.weights, gol: 5 } }, { bonusWeights: { ...config.bonusWeights, gol: 0 } }, { scatterTrigger: 2 }])
    assert.throws(() => validateGolacoConfig({ ...config, ...patch }))
})

test('golaço: generation is reproducible, never places Wild on reel 1 or golden balls on paid spins', () => {
  const a = seededRandom(5), b = seededRandom(5), seen = new Set()
  for (let i = 0; i < 800; i++) {
    const bonus = i % 2 === 1, grid = generateGrid(a, bonus)
    assert.deepEqual(grid, generateGrid(b, bonus)); validateGrid(grid)
    assert.ok(!grid[0].includes('camisa')); if (!bonus) assert.ok(!grid.flat().includes('gol'))
    grid.flat().forEach(s => seen.add(s))
  }
  assert.deepEqual([...seen].sort(), [...SYMBOLS].sort())
})

test('golaço: ways pay the longest left-to-right run; Wild substitutes, never for Trophy', () => {
  assert.equal(evaluateWays(loss()).length, 0)
  assert.deepEqual(evaluateWays(win()).map(w => [w.symbol, w.reels, w.ways]), [['medalha', 3, 1]])
  const grid = win(2); grid[1][1] = 'medalha'
  assert.deepEqual(evaluateWays(grid).map(w => [w.symbol, w.reels, w.ways]).find(w => w[0] === 'medalha'), ['medalha', 3, 2])
  assert.equal(evaluateWays(Array(5).fill(Array(3).fill('cone')))[0].ways, 243)
  const t = trophies(3); t[1][1] = 'camisa'
  assert.equal(evaluateSpin(t, 100).awardedSpins, 8)
})

test('golaço: 3 / 4 / 5+ Trophies anywhere award 8 / 12 / 20; adjacency irrelevant; two award nothing', () => {
  assert.deepEqual([0, 2, 3, 4, 5, 9].map(n => scatterAward(n)), [0, 0, 8, 12, 20, 20])
  for (const [n, spins] of [[2, 0], [3, 8], [4, 12], [5, 20], [7, 20]]) assert.equal(evaluateSpin(trophies(n), 100).awardedSpins, spins)
  const spread = loss(); spread[4][2] = 'taca'; spread[0][0] = 'taca'; spread[2][1] = 'taca'
  assert.equal(evaluateSpin(spread, 100).awardedSpins, 8)
})

test('golaço: Goal Streak counts golden balls before the spin pays, caps at ×5 and multiplies wins', () => {
  const g = win(); g[3][2] = 'gol'
  const one = evaluateSpin(g, 100, 1)
  assert.equal(one.goals, 1); assert.equal(one.streak, 2); assert.equal(one.multiplier, 2)
  assert.equal(one.payout, settleAmount(100, one.wins, 2).payout)
  g[4][0] = 'gol'; g[4][1] = 'gol'
  assert.equal(evaluateSpin(g, 100, 3).streak, 5, 'cap')
  assert.equal(evaluateSpin(loss(), 100, 5).streak, 5)
  assert.equal(evaluateSpin(win(), 100, null).multiplier, 1, 'no base-game multiplier')
  assert.throws(() => evaluateSpin(g, 100, null), /free-spin/)
  assert.throws(() => evaluateSpin(loss(), 100, 6))
  assert.equal(evaluateSpin(trophies(2), 100, 1).awardedSpins, 2, 'each Trophy in a free spin requests +1')
})

test('golaço: fixed-point payout floors once and caps at 1,000× the spin', () => {
  const big = evaluateSpin([Array(3).fill('chuteira'), ...Array(4).fill(Array(3).fill('camisa'))], 5000, 5)
  assert.equal(big.payout, 5_000_000); assert.equal(big.capped, true)
  assert.equal(settleAmount(101, [{ ways: 3, rate: 2150 }], 1).payout, Math.floor(101 * 3 * 2150 / 10000))
})

test('golaço: exact trigger odds and base return; simulated bonus keeps total return coherent', () => {
  const odds = triggerProbabilities()
  assert.ok(Math.abs(1 / odds.any - 114.67) < 0.01, `1 in ${1 / odds.any}`)
  const base = exactBaseReturn()
  assert.ok(Math.abs(base.total - 0.69390) < 1e-4, `base ${base.total}`)
  const d = decompose(3000, 99)
  assert.ok(d.estimatedRtp > 0.90 && d.estimatedRtp < 0.99, `total ${d.estimatedRtp}`)
  assert.ok(d.value[0].meanSpinsPlayed > 8 && d.value[0].meanFinalStreak > 3 && d.value[0].meanFinalStreak < 5)
  const s = simulate(4000, 3)
  assert.deepEqual(s, simulate(4000, 3)); assert.ok(Math.abs(s.estimatedRtp - s.baseRtp - s.bonusRtp) < 1e-9)
  assert.equal(playBonus(seededRandom(8), 100, 20, { ...config, bonusWeights: { ...config.bonusWeights, taca: 100000 } }).played, 40, 'retriggers stop at 40')
})

test('golaço: reels land left to right, payout books once on the last stop, paid stake debits once', () => {
  const drawn = win(1)
  const { wallet, engine, advance } = harness(() => drawn)
  const balance = wallet.getSnapshot().session.balance
  assert.equal(engine.spin(100).ok, true); assert.equal(engine.spin(100).ok, false)
  assert.deepEqual(engine.getSnapshot().grid, IDLE_GRID)
  advance(FIRST_STOP_MS); assert.equal(engine.getSnapshot().stopped, 1); assert.deepEqual(engine.getSnapshot().grid[0], drawn[0])
  for (let reel = 2; reel <= 4; reel++) { advance(STOP_GAP_MS); assert.equal(engine.getSnapshot().stopped, reel); assert.equal(wallet.getSnapshot().session.balance, balance - 100) }
  advance(STOP_GAP_MS)
  assert.equal(engine.getSnapshot().phase, 'result'); assert.equal(FIRST_STOP_MS + 4 * STOP_GAP_MS, SPIN_MS)
  assert.equal(wallet.getSnapshot().session.balance, balance - 100 + evaluateSpin(drawn, 100).payout)
  for (let i = 0; i < 10; i++) engine.tick()
  assert.equal(wallet.getSnapshot().session.transactions.length, 2)
  advance(RESULT_MS); assert.equal(engine.getSnapshot().phase, 'ready')
})

test('golaço: two landed Trophies start anticipation without changing the drawn grid', () => {
  const drawn = trophies(3)
  const { engine, advance, settle, time } = harness(() => drawn)
  engine.spin(100); advance(FIRST_STOP_MS)
  assert.equal(engine.getSnapshot().anticipation, false)
  advance(STOP_GAP_MS)
  assert.equal(engine.getSnapshot().anticipation, true)
  assert.equal(engine.getSnapshot().revealAt, FIRST_STOP_MS + STOP_GAP_MS + 3 * ANTICIPATION_GAP_MS)
  settle(); assert.deepEqual(engine.getSnapshot().grid, drawn); assert.equal(engine.getSnapshot().phase, 'bonus-intro')
  assert.equal(time(), FIRST_STOP_MS + STOP_GAP_MS + 3 * ANTICIPATION_GAP_MS)
})

test('golaço: a full Final de Ouro — intro, counter, streak steps as balls land, retrigger, summary, one credit per win', () => {
  let freeSpin = 0
  const { wallet, engine, advance, settle } = harness((_r, free) => {
    if (!free) return trophies(3)
    freeSpin++
    const g = win(); if (freeSpin <= 5) g[3][1] = 'gol'; if (freeSpin === 2) g[4][2] = 'taca'
    return g
  })
  engine.spin(200); settle()
  assert.deepEqual([engine.getSnapshot().phase, engine.getSnapshot().bonusRemaining, engine.getSnapshot().bonusAwarded, engine.getSnapshot().streak], ['bonus-intro', 8, 8, 1])
  advance(BONUS_INTRO_MS)
  assert.equal(engine.getSnapshot().phase, 'spinning'); assert.equal(engine.getSnapshot().bonusRemaining, 7)
  advance(FIRST_STOP_MS + 2 * STOP_GAP_MS); assert.equal(engine.getSnapshot().streak, 1)
  advance(STOP_GAP_MS); assert.equal(engine.getSnapshot().streak, 2, 'GOL lands with reel 4, before settlement')
  let total = 0, credits = 0
  while (engine.getSnapshot().phase !== 'bonus-summary') {
    settle()
    const payout = engine.getSnapshot().result.evaluation.payout
    total += payout; if (payout) credits++
    if (engine.getSnapshot().phase === 'result') advance(payout ? BONUS_WIN_MS : BONUS_RESULT_MS)
  }
  const end = engine.getSnapshot()
  assert.equal(end.bonusAwarded, 9); assert.equal(end.streak, 5); assert.equal(end.bonusTotal, total)
  assert.equal(wallet.getSnapshot().session.transactions.filter(t => t.kind === 'debit').length, 1)
  assert.equal(wallet.getSnapshot().session.transactions.filter(t => t.kind === 'credit').length, credits)
  assert.equal(wallet.reset().ok, true, 'summary releases the wallet')
  assert.equal(engine.spin(200).ok, true); assert.equal(engine.getSnapshot().streak, 1, 'a repeated bonus starts from ×1')
})

test('golaço: insufficient credits, invalid stakes and entropy failure never debit', () => {
  const { engine, wallet } = harness()
  for (const stake of [0, 99, 5001, NaN, 100.5]) assert.equal(engine.spin(stake).ok, false)
  wallet.debit(wallet.getSnapshot().session.balance - 50)
  assert.equal(engine.spin(100).reason, 'insufficient-credits')
  const bad = harness(() => { throw Error('entropy') })
  assert.equal(bad.engine.spin(100).reason, 'random-unavailable'); assert.equal(bad.wallet.getSnapshot().session.transactions.length, 0)
})

test('golaço: complete, natural PT-BR/EN/ES copy with SERP-safe metadata and no protected marks', () => {
  const keys = Object.keys(golacoCopy('pt-BR'))
  const strings = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(strings)
  for (const locale of ['en', 'pt-BR', 'es-MX']) {
    const copy = golacoCopy(locale)
    assert.deepEqual(Object.keys(copy), keys)
    assert.ok(copy.seoTitle.length <= 60 && copy.description.length <= 160, `${locale} SERP lengths`)
    assert.equal(Object.keys(copy.symbols).length, SYMBOLS.length)
    assert.doesNotMatch(strings(copy).join(' '), /CBF|FIFA|Nike|Adidas|Copa do Mundo|World Cup|Pragmatic|Neymar|Pel[ée]/i)
  }
  assert.match(golacoCopy('pt-BR').seoTitle, /slot de futebol/)
  assert.match(golacoCopy('pt-BR').articleIntro, /caça-níquel de futebol/)
  assert.match(golacoCopy('pt-BR').articleBonus, /jogo de futebol grátis/)
  assert.doesNotMatch(strings(golacoCopy('pt-BR')).join(' '), /\b(free spins|wild|trophy|streak)\b/i, 'no English leaks in PT-BR')
  assert.equal(GOLACO.slug, 'golaco'); assert.equal(GOLACO.category, 'slots')
})

test('football Originals: discovery cards and spotlight stay light (no engine, audio or full game copy)', async () => {
  const { readFile } = await import('node:fs/promises')
  for (const file of ['components/originals/football-features.tsx', 'lib/home/spotlight.ts', 'lib/originals/football-cards.ts']) {
    const source = await readFile(new URL('../' + file, import.meta.url), 'utf8')
    const imports = source.match(/from '[^']+'/g) ?? []
    assert.ok(imports.every(path => !/(golaco|embaixadinha)\/(copy|engine|audio|math|juggle)|synth|'three/.test(path)), file)
  }
})
