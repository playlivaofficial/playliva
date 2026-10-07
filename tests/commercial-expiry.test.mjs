import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import country from '../components/country-context.tsx'
import expiry from '../lib/commercial/expiry.ts'
import commercial from '../lib/commercial/server.ts'
import crash from '../lib/originals/crash/definition.ts'
import { registration } from './fixtures/commercial.mjs'
import { commercialFixture } from './fixtures/promo-commercial.mjs'

const hooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) return { format: 'module', shortCircuit: true, source: 'export default new Proxy({}, {get: (_,key)=>String(key)});' }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const { OperatorCard } = unwrap(await import('../components/operator-card.tsx'))
const { OperatorProfileView } = unwrap(await import('../components/operator-profile-view.tsx'))
const { BetssonEngagementOffer } = unwrap(await import('../components/affiliates/betsson-engagement-offer.tsx'))
hooks.deregister()
const h = React.createElement
const NOW = Date.parse('2026-10-08T09:00:00.000Z')

function fixture(geo, delay = 1000) {
  return commercialFixture(geo, { legal: { status: 'verified', source: 'https://partner.test/legal',
    verifiedAt: new Date(Date.now() - 1000).toISOString(), reviewBy: new Date(Date.now() + delay).toISOString(),
    statement: 'Reviewed statement marker', disclosure: 'Reviewed disclosure marker' } })
}

function Probe() {
  const { commercial: snapshot, currency, locale, marketCode } = country.useCountry()
  const [count, setCount] = useState(0)
  return h('section', null,
    h('output', { 'data-operators': snapshot.operators.map(item => item.id).join(','),
      'data-offers': snapshot.offers.length, 'data-campaigns': snapshot.campaigns.length,
      'data-currency': currency, 'data-locale': locale, 'data-market': marketCode }, count),
    h('button', { 'data-state-button': '', onClick: () => setCount(value => value + 1) }, 'Local state'))
}

async function mounted(t, run) {
  t.mock.timers.enable({ apis: ['Date'], now: NOW })
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.playliva.com/es-mx/operators', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'MouseEvent', 'HTMLElement', 'Node', 'IS_REACT_ACT_ENVIRONMENT']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true,
      value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] })
  }
  const timers = new Map(), listeners = new Set()
  let timerId = 0
  window.setTimeout = (fn, delay = 0) => { const id = ++timerId; timers.set(id, { fn, at: Date.now() + delay, delay }); return id }
  window.clearTimeout = id => timers.delete(id)
  for (const target of [window, document]) {
    const subscriptions = new Map()
    listeners.add(subscriptions)
    const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target)
    target.addEventListener = (name, callback, options) => {
      if (['focus', 'pageshow', 'visibilitychange'].includes(name)) {
        if (!subscriptions.has(name)) subscriptions.set(name, new Set())
        subscriptions.get(name).add(callback)
      }
      return add(name, callback, options)
    }
    target.removeEventListener = (name, callback, options) => {
      subscriptions.get(name)?.delete(callback)
      return remove(name, callback, options)
    }
  }
  const root = createRoot(document.getElementById('root'))
  const mount = (snapshot, geo = snapshot.geo, child = h(Probe)) => act(() => root.render(
    h(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
      h(PathnameContext.Provider, { value: `/es-${String(snapshot.geo ?? 'MX').toLowerCase()}/operators` },
        h(country.CountryProvider, { initialLocale: 'es-MX', initialCountryCode: 'MX', visitorCountryCode: geo, commercial: snapshot }, child)))))
  const advance = (ms, deliver = true) => act(() => {
    t.mock.timers.tick(ms)
    if (!deliver) return
    let count = 0
    while ([...timers.values()].some(timer => timer.at <= Date.now())) {
      assert.ok(++count < 100, 'expiry must not create a zero-delay timer loop')
      for (const [id, timer] of [...timers]) if (timer.at <= Date.now() && timers.delete(id)) timer.fn()
    }
  })
  try { await run({ mount, advance, timers, listeners, root }) }
  finally {
    await act(() => root.unmount())
    assert.equal(timers.size, 0, 'unmount clears outstanding expiry timers')
    for (const subscriptions of listeners) for (const [event, callbacks] of subscriptions) {
      assert.equal(callbacks.size, 0, `unmount removes every ${event} listener`)
    }
    dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
    t.mock.timers.reset()
  }
}

test('public snapshot exposes only the validated review deadline, never private evidence fields', () => {
  const record = registration('MX')
  record.legal.privateCredential = 'private-evidence-marker'
  const snapshot = commercial.snapshotFromRegistry('MX', [record])
  assert.equal(snapshot.operators[0].commercialLegal.reviewBy, record.legal.reviewBy)
  assert.doesNotMatch(JSON.stringify(snapshot.operators[0].commercialLegal), /partner\.test|verifiedAt|private-evidence-marker/)
  for (const reviewBy of [undefined, '', 'invalid', [record.legal.reviewBy], new Date(Date.now() - 1).toISOString()]) {
    const stale = structuredClone(snapshot)
    stale.operators[0].commercialLegal.reviewBy = reviewBy
    assert.equal(expiry.currentCommercialSnapshot(stale).operators.length, 0)
  }
})

