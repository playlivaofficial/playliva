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
import owner from '../components/owner/geo-preview.tsx'
import consent from '../lib/consent.ts'
import tracking from '../lib/tracking.ts'
import commercial from '../lib/commercial/types.ts'

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

function MarketProbe() {
  const {countryCode,marketCode,locale,currency} = country.useCountry()
  return h('output', { 'data-market': marketCode, 'data-selected': countryCode, 'data-locale': locale }, currency)
}
function probeTree(geo, preview = geo) {
  const locale = geo ? 'es-' + geo : 'en', path = geo ? '/es-' + geo.toLowerCase() + '/games' : '/en/games'
  return h(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    h(PathnameContext.Provider, { value: path }, h(country.CountryProvider, { key: String(geo)+String(preview), initialLocale: locale, initialCountryCode: 'MX', visitorCountryCode: geo, previewCountryCode: preview, commercial: commercial.emptyCommercialSnapshot(geo) }, h(MarketProbe))))
}

test('pending GEOs never invent commercial surfaces; owner selectors show only Real/MX/CO/PE', () => {
  for (const geo of [null, 'BR', 'MX', 'CO', 'PE']) assert.doesNotMatch(renderToStaticMarkup(tree(geo)), /href="\/go\?/)
  assert.equal(renderToStaticMarkup(h(owner.OwnerGeoPreview, { status: { authorized: false, previewGeo: null, realCountry: 'GE' } })), '')
  for (const [geo, currency] of [['MX','MXN'],['CO','COP'],['PE','PEN']]) {
    const html = renderToStaticMarkup(h(owner.OwnerGeoPreview, { status: { authorized: true, previewGeo: geo, realCountry: 'GE' } }))
    assert.match(html, new RegExp(geo+' preview')); assert.match(html, /Reset to Real GEO/); assert.match(html, /Real country: GE/)
    assert.match(html, new RegExp('es-'+geo+' · '+currency))
    assert.doesNotMatch(html, /option value="(?:BR|ES|PT|ZA)"/)
  }
})

test('owner MX/CO/PE selection overrides saved preferences, reset restores real GEO and previews never record analytics', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.playliva.com/es-co/games', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node', 'IS_REACT_ACT_ENVIRONMENT']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] })
  }
  const root = createRoot(document.getElementById('root'))
  try {
    window.localStorage.setItem('playliva.country', 'MX')
    for (const [geo,currency] of [['MX','MXN'],['CO','COP'],['PE','PEN']]) {
      await act(() => root.render(probeTree(geo)))
      const output = document.querySelector('output')
      assert.equal(output.dataset.market, geo); assert.equal(output.dataset.selected, geo)
      assert.equal(output.dataset.locale, 'es-'+geo); assert.equal(output.textContent, currency)
      assert.equal(window.localStorage.getItem('playliva.country'), 'MX', 'preview never overwrites public preference')
    }
    await act(() => root.render(probeTree(null)))
    assert.equal(document.querySelector('output').dataset.market, undefined, 'reset cannot turn editorial preference into real GEO')
    consent.saveConsent({ necessary: true, analytics: true, marketing: false })
    const marker = document.createElement('section'); marker.dataset.ownerGeoPreview = 'CO'; document.body.append(marker)
    const count = window.dataLayer?.length ?? 0
    tracking.track('page_view', { country: 'CO' })
    assert.equal(window.dataLayer?.length ?? 0, count)
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
  }
})
