import test from 'node:test'
import assert from 'node:assert/strict'
import configModule from '../lib/originals/capybara/config.ts'
import mathModule from '../lib/originals/capybara/math.ts'
import engineModule from '../lib/originals/capybara/engine.ts'
import simModule from '../lib/originals/capybara/simulation.ts'
import sessionModule from '../lib/originals/session.ts'
const { SLOT_CONFIG: config, SYMBOLS, WAYS, validateConfig } = configModule
const { generateGrid, evaluateWays, evaluateSpin, randomBelow, settleAmount, validateGrid, scatterAward } = mathModule
const { createSlotEngine, SPIN_MS, RESULT_MS, BONUS_RESULT_MS, BONUS_WIN_MS, BONUS_INTRO_MS, FIRST_STOP_MS, STOP_GAP_MS, ANTICIPATION_GAP_MS } = engineModule
const { seededRandom, simulate, triggerProbabilities, playBonus } = simModule
const { createDemoSessionStore, MAX_CREDIT_UNITS } = sessionModule
const loss = () => ['coconut', 'emerald', 'flower', 'toucan', 'pearl'].map(s => Array(4).fill(s))
const winning = (wilds = 0) => {
  const grid = loss()
  for (let i = 0; i < 3; i++) grid[i][0] = i > 0 && i <= wilds ? 'wild' : 'leaf'
  return grid
}
const bonus = (suns = 3) => { const grid = loss(); for (let i = 0; i < suns; i++) grid[i % 5][Math.floor(i / 5)] = 'scatter'; return grid }
function harness(draw = loss, options = {}) {
  let at = 0, id = 0
  const wallet = createDemoSessionStore(() => null)
  const engine = createSlotEngine(wallet, { now: () => at, id: () => `slot-${++id}`, draw, ...options })
  const advance = ms => { at += ms; engine.tick() }
  /** Advance exactly to the (possibly anticipation-extended) final stop. */
  const settle = () => { while (engine.getSnapshot().phase === 'spinning') advance(engine.getSnapshot().revealAt - at) }
  return { wallet, engine, advance, settle, time: () => at }
}
test('slot: honest 5×4 / 1,024 ways and bounded immutable configuration', () => {
  assert.equal(WAYS, 1024); validateConfig(config)
  assert.throws(() => { config.paytable.leaf[0] = 0 }, TypeError)
  for (const patch of [{ payScale: 0 }, { scatterAwards: [8, 12] }, { scatterAwards: [12, 8, 20] }, { scatterAwards: [8, 12, 21] }, { maxFreeSpins: 51 },
    { maxFreeSpins: 19 }, { retriggerSpins: 0 }, { bonusScatterWeight: 0 }, { maxWinMultiple: Infinity }, { scatterTrigger: 2 }, { wildMultipliers: [2, 1] }]) assert.throws(() => validateConfig({ ...config, ...patch }))
  assert.deepEqual([config.scatterAwards, config.maxBonusMultiplier, config.retriggerSpins, config.maxFreeSpins], [[8, 12, 20], 5, 1, 50])
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
  const max = evaluateSpin(Array.from({ length: 5 }, (_, i) => Array(4).fill(i ? 'wild' : 'coconut')), 5000, 5)
  assert.equal(max.payout, 5000000); assert.equal(max.capped, true)
  assert.throws(() => settleAmount(1.1, wins, 1))
})
test('slot: 3 / 4 / 5+ Golden Suns anywhere award 8 / 12 / 20; two award nothing', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 20].map(n => scatterAward(n)), [0, 0, 0, 8, 12, 20, 20, 20])
  for (const [suns, spins] of [[2, 0], [3, 8], [4, 12], [5, 20], [7, 20]]) assert.equal(evaluateSpin(bonus(suns), 100).awardedSpins, spins)
})
test('slot: Sun scatters pay the bonus regardless of adjacency, reel or row', () => {
  const grid = loss(); grid[4][3] = 'scatter'; grid[0][2] = 'scatter'; grid[2][1] = 'scatter'
  assert.equal(evaluateSpin(grid, 100).awardedSpins, 8)
  const stacked = loss(); stacked[3][0] = stacked[3][1] = stacked[3][2] = stacked[3][3] = 'scatter'
  assert.equal(evaluateSpin(stacked, 100).awardedSpins, 12)
})
test('slot: each Sun during free spins requests +1 retrigger spin, never a new 8/12/20 award', () => {
  assert.equal(evaluateSpin(bonus(3), 100, 1).awardedSpins, 3)
  assert.equal(evaluateSpin(bonus(1), 100, 1).awardedSpins, 1)
  assert.equal(evaluateSpin(loss(), 100, 1).awardedSpins, 0)
})
test('slot: every bonus Wild raises the Gold Multiplier before the current payout, capped at ×5 and replacing the base ladder', () => {
  const a = evaluateSpin(winning(2), 100, 1)
  assert.equal(a.multiplier, 3); assert.equal(a.bonusMultiplier, 3)
  assert.equal(a.payout, settleAmount(100, a.wins, 3).payout)
  assert.equal(evaluateSpin(loss(), 100, a.bonusMultiplier).multiplier, 3)
  const capped = evaluateSpin(winning(2), 100, 4)
  assert.equal(capped.multiplier, 5); assert.equal(capped.bonusMultiplier, 5)
  assert.equal(evaluateSpin(winning(2), 100, 5).multiplier, 5)
  assert.throws(() => evaluateSpin(loss(), 100, 6))
})
test('slot: free-spin reels use their own Sun/Wild density while the paid reels stay unchanged', () => {
  const counts = (bonusReels) => {
    const random = seededRandom(7), tally = { wild: 0, scatter: 0 }
    for (let i = 0; i < 4000; i++) generateGrid(random, bonusReels).flat().forEach(s => { if (s in tally) tally[s]++ })
    return tally
  }
  const paid = counts(false), free = counts(true)
  assert.ok(free.wild > paid.wild * 1.6, 'free spins carry more Capybara Wilds')
  assert.ok(free.scatter < paid.scatter * 0.6, 'free spins carry fewer Suns, keeping retriggers occasional')
  assert.deepEqual(triggerProbabilities(), triggerProbabilities({ ...config, bonusScatterWeight: 1, bonusWildWeight: 1 }))
  const odds = triggerProbabilities()
  assert.ok(Math.abs(1 / odds.any - 108.43) < 0.01, 'paid trigger odds unchanged at ~1 in 108')
})
test('slot: paid stake debits once; hidden outcome settles once; repeated clicks/ticks cannot credit twice', () => {
  const { wallet, engine, advance } = harness(() => winning(2))
  const balance = wallet.getSnapshot().session.balance
  assert.equal(engine.spin(100).ok, true); assert.equal(engine.spin(100).ok, false)
  assert.equal(engine.getSnapshot().result, null); assert.equal(wallet.getSnapshot().session.balance, balance - 100)
  advance(SPIN_MS - 1); assert.equal(engine.getSnapshot().phase, 'spinning'); assert.equal(wallet.getSnapshot().session.balance, balance - 100)
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
test('slot: eight free spins never debit; Gold Multiplier climbs to ×5 and holds; wallet stays locked through bonus', () => {
  const { wallet, engine, advance, settle } = harness((_random, free) => free ? winning(1) : bonus())
  engine.spin(200); settle()
  const intro = engine.getSnapshot()
  assert.equal(intro.phase, 'bonus-intro'); assert.equal(wallet.reset().ok, false)
  assert.deepEqual([intro.bonusRemaining, intro.bonusAwarded, intro.bonusMultiplier], [8, 8, 1])
  engine.continueBonus()
  let total = 0, credits = 0
  for (let i = 1; i <= 8; i++) {
    const spinning = engine.getSnapshot()
    assert.equal(spinning.phase, 'spinning'); assert.equal(spinning.bonusRemaining, 8 - i, 'counter shows remaining / 8')
    settle()
    assert.equal(engine.getSnapshot().bonusMultiplier, Math.min(5, 1 + i))
    const evaluation = engine.getSnapshot().result.evaluation
    assert.equal(evaluation.payout, settleAmount(200, evaluation.wins, Math.min(5, 1 + i)).payout, 'active Gold Multiplier applies to the win')
    total += evaluation.payout; if (evaluation.payout) credits++
    if (i < 8) { assert.equal(wallet.reset().ok, false); advance(BONUS_WIN_MS) }
  }
  assert.equal(engine.getSnapshot().phase, 'bonus-summary'); assert.equal(engine.getSnapshot().bonusTotal, total)
  assert.equal(wallet.getSnapshot().session.transactions.filter(t => t.kind === 'debit').length, 1)
  assert.equal(wallet.getSnapshot().session.transactions.filter(t => t.kind === 'credit').length, credits, 'one credit per winning spin, never duplicated')
  assert.equal(wallet.getSnapshot().session.balance, 1000000 - 200 + total)
  for (let i = 0; i < 5; i++) engine.tick()
  assert.equal(wallet.getSnapshot().session.balance, 1000000 - 200 + total)
  engine.continueBonus(); assert.equal(engine.getSnapshot().phase, 'ready'); assert.equal(wallet.reset().ok, true)
})
test('slot: bonus intro starts free spins on its own after a short beat, or at once when tapped', () => {
  const { engine, advance, settle } = harness((_r, free) => free ? loss() : bonus(4))
  engine.spin(100); settle()
  assert.equal(engine.getSnapshot().phase, 'bonus-intro'); assert.equal(engine.getSnapshot().bonusRemaining, 12)
  advance(BONUS_INTRO_MS - 1); assert.equal(engine.getSnapshot().phase, 'bonus-intro')
  advance(1); assert.equal(engine.getSnapshot().phase, 'spinning'); assert.equal(engine.getSnapshot().bonusRemaining, 11)
  engine.continueBonus(); assert.equal(engine.getSnapshot().bonusRemaining, 11, 'a late tap cannot start a second free spin')
  const quick = harness((_r, free) => free ? loss() : bonus(5))
  quick.engine.spin(100); quick.settle(); quick.engine.continueBonus()
  assert.deepEqual([quick.engine.getSnapshot().phase, quick.engine.getSnapshot().bonusRemaining, quick.engine.getSnapshot().bonusAwarded], ['spinning', 19, 20])
})
test('slot: zero-win free spins complete the bonus, and Spin can dismiss the summary into a fresh paid spin', () => {
  const { wallet, engine, advance, settle } = harness((_r, free) => free ? loss() : bonus())
  engine.spin(100); settle(); engine.continueBonus()
  for (let i = 0; i < 8; i++) { settle(); if (i < 7) advance(BONUS_RESULT_MS) }
  assert.equal(engine.getSnapshot().phase, 'bonus-summary'); assert.equal(engine.getSnapshot().bonusTotal, 0)
  assert.equal(wallet.getSnapshot().session.transactions.length, 1)
  assert.equal(engine.spin(100).ok, true)
  const next = engine.getSnapshot()
  assert.deepEqual([next.phase, next.free, next.bonusRemaining, next.bonusAwarded, next.bonusMultiplier], ['spinning', false, 0, 0, 1])
  settle(); engine.continueBonus()
  assert.equal(engine.getSnapshot().bonusMultiplier, 1, 'a repeated bonus starts again from ×1')
})
test('slot: each Sun in a free spin adds +1 spin as it lands, capped at 50 spins per bonus', () => {
  let freeSpin = 0
  const { engine, advance, settle, wallet } = harness((_r, free) => {
    if (!free) return bonus()
    freeSpin++; const grid = loss(); if (freeSpin === 2) grid[3][1] = 'scatter'; return grid
  })
  engine.spin(100); settle(); engine.continueBonus(); settle(); advance(BONUS_RESULT_MS)
  assert.equal(engine.getSnapshot().bonusRemaining, 6)
  advance(FIRST_STOP_MS + 2 * STOP_GAP_MS); assert.equal(engine.getSnapshot().retriggered, 0)
  advance(STOP_GAP_MS)
  const retrigger = engine.getSnapshot()
  assert.deepEqual([retrigger.phase, retrigger.stopped, retrigger.retriggered, retrigger.bonusRemaining, retrigger.bonusAwarded], ['spinning', 4, 1, 7, 9])
  settle(); assert.equal(engine.getSnapshot().bonusRemaining, 7); assert.equal(engine.getSnapshot().bonusAwarded, 9)
  let played = 2
  while (engine.getSnapshot().phase !== 'bonus-summary') { advance(BONUS_RESULT_MS); settle(); played++ }
  assert.equal(played, 9)
  assert.equal(wallet.getSnapshot().session.transactions.length, 1)

  const flood = harness((_r, free) => free ? bonus(4) : bonus(5))
  flood.engine.spin(100); flood.settle(); flood.engine.continueBonus()
  let spins = 0
  while (flood.engine.getSnapshot().phase !== 'bonus-summary' && spins < 200) { flood.settle(); spins++; flood.advance(BONUS_RESULT_MS) }
  assert.equal(spins, 50, 'retriggers stop at the 50-spin ceiling, never loop forever')
  assert.equal(flood.engine.getSnapshot().bonusAwarded, 50)
  assert.equal(playBonus(seededRandom(3), 100, 20, { ...config, bonusScatterWeight: 1000000 }).played, 50)
})
test('slot: reels stop left to right and disclose only landed reels; payout books once on the last stop', () => {
  const drawn = winning(2)
  const { wallet, engine, advance } = harness(() => drawn)
  const balance = wallet.getSnapshot().session.balance
  engine.spin(100)
  assert.deepEqual(engine.getSnapshot().grid, engineModule.IDLE_GRID); assert.equal(engine.getSnapshot().stopped, 0)
  advance(FIRST_STOP_MS - 1); assert.equal(engine.getSnapshot().stopped, 0)
  advance(1); assert.equal(engine.getSnapshot().stopped, 1)
  assert.deepEqual(engine.getSnapshot().grid[0], drawn[0]); assert.deepEqual(engine.getSnapshot().grid[1], engineModule.IDLE_GRID[1])
  for (let reel = 2; reel <= 4; reel++) {
    advance(STOP_GAP_MS); assert.equal(engine.getSnapshot().stopped, reel)
    assert.equal(wallet.getSnapshot().session.balance, balance - 100, 'nothing is paid before the last reel stops')
  }
  assert.equal(engine.getSnapshot().result, null)
  advance(STOP_GAP_MS)
  assert.equal(engine.getSnapshot().phase, 'result'); assert.equal(engine.getSnapshot().stopped, 5)
  assert.equal(wallet.getSnapshot().session.balance, balance - 100 + evaluateSpin(drawn, 100).payout)
})
test('slot: two landed Suns start anticipation on remaining reels without changing the drawn outcome', () => {
  const drawn = loss(); drawn[0][2] = 'scatter'; drawn[1][0] = 'scatter'; drawn[4][3] = 'scatter'
  const { engine, advance, settle, time } = harness(() => drawn)
  engine.spin(100)
  advance(FIRST_STOP_MS); assert.equal(engine.getSnapshot().anticipation, false)
  advance(STOP_GAP_MS)
  const tense = engine.getSnapshot()
  assert.equal(tense.anticipation, true); assert.equal(tense.stopped, 2)
  assert.equal(tense.revealAt, FIRST_STOP_MS + STOP_GAP_MS + 3 * ANTICIPATION_GAP_MS)
  advance(STOP_GAP_MS); assert.equal(engine.getSnapshot().stopped, 2, 'the anticipating reel keeps spinning longer')
  settle()
  assert.equal(time(), FIRST_STOP_MS + STOP_GAP_MS + 3 * ANTICIPATION_GAP_MS)
  assert.deepEqual(engine.getSnapshot().grid, drawn); assert.equal(engine.getSnapshot().phase, 'bonus-intro')

  const late = harness(() => { const g = loss(); g[3][0] = 'scatter'; g[4][0] = 'scatter'; return g })
  late.engine.spin(100); late.settle()
  assert.equal(late.time(), SPIN_MS, 'Suns on the final reels need no anticipation')
  assert.equal(late.engine.getSnapshot().anticipation, false)

  const free = harness((_r, isFree) => isFree ? bonus(3) : bonus(3))
  free.engine.spin(100); free.settle(); free.engine.continueBonus()
  const at = free.time(); free.settle()
  assert.equal(free.time() - at, SPIN_MS, 'free spins never fake an anticipation delay')
})
test('slot: Gold Multiplier steps up as each Capybara lands, before the win is booked', () => {
  const freeGrid = loss(); freeGrid[1][0] = 'wild'; freeGrid[3][2] = 'wild'
  const { engine, advance, settle, wallet } = harness((_r, free) => free ? freeGrid : bonus())
  engine.spin(100); settle(); engine.continueBonus()
  const before = wallet.getSnapshot().session.balance
  advance(FIRST_STOP_MS); assert.equal(engine.getSnapshot().bonusMultiplier, 1)
  advance(STOP_GAP_MS); assert.equal(engine.getSnapshot().bonusMultiplier, 2)
  advance(STOP_GAP_MS); assert.equal(engine.getSnapshot().bonusMultiplier, 2)
  advance(STOP_GAP_MS); assert.equal(engine.getSnapshot().bonusMultiplier, 3)
  assert.equal(wallet.getSnapshot().session.balance, before)
  settle(); assert.equal(engine.getSnapshot().bonusMultiplier, 3); assert.equal(engine.getSnapshot().result.evaluation.bonusMultiplier, 3)
})
test('slot: reentrant engine and wallet notifications cannot double debit or settle', () => {
  const { wallet, engine, advance } = harness(() => winning(2))
  wallet.subscribe(() => { engine.spin(100); engine.tick(); engine.continueBonus() })
  engine.subscribe(() => { engine.spin(100); engine.tick(); engine.continueBonus() })
  engine.spin(100); advance(SPIN_MS)
  assert.equal(wallet.getSnapshot().session.transactions.length, 2)
  for (let i = 0; i < 5; i++) { assert.equal(engine.spin(100).ok, false); engine.tick() }
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
  const { wallet, engine, settle } = harness((_r, free) => { if (free && fail) throw Error('no entropy'); return free ? loss() : bonus() })
  engine.spin(100); settle(); engine.continueBonus()
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
  assert.ok(a.bonusSpins >= a.bonuses * 8 && a.bonusSpins <= a.bonuses * 50)
  assert.equal(a.bonuses, a.triggers.three + a.triggers.four + a.triggers.fivePlus)
  assert.ok(Math.abs(a.estimatedRtp - a.baseRtp - a.bonusRtp) < 1e-9)
  assert.ok(a.estimatedRtp > 0 && a.hitRate > 0 && a.hitRate <= 1 && a.maxObservedWinMultiple > 0)
  for (const n of [0, -1, 1.1, Infinity, 10000001]) assert.throws(() => simulate(n))
  assert.throws(() => seededRandom(0))
})
