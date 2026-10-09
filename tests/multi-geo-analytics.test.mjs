import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import input from '../lib/owner/server/event-input.ts'
import routes from '../lib/owner/server/event-routes.ts'
import commercial from '../lib/commercial/server.ts'
import geo from '../lib/geo.ts'
import context from '../lib/commercial-context.ts'
import tracking from '../lib/tracking.ts'
import search from '../lib/owner/search-model.ts'
import reporting from '../lib/owner/server/search-report.ts'
import catalog from '../lib/owner/server/catalog.ts'
import { registration as reviewedFixture } from './fixtures/commercial.mjs'

const registration = country => ({
  id: `test-${country.toLowerCase()}`, slug: `test-${country.toLowerCase()}`, brand: 'Isolated test operator', geo: country,
  productTypes: ['crash'], approved: true, active: true, affiliateUrl: 'https://partner.invalid/approved-fixture',
  campaignKey: `${country.toLowerCase()}-approved`, campaignId: 'private-test-id', currency: geo.GEO_CONFIG[country].currency,
  priority: 1, assets: { logo: '/icon.svg', alt: 'Test' }, legal: reviewedFixture(country).legal, verifiedGames: ['g-aviator'],
})
const headers = country => new Headers({ 'x-vercel-ip-country': country })
const event = country => ({ id: randomUUID(), event: 'affiliate_click', timestamp: new Date().toISOString(), url: `/es-${country.toLowerCase()}/games/aviator`,
  operatorSlug: `test-${country.toLowerCase()}`, campaignKey: `${country.toLowerCase()}-approved`, placement: 'game_detail_play_real', ctaLocation: 'game_detail_play_real',
  country: 'BR', language: 'pt-BR', trafficSource: 'youtube', provider: 'invented', device: 'mobile' })

test('MX/CO/PE analytics validate the actual server GEO, operator and campaign while preserving regional locale/currency', () => {
  for (const country of geo.TARGET_GEOS) {
    const snapshot = commercial.snapshotFromRegistry(country, [registration(country)])
    assert.equal(snapshot.operators.length, 1)
    const row = input.eventInput(event(country), headers(country), Date.now(), snapshot)
    assert.ok(row)
    assert.equal(row.dimensions.geo, country)
    assert.equal(row.dimensions.locale, `es-${country}`)
    assert.equal(row.dimensions.currency, geo.GEO_CONFIG[country].currency)
    assert.equal(row.dimensions.provider, 'spribe')
    assert.equal(row.dimensions.cta, 'game_detail_play_real')
    assert.equal(row.dimensions.partnerCampaign, `${country.toLowerCase()}-approved`)
    assert.doesNotMatch(JSON.stringify(row), /private-test-id|partner.invalid|invented/)
    for (const other of ['BR', 'GE', ...geo.TARGET_GEOS.filter(value => value !== country)]) {
      assert.equal(input.eventInput(event(country), headers(other), Date.now(), snapshot), null)
    }
    for (const patch of [{ campaignKey: 'wrong-campaign' }, { operatorSlug: 'wrong-operator' }, { promoId: 'unapproved-offer' },
      { url: '/owner/growth' }, { url: `/es-${country.toLowerCase()}/games/does-not-exist` }, { url: `/es-${country.toLowerCase()}/games/aviator?secret=hidden` },
      { id: 'invalid' }, { timestamp: new Date(Date.now() - 301000).toISOString() }]) {
      assert.equal(input.eventInput({ ...event(country), ...patch }, headers(country), Date.now(), snapshot), null)
    }
    for (const patch of [{ approved: false }, { active: false }, { affiliateUrl: '' }]) {
      const suppressed = commercial.snapshotFromRegistry(country, [{ ...registration(country), ...patch }])
      assert.equal(input.eventInput(event(country), headers(country), Date.now(), suppressed), null)
    }
  }
})

test('analytics and Search Console accept real regional pages independently of indexing rollout', () => {
  for (const country of geo.TARGET_GEOS) {
    const segment = 'es-' + country.toLowerCase(), snapshot = commercial.snapshotFromRegistry(country, [])
    for (const path of ['/games/aviator', '/play/crash', '/providers/spribe', '/where-to-play/aviator', '/games-like/aviator', '/compare/aviator-vs-jetx', '/offers']) {
      assert.ok(routes.isMeasuredPublicRoute(`/${segment}${path}`, snapshot), segment + path)
      assert.ok(input.eventInput({ ...event(country), event: 'page_view', url: `/${segment}${path}` }, headers(country), Date.now(), snapshot))
    }
    assert.equal(context.commercialContext(`/${segment}/games/aviator`).language, geo.GEO_CONFIG[country].locale)
    assert.equal(tracking.sanitizeTrackPayload({ locale: geo.GEO_CONFIG[country].locale }, `/${segment}/games`).language, geo.GEO_CONFIG[country].locale)
    assert.equal(search.canonicalPage(`https://www.playliva.com/${segment}/games?utm_source=qa`), `https://www.playliva.com/${segment}/games`)
    for (const path of ['/owner/growth', `/${segment}/operators/pending`, `/${segment}/providers/unknown`, `/${segment}/play/unknown`, '/es-es/games']) assert.equal(routes.isMeasuredPublicRoute(path, snapshot), false)
  }
  assert.deepEqual(['MX', 'CO', 'PE'].map(reporting.searchCountryCode), ['mex', 'col', 'per'])
  assert.equal(search.evidenceLocale('CO', ''), 'es-co')
  assert.equal(search.evidenceLocale('PE', 'en'), 'en', 'an explicitly selected reporting language remains independent')
  assert.equal(search.isSearchTitleTarget('https://www.playliva.com/es-co/games/aviator'), false, 'legacy PT-BR Autopilot scope is unchanged')
})

test('Owner launch readiness reads current registry without exposing destinations or private tracking IDs', () => {
  const before = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  try {
    // A GEO is ready only when its confirmed primary brand publishes.
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([registration('CO')])
    assert.deepEqual(catalog.commercialReadiness().map(row => [row.geo, row.ready]), [['MX', false], ['CO', false], ['PE', false]])
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([{ ...registration('CO'), brand: 'Betsson' }])
    assert.deepEqual(catalog.commercialReadiness().map(row => [row.geo, row.currency, row.ready]), [['MX', 'MXN', false], ['CO', 'COP', true], ['PE', 'PEN', false]])
    assert.deepEqual(catalog.operatorOverview().map(row => [row.slug, row.eligibleGeo]), [['test-co', ['CO']]])
    assert.doesNotMatch(JSON.stringify(catalog.operatorOverview()), /partner.invalid|private-test-id/)
  } finally { if (before === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY; else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = before }
})
