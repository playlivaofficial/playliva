import test from 'node:test'
import assert from 'node:assert/strict'
import engineModule from '../lib/originals/crash/engine.ts'
import walletModule from '../lib/originals/session.ts'
const { createCrashEngine, generateCrashPoint, multiplierAt, timeToMultiplier, payoutFor,
  MAX_MULTIPLIER, PREPARING_MS, KICK_MS, RESULT_MS, SETTLED_MS } = engineModule
const { createDemoSessionStore, MAX_CREDITS } = walletModule
const flight = PREPARING_MS + KICK_MS
function fixture(point = 500, storage = null) {
  let time = 0, ids = 0
  const wallet = createDemoSessionStore(() => storage, () => 1000 + time)
  const sample = Math.ceil((1 - 97 / point) * 0x1_0000_0000)
  const random = { uint32: () => sample }
  assert.equal(generateCrashPoint(random), point)
  const engine = createCrashEngine(wallet, { now: () => time, random, id: () => `round-${++ids}` })
  return { wallet, engine, set: t => { time = t }, at: t => { time = t; engine.tick() },
    balance: () => wallet.getSnapshot().session.balance, snapshot: engine.getSnapshot }
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
test('fixed-point payouts floor fractional credits and stay integer-safe', () => {
  assert.equal(payoutFor(101, 247), 249)
  assert.equal(payoutFor(MAX_CREDITS, MAX_MULTIPLIER), 100_000_000_000)
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
  assert.equal(f.engine.start(10001).reason, 'insufficient-credits')
  for (const auto of [100, 10001, 201.1, NaN]) assert.equal(f.engine.start(100, auto).reason, 'invalid-auto')
  assert.equal(f.balance(), 10000)
  f.wallet.credit(MAX_CREDITS - 10000)
  assert.equal(f.engine.start(100).reason, 'balance-limit')
})
test('preparing/kick/flight are timed; repeated start and early cashout cannot mutate twice', () => {
  const f = fixture()
  assert.equal(f.engine.start(100).ok, true)
  assert.equal(f.snapshot().phase, 'preparing')
  for (let i = 0; i < 20; i++) { assert.equal(f.engine.start(100).ok, false); assert.equal(f.engine.cashOut(), false) }
  assert.equal(f.balance(), 9900)
  f.at(PREPARING_MS); assert.equal(f.snapshot().phase, 'kick')
  f.at(flight); assert.equal(f.snapshot().phase, 'flying')
  assert.equal(f.wallet.getSnapshot().session.transactions.length, 1)
})
test('manual cashout credits once, rejects spam/stale callbacks, then returns ready', () => {
  const f = fixture()
  f.engine.start(100)
  f.at(flight + timeToMultiplier(247) + .001)
  assert.equal(f.engine.cashOut(), true)
  assert.equal(f.balance(), 10147)
  const id = f.snapshot().roundId
  for (let i = 0; i < 20; i++) { assert.equal(f.engine.cashOut(id), false); f.engine.tick() }
  assert.equal(f.balance(), 10147)
  f.at(flight + timeToMultiplier(247) + RESULT_MS + 1)
  assert.equal(f.snapshot().phase, 'settled')
  f.at(flight + timeToMultiplier(247) + RESULT_MS + SETTLED_MS + 1)
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
    assert.equal(f.snapshot().phase, 'crashed')
    assert.equal(f.balance(), 9900)
  }
})
test('auto settlement uses logical deadlines even after a throttled tab misses the entire flight', () => {
  const f = fixture(500)
  f.engine.start(100, 200)
  f.at(flight + 100000)
  assert.equal(f.snapshot().phase, 'cashed_out')
  assert.equal(f.snapshot().result.multiplier, 200)
  assert.equal(f.balance(), 10100)
  assert.equal(f.engine.cashOut(), false)
  for (const point of [100, 150, 200]) {
    const loss = fixture(point)
    loss.engine.start(100, 200); loss.at(flight + 100000)
    assert.equal(loss.snapshot().result.won, false)
    assert.equal(loss.balance(), 9900)
  }
})
test('manual/auto race, wallet re-entrancy and double notifications settle exactly once', () => {
  const g = fixture()
  g.wallet.hydrate()
  g.wallet.subscribe(() => { g.engine.start(100); g.engine.cashOut(); g.engine.tick() })
  g.engine.start(100, 200)
  g.set(flight + timeToMultiplier(200))
  g.engine.cashOut(); g.engine.tick(); g.engine.cashOut()
  assert.equal(g.balance(), 10100)
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
  assert.equal(next.balance(), 9750)
  next.engine.tick(); assert.equal(next.engine.cashOut(), false)
  assert.equal(next.wallet.getSnapshot().session.transactions.length, 1)
  assert.equal(next.wallet.reset().ok, true)
})
test('RNG failure does not spend credits; duplicate round IDs are rejected', () => {
  const wallet = createDemoSessionStore(() => null)
  const failed = createCrashEngine(wallet, { random: { uint32() { throw new Error('Unavailable') } } })
  assert.equal(failed.start(100).reason, 'random-unavailable')
  assert.equal(wallet.getSnapshot().session.balance, 10000)
  let t = 0
  const engine = createCrashEngine(wallet, { now: () => t, random: { uint32: () => 0 }, id: () => 'same-id' })
  engine.start(100); t = flight; engine.tick()
  t += RESULT_MS + SETTLED_MS; engine.tick()
  assert.equal(engine.start(100).ok, false)
})