for (const geo of ['MX', 'CO', 'PE']) test(`${geo}: mounted snapshot expires only affected records and preserves local state`, async t => {
  await mounted(t, async ({ mount, advance, timers }) => {
    const snapshot = fixture(geo), later = registration(geo, { id: 'later-operator', slug: 'later-operator', campaignKey: 'later-campaign',
      legal: { status: 'verified', source: 'https://partner.test/legal', verifiedAt: new Date(NOW - 1000).toISOString(), reviewBy: new Date(NOW + 2000).toISOString() } })
    snapshot.operators.push(commercial.snapshotFromRegistry(geo, [later]).operators[0])
    await mount(snapshot)
    await act(() => document.querySelector('[data-state-button]').click())
    await advance(999)
    assert.equal(document.querySelector('output').dataset.operators, `${snapshot.operators[0].id},later-operator`)
    await advance(1)
    const output = document.querySelector('output')
    assert.equal(output.dataset.operators, 'later-operator')
    assert.equal(output.dataset.offers, '0'); assert.equal(output.dataset.campaigns, '0')
    assert.equal(output.dataset.currency, { MX: 'MXN', CO: 'COP', PE: 'PEN' }[geo])
    assert.equal(output.dataset.locale, `es-${geo}`); assert.equal(output.dataset.market, geo)
    assert.equal(output.textContent, '1', 'expiry never remounts non-commercial children')
    await mount(snapshot)
    assert.equal(document.querySelector('output').dataset.operators, 'later-operator', 'old props cannot restore expired records')
    await advance(1000)
    assert.equal(document.querySelector('output').dataset.operators, '')
    assert.equal(timers.size, 0, 'no timer remains after every review expires')
  })
})

for (const event of ['focus', 'pageshow', 'visibilitychange']) test(`${event}: suspended timers catch up on an expired review`, async t => {
  await mounted(t, async ({ mount, advance }) => {
    await mount(fixture('MX'))
    await advance(1000, false)
    assert.notEqual(document.querySelector('output').dataset.operators, '')
    await act(() => (event === 'visibilitychange' ? document : window).dispatchEvent(new Event(event)))
    assert.equal(document.querySelector('output').dataset.operators, '')
  })
})

test('long review deadlines are chunked without premature removal or runaway timers', async t => {
  await mounted(t, async ({ mount, advance, timers }) => {
    const chunk = 2_147_483_647
    await mount(fixture('MX', chunk + 5000))
    assert.equal([...timers.values()][0].delay, chunk)
    await advance(chunk)
    assert.notEqual(document.querySelector('output').dataset.operators, '')
    assert.equal([...timers.values()][0].delay, 5000)
    await advance(5000)
    assert.equal(document.querySelector('output').dataset.operators, '')
  })
})

test('unsupported GEO and pending snapshots never acquire eligibility from cached props', async t => {
  await mounted(t, async ({ mount }) => {
    for (const geo of ['BR', 'GE', null, 'CO', 'PE']) {
      await mount(fixture('MX'), geo)
      assert.equal(document.querySelector('output').dataset.operators, '')
    }
    await mount(commercial.snapshotFromRegistry('MX', [registration('MX', { approved: false })]))
    assert.equal(document.querySelector('output').dataset.operators, '')
  })
})

test('stale profile and card props lose CTAs, reviewed claims and game availability at expiry', async t => {
  await mounted(t, async ({ mount, advance }) => {
    const snapshot = fixture('MX'), operator = snapshot.operators[0]
    await mount(snapshot, 'MX', h(React.Fragment, null, h(OperatorCard, { operator, country: 'MX' }), h(OperatorProfileView, { operator })))
    assert.ok(document.querySelector('a[href^="/go?"]'))
    assert.match(document.body.textContent, /Reviewed statement marker/)
    assert.ok(document.querySelector('a[href*="/games/aviator"]'))
    await advance(1000)
    assert.equal(document.querySelectorAll('a[href^="/go?"]').length, 0)
    assert.equal(document.querySelectorAll('[data-betting-ad]').length, 0)
    assert.equal(document.querySelectorAll('[data-evidence-state="current"]').length, 0)
    assert.doesNotMatch(document.body.textContent, /Reviewed (?:statement|disclosure) marker/)
    assert.equal(document.querySelectorAll('a[href*="/games/aviator"]').length, 0)
    assert.ok(document.querySelector('h1'), 'neutral profile identity remains')
  })
})

test('operator review expiry closes an open popup and releases the game hold', async t => {
  await mounted(t, async ({ mount, advance }) => {
    const snapshot = fixture('MX'), holds = [], hold = value => holds.push(value)
    const render = active => mount(snapshot, 'MX', h(BetssonEngagementOffer, { game: crash.ISLAND_CRASH, roundActive: active, onHold: hold }))
    await render(false)
    for (let cycle = 0; cycle < 3; cycle++) { await render(true); await render(false) }
    await advance(10)
    assert.ok(document.querySelector('[data-engagement-offer]')); assert.equal(holds.at(-1), true)
    await advance(990)
    assert.equal(document.querySelector('[data-engagement-offer]'), null); assert.equal(holds.at(-1), false)
  })
})
