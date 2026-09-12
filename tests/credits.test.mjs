import test from 'node:test'
import assert from 'node:assert/strict'
import creditsModule from '../lib/originals/credits.ts'
import sessionModule from '../lib/originals/session.ts'
import engineModule from '../lib/originals/crash/engine.ts'
const { CREDIT_SCALE, INITIAL_CREDIT_UNITS, MAX_CREDIT_UNITS, parseCreditInput, formatCredits } = creditsModule
const { decodeSession, createDemoSessionStore, DEMO_STORAGE_KEY, HISTORY_LIMIT } = sessionModule
const { payoutFor } = engineModule
const legacy = () => ({ version: 1, balance: 9750, sequence: 1, settings: { sound: true, haptics: true },
  transactions: [{ sequence: 1, kind: 'debit', amount: 250, balance: 9750, at: 123456, gameId: 'island-crash', roundId: 'legacy-round' }] })
function memory(raw) {
  const data = new Map([[DEMO_STORAGE_KEY, raw]])
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}

test('decimal inputs convert only at the boundary; display uses exactly two localized digits', () => {
  assert.equal(CREDIT_SCALE, 100)
  for (const [input, units] of [['10', 1000], ['10.00', 1000], ['11.50', 1150], ['234,25', 23425], [' 0.01 ', 1], ['0', 0], ['1000000000.00', MAX_CREDIT_UNITS]]) {
    assert.equal(parseCreditInput(input), units)
  }
  for (const input of ['', '-1', '1.001', '.01', '1e2', '1,1.1', 'NaN', 'Infinity', '1000000000.01']) assert.ok(Number.isNaN(parseCreditInput(input)))
  assert.equal(formatCredits(975000, 'en'), '9,750.00')
  assert.equal(formatCredits(975000, 'pt-BR'), '9.750,00')
  assert.equal(formatCredits(975000, 'es-MX'), '9,750.00')
  assert.equal(formatCredits(1, 'en'), '0.01')
  assert.equal(formatCredits(0, 'en'), '0.00')
  assert.equal(formatCredits(MAX_CREDIT_UNITS, 'en'), '1,000,000,000.00')
  for (const invalid of [NaN, Infinity, -1, 1.1]) assert.equal(formatCredits(invalid, 'en'), '—')
})

test('live return and settlement share exact subunit arithmetic, including rounding boundaries', () => {
  for (const [stake, multiplier, units, display] of [[1000, 115, 1150, '11.50'], [10000, 101, 10100, '101.00'], [25000, 234, 58500, '585.00']]) {
    assert.equal(payoutFor(stake, multiplier), units)
    assert.equal(formatCredits(payoutFor(stake, multiplier), 'en'), display)
  }
  assert.equal(payoutFor(101, 247), 249, 'discard only the fractional subunit, not fractional credits')
  assert.equal(payoutFor(1, 199), 1)
  assert.equal(payoutFor(1, 200), 2)
  assert.equal(payoutFor(99999999999, 9999), Number(99999999999n * 9999n / 100n))
})

test('v1 9750 migrates to 975000 once, preserving settings and ledger identity; reset stays safe', () => {
  const original = legacy(), raw = JSON.stringify(original), storage = memory(raw)
  const store = createDemoSessionStore(() => storage)
  store.hydrate()
  const migrated = store.getSnapshot().session
  assert.equal(store.getSnapshot().storageStatus, 'persistent')
  assert.equal(migrated.version, 2)
  assert.equal(migrated.balance, 975000)
  assert.equal(formatCredits(migrated.balance, 'en'), '9,750.00')
  assert.deepEqual(migrated.settings, original.settings)
  assert.deepEqual(migrated.transactions, original.transactions.map(item => ({ ...item, amount: item.amount * 100, balance: item.balance * 100 })))
  assert.equal(JSON.stringify(original), raw, 'migration does not mutate the source')
  for (let i = 0; i < 5; i++) {
    const next = createDemoSessionStore(() => storage); next.hydrate()
    assert.deepEqual(next.getSnapshot().session, migrated, 'v2 reload never scales again')
  }
  assert.equal(store.reset().ok, true)
  assert.equal(store.getSnapshot().session.balance, INITIAL_CREDIT_UNITS)
  assert.equal(store.getSnapshot().session.transactions.at(-1).amount, INITIAL_CREDIT_UNITS)
  assert.deepEqual(store.getSnapshot().session.settings, original.settings)
  assert.deepEqual(decodeSession(storage.getItem(DEMO_STORAGE_KEY)), store.getSnapshot().session)
})

test('valid bounded v1 history, resets, maximum balance and empty initial state migrate without losing entries', () => {
  const value = { ...legacy(), balance: 10000, sequence: 0, transactions: [] }
  assert.equal(decodeSession(JSON.stringify(value)).balance, INITIAL_CREDIT_UNITS)
  for (let i = 1; i <= 70; i++) {
    const kind = i === 30 ? 'reset' : i % 2 ? 'debit' : 'credit', amount = kind === 'reset' ? 10000 : 3
    value.balance = kind === 'reset' ? 10000 : value.balance + (kind === 'debit' ? -amount : amount)
    value.sequence = i
    value.transactions.push({ sequence: i, kind, amount, balance: value.balance, at: 1000 + i })
    value.transactions = value.transactions.slice(-HISTORY_LIMIT)
  }
  const migrated = decodeSession(JSON.stringify(value))
  assert.equal(migrated.sequence, 70)
  assert.equal(migrated.transactions.length, HISTORY_LIMIT)
  assert.equal(migrated.transactions[0].sequence, 21)
  assert.equal(migrated.transactions.find(item => item.kind === 'reset').amount, INITIAL_CREDIT_UNITS)
  assert.equal(migrated.balance, value.balance * 100)
  const maximum = { ...legacy(), balance: 1_000_000_000,
    transactions: [{ sequence: 1, kind: 'credit', amount: 999_990_000, balance: 1_000_000_000, at: 1 }] }
  assert.equal(decodeSession(JSON.stringify(maximum)).balance, MAX_CREDIT_UNITS)
})

test('migration validates v1 before conversion; invalid/unknown records recover instead of inventing credits', () => {
  const good = legacy()
  const invalid = [{ ...good, version: 3 }, { ...good, balance: 9750.5 }, { ...good, balance: 975000 },
    { ...good, transactions: [{ ...good.transactions[0], amount: 249 }] },
    { ...good, transactions: [{ ...good.transactions[0], roundId: '<invalid>' }] },
    { ...good, transactions: [{ ...good.transactions[0], kind: 'reset' }] }]
  for (const value of invalid) {
    const raw = JSON.stringify(value)
    assert.equal(decodeSession(raw), null)
    const store = createDemoSessionStore(() => memory(raw)); store.hydrate()
    assert.equal(store.getSnapshot().storageStatus, 'recovered')
    assert.equal(store.getSnapshot().session.balance, INITIAL_CREDIT_UNITS)
  }
})

test('failed migration persistence keeps converted balance usable in memory and retry never double-scales', () => {
  const raw = JSON.stringify(legacy())
  const storage = { getItem: () => raw, setItem() { throw Error('quota') } }
  const first = createDemoSessionStore(() => storage); first.hydrate()
  assert.equal(first.getSnapshot().storageStatus, 'memory-only')
  assert.equal(first.getSnapshot().session.balance, 975000)
  first.debit(1); first.credit(1)
  assert.equal(first.getSnapshot().session.balance, 975000)
  const next = createDemoSessionStore(() => storage); next.hydrate()
  assert.equal(next.getSnapshot().session.balance, 975000)
})
