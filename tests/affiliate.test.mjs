import test from 'node:test'
import assert from 'node:assert/strict'
import { registration } from './fixtures/commercial.mjs'
import server from '../lib/commercial/server.ts'
import data from '../lib/data.ts'
import affiliate from '../lib/affiliate.ts'
const { snapshotFromRegistry, privateCommercialDestination } = server
const { getGame, getPublicOperators, getPublicOffers, getOperatorsForGame, isAffiliateEligible, isOfferEligible } = data
const { resolveDestination, affiliateFallbackPath } = affiliate

const snapshot = snapshotFromRegistry('MX', [registration()])
const partner = snapshot.operators[0]
const context = { operatorSlug: partner.slug, country: 'MX' }
function publicationFixture() {
  const verifiedAt = new Date().toISOString(), reviewBy = new Date(Date.now() + 86400000).toISOString()
  return { title: 'Process-local test', terms: 'Test only', source: 'https://partner.test/terms', lastVerifiedAt: verifiedAt,
    validUntil: reviewBy, complianceReview: { market: 'MX', status: 'reviewed-permitted', legalSource: 'https://review.test', verifiedAt, reviewBy } }
}

test('approved partner resolves exact opaque regional reference; private tracking never reaches public props', () => {
  for (const analyticsAllowed of [undefined, false, true]) {
    for (const category of [undefined, 'crash', 'slots', 'live-casino']) {
      assert.equal(resolveDestination({ ...context, category, analyticsAllowed }, snapshot)?.url, partner.affiliateUrl.MX)
    }
    assert.equal(resolveDestination({ ...context, gameSlug: 'aviator', analyticsAllowed }, snapshot)?.url, partner.affiliateUrl.MX)
  }
  assert.ok(getOperatorsForGame(getGame('aviator'), 'MX', snapshot.operators).includes(partner))
})
for (const patch of [{ approved: false }, { destinationReady: false }, { affiliateStatus: 'pending' }, { affiliateStatus: 'paused' },
  { verified: false }, { isMock: true }, { active: false }]) {
  test(`all public outbound paths reject ${JSON.stringify(patch)}`, () => {
    const operator = { ...partner, ...patch }, closed = { ...snapshot, operators: [operator] }
    assert.equal(isAffiliateEligible(operator, 'MX'), false)
    assert.equal(resolveDestination(context, closed), null)
    assert.equal(getPublicOperators(closed.operators).length, 0)
    assert.equal(getOperatorsForGame(getGame('aviator'), 'MX', closed.operators).length, 0)
  })
}
test('wrong GEO, retired BR, category, unavailable game and fixture contexts cannot resolve', () => {
  for (const extra of [{ country: 'BR' }, { country: 'CO' }, { country: 'PE' }, { country: 'XX' }, { category: 'sports' },
    { category: 'unknown' }, { gameSlug: 'unknown' }, { gameSlug: 'mines' }, { gameSlug: 'aviator', category: 'slots' },
    { matchSlug: 'demo-match' }, { placement: 'sports_odds' }, { pageType: 'where_to_play' }]) {
    assert.equal(resolveDestination({ ...context, ...extra }, snapshot), null, JSON.stringify(extra))
  }
  assert.ok(resolveDestination({ ...context, pageType: 'game', pageSlug: 'aviator' }, snapshot))
  assert.equal(resolveDestination({ ...context, operatorSlug: 'missing' }, snapshot), null)
})
test('unregistered/raw destinations and mismatched opaque references cannot grant visibility', () => {
  for (const url of ['javascript:alert(1)', 'http://example.com', 'https://partner.test', '#', 'playliva-affiliate:CO:test-mx:test-mx-campaign']) {
    const closed = { ...snapshot, operators: [{ ...partner, affiliateUrl: { MX: url } }] }
    assert.equal(resolveDestination(context, closed), null)
  }
})
test('offer resolution and lists share operator, market, category, date and evidence gates', () => {
  const offer = { ...publicationFixture(), id: 'unit-test-offer', operatorId: partner.id, country: 'MX',
    category: 'crash', status: 'verified', active: true, affiliateUrl: partner.affiliateUrl.MX }
  const operator = { ...partner, verifiedOffers: [offer.id] }, opened = { ...snapshot, operators: [operator], offers: [offer] }
  assert.ok(isOfferEligible(offer, 'MX', {}, opened.operators))
  assert.ok(getPublicOffers('MX', opened.offers, opened.operators).includes(offer))
  assert.ok(resolveDestination({ country: 'MX', offerId: offer.id }, opened))
  for (const patch of [{ approved: false }, { affiliateStatus: 'pending' }, { affiliateStatus: 'paused' },
    { verified: false }, { isMock: true }, { active: false }, { verifiedOffers: [] }]) {
    const closed = { ...opened, operators: [{ ...operator, ...patch }] }
    assert.equal(resolveDestination({ country: 'MX', offerId: offer.id }, closed), null)
    assert.equal(getPublicOffers('MX', closed.offers, closed.operators).length, 0)
  }
  for (const extra of [{ country: 'CO' }, { category: 'slots' }, { operatorSlug: 'other' }]) {
    assert.equal(resolveDestination({ country: 'MX', offerId: offer.id, ...extra }, opened), null)
  }
  for (const patch of [{ validUntil: '2000-01-01' }, { validUntil: undefined }, { operatorId: 'missing' }, { complianceReview: undefined }]) {
    assert.equal(isOfferEligible({ ...offer, ...patch }, 'MX', {}, opened.operators), false)
  }
})
test('fallback paths preserve all supported locales and never reflect untrusted operators', () => {
  for (const [language, segment] of [['en','en'], ['pt-BR','pt-br'], ['es-MX','es-mx'], ['es-CO','es-co'], ['es-PE','es-pe']]) {
    for (const operatorSlug of [partner.slug, 'missing', '//evil.invalid', '../games', '%2f%2fevil.invalid']) {
      assert.equal(affiliateFallbackPath({ language, operatorSlug }), `/${segment}/operators`)
    }
  }
  assert.equal(affiliateFallbackPath({ cookieLocale: 'en' }), '/en/offers')
})
test('server functional attribution, consented measurement, encoding and fragments remain intact', () => {
  const saved = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  try {
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([registration('MX', {
      affiliateUrl: 'https://partner.test/path?affiliate_id=test-only&destination=%2Fcasino#landing',
      trackingTemplate: 'campaign_id={campaignId}&tracking_code={geo}', analyticsTrackingTemplate: 'subid={pageSlug}&placement={placement}',
    })])
    for (const analyticsAllowed of [false, true]) {
      const url = new URL(privateCommercialDestination(partner.affiliateUrl.MX, { pageSlug: 'one&other=two', placement: 'operator_card' }, analyticsAllowed))
      assert.equal(url.searchParams.get('affiliate_id'), 'test-only')
      assert.equal(url.searchParams.get('campaign_id'), 'private-test-id')
      assert.equal(url.searchParams.get('tracking_code'), 'MX')
      assert.equal(url.searchParams.get('destination'), '/casino')
      assert.equal(url.hash, '#landing')
      assert.equal(url.searchParams.get('subid'), analyticsAllowed ? 'one&other=two' : null)
      assert.equal(url.searchParams.get('placement'), analyticsAllowed ? 'operator_card' : null)
      assert.equal(url.searchParams.has('other'), false)
    }
  } finally { if (saved === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY; else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = saved }
})
