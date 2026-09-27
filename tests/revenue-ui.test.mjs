import test from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import country from '../components/country-context.tsx'
import button from '../components/affiliate-button.tsx'
import capture from '../components/analytics/attribution-capture.tsx'
import consent from '../lib/consent.ts'
import tracking from '../lib/tracking.ts'

const h = React.createElement
function tree(path, visitor = 'BR') {
  return h(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    h(PathnameContext.Provider, { value: path }, h(SearchParamsContext.Provider, { value: new URLSearchParams(globalThis.window?.location.search) },
      h(country.CountryProvider, { key: visitor ?? 'unknown', initialLocale: 'pt-BR', initialCountryCode: 'BR', visitorCountryCode: visitor },
        h(button.AffiliateButton, { operatorSlug: 'betsson-group-affiliates', gameSlug: 'aviator', pageType: 'game', ctaLocation: 'game_detail_play_real' }, 'Explore'),
        h(capture.AttributionCapture)))))
}

test('unknown/Georgia request GEO omits commercial anchors from server HTML', () => {
  for (const visitor of [null]) assert.doesNotMatch(renderToStaticMarkup(tree('/pt-br/games/aviator', visitor)), /href="\/go\?/)
  assert.match(renderToStaticMarkup(tree('/pt-br/games/aviator', 'BR')), /href="\/go\?/)
})

test('late consent, SPA context, retry idempotency and saved-market bypass protection', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.playliva.com/pt-br/games/aviator?utm_source=tiktok&utm_content=creative-1', virtualConsole: new VirtualConsole() })
  const saved = new Map(), observers = [], requests = []
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'MouseEvent', 'HTMLElement', 'Node', 'IntersectionObserver', 'IS_REACT_ACT_ENVIRONMENT']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] })
  }
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe(target) { this.target = target }
    disconnect() { this.disconnected = true }
    visible() { if (!this.disconnected) this.callback([{ target: this.target, isIntersecting: true, intersectionRatio: 1 }]) }
  }
  window.fetch = async (_url, options) => {
    const body = JSON.parse(options.body); requests.push(body)
    return new Response(null, { status: body.event === 'affiliate_click' && requests.filter(r => r.id === body.id).length === 1 ? 503 : 202 })
  }
  const root = createRoot(document.getElementById('root'))
  const mount = (visitor = 'BR') => act(() => root.render(tree(window.location.pathname, visitor)))
  try {
    consent.saveConsent({ necessary: true, analytics: false, marketing: false })
    await mount()
    await act(() => observers.forEach(observer => observer.visible()))
    assert.equal(requests.length, 0, 'no collection before consent')
    await act(() => consent.saveConsent({ necessary: true, analytics: true, marketing: false }))
    assert.equal(requests.filter(r => r.event === 'affiliate_impression').length, 1, 'visible CTA counted when consent arrives later')
    assert.equal(requests.filter(r => r.event === 'page_view').length, 1)
    await mount(); await act(() => observers.forEach(observer => observer.visible()))
    assert.equal(requests.filter(r => r.event === 'affiliate_impression').length, 1, 'render does not fabricate exposure')
    await act(() => document.querySelector('a[href^="/go?"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))
    const clicks = window.dataLayer.filter(r => r.event === 'affiliate_click')
    assert.equal(clicks.length, 1)
    assert.equal(clicks[0].trafficSource, 'tiktok'); assert.equal(clicks[0].utmContent, 'creative-1')
    assert.equal(clicks[0].taxonomy, 'playliva_real_game')
    assert.equal(clicks[0].campaignKey, 'betsson-br-crash')
    const attempts = requests.filter(r => r.event === 'affiliate_click')
    assert.equal(attempts.length, 2); assert.equal(attempts[0].id, attempts[1].id, 'retry uses the same receipt')
    window.history.pushState({}, '', '/pt-br/where-to-play/aviator')
    await mount(); await act(() => observers.forEach(observer => observer.visible()))
    assert.equal(requests.filter(r => r.event === 'page_view').length, 2)
    assert.equal(requests.at(-1).taxonomy, 'playliva_where_to_play')
    assert.equal(requests.at(-1).trafficSource, 'tiktok')
    const noindex = document.createElement('meta'); noindex.name = 'robots'; noindex.content = 'noindex, follow'; document.head.append(noindex)
    const beforeNoindex = requests.length
    tracking.track('page_view')
    assert.equal(requests.length, beforeNoindex, 'noindex pages do not send rejected canonical-feed requests')
    window.history.pushState({}, '', '/pt-br/games?provider=spribe')
    tracking.track('page_view')
    assert.equal(requests.length, beforeNoindex + 1, 'Games facets still measure the canonical Games route')
    window.history.pushState({}, '', '/pt-br/where-to-play/aviator')
    noindex.remove()
    window.localStorage.setItem('playliva.country', 'BR')
    await mount(null)
    assert.equal(document.querySelectorAll('a[href^="/go?"]').length, 0, 'saved Brazil cannot override noneligible request GEO')
    const count = requests.length
    await act(() => consent.saveConsent({ necessary: true, analytics: false, marketing: false }))
    window.history.pushState({}, '', '/pt-br/games')
    await mount(null)
    assert.equal(requests.length, count)
    assert.equal(window.sessionStorage.getItem('playliva.attribution'), null)
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
  }
})
