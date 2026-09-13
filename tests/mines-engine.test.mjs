import test from 'node:test'
import assert from 'node:assert/strict'
import config from '../lib/originals/mines/config.ts'
import math from '../lib/originals/mines/math.ts'
import engineModule from '../lib/originals/mines/engine.ts'
import session from '../lib/originals/session.ts'
import simulation from '../lib/originals/mines/simulation.ts'
const { MINE_COUNTS, generateMines, boundedInteger, MULTIPLIER_SCALE } = config
const { survivalProbability, fairMultiplier, configuredMultiplier, minesPayout, combinations } = math
function harness(options = {}) {
  let at = 0, serial = 0, raw = null
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value } }
  const wallet = session.createDemoSessionStore(() => storage), engine = engineModule.createMinesEngine(wallet,
    { now: () => at, id: () => `mines-${++serial}`, random: { uint32: () => 0 }, ...options })
  wallet.hydrate()
  return { wallet, engine, storage, advance(ms) { at += ms; engine.tick() }, start(stake = 1000, mines = 3) { return engine.start(stake, mines, engine.getSnapshot().revision) },
    pick(i) { return engine.pick(i, engine.getSnapshot().roundId) }, cash() { return engine.cashOut(engine.getSnapshot().roundId) }, state: () => engine.getSnapshot(), ledger: () => wallet.getSnapshot().session.transactions }
}
test('Mines: identity, 25 tiles, immutable presets and default three mines', () => {
  assert.equal(config.LIVA_MINES.category, 'instant-games'); assert.equal(config.BOARD_SIZE, 25)
  assert.deepEqual(MINE_COUNTS, [1,3,5,7,10]); assert.equal(config.DEFAULT_MINES, 3)
  assert.ok(Object.isFrozen(MINE_COUNTS)); assert.ok(Object.isFrozen(config.LIVA_MINES.title))
})
test('Mines RNG: exact count, no duplicates, valid indexes and immutable layout in every mode', () => {
  for (const count of MINE_COUNTS) for (let v = 0; v < 100; v++) {
    const cells = generateMines(count, { uint32: () => v })
    assert.equal(cells.length, count); assert.equal(new Set(cells).size, count); assert.ok(cells.every(i => i >= 0 && i < 25)); assert.ok(Object.isFrozen(cells))
  }
  assert.throws(() => generateMines(2))
})
test('Mines RNG: unbiased rejection, secure default and fail-closed invalid entropy', () => {
  let calls = 0
  assert.equal(boundedInteger(25, { uint32: () => ++calls === 1 ? 0xffffffff : 24 }), 24); assert.equal(calls, 2)
  for (const value of [-1, 0x100000000, NaN, 1.1]) assert.throws(() => boundedInteger(25, { uint32: () => value }))
  assert.throws(() => boundedInteger(25, { uint32: () => 0xffffffff }))
  assert.throws(() => boundedInteger(26)); assert.ok(generateMines(3).every(i => Number.isInteger(i)))
})
test('Mines math: exact survival and reciprocal multipliers, including terminal picks', () => {
  assert.deepEqual(survivalProbability(3,1), { numerator:22n, denominator:25n })
  assert.deepEqual(fairMultiplier(3,1), { numerator:25n, denominator:22n })
  assert.deepEqual(survivalProbability(10,15), { numerator:1n, denominator:3268760n })
  for (const m of MINE_COUNTS) assert.deepEqual(survivalProbability(m,0), { numerator:1n, denominator:1n })
  for (const pair of [[2,1],[3,-1],[3,23],[3,1.5]]) assert.throws(() => survivalProbability(...pair))
  assert.throws(() => combinations(26,2))
})
test('Mines math: all steps strictly increase and apply one centralized edge, never per pick', () => {
  for (const m of MINE_COUNTS) for (let k = 1; k <= 25-m; k++) {
    const p = survivalProbability(m,k), value = configuredMultiplier(m,k)
    assert.equal(BigInt(value), p.denominator * 9700n * 1000000n / (p.numerator * 10000n))
    assert.ok(value > configuredMultiplier(m,k-1)); assert.ok(Number.isSafeInteger(value))
    assert.ok(BigInt(value) * p.numerator * 10000n <= p.denominator * 9700n * 1000000n)
  }
  assert.equal(configuredMultiplier(3,1),1102272); assert.equal(configuredMultiplier(10,15),3170697200000)
  assert.equal(configuredMultiplier(3,0),MULTIPLIER_SCALE); assert.throws(() => configuredMultiplier(3,1,10001))
})
test('Mines math: integer payout includes stake, floors subunits and handles large terminal return', () => {
  assert.equal(minesPayout(1000,3,1),1102); assert.equal(minesPayout(100,1,1),101)
  assert.equal(minesPayout(5000,10,15),15853486000)
  for (const stake of [0,-1,1.1,NaN]) assert.throws(() => minesPayout(stake,3,1))
  assert.throws(() => minesPayout(1000,3,0)); assert.throws(() => minesPayout(session.MAX_CREDIT_UNITS,10,15))
  assert.equal(math.multiplierLabel(1102272,'en'),'1.10×')
})
test('Mines: Start debits once, protects stale revision and never exposes the active mine layout', () => {
  const h = harness(); const rev = h.state().revision
  assert.ok(h.start().ok); assert.equal(h.state().phase,'active'); assert.equal(h.ledger().length,1)
  assert.equal(h.engine.start(1000,3,rev).ok,false); assert.equal(h.ledger().length,1)
  assert.deepEqual(h.state().revealedMines,[]); assert.deepEqual(h.state().safe,[]); assert.equal(h.state().potential,0)
  assert.equal(h.wallet.reset().ok,false); assert.ok(Object.isFrozen(h.state()))
})
test('Mines: safe picks grow the ordered trail immediately, duplicate/invalid cells cannot advance math', () => {
  const h = harness(); h.start(); h.pick(24); h.pick(4); h.pick(19)
  assert.deepEqual(h.state().safe,[24,4,19]); assert.equal(h.state().potential,minesPayout(1000,3,3))
  const before = h.state(); assert.equal(h.pick(4).ok,false); assert.equal(h.state(),before)
  for (const i of [-1,25,1.5,NaN]) assert.equal(h.pick(i).ok,false)
  assert.equal(h.cash().ok,true); assert.ok(Object.isFrozen(h.state().safe))
})
test('Mines: zero-pick cashout blocked, one safe cashout credits exactly once and disables tile interaction', () => {
  const h = harness(); h.start(); assert.equal(h.cash().ok,false); h.pick(3)
  assert.ok(h.cash().ok); assert.equal(h.cash().ok,false); assert.equal(h.pick(4).ok,false)
  assert.deepEqual(h.ledger().map(t=>[t.kind,t.amount]),[['debit',1000],['credit',1102]])
  assert.equal(h.state().result.profit,102); assert.equal(h.state().phase,'cashed_out')
  h.advance(260); assert.equal(h.state().phase,'result'); h.advance(340); assert.equal(h.state().phase,'ready')
  assert.equal(h.ledger().length,2); assert.equal(h.state().result.returned,1102)
})
test('Mines: immediate mine hit loses once, exposes exact mines but never pays', () => {
  const h = harness(); h.start(); h.pick(0)
  assert.equal(h.state().phase,'mine_hit'); assert.equal(h.state().hit,0); assert.deepEqual(h.state().revealedMines,[0,1,2])
  assert.equal(h.state().result.returned,0); assert.equal(h.cash().ok,false); assert.equal(h.ledger().length,1)
  h.advance(599); assert.equal(h.state().phase,'result'); h.advance(1); assert.equal(h.state().phase,'ready')
  assert.equal(h.state().completed,1); assert.equal(h.ledger().length,1)
})
test('Mines: hitting a mine after safe picks preserves trail but forfeits all potential', () => {
  const h = harness(); h.start(); h.pick(3); h.pick(8); const potential=h.state().potential; h.pick(1)
  assert.ok(potential>1000); assert.deepEqual(h.state().safe,[3,8]); assert.equal(h.state().result.profit,-1000)
  assert.equal(h.ledger().length,1); assert.equal(h.pick(9).ok,false)
})
test('Mines: every mode auto-secures all safe tiles at the exact terminal multiplier', () => {
  for (const m of MINE_COUNTS) {
    const h = harness(); h.start(100,m); for(let i=m;i<25;i++) assert.ok(h.pick(i).ok)
    assert.equal(h.state().phase,'cashed_out'); assert.equal(h.state().safe.length,25-m)
    assert.equal(h.state().result.returned,minesPayout(100,m,25-m)); assert.equal(h.ledger().length,2)
  }
})
test('Mines: cannot change mine mode/stake during a round and no stale round cell can pick next round', () => {
  const h=harness(); h.start(); const first=h.state().roundId
  assert.equal(h.start(5000,10).ok,false); assert.equal(h.state().mineCount,3)
  h.pick(3); h.cash(); h.advance(600); assert.ok(h.start(500,7).ok)
  assert.equal(h.engine.pick(24,first).ok,false); assert.equal(h.engine.cashOut(first).ok,false); assert.deepEqual(h.state().safe,[])
})
test('Mines: insufficient funds and unsupported stakes/modes never debit', () => {
  const h=harness(); h.wallet.debit(999950)
  assert.equal(h.start().reason,'insufficient-credits'); assert.equal(h.ledger().length,1)
  for (const stake of [0,1,101,NaN,5001]) assert.equal(h.start(stake).ok,false)
  assert.equal(h.start(100,2).ok,false)
})
test('Mines: unavailable entropy, invalid ID/clock and reused IDs fail without debit', () => {
  for (const options of [{random:{uint32(){throw Error('no entropy')}}},{id:()=>''},{now:()=>NaN}]) {
    const h=harness(options); assert.equal(h.start().ok,false); assert.equal(h.ledger().length,0)
  }
  const h=harness({id:()=> 'same-id'});h.start();h.pick(0);h.advance(600);assert.equal(h.start().ok,false);assert.equal(h.ledger().length,1)
})
test('Mines: shared wallet round lock and maximal payout headroom checked before debit', () => {
  const h=harness(); assert.ok(h.wallet.acquireRound('other-round'));assert.equal(h.start().ok,false);assert.equal(h.ledger().length,0)
  h.wallet.releaseRound('other-round'); h.wallet.credit(session.MAX_CREDIT_UNITS-h.wallet.getSnapshot().session.balance)
  assert.equal(h.start().reason,'balance-limit'); assert.equal(h.ledger().length,1)
})
test('Mines: reentrant Start/Cash Out listeners cannot duplicate ledger entries', () => {
  const h=harness();const stop=h.wallet.subscribe(()=>{h.start();h.cash()}); h.start();h.pick(3);h.cash();stop()
  assert.equal(h.ledger().length,2);assert.equal(h.state().completed,1)
})
test('Mines: reentrant interruption after debit is deferred and releases unfinished round safely', () => {
  const h=harness();let once=false;const stop=h.wallet.subscribe(()=>{if(!once&&h.ledger().length){once=true;h.engine.abandon()}})
  h.start();stop();assert.equal(h.state().phase,'ready');assert.equal(h.ledger().length,1);assert.equal(h.wallet.reset().ok,true)
})
test('Mines: reload/unmount keeps spent credits, never resumes/refunds or duplicates completed payout', () => {
  const h=harness();h.start();h.pick(3);h.engine.abandon();h.advance(10000)
  assert.equal(h.ledger().length,1);assert.equal(h.state().phase,'ready')
  const wallet=session.createDemoSessionStore(()=>h.storage);wallet.hydrate();const next=engineModule.createMinesEngine(wallet)
  assert.equal(wallet.getSnapshot().session.balance,999000);assert.equal(next.getSnapshot().phase,'ready');assert.equal(next.getSnapshot().roundId,null)
  h.start();h.pick(3);h.cash();h.engine.abandon();assert.equal(h.ledger().length,3)
})
test('Mines: large seeded layout verification matches counts and combinatorial progression', () => {
  const report=simulation.simulateMines(100000,9132026)
  for(const r of report){assert.equal(r.cells.reduce((a,b)=>a+b),r.rounds*r.mines)
    for(const count of r.cells) assert.ok(Math.abs(count-r.expectedPerCell)<r.expectedPerCell*.055,JSON.stringify({mines:r.mines,count,expected:r.expectedPerCell}))
    assert.equal(r.progression.length,26-r.mines);assert.equal(r.progression[0].survived,r.rounds)
  }
})
