import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { NextRequest } from 'next/server.js'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import endpoint from '../app/go/route.ts'
import commercial from '../lib/commercial/server.ts'
import promotion from '../lib/affiliates/promotion.ts'
import countryModule from '../components/country-context.tsx'
import { registration } from './fixtures/commercial.mjs'

const unwrap = module => module.default ?? module
const { GameCasinoOptions } = unwrap(await import('../components/affiliates/game-casino-options.tsx'))
const { CountryProvider } = unwrap(countryModule)
const day = 86_400_000
// Synthetic operators per GEO: sponsor-chain brand plus an additional operator. Not real offers or links.
const additional = { MX: 'Winpot', CO: 'Betsson', PE: '1xBet' }
const primary = { MX: 'Betsson', CO: 'bwin', PE: 'Inkabet' }

function campaign(geo, key) {
  const now = Date.now(), text = `Prueba ${key} ${{ MX: 'MXN', CO: 'COP', PE: 'PEN' }[geo]}.`
  const verifiedAt = new Date(now - day).toISOString(), reviewBy = new Date(now + 7 * day).toISOString()
  return { id: `promo-${key}`, approved: true, active: true, cadence: { cycleMultiple: 3, delayMs: 0 },
    placements: [...Object.values(promotion.BANNER_SURFACES).map(item => item.placement), 'originals_engagement_offer', 'offers_page'],
    validFrom: verifiedAt, validUntil: reviewBy, verifiedTerms: [text],
    copy: { [`es-${geo}`]: { headline: `Oferta ${key}`, condition: text, cta: 'Regístrate' } },
    offer: { id: `offer-${key}`, title: `Oferta ${key}`, description: text, terms: text, category: 'welcome', status: 'verified',
      source: 'https://partner.test/terms', lastVerifiedAt: verifiedAt,
      complianceReview: { status: 'reviewed-permitted', market: geo, legalSource: 'https://partner.test/legal', verifiedAt, reviewBy } } }
}
function market(geo, { primaryGames = ['g1'], additionalGames = ['g1', 'g3'], additionalProducts } = {}) {
  const lower = geo.toLowerCase()
  return [
    registration(geo, { id: `main-${lower}`, slug: 'main-casino', brand: primary[geo], campaignKey: `main-${lower}`, priority: 9,
      affiliateUrl: `https://partner.test/main-${lower}`, verifiedGames: primaryGames, offer: campaign(geo, `main-${lower}`) }),
    registration(geo, { id: `extra-${lower}`, slug: 'extra-casino', brand: additional[geo], campaignKey: `extra-${lower}`, priority: 1,
      affiliateUrl: `https://partner.test/extra-${lower}`, verifiedGames: additionalGames, offer: campaign(geo, `extra-${lower}`),
      ...(additionalProducts ? { productTypes: additionalProducts } : {}) }),
  ]
}
const aviator = { id: 'g1', slug: 'aviator', title: 'Aviator', category: 'crash' }
const spaceman = { id: 'g3', slug: 'spaceman', title: 'Spaceman', category: 'crash' }
const plinko = { id: 'g10', slug: 'plinko', title: 'Plinko', category: 'instant-games' }

test('primary advertising and multi-operator Where to Play are separate decisions', () => {
  for (const geo of ['MX', 'CO', 'PE']) {
    const snapshot = commercial.snapshotFromRegistry(geo, market(geo)), locale = `es-${geo}`
    // Sponsor surfaces belong to the primary only, even though the additional operator has the better priority number.
    assert.deepEqual(snapshot.operators.filter(item => item.sponsor).map(item => item.name), [primary[geo]])
    assert.equal(promotion.getSponsoredBanner(snapshot, geo, locale, 'homepage')?.operatorName, primary[geo])
    assert.equal(promotion.getPromotion(snapshot, geo, locale, 'originals_engagement_offer')?.operatorName, primary[geo])
    // A game verified at both operators lists both, primary first, each with its own offer and placement.
    const both = promotion.getGameCasinoOptions(snapshot, geo, locale, aviator)
    assert.deepEqual(both.verified.map(item => item.operatorName), [primary[geo], additional[geo]])
    assert.deepEqual(both.explore, [])
    assert.ok(both.verified.every(item => item.placement === 'game_where_to_play_verified' && item.offer))
    // Verified only at the additional operator: it is listed as verified; the primary stays visible as honest discovery.
    const one = promotion.getGameCasinoOptions(snapshot, geo, locale, spaceman)
    assert.deepEqual(one.verified.map(item => item.operatorName), [additional[geo]])
    assert.deepEqual(one.explore.map(item => item.operatorName), [primary[geo]])
    assert.ok(one.explore.every(item => item.placement === 'game_explore_casinos'))
    // No operator ever appears in both lists, and nothing is invented for unknown games.
    const none = promotion.getGameCasinoOptions(snapshot, geo, locale, plinko)
    assert.deepEqual(none.verified, [])
    assert.deepEqual(none.explore.map(item => item.operatorName), [primary[geo], additional[geo]])
  }
})

