import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import country from '../components/country-context.tsx'
import button from '../components/affiliate-button.tsx'
import crash from '../lib/originals/crash/definition.ts'
import config from '../lib/affiliates/betsson-promo-config.ts'
import owner from '../components/owner/geo-preview.tsx'
import consent from '../lib/consent.ts'
import tracking from '../lib/tracking.ts'

const hooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) return { format: 'module', shortCircuit: true, source: 'export default new Proxy({}, { get: (_, key) => String(key) });' }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const banners = unwrap(await import('../components/affiliates/betsson-sponsored-banner.tsx'))
const offers = unwrap(await import('../components/offers-view.tsx'))
const popup = unwrap(await import('../components/affiliates/betsson-engagement-offer.tsx'))
hooks.deregister()
const h = React.createElement
function tree(geo, active = false, preview = geo, locale = 'pt-BR') {
  return h(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    h(PathnameContext.Provider, { value: locale === 'en' ? '/en/play/crash' : '/pt-br/play/crash' },
      h(country.CountryProvider, { key: `${geo}:${preview}`, initialLocale: locale, initialCountryCode: 'BR', visitorCountryCode: geo, previewCountryCode: preview },
        h(banners.BetssonHomeBanner), h(banners.BetssonSponsoredBanner, { surface: 'originals' }), h(offers.OffersView),
        h(button.AffiliateButton, { operatorSlug: 'betsson-group-affiliates', gameSlug: 'aviator', pageType: 'game', ctaLocation: 'game_detail_play_real' }, 'Explore'),
        h(popup.BetssonEngagementOffer, { game: crash.ISLAND_CRASH, roundActive: active })) ))
}

test('server HTML gates banners, Originals sponsor, Offers and affiliate links by GEO, never PT-BR locale', () => {
  for (const geo of [null, 'MX']) assert.doesNotMatch(renderToStaticMarkup(tree(geo)), /href="\/go\?/)
  for (const locale of ['pt-BR', 'en']) {
    const html = renderToStaticMarkup(tree('BR', false, 'BR', locale))
    assert.match(html, /data-betsson-banner="homepage"/)
    assert.match(html, /data-betsson-banner="originals"/)
    assert.match(html, /href="\/go\?/)
    assert.match(html, /offers_page/)
  }
  assert.equal(renderToStaticMarkup(h(owner.OwnerGeoPreview, { status: { authorized: false, previewGeo: null, realCountry: 'GE' } })), '')
  const html = renderToStaticMarkup(h(owner.OwnerGeoPreview, { status: { authorized: true, previewGeo: 'BR', realCountry: 'GE' } }))
  assert.match(html, /BR preview/); assert.match(html, /Reset to Real GEO/); assert.match(html, /Real country: GE/)
})

test('saved MX cannot hide owner BR preview; popup recurs at 3 and 6, reset/MX/PT-BR suppress it and QA tracking', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.playliva.com/pt-br/play/crash', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node', 'IS_REACT_ACT_ENVIRONMENT']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] })
  }
  const root = createRoot(document.getElementById('root'))
  const pending = new Map(); let timer = 0
  const originalTimeout = window.setTimeout.bind(window), originalClear = window.clearTimeout.bind(window)
  window.setTimeout = (fn, ms, ...args) => ms === config.BETSSON_PROMO.engagement.delayMs ? (pending.set(++timer, fn), timer) : originalTimeout(fn, ms, ...args)
  window.clearTimeout = id => pending.has(id) ? pending.delete(id) : originalClear(id)
  const mount = (geo, active = false, preview = geo) => act(() => root.render(tree(geo, active, preview)))
  const settle = () => act(() => { for (const [id, fn] of pending) { pending.delete(id); fn() } })
  try {
    window.localStorage.setItem('playliva.country', 'MX')
    await mount('BR')
    assert.ok(document.querySelector('[data-betsson-banner="homepage"]'))
    assert.equal(window.localStorage.getItem('playliva.country'), 'MX', 'preview never overwrites public preference')
    for (let cycle = 1; cycle <= 6; cycle++) {
      await mount('BR', true); assert.equal(document.querySelector('[role="dialog"]'), null, 'never mid-round')
      await mount('BR'); await settle()
      assert.equal(Boolean(document.querySelector('[role="dialog"]')), cycle % 3 === 0)
      if (cycle % 3 === 0) assert.equal(document.querySelector('[data-betsson-engagement-offer]').getAttribute('data-completed-cycle'), String(cycle))
    }
    for (const geo of [null, 'MX']) {
      await mount(geo)
      for (let cycle = 1; cycle <= 3; cycle++) { await mount(geo, true); await mount(geo); await settle() }
      assert.equal(document.querySelector('[role="dialog"]'), null)
      assert.equal(document.querySelector('a[href^="/go?"]'), null)
    }
    await mount('BR', false, null)
    assert.equal(document.querySelector('a[href^="/go?"]'), null, 'Real GEO restores saved MX selection')
    consent.saveConsent({ necessary: true, analytics: true, marketing: false })
    const marker = document.createElement('section'); marker.dataset.ownerGeoPreview = 'BR'; document.body.append(marker)
    const count = window.dataLayer?.length ?? 0
    tracking.track('affiliate_click', { country: 'BR' })
    assert.equal(window.dataLayer?.length ?? 0, count)
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
  }
})
