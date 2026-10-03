import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import sessionModule from '../lib/originals/session.ts'
import realModule from '../lib/originals/play-real.ts'
import affiliateModule from '../lib/affiliate.ts'
import copyModule from '../lib/originals/copy.ts'
const { createDemoSessionStore, decodeSession, DEMO_STORAGE_KEY, INITIAL_CREDIT_UNITS: INITIAL_CREDITS, MAX_CREDIT_UNITS: MAX_CREDITS, HISTORY_LIMIT } = sessionModule
const { getPlayRealOptions } = realModule
const memory = () => {
  const data = new Map()
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}

test('demo wallet starts at 10,000 credits in integer subunits; debit, credit and reset are bounded and immutable', () => {
  const store = createDemoSessionStore(() => null, () => 1234)
  assert.equal(store.getSnapshot().session.balance, INITIAL_CREDITS)
  assert.deepEqual(store.debit(250, { gameId: 'test-only', roundId: 'round-1' }), { ok: true })
  const previous = store.getSnapshot()
  assert.equal(previous.session.balance, INITIAL_CREDITS - 250)
  assert.deepEqual(store.credit(100), { ok: true })
  assert.equal(store.getSnapshot().session.balance, INITIAL_CREDITS - 150)
  assert.equal(previous.session.balance, INITIAL_CREDITS - 250)
  assert.throws(() => { previous.session.balance = 42 }, TypeError)
  assert.deepEqual(store.debit(INITIAL_CREDITS - 149), { ok: false, reason: 'insufficient-credits' })
  assert.equal(store.getSnapshot().session.balance, INITIAL_CREDITS - 150)
  assert.equal(store.reset().ok, true)
  assert.equal(store.getSnapshot().session.balance, INITIAL_CREDITS)
  assert.equal(store.getSnapshot().session.transactions.at(-1).kind, 'reset')
  assert.equal(store.getSnapshot().session.transactions[0].roundId, 'round-1')
  assert.equal(store.getSnapshot().session.transactions[0].at, 1234)
  assert.ok(decodeSession(JSON.stringify(store.getSnapshot().session)))
})

