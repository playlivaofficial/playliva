import test from 'node:test'
import assert from 'node:assert/strict'
import dataModule from '../lib/data.ts'
const { OPERATORS, getOperator, getGame, getPublicOperators, getPublicOffers, getOperatorsForGame,
  getOffers, isAffiliateEligible, isOfferEligible } = dataModule
import affiliateModule from '../lib/affiliate.ts'
const { resolveDestination, affiliateFallbackPath } = affiliateModule

const partner = getOperator('betsson-group-affiliates')
const context = { operatorSlug: partner.slug, country: 'BR' }

test('approved partner retains exact configured base and category destinations', () => {
  for (const analyticsAllowed of [undefined, false, true]) {
    assert.equal(resolveDestination({ ...context, analyticsAllowed })?.url, partner.affiliateUrl.BR)
    for (const category of ['crash', 'slots', 'live-casino']) {
      assert.equal(resolveDestination({ ...context, category, analyticsAllowed })?.url,
        partner.categoryAffiliateUrl?.[category]?.BR ?? partner.affiliateUrl.BR)
    }
    assert.equal(resolveDestination({ ...context, gameSlug: 'aviator', analyticsAllowed })?.url, partner.categoryAffiliateUrl.crash.BR)
  }
  assert.ok(getOperatorsForGame(getGame('aviator'), 'BR').includes(partner))
})

for (const patch of [{ affiliateStatus: 'pending' }, { affiliateStatus: 'paused' },
  { verified: false }, { isMock: true }, { active: false }]) {
  test(`all public outbound paths reject ${JSON.stringify(patch)}`, () => {
    const saved = { ...partner }
    try {
      Object.assign(partner, patch)
      assert.equal(isAffiliateEligible(partner, 'BR'), false)
      assert.equal(resolveDestination(context), null)
      assert.equal(getPublicOperators().includes(partner), false)
      assert.equal(getOperatorsForGame(getGame('aviator'), 'BR').includes(partner), false)
    } finally { Object.assign(partner, saved) }
  })
}

test('unsupported GEO, category, game and fixture contexts cannot resolve', () => {
  for (const extra of [{ country: 'MX' }, { country: 'XX' }, { category: 'sports' },
    { category: 'unknown' }, { gameSlug: 'unknown' }, { gameSlug: 'mines' },
    { gameSlug: 'aviator', category: 'slots' }, { matchSlug: 'demo-match' },
    { placement: 'sports_odds' }, { pageType: 'where_to_play' }]) {
    assert.equal(resolveDestination({ ...context, ...extra }), null, JSON.stringify(extra))
  }
  assert.ok(resolveDestination({ ...context, pageType: 'game', pageSlug: 'aviator' }))
  assert.equal(resolveDestination({ ...context, operatorSlug: 'missing' }), null)
})

test('unsafe destination configurations fail closed', () => {
  const saved = partner.affiliateUrl
  try {
    for (const url of ['javascript:alert(1)', 'http://example.com', 'https://example.com/aff', '#', 'https://user:password@example.org']) {
      partner.affiliateUrl = { BR: url }
      assert.equal(resolveDestination(context), null)
    }
  } finally { partner.affiliateUrl = saved }
})

test('offer resolution and lists share operator, market, category, date and verification gates', () => {
  // Synthetic offer exists only in this process and reuses an existing approved
  // destination. It is never written to application data or sent externally.
  const offer = { id: 'unit-test-offer', operatorId: partner.id, country: 'BR',
    category: 'crash', status: 'verified', active: true, affiliateUrl: partner.affiliateUrl.BR }
  const offers = getOffers('BR')
  const saved = { ...partner }
  offers.push(offer)
  try {
    assert.ok(isOfferEligible(offer, 'BR'))
    assert.ok(getPublicOffers('BR').includes(offer))
    assert.ok(resolveDestination({ country: 'BR', offerId: offer.id }))
    for (const patch of [{ affiliateStatus: 'pending' }, { affiliateStatus: 'paused' },
      { verified: false }, { isMock: true }, { active: false }, { verifiedOffers: [] }]) {
      Object.assign(partner, saved, patch)
      assert.equal(resolveDestination({ country: 'BR', offerId: offer.id }), null)
      assert.equal(getPublicOffers('BR').includes(offer), false)
    }
    Object.assign(partner, saved)
    delete partner.verifiedOffers
    assert.equal(resolveDestination({ country: 'MX', offerId: offer.id }), null)
    assert.equal(resolveDestination({ country: 'BR', offerId: offer.id, category: 'slots' }), null)
    assert.equal(resolveDestination({ country: 'BR', offerId: offer.id, operatorSlug: 'other' }), null)
    offer.validUntil = '2000-01-01'
    assert.equal(isOfferEligible(offer, 'BR'), false)
    delete offer.validUntil
    offer.operatorId = 'missing'
    assert.equal(isOfferEligible(offer, 'BR'), false)
  } finally {
    offers.splice(offers.indexOf(offer), 1)
    delete partner.verifiedOffers
    Object.assign(partner, saved)
  }
  assert.ok(OPERATORS.every((operator) => operator.id !== 'unit-test-offer'))
})

