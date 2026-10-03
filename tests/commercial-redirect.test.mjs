import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server.js'
import endpoint from '../app/go/route.ts'
import commercial from '../lib/commercial/server.ts'
import { registration } from './fixtures/commercial.mjs'

const origin = 'https://www.playliva.com'
const targetGeos = ['MX', 'CO', 'PE']

function request(country, actualCountry = country, extra = {}, consent = false) {
  const params = new URLSearchParams({ operator: 'test-partner', country, language: `es-${country}`, placement: 'where-to-play', ...extra })
  return new NextRequest(`${origin}/go?${params}`, { headers: {
    ...(actualCountry ? { 'x-vercel-ip-country': actualCountry } : {}),
    ...(consent ? { cookie: 'playliva_analytics=granted' } : {}),
  } })
}

function location(response) {
  assert.equal(response.status, 302)
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  return new URL(response.headers.get('location'))
}

function internalFallback(response, locale = 'es-mx') {
  const url = location(response)
  assert.equal(url.origin, origin, 'rejected redirects remain on PlayLiva')
  assert.equal(url.pathname, `/${locale}/operators`)
  assert.equal(url.search, '', 'the fallback must not forward untrusted query fields')
}

function offerRegistration(geo = 'MX', overrides = {}) {
  const now = Date.now(), day = 86_400_000
  return registration(geo, { offer: {
    id: `test-${geo.toLowerCase()}-promo`, approved: true, active: true,
    offer: {
      id: `test-${geo.toLowerCase()}-offer`, title: 'Verified fixture offer',
      description: 'Synthetic integration fixture.', terms: 'Approved fixture terms apply.',
      category: 'welcome', status: 'verified', source: 'https://partner.test/terms',
      lastVerifiedAt: new Date(now - day).toISOString(),
      complianceReview: { status: 'reviewed-permitted', market: geo,
        legalSource: 'https://partner.test/review', verifiedAt: new Date(now - day).toISOString(),
        reviewBy: new Date(now + 7 * day).toISOString() },
    },
    copy: { [`es-${geo}`]: { headline: 'Oferta de prueba', condition: 'Consulta las condiciones', cta: 'Ver condiciones' } },
    placements: ['offers_page'], cadence: { cycleMultiple: 3, delayMs: 900 },
    validFrom: new Date(now - day).toISOString(), validUntil: new Date(now + 7 * day).toISOString(),
    verifiedTerms: ['Approved fixture terms apply.'], ...overrides,
  } })
}

test('HTTP affiliate boundary resolves only current exact-GEO approvals and fails closed', async t => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  const configure = records => { process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify(records) }
  try {
    await t.test('each approved GEO has an opaque public reference and exact private destination', async () => {
      configure(targetGeos.map(geo => registration(geo)))
      for (const geo of targetGeos) {
        const snapshot = commercial.commercialSnapshot(geo)
        const reference = snapshot.operators[0].affiliateUrl[geo]
        assert.equal(reference, `playliva-affiliate:${geo}:test-${geo.toLowerCase()}:test-${geo.toLowerCase()}-campaign`)
        assert.doesNotMatch(JSON.stringify(snapshot), /partner\.test|private-test-id/)
        const url = location(await endpoint.GET(request(geo)))
        assert.equal(url.toString(), `https://partner.test/${geo.toLowerCase()}?campaign=private-test-id&market=${geo}`)
        assert.equal(url.searchParams.has('placement'), false, 'optional measurement requires consent')
        const consented = location(await endpoint.GET(request(geo, geo, {}, true)))
        assert.equal(consented.searchParams.get('placement'), 'where-to-play')
        assert.equal(consented.searchParams.get('market'), geo)
      }
    })

    await t.test('country parameters cannot override trusted GEO or revive Brazil/ROW', async () => {
      configure(targetGeos.map(geo => registration(geo)))
      for (const actual of ['CO', 'PE', 'BR', 'GE', 'US', undefined, 'MX,CO']) {
        // Pass null explicitly for missing GEO because the helper defaults to country.
        internalFallback(await endpoint.GET(request('MX', actual ?? null)))
      }
      internalFallback(await endpoint.GET(request('BR', 'BR', { language: 'pt-BR' })), 'pt-br')
      internalFallback(await endpoint.GET(request('GE', 'GE', { language: 'es-PE' })), 'es-pe')
      internalFallback(await endpoint.GET(request('MX', 'MX', { operator: 'betsson-group-affiliates' })))
      internalFallback(await endpoint.GET(request('MX', 'MX', { operator: 'https://external.test/destination' })))
    })

    await t.test('pending, inactive, incomplete and revoked approvals reject stale CTA requests', async () => {
      const patches = [
        { approved: false }, { active: false }, { affiliateUrl: '' },
        { campaignKey: '' }, { legal: { status: 'blocked' } },
      ]
      for (const geo of targetGeos) {
        for (const patch of patches) {
          configure([registration(geo, patch)])
          internalFallback(await endpoint.GET(request(geo)), `es-${geo.toLowerCase()}`)
        }
      }
      configure([registration()])
      assert.equal(location(await endpoint.GET(request('MX'))).origin, 'https://partner.test')
      configure([registration('MX', { approved: false })])
      internalFallback(await endpoint.GET(request('MX')))
    })

    await t.test('verified offers resolve; expired and unapproved offers never degrade to a brand CTA', async () => {
      for (const geo of targetGeos) {
        const params = { offer: `test-${geo.toLowerCase()}-offer`, placement: 'offers_page' }
        configure([offerRegistration(geo)])
        assert.equal(commercial.commercialSnapshot(geo).offers.length, 1, 'positive offer fixture must be eligible')
        assert.equal(location(await endpoint.GET(request(geo, geo, params))).pathname, `/${geo.toLowerCase()}`)
        for (const patch of [
          { approved: false }, { active: false },
          { validUntil: new Date(Date.now() - 60_000).toISOString() },
        ]) {
          configure([offerRegistration(geo, patch)])
          assert.equal(commercial.commercialSnapshot(geo).operators.length, 1, 'operator remains independently approved')
          internalFallback(await endpoint.GET(request(geo, geo, params)), `es-${geo.toLowerCase()}`)
        }
        configure([offerRegistration(geo)])
        internalFallback(await endpoint.GET(request(geo, geo, { ...params, offer: 'unknown-offer' })), `es-${geo.toLowerCase()}`)
      }
    })
  } finally {
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})