test('invalid wallet amounts, overflow and invalid context never change balance/history', () => {
  const store = createDemoSessionStore(() => null)
  store.hydrate()
  const before = store.getSnapshot()
  for (const amount of [0, -1, 1.5, NaN, Infinity, -Infinity, '100', null, undefined, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(store.debit(amount).ok, false)
    assert.equal(store.credit(amount).ok, false)
    assert.equal(store.getSnapshot(), before)
  }
  assert.equal(store.credit(MAX_CREDITS).reason, 'balance-limit')
  assert.equal(store.debit(1, { roundId: 'email@example.invalid' }).reason, 'invalid-context')
  assert.equal(store.credit(MAX_CREDITS - INITIAL_CREDITS).ok, true)
  assert.equal(store.credit(1).ok, false)
  assert.equal(store.debit(MAX_CREDITS).ok, true)
  assert.equal(store.getSnapshot().session.balance, 0)
  assert.equal(store.debit(1).ok, false)
})

test('local session persists balance/settings/history and bounds its schema', () => {
  const storage = memory()
  const store = createDemoSessionStore(() => storage)
  const unlisten = store.subscribe(() => {})
  assert.equal(store.getSnapshot().storageStatus, 'persistent')
  store.setSettings({ sound: true, haptics: true })
  assert.equal(store.setSettings({ sound: 'yes', haptics: false }), false)
  for (let i = 0; i < HISTORY_LIMIT + 20; i++) store.debit(1)
  const state = store.getSnapshot().session
  assert.equal(state.transactions.length, HISTORY_LIMIT)
  assert.equal(state.transactions[0].sequence, 21)
  const restored = createDemoSessionStore(() => storage)
  restored.hydrate()
  assert.deepEqual(restored.getSnapshot().session, state)
  assert.deepEqual(restored.getSnapshot().session.settings, { sound: true, haptics: true })
  assert.equal(restored.getServerSnapshot().session.balance, INITIAL_CREDITS)
  unlisten()
})

test('corruption, unknown/older schemas and inconsistent records safely reset', () => {
  const fixture = memory()
  const good = createDemoSessionStore(() => fixture)
  good.debit(10)
  const state = good.getSnapshot().session
  const invalid = ['{bad', 'null', '[]', 'x'.repeat(32769),
    ...[{ ...state, version: 0 }, { ...state, version: 3 }, { ...state, balance: -1 },
      { ...state, balance: 99 }, { ...state, settings: { sound: 'true', haptics: false } },
      { ...state, transactions: [] }, { ...state, transactions: [null] },
      { ...state, transactions: [{ ...state.transactions[0], sequence: 4 }] },
      { ...state, transactions: [{ ...state.transactions[0], amount: 100 }] }].map(JSON.stringify)]
  for (const raw of invalid) {
    const storage = memory()
    storage.setItem(DEMO_STORAGE_KEY, raw)
    const store = createDemoSessionStore(() => storage)
    store.hydrate()
    assert.equal(store.getSnapshot().session.balance, INITIAL_CREDITS)
    assert.equal(store.getSnapshot().storageStatus, 'recovered')
    assert.ok(decodeSession(storage.getItem(DEMO_STORAGE_KEY)))
  }
})

test('storage access/read/write errors keep a usable in-memory wallet', () => {
  for (const access of [() => null, () => { throw Error('unavailable') },
    () => ({ getItem() { throw Error('blocked') }, setItem() {} }),
    () => ({ getItem() { return null }, setItem() { throw Error('quota') } })]) {
    const store = createDemoSessionStore(access)
    store.hydrate()
    assert.equal(store.getSnapshot().storageStatus, 'memory-only')
    assert.equal(store.debit(10).ok, true)
    assert.equal(store.credit(5).ok, true)
    assert.equal(store.getSnapshot().session.balance, INITIAL_CREDITS - 5)
  }
})

test('Play Real uses approved category/GEO links without mapping Originals to provider games',()=>{
  for(const geo of ['MX','CO','PE']) {
    const locale=`es-${geo}`,snapshot=commercialFixture(geo),partner=snapshot.operators[0]
    for(const category of ['crash','slots','live-casino','table-games','instant-games']) {
      const options=getPlayRealOptions(geo,category,locale,snapshot)
      assert.equal(options.length,1)
      const query=new URL(options[0].href,'https://www.playliva.com').searchParams
      assert.equal(query.get('game'),null)
      assert.equal(query.get('country'),geo)
      assert.equal(query.get('category'),category)
      assert.equal(affiliateModule.resolveDestination({operatorSlug:partner.slug,country:geo,category},snapshot)?.url,partner.affiliateUrl[geo])
    }
    for(const category of ['sports','unknown',undefined])assert.deepEqual(getPlayRealOptions(geo,category,locale,snapshot),[])
    const generic=realModule.getGenericApprovedOperatorCtas(geo,locale,snapshot)
    assert.equal(generic.length,1);assert.equal(generic[0].mode,'generic-brand')
    const query=new URL(generic[0].href,'https://www.playliva.com').searchParams
    assert.equal(query.get('game'),null);assert.equal(query.get('category'),null)
    assert.equal(query.get('placement'),'originals_generic_operator')
    for(const other of ['BR','GE','MX','CO','PE'])if(other!==geo)assert.deepEqual(getPlayRealOptions(other,'crash',locale,snapshot),[])
    for(const patch of [{approved:false},{active:false},{affiliateStatus:'pending'},{verified:false},{isMock:true},{destinationReady:false}]) {
      const blocked=structuredClone(snapshot);Object.assign(blocked.operators[0],patch)
      assert.deepEqual(getPlayRealOptions(geo,'crash',locale,blocked),[])
    }
  }
})

test('shared terminology is complete in all three locales, without currency symbols', () => {
  const english = copyModule.originalsCopy('en')
  for (const locale of ['en', 'pt-BR', 'es-MX']) {
    const copy = copyModule.originalsCopy(locale)
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(english).sort())
    assert.ok(Object.values(copy).every(value => value.length > 0 && !/[$€£]/.test(value)))
    assert.equal(copy.credits, 'Liva Credits')
  }
})

test('detected competing tab writes detach persistence instead of overwriting newer saved progress', () => {
  const storage = memory()
  const first = createDemoSessionStore(() => storage)
  const second = createDemoSessionStore(() => storage)
  first.hydrate()
  second.hydrate()
  first.debit(100)
  second.debit(20)
  assert.equal(second.getSnapshot().session.balance, INITIAL_CREDITS - 20)
  assert.equal(second.getSnapshot().storageStatus, 'memory-only')
  assert.equal(decodeSession(storage.getItem(DEMO_STORAGE_KEY)).balance, INITIAL_CREDITS - 100)
  second.reset()
  assert.equal(decodeSession(storage.getItem(DEMO_STORAGE_KEY)).balance, INITIAL_CREDITS - 100)
})
