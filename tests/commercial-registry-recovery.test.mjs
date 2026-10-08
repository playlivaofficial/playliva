import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server.js'
import endpoint from '../app/go/route.ts'
import commercial from '../lib/commercial/server.ts'
import operators from '../lib/commercial/operators.ts'
import { registration } from './fixtures/commercial.mjs'

const geos = ['MX', 'CO', 'PE']
const keyFor = geo => `test-${geo.toLowerCase()}-brand`
const destinations = Object.fromEntries(geos.map(geo => [keyFor(geo), `https://partner.test/legacy-${geo.toLowerCase()}`]))
// Synthetic retired-market and cross-GEO keys. Never real partner links.
const hostile = { ...destinations, 'test-br-brand': 'https://record.partner.test/br', 'test-mx-retired': 'https://record.betsson.bet.br/x' }
const keyed = (geo, overrides = {}) => { const record = registration(geo); delete record.affiliateUrl; return { ...record, destinationKey: keyFor(geo), ...overrides } }

function withEnv(values, run) {
  const saved = { registry: process.env.PLAYLIVA_COMMERCIAL_REGISTRY, legacy: process.env.PLAYLIVA_AFFILIATE_DESTINATIONS }
  const set = (key, value) => { if (value === undefined) delete process.env[key]; else process.env[key] = value }
  set('PLAYLIVA_COMMERCIAL_REGISTRY', values.registry); set('PLAYLIVA_AFFILIATE_DESTINATIONS', values.legacy)
  const restore = () => { set('PLAYLIVA_COMMERCIAL_REGISTRY', saved.registry); set('PLAYLIVA_AFFILIATE_DESTINATIONS', saved.legacy) }
  let result
  try { result = run() } catch (error) { restore(); throw error }
  if (result instanceof Promise) return result.finally(restore)
  restore(); return result
}

test('active GEO operator mapping is MX/CO Betsson and PE Inkabet with the market locale and currency', () => {
  assert.deepEqual(operators.EXPECTED_OPERATORS.map(row => [row.geo, row.brand, row.locale, row.currency]),
    [['MX', 'Betsson', 'es-MX', 'MXN'], ['CO', 'Betsson', 'es-CO', 'COP'], ['PE', 'Inkabet', 'es-PE', 'PEN']])
})

test('legacy keys are scoped by their GEO segment; Brazil stays retired', () => {
  assert.equal(commercial.legacyKeyGeo('betsson-mx-brand'), 'MX')
  assert.equal(commercial.legacyKeyGeo('inkabet-pe'), 'PE')
  assert.equal(commercial.legacyKeyGeo('betsson-br-promo'), 'BR')
  for (const key of ['betsson', 'mx-brand-x'.toUpperCase(), 'betsson_mx', '-mx-', 'x'.repeat(81)]) assert.equal(commercial.legacyKeyGeo(key), null)
})

test('registry records resolve GEO-scoped legacy destinations and redirect with exact tracking', async () => {
  await withEnv({ registry: JSON.stringify(geos.map(geo => keyed(geo))), legacy: JSON.stringify(hostile) }, async () => {
    for (const geo of geos) {
      const snapshot = commercial.commercialSnapshot(geo)
      assert.equal(snapshot.operators.length, 1, `${geo} publishes from the legacy destination`)
      assert.doesNotMatch(JSON.stringify(snapshot), /partner\.test\/legacy|private-test-id|destinationKey/, 'public snapshot never carries destinations')
      const response = await endpoint.GET(new NextRequest(`https://www.playliva.com/go?${new URLSearchParams({ operator: 'test-partner', country: geo, language: `es-${geo}`, placement: 'where-to-play' })}`,
        { headers: { 'x-vercel-ip-country': geo } }))
      const target = new URL(response.headers.get('location'))
      assert.equal(`${target.origin}${target.pathname}`, `https://partner.test/legacy-${geo.toLowerCase()}`)
      assert.equal(target.searchParams.get('campaign'), 'private-test-id')
      assert.equal(target.searchParams.get('market'), geo)
    }
  })
})

