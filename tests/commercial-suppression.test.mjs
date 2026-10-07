import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server.js'
import commercial from '../lib/commercial/server.ts'
import endpoint from '../app/go/route.ts'
import { registration } from './fixtures/commercial.mjs'
import { commercialFixture } from './fixtures/promo-commercial.mjs'

const geos = ['MX', 'CO', 'PE']
const origin = 'https://www.playliva.com'

function invalidReviews(now) {
  const valid = { status: 'verified', source: 'https://partner.test/legal',
    verifiedAt: new Date(now - 60_000).toISOString(), reviewBy: new Date(now + 60_000).toISOString() }
  return [
    undefined, null, {}, { ...valid, status: 'unknown' }, { ...valid, status: 'blocked' },
    ...['source', 'verifiedAt', 'reviewBy'].map(field => ({ ...valid, [field]: undefined })),
    { ...valid, source: 'http://partner.test/legal' },
    { ...valid, source: 'https://example.com/legal' },
    { ...valid, source: 'https://localhost/legal' },
    { ...valid, verifiedAt: 'not-a-date' }, { ...valid, reviewBy: 'not-a-date' },
    { ...valid, verifiedAt: new Date(now + 1).toISOString() },
    { ...valid, reviewBy: new Date(now).toISOString() },
    { ...valid, reviewBy: new Date(now - 1).toISOString() },
  ]
}

test('missing, unverified and stale evidence suppresses the whole record in each GEO', () => {
  const now = Date.now()
  for (const geo of geos) {
    const offer = commercialFixture(geo).campaigns[0]
    assert.ok(offer, 'control offer fixture must be eligible before the evidence is withdrawn')
    for (const legal of invalidReviews(now)) {
      const record = registration(geo, { legal, offer })
      assert.deepEqual(commercial.parseOperatorRegistry(JSON.stringify([record]), now), [])
      const snapshot = commercial.snapshotFromRegistry(geo, [record], now)
      assert.deepEqual(snapshot.operators, [])
      assert.deepEqual(snapshot.offers, [])
      assert.deepEqual(snapshot.campaigns, [])
    }
  }
})

test('review start is inclusive and expiry is exclusive using the supplied evaluation time', () => {
  // Deliberately independent of the process clock: no real-time parser bypass.
  const start = Date.parse('2025-01-01T00:00:00.000Z'), end = start + 60_000
  const record = registration('MX', { legal: { status: 'verified', source: 'https://partner.test/legal',
    verifiedAt: new Date(start).toISOString(), reviewBy: new Date(end).toISOString() } })
  for (const [now, count] of [[start - 1, 0], [start, 1], [end - 1, 1], [end, 0], [end + 1, 0]]) {
    assert.equal(commercial.parseOperatorRegistry(JSON.stringify([record]), now).length, count)
    assert.equal(commercial.snapshotFromRegistry('MX', [record], now).operators.length, count)
  }
})

test('withdrawing evidence revokes old references and HTTP redirects without cross-GEO fallback', async t => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  t.mock.timers.enable({ apis: ['Date'], now: Date.now() })
  try {
    for (const geo of geos) {
      const records = geos.map(value => registration(value))
      process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify(records)
      const reference = commercial.commercialSnapshot(geo).operators[0].affiliateUrl[geo]
      assert.ok(commercial.privateCommercialDestination(reference), 'control reference is initially eligible')
      for (const legal of invalidReviews(Date.now())) {
        process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify(records.map(record =>
          record.geo === geo ? { ...record, legal } : record))
        assert.equal(commercial.privateCommercialDestination(reference), null)
        const query = new URLSearchParams({ operator: 'test-partner', country: geo, language: `es-${geo}` })
        const response = await endpoint.GET(new NextRequest(`${origin}/go?${query}`, {
          headers: { 'x-vercel-ip-country': geo },
        }))
        assert.equal(response.status, 302)
        assert.equal(response.headers.get('location'), `${origin}/es-${geo.toLowerCase()}/operators`)
        assert.equal(response.headers.get('cache-control'), 'private, no-store')
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
        for (const other of geos.filter(value => value !== geo)) {
          assert.equal(commercial.commercialSnapshot(other).operators.length, 1,
            'a rejected record must not discard unrelated reviewed records')
        }
      }
    }
  } finally {
    t.mock.timers.reset()
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})

test('a previously rendered reference stops resolving as the review deadline passes', t => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  const now = Date.now()
  t.mock.timers.enable({ apis: ['Date'], now })
  try {
    const record = registration('MX', { legal: { status: 'verified', source: 'https://partner.test/legal',
      verifiedAt: new Date(now - 60_000).toISOString(), reviewBy: new Date(now + 1_000).toISOString() } })
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([record])
    const reference = commercial.commercialSnapshot('MX').operators[0].affiliateUrl.MX
    t.mock.timers.tick(999)
    assert.ok(commercial.privateCommercialDestination(reference))
    t.mock.timers.tick(1)
    assert.equal(commercial.privateCommercialDestination(reference), null)
    assert.deepEqual(commercial.commercialSnapshot('MX').operators, [])
  } finally {
    t.mock.timers.reset()
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})
