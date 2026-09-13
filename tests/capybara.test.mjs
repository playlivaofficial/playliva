import test from 'node:test'
import assert from 'node:assert/strict'
import configModule from '../lib/originals/capybara/config.ts'
import mathModule from '../lib/originals/capybara/math.ts'
import engineModule from '../lib/originals/capybara/engine.ts'
import simModule from '../lib/originals/capybara/simulation.ts'
import sessionModule from '../lib/originals/session.ts'
const { SLOT_CONFIG: config, SYMBOLS, WAYS, validateConfig } = configModule
const { generateGrid, evaluateWays, evaluateSpin, randomBelow, settleAmount, validateGrid } = mathModule
const { createSlotEngine, SPIN_MS, RESULT_MS, BONUS_RESULT_MS } = engineModule
const { seededRandom, simulate } = simModule
const { createDemoSessionStore, MAX_CREDIT_UNITS } = sessionModule
const loss = () => ['coconut', 'emerald', 'flower', 'toucan', 'pearl'].map(s => Array(4).fill(s))
const winning = (wilds = 0) => {
  const grid = loss()
  for (let i = 0; i < 3; i++) grid[i][0] = i > 0 && i <= wilds ? 'wild' : 'leaf'
  return grid
}
const bonus = () => { const grid = loss(); for (let i = 0; i < 3; i++) grid[i][0] = 'scatter'; return grid }
function harness(draw = loss, options = {}) {
  let at = 0, id = 0
  const wallet = createDemoSessionStore(() => null)
  const engine = createSlotEngine(wallet, { now: () => at, id: () => `slot-${++id}`, draw, ...options })
  const advance = ms => { at += ms; engine.tick() }
  return { wallet, engine, advance }
}
test('slot: honest 5×4 / 1,024 ways and bounded immutable configuration', () => {
  assert.equal(WAYS, 1024); validateConfig(config)
  assert.throws(() => { config.paytable.leaf[0] = 0 }, TypeError)
  for (const patch of [{ payScale: 0 }, { freeSpins: 9 }, { maxWinMultiple: Infinity }, { scatterTrigger: 2 }, { wildMultipliers: [2, 1] }]) assert.throws(() => validateConfig({ ...config, ...patch }))
})
test('slot: weighted generation is reproducible, valid and never creates first-reel Wilds', () => {
  const a = seededRandom(42), b = seededRandom(42), counts = Object.fromEntries(SYMBOLS.map(s => [s, 0]))
  for (let i = 0; i < 500; i++) { const grid = generateGrid(a, i % 2 === 0); assert.deepEqual(grid, generateGrid(b, i % 2 === 0)); validateGrid(grid); grid.flat().forEach(s => counts[s]++) }
  assert.ok(Object.values(counts).every(n => n > 0))
  assert.throws(() => validateGrid([])); assert.throws(() => validateGrid(Array(5).fill(Array(4).fill('wild'))))
})
test('slot: rejection sampling rejects bias tail, invalid or missing entropy without fallback', () => {
  const samples = [0xffffffff, 7]
  assert.equal(randomBelow(10, { uint32: () => samples.shift() }), 7)
  for (const value of [-1, NaN, 1.1, 0x1_0000_0000]) assert.throws(() => randomBelow(10, { uint32: () => value }))
  assert.throws(() => randomBelow(10, { uint32: () => 0xffffffff }))
})
test('slot: adjacent evaluation stops at gaps, requires leftmost three and pays longest combination only', () => {
  assert.equal(evaluateWays(loss()).length, 0)
  const grid = winning(); assert.deepEqual(evaluateWays(grid).map(w => [w.symbol, w.reels, w.ways]), [['leaf', 3, 1]])
  grid[3][0] = 'leaf'; grid[4][0] = 'leaf'
  assert.deepEqual(evaluateWays(grid).map(w => [w.symbol, w.reels, w.ways]), [['leaf', 5, 1]])
  grid[1][0] = 'scatter'; assert.equal(evaluateWays(grid).length, 0)
})
test('slot: product of per-reel matches counts all 1,024 ways exactly once', () => {
  const result = evaluateWays(Array(5).fill(Array(4).fill('leaf')))
  assert.equal(result.length, 1); assert.equal(result[0].ways, 1024)
})
test('slot: substituting winning Wilds apply x2/x3/x5/x10 once to total ways', () => {
  for (let n = 0; n <= 4; n++) {
    const grid = winning(); for (let i = 0; i < n; i++) grid[1 + i % 2][Math.floor(i / 2)] = 'wild'
    const result = evaluateSpin(grid, 100)
    assert.equal(result.winningWilds, n); assert.equal(result.multiplier, [1, 2, 3, 5, 10][n])
    assert.equal(result.payout, settleAmount(100, result.wins, result.multiplier).payout)
  }
  const grid = winning(); grid[4][0] = 'wild'; assert.equal(evaluateSpin(grid, 100).multiplier, 1)
})
test('slot: Wilds never substitute for Scatter and distinct anchor symbols may both win', () => {
  const grid = winning(2); grid[0][1] = 'acai'
  assert.deepEqual(evaluateWays(grid).map(w => w.symbol), ['coconut', 'acai', 'leaf'])
  assert.equal(evaluateSpin(grid, 100).awardedSpins, 0)
})
test('slot: fixed-point payout floors only once after aggregation and caps each spin', () => {
  const wins = [{ ways: 3, rate: 49 }, { ways: 2, rate: 63 }]
  assert.equal(settleAmount(101, wins, 3).payout, Number(101n * 273n * 3n / 10000n))
  const max = evaluateSpin(Array.from({ length: 5 }, (_, i) => Array(4).fill(i ? 'wild' : 'coconut')), 5000, 20)
  assert.equal(max.payout, 5000000); assert.equal(max.capped, true)
  assert.throws(() => settleAmount(1.1, wins, 1))
})
test('slot: anywhere 3+ Scatters award exactly 8; two do not; free spins do not retrigger', () => {
  const grid = bonus(); assert.equal(evaluateSpin(grid, 100).awardedSpins, 8)
  assert.equal(evaluateSpin(grid, 100, 1).awardedSpins, 0)
  grid[2][0] = 'pearl'; assert.equal(evaluateSpin(grid, 100).awardedSpins, 0)
})
test('slot: every bonus Wild increases persistent multiplier before current payout, replacing base ladder', () => {
  const a = evaluateSpin(winning(2), 100, 4)
  assert.equal(a.multiplier, 6); assert.equal(a.bonusMultiplier, 6)
  assert.equal(evaluateSpin(loss(), 100, a.bonusMultiplier).multiplier, 6)
  assert.equal(evaluateSpin(winning(2), 100, 19).multiplier, 20)
})
test('slot: paid stake debits once; hidden outcome settles once; repeated clicks/ticks cannot credit twice', () => {
  const { wallet, engine, advance } = harness(() => winning(2))
  const balance = wallet.getSnapshot().session.balance
  assert.equal(engine.spin(100).ok, true); assert.equal(engine.spin(100).ok, false)
  assert.equal(engine.getSnapshot().result, null); assert.equal(wallet.getSnapshot().session.balance, balance - 100)
  advance(SPIN_MS - 1); assert.equal(engine.getSnapshot().phase, 'spinning')
  advance(1); const paid = evaluateSpin(winning(2), 100).payout
  assert.equal(wallet.getSnapshot().session.balance, balance - 100 + paid)
  for (let i = 0; i < 10; i++) engine.tick()
  assert.equal(wallet.getSnapshot().session.transactions.length, 2)
  advance(RESULT_MS); assert.equal(engine.getSnapshot().phase, 'ready')
})
test('slot: invalid stake, insufficient balance, upper limit and entropy failure cannot debit', () => {
  const { wallet, engine } = harness()
  for (const stake of [0, 99, 5001, NaN, Infinity, 100.5, '100']) assert.equal(engine.spin(stake).ok, false)
  assert.equal(wallet.getSnapshot().session.transactions.length, 0)
  wallet.debit(wallet.getSnapshot().session.balance - 99)
  assert.equal(engine.spin(100).reason, 'insufficient-credits')
  const full = harness(); full.wallet.credit(MAX_CREDIT_UNITS - full.wallet.getSnapshot().session.balance)
  assert.equal(full.engine.spin(100).reason, 'balance-limit')
  const bad = harness(() => { throw Error('entropy') }); assert.equal(bad.engine.spin(100).reason, 'random-unavailable')
  assert.equal(bad.wallet.getSnapshot().session.transactions.length, 0)
})
test('slot: eight free spins never debit; multiplier carries; wallet stays locked through bonus', () => {
  const { wallet, engine, advance } = harness((_random, free) => free ? winning(1) : bonus())
  engine.spin(200); advance(SPIN_MS)
  assert.equal(engine.getSnapshot().phase, 'bonus-intro'); assert.equal(wallet.reset().ok, false)
  engine.continueBonus()
  let total = 0
  for (let i = 1; i <= 8; i++) {
    assert.equal(engine.getSnapshot().phase, 'spinning'); advance(SPIN_MS)
    assert.equal(engine.getSnapshot().bonusMultiplier, 1 + i)
    total += engine.getSnapshot().result.evaluation.payout
    if (i < 8) { assert.equal(wallet.reset().ok, false); advance(BONUS_RESULT_MS) }
  }
  assert.equal(engine.getSnapshot().phase, 'bonus-summary'); assert.equal(engine.getSnapshot().bonusTotal, total)
  assert.equal(wallet.getSnapshot().session.transactions.filter(t => t.kind === 'debit').length, 1)
  assert.equal(wallet.getSnapshot().session.balance, 1000000 - 200 + total)
  engine.continueBonus(); assert.equal(engine.getSnapshot().phase, 'ready'); assert.equal(wallet.reset().ok, true)
})
test('slot: reentrant engine and wallet notifications cannot double debit or settle', () => {
  const { wallet, engine, advance } = harness(() => winning(2))
  wallet.subscribe(() => { engine.spin(100); engine.tick(); engine.continueBonus() })
  engine.subscribe(() => { engine.spin(100); engine.tick(); engine.continueBonus() })
  engine.spin(100); advance(SPIN_MS)
  assert.equal(wallet.getSnapshot().session.transactions.length, 2)
})
test('slot: shared wallet excludes simultaneous games; duplicate IDs and settlement failure are safe', () => {
  const { wallet, engine, advance } = harness(() => winning(1), { id: () => 'same-id' })
  wallet.acquireRound('other-game'); assert.equal(engine.spin(100).ok, false); wallet.releaseRound('other-game')
  engine.spin(100); advance(SPIN_MS); advance(RESULT_MS); assert.equal(engine.spin(100).ok, false)
  const failed = harness(() => winning()); failed.wallet.credit = () => ({ ok: false, reason: 'balance-limit' })
  failed.engine.spin(100); failed.advance(SPIN_MS); assert.equal(failed.engine.getSnapshot().error, 'settlement-failed')
  assert.equal(failed.engine.getSnapshot().result, null); assert.equal(failed.wallet.reset().ok, true)
})
test('slot: entropy interruption during bonus retries unspent free spin without debit', () => {
  let fail = true
  const { wallet, engine, advance } = harness((_r, free) => { if (free && fail) throw Error('no entropy'); return free ? loss() : bonus() })
  engine.spin(100); advance(SPIN_MS); engine.continueBonus()
  assert.equal(engine.getSnapshot().phase, 'error'); assert.equal(engine.getSnapshot().bonusRemaining, 8)
  fail = false; engine.continueBonus(); assert.equal(engine.getSnapshot().bonusRemaining, 7)
  assert.equal(wallet.getSnapshot().session.transactions.length, 1)
})
test('slot: reload preserves booked wallet only, never restores/refunds/replays pending outcome', () => {
  let raw = null
  const storage = { getItem: () => raw, setItem: (_k, value) => { raw = value } }
  const wallet = createDemoSessionStore(() => storage), engine = createSlotEngine(wallet, { draw: bonus, id: () => 'reload-spin' })
  engine.spin(100)
  const restored = createDemoSessionStore(() => storage); restored.hydrate()
  const fresh = createSlotEngine(restored)
  assert.equal(restored.getSnapshot().session.balance, 999900)
  assert.equal(fresh.getSnapshot().phase, 'ready'); assert.equal(fresh.getSnapshot().bonusRemaining, 0)
  fresh.tick(); assert.equal(restored.getSnapshot().session.balance, 999900)
})
test('slot: throttled/rewinding clocks settle once and never skip an entire bonus', () => {
  const { engine, advance } = harness((_r, free) => free ? loss() : bonus())
  engine.spin(100); advance(100000); engine.continueBonus(); advance(100000)
  assert.equal(engine.getSnapshot().completed, 2); assert.equal(engine.getSnapshot().bonusRemaining, 7)
  advance(-50000); assert.equal(engine.getSnapshot().completed, 2)
})
test('slot: deterministic simulation reports all requested metrics including full bonus series', () => {
  const a = simulate(1000, 42); assert.deepEqual(a, simulate(1000, 42)); assert.notDeepEqual(a, simulate(1000, 43))
  assert.equal(a.bonusSpins, a.bonuses * 8)
  assert.ok(a.estimatedRtp > 0 && a.hitRate > 0 && a.hitRate <= 1 && a.maxObservedWinMultiple > 0)
  for (const n of [0, -1, 1.1, Infinity, 10000001]) assert.throws(() => simulate(n))
  assert.throws(() => seededRandom(0))
})