test('category support, GEO and approval gate every option; no fixed operator limit', () => {
  const snapshot = commercial.snapshotFromRegistry('MX', market('MX', { additionalProducts: ['slots'] }))
  assert.deepEqual(promotion.getGameCasinoOptions(snapshot, 'MX', 'es-MX', aviator).verified.map(item => item.operatorName), ['Betsson'],
    'an operator without the game category is never offered for it, even with a stale availability record')
  assert.deepEqual(promotion.getGameCasinoOptions(snapshot, 'CO', 'es-CO', aviator), { verified: [], explore: [] }, 'another GEO snapshot never leaks')
  // A third and fourth operator in a GEO are listed without any cap.
  const many = [...market('PE'), registration('PE', { id: 'third-pe', slug: 'third-casino', brand: 'Tercero', campaignKey: 'third-pe', priority: 2,
    affiliateUrl: 'https://partner.test/third-pe', verifiedGames: ['g1'] }), registration('PE', { id: 'fourth-pe', slug: 'fourth-casino', brand: 'Cuarto',
    campaignKey: 'fourth-pe', priority: 3, affiliateUrl: 'https://partner.test/fourth-pe', verifiedGames: [] })]
  const options = promotion.getGameCasinoOptions(commercial.snapshotFromRegistry('PE', many), 'PE', 'es-PE', aviator)
  assert.deepEqual(options.verified.map(item => item.operatorName), ['Inkabet', '1xBet', 'Tercero'])
  assert.deepEqual(options.explore.map(item => item.operatorName), ['Cuarto'])
})

test('every option redirects through its own operator destination in the exact GEO only', async () => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  try {
    for (const geo of ['MX', 'CO', 'PE']) {
      process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify(market(geo))
      const snapshot = commercial.commercialSnapshot(geo), locale = `es-${geo}`
      const options = promotion.getGameCasinoOptions(snapshot, geo, locale, spaceman)
      for (const option of [...options.verified, ...options.explore]) {
        const go = href => endpoint.GET(new NextRequest(`https://www.playliva.com${href}`, { headers: { 'x-vercel-ip-country': geo } }))
        const target = new URL((await go(option.href)).headers.get('location'))
        assert.equal(`${target.origin}${target.pathname}`, `https://partner.test/${option.operatorSlug === 'main-casino' ? 'main' : 'extra'}-${geo.toLowerCase()}`)
        const other = geo === 'MX' ? 'CO' : 'MX'
        const blocked = new URL((await endpoint.GET(new NextRequest(`https://www.playliva.com${option.href}`, { headers: { 'x-vercel-ip-country': other } }))).headers.get('location'))
        assert.equal(blocked.origin, 'https://www.playliva.com', 'a visitor from another GEO falls back internally')
      }
    }
  } finally {
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})

test('the rendered game section labels verified play and unverified discovery honestly', () => {
  const snapshot = commercial.snapshotFromRegistry('CO', market('CO'))
  const markup = renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: '/es-co/games/spaceman' },
      React.createElement(CountryProvider, { initialLocale: 'es-CO', visitorCountryCode: 'CO', commercial: snapshot },
        React.createElement(GameCasinoOptions, { game: spaceman })))))
  const doc = new JSDOM(markup).window.document
  const verified = [...doc.querySelectorAll('[data-casino-option="verified"]')], explore = [...doc.querySelectorAll('[data-casino-option="explore"]')]
  assert.deepEqual(verified.map(item => item.dataset.operatorId), ['extra-co'])
  assert.deepEqual(explore.map(item => item.dataset.operatorId), ['main-co'])
  assert.match(verified[0].textContent, /Jugar en Betsson/)
  assert.match(explore[0].textContent, /Visitar bwin/)
  assert.doesNotMatch(explore[0].textContent, /Jugar en/, 'unverified operators never claim the game')
  assert.match(doc.querySelector('[data-casino-explore]').textContent, /Aún no confirmamos que estos casinos ofrezcan Spaceman/)
  for (const link of doc.querySelectorAll('a[href^="/go?"]')) {
    assert.equal(link.rel, 'sponsored noopener noreferrer')
    assert.equal(new URL(link.href, 'https://www.playliva.com').searchParams.get('country'), 'CO')
  }
  assert.doesNotMatch(markup, /partner\.test/, 'destinations stay server-side')
})

test('validated game deep links open the verified game; unverified or colliding links are ignored', async () => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  try {
    const records = market('PE')
    records[0].gameLinks = [
      { gameId: 'g1', campaignKey: 'main-pe-aviator', affiliateUrl: 'https://partner.test/main-pe/aviator' },
      { gameId: 'g6', campaignKey: 'main-pe-bonanza', affiliateUrl: 'https://partner.test/main-pe/bonanza' }, // g6 not verified: ignored
      { gameId: 'g1', campaignKey: 'main-pe', affiliateUrl: 'https://partner.test/collision' }, // duplicate game and brand key: ignored
    ]
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify(records)
    const snapshot = commercial.commercialSnapshot('PE')
    assert.deepEqual(Object.keys(snapshot.operators[0].gameAffiliateUrl.PE), ['g1'])
    assert.doesNotMatch(JSON.stringify(snapshot), /partner\.test\/(main|extra|collision)/, 'destinations stay server-side')
    const [inkabet] = promotion.getGameCasinoOptions(snapshot, 'PE', 'es-PE', aviator).verified
    assert.equal(new URL(inkabet.href, 'https://www.playliva.com').searchParams.get('game'), 'aviator')
    const go = href => endpoint.GET(new NextRequest(`https://www.playliva.com${href}`, { headers: { 'x-vercel-ip-country': 'PE' } }))
    assert.equal(new URL((await go(inkabet.href)).headers.get('location')).pathname, '/main-pe/aviator')
    // The additional operator has no deep link: its verified row uses its own destination.
    const extra = promotion.getGameCasinoOptions(snapshot, 'PE', 'es-PE', aviator).verified[1]
    assert.equal(new URL(extra.href, 'https://www.playliva.com').searchParams.get('game'), null)
    assert.equal(new URL((await go(extra.href)).headers.get('location')).pathname, '/extra-pe')
    // The deep-link reference resolves only for its verified game record.
    assert.equal(commercial.privateCommercialDestination('playliva-affiliate:PE:main-pe:main-pe-bonanza'), null)
  } finally {
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})