test('fallback paths preserve locale and never reflect unsafe operator text', () => {
  for (const [language, segment] of [['en', 'en'], ['pt-BR', 'pt-br'], ['es-MX', 'es-mx']]) {
    assert.equal(affiliateFallbackPath({ language, operatorSlug: partner.slug }), `/${segment}/operators/${partner.slug}`)
    for (const operatorSlug of ['missing', '//evil.invalid', '../games', '%2f%2fevil.invalid', 'nova']) {
      assert.equal(affiliateFallbackPath({ language, operatorSlug }), `/${segment}/operators`)
    }
  }
  assert.equal(affiliateFallbackPath({ cookieLocale: 'en' }), '/en/offers')
})

test('functional partner template survives every consent state; optional measurement is gated', () => {
  const saved = partner.trackingTemplate
  const savedAnalytics = partner.analyticsTrackingTemplate
  // Process-local sentinels exercise future partner configuration; no real
  // campaign IDs or production operator records are created or changed.
  partner.trackingTemplate = { BR: 'affiliate_id=test-only&campaign_id=test-only&tracking_code={geo}' }
  partner.analyticsTrackingTemplate = { BR: 'subid={pageSlug}&placement={placement}' }
  const offer = { id: 'unit-test-attribution', operatorId: partner.id, country: 'BR',
    category: 'crash', status: 'verified', active: true, affiliateUrl: partner.affiliateUrl.BR }
  const offers = getOffers('BR')
  offers.push(offer)
  try {
    for (const extra of [{}, { category: 'crash' }, { offerId: offer.id }]) {
      for (const analyticsAllowed of [undefined, false, true]) {
        const url = new URL(resolveDestination({ ...context, ...extra, analyticsAllowed,
          pageSlug: 'one&other=two', placement: 'operator_card' }).url)
        assert.equal(url.searchParams.get('affiliate_id'), 'test-only')
        assert.equal(url.searchParams.get('campaign_id'), 'test-only')
        assert.equal(url.searchParams.get('tracking_code'), 'BR')
        assert.equal(url.searchParams.get('subid'), analyticsAllowed ? 'one&other=two' : null)
        assert.equal(url.searchParams.get('placement'), analyticsAllowed ? 'operator_card' : null)
        assert.equal(url.searchParams.has('other'), false)
      }
    }
  } finally {
    offers.splice(offers.indexOf(offer), 1)
    if (saved === undefined) delete partner.trackingTemplate
    else partner.trackingTemplate = saved
    if (savedAnalytics === undefined) delete partner.analyticsTrackingTemplate
    else partner.analyticsTrackingTemplate = savedAnalytics
  }
})

test('destination query attribution and fragments are intact without analytics', () => {
  const saved = { ...partner }
  const baseUrl = `${partner.affiliateUrl.BR}?affiliate_id=test-only&destination=%2Fcasino#landing`
  try {
    partner.affiliateUrl = { BR: baseUrl }
    partner.categoryAffiliateUrl = { crash: { BR: baseUrl } }
    partner.trackingTemplate = { BR: 'campaign_id=test-only&tracking_code={placement}' }
    for (const analyticsAllowed of [undefined, false, true]) {
      for (const category of [undefined, 'crash']) {
        const url = new URL(resolveDestination({ ...context, category, analyticsAllowed, placement: 'one&other=two' }).url)
        assert.equal(url.searchParams.get('affiliate_id'), 'test-only')
        assert.equal(url.searchParams.get('destination'), '/casino')
        assert.equal(url.searchParams.get('campaign_id'), 'test-only')
        assert.equal(url.searchParams.get('tracking_code'), 'one&other=two')
        assert.equal(url.searchParams.has('other'), false)
        assert.equal(url.hash, '#landing')
      }
    }
  } finally {
    delete partner.trackingTemplate
    Object.assign(partner, saved)
  }
})