test('legacy destinations never cross GEOs, never revive Brazil and never activate alone', () => {
  const legacy = JSON.stringify(hostile)
  // Another GEO's key, a retired BR key and a BR-hosted value all fail closed.
  for (const record of [keyed('MX', { destinationKey: keyFor('CO') }), keyed('MX', { destinationKey: 'test-br-brand' }), keyed('MX', { destinationKey: 'test-mx-retired' }),
    keyed('MX', { destinationKey: 'missing-mx-key' }), keyed('MX', { destinationKey: '__proto__' })]) {
    assert.deepEqual(commercial.parseOperatorRegistry(JSON.stringify([record]), Date.now(), legacy), [])
  }
  assert.deepEqual(commercial.parseOperatorRegistry('[]', Date.now(), legacy), [], 'the destinations map alone publishes nothing')
  assert.deepEqual(commercial.parseOperatorRegistry(JSON.stringify([keyed('MX')]), Date.now(), 'not json'), [])
  // An explicit destination wins and existing safeguards still apply to bridged records.
  const explicit = commercial.parseOperatorRegistry(JSON.stringify([{ ...keyed('MX'), affiliateUrl: 'https://partner.test/explicit' }]), Date.now(), legacy)
  assert.equal(explicit[0].affiliateUrl, 'https://partner.test/explicit')
  for (const patch of [{ approved: false }, { active: false }, { currency: 'COP' }, { legal: { status: 'unknown' } }]) {
    assert.deepEqual(commercial.parseOperatorRegistry(JSON.stringify([keyed('MX', patch)]), Date.now(), legacy), [], JSON.stringify(patch))
  }
})

test('expired offers stay suppressed on bridged records while brand discovery remains', () => {
  const day = 86_400_000, now = Date.now()
  const record = keyed('PE', { offer: { id: 'test-pe-promo', approved: true, active: true, placements: ['offers_page'], cadence: { cycleMultiple: 3, delayMs: 0 },
    validFrom: new Date(now - 9 * day).toISOString(), validUntil: new Date(now - day).toISOString(), verifiedTerms: ['Fixture terms.'],
    copy: { 'es-PE': { headline: 'Prueba', condition: 'Condiciones', cta: 'Ver' } },
    offer: { id: 'test-pe-offer', title: 'Prueba', description: 'Prueba', terms: 'Prueba', category: 'welcome', status: 'verified', source: 'https://partner.test/t', lastVerifiedAt: new Date(now - 9 * day).toISOString(),
      complianceReview: { status: 'reviewed-permitted', market: 'PE', legalSource: 'https://partner.test/l', verifiedAt: new Date(now - 9 * day).toISOString(), reviewBy: new Date(now + day).toISOString() } } } })
  withEnv({ registry: JSON.stringify([record]), legacy: JSON.stringify(destinations) }, () => {
    const snapshot = commercial.commercialSnapshot('PE')
    assert.equal(snapshot.operators.length, 1)
    assert.deepEqual([snapshot.offers.length, snapshot.campaigns.length], [0, 0])
  })
})

test('owner diagnostics explain missing configuration per GEO without exposing values', () => {
  withEnv({}, () => {
    const result = commercial.diagnoseCommercialConfiguration()
    assert.deepEqual([result.registry, result.legacyDestinations], ['missing', 'missing'])
    assert.deepEqual(result.geos.map(row => [row.geo, row.brand, row.published, row.issues]),
      [['MX', 'Betsson', 0, ['no_registry_record']], ['CO', 'Betsson', 0, ['no_registry_record']], ['PE', 'Inkabet', 0, ['no_registry_record']]])
  })
  const now = Date.now(), day = 86_400_000
  const records = [keyed('MX'), keyed('CO', { destinationKey: 'test-co-unknown' }),
    keyed('PE', { legal: { status: 'verified', source: 'https://partner.test/l', verifiedAt: new Date(now - 9 * day).toISOString(), reviewBy: new Date(now - day).toISOString() } })]
  withEnv({ registry: JSON.stringify(records), legacy: JSON.stringify(hostile) }, () => {
    const result = commercial.diagnoseCommercialConfiguration(now)
    const text = JSON.stringify(result)
    assert.doesNotMatch(text, /https?:|private-test-id|partner\.test|bet\.br/, 'diagnostics never contain destinations or campaign IDs')
    assert.deepEqual([result.registry, result.legacyDestinations, result.retiredLegacyKeys], ['configured', 'configured', 1])
    const byGeo = Object.fromEntries(result.geos.map(row => [row.geo, row]))
    assert.equal(byGeo.MX.published, 1)
    assert.deepEqual(byGeo.MX.issues, ['expected_operator_not_published'], 'fixture brand differs from the confirmed operator')
    assert.deepEqual(byGeo.CO.issues, ['destination_missing', 'legacy_destination_unresolved'])
    assert.deepEqual(byGeo.PE.issues, ['legal_review_not_current'])
    assert.equal(byGeo.MX.legacyKeys, 2)
  })
  withEnv({ registry: '{bad', legacy: '[]' }, () => {
    const result = commercial.diagnoseCommercialConfiguration()
    assert.deepEqual([result.registry, result.legacyDestinations], ['invalid', 'invalid'])
  })
  withEnv({ registry: JSON.stringify([keyed('MX', { brand: 'Betsson' })]), legacy: JSON.stringify(destinations) }, () => {
    assert.deepEqual(commercial.diagnoseCommercialConfiguration().geos[0].issues, [])
  })
})
