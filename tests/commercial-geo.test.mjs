import test from 'node:test'
import assert from 'node:assert/strict'
import { registration } from './fixtures/commercial.mjs'
import server from '../lib/commercial/server.ts'
import affiliate from '../lib/affiliate.ts'
import data from '../lib/data.ts'
import visitor from '../lib/visitor-market.ts'
import geo from '../lib/geo.ts'
const { parseOperatorRegistry, snapshotFromRegistry, privateCommercialDestination, commercialSnapshot } = server
const { resolveDestination } = affiliate
const { getGame, getOperatorsForGame, getPublicOperators, isAffiliateEligible, OPERATORS } = data
const { visitorMarket } = visitor
const { GEO_CONFIG, TARGET_GEOS } = geo

test('each target GEO has isolated approved commercial data, correct currency and locale', () => {
  const records = TARGET_GEOS.map(geo => registration(geo))
  for (const geo of TARGET_GEOS) {
    const snapshot = snapshotFromRegistry(geo, records)
    assert.equal(snapshot.operators.length, 1)
    assert.equal(snapshot.currency, GEO_CONFIG[geo].currency)
    assert.equal(GEO_CONFIG[geo].locale, `es-${geo}`)
    assert.equal(visitorMarket(new Headers({ 'x-vercel-ip-country': geo })), geo)
    assert.equal(getPublicOperators(snapshot.operators).length, 1)
    assert.equal(getOperatorsForGame(getGame('aviator'), geo, snapshot.operators).length, 1)
    assert.equal(getOperatorsForGame(getGame('jetx'), geo, snapshot.operators).length, 0, 'category alone cannot assert game availability')
    const destination = resolveDestination({ operatorSlug: 'test-partner', country: geo }, snapshot)
    assert.match(destination.url, new RegExp(`^playliva-affiliate:${geo}:`))
    for (const other of TARGET_GEOS.filter(value => value !== geo)) {
      assert.equal(resolveDestination({ operatorSlug: 'test-partner', country: other }, snapshot), null)
      assert.equal(isAffiliateEligible(snapshot.operators[0], other), false)
    }
  }
})

test('pending, inactive, incomplete, invalid and conflicting configuration fails closed', () => {
  for (const patch of [{ approved: false }, { active: false }, { affiliateUrl: '' }, { affiliateUrl: 'http://partner.test' },
    { affiliateUrl: 'https://localhost/private' }, { campaignKey: '' }, { currency: 'BRL' }, { legal: { status: 'blocked' } },
    { assets: { logo: '//external.test/logo', alt: 'bad' } }, { productTypes: [] }]) {
    assert.equal(snapshotFromRegistry('MX', [registration('MX', patch)]).operators.length, 0, JSON.stringify(patch))
  }
  assert.equal(snapshotFromRegistry('MX', [registration(), registration()]).operators.length, 0)
  assert.deepEqual(parseOperatorRegistry('{bad'), [])
  assert.deepEqual(parseOperatorRegistry('{}'), [])
})

test('Brazil retirement and ROW cannot use archived campaigns or another country fallback', () => {
  for (const geo of ['BR', 'GE', 'US', 'PT', 'ES', 'ZA', null, undefined]) {
    const snapshot = snapshotFromRegistry(geo, [registration()])
    assert.equal(snapshot.geo, null)
    assert.deepEqual(snapshot.operators, [])
    assert.equal(visitorMarket(new Headers(geo ? { 'x-vercel-ip-country': geo } : {})), null)
    assert.equal(resolveDestination({ country: geo, operatorSlug: 'betsson' }, snapshot), null)
  }
  assert.equal(getPublicOperators(OPERATORS).length, 0)
  assert.equal(privateCommercialDestination('playliva-affiliate:betsson-br-brand'), null)
  assert.equal(privateCommercialDestination('https://www.betsson.bet.br'), null)
})

test('public snapshot contains no destination or private campaign credentials; redirect resolves only current config', () => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  try {
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([registration()])
    const snapshot = commercialSnapshot('MX')
    const serialized = JSON.stringify(snapshot)
    assert.ok(!serialized.includes('partner.test'))
    assert.ok(!serialized.includes('private-test-id'))
    const reference = snapshot.operators[0].affiliateUrl.MX
    assert.equal(privateCommercialDestination(reference), 'https://partner.test/mx?campaign=private-test-id&market=MX')
    assert.equal(new URL(privateCommercialDestination(reference, { placement: 'test' }, true)).searchParams.get('placement'), 'test')
    assert.equal(new URL(privateCommercialDestination(reference, { placement: 'test' }, false)).searchParams.has('placement'), false)
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([registration('MX', { approved: false })])
    assert.equal(privateCommercialDestination(reference), null, 'revocation invalidates stale rendered CTA')
  } finally {
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})
