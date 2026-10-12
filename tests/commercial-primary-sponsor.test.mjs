import test from 'node:test'
import assert from 'node:assert/strict'
import commercial from '../lib/commercial/server.ts'
import promotion from '../lib/affiliates/promotion.ts'
import data from '../lib/data.ts'
import { registration } from './fixtures/commercial.mjs'

// Synthetic campaigns only. Brands mirror the confirmed GEO mapping; nothing here is a real offer.
const day = 86_400_000
const sponsorPlacements = [...Object.values(promotion.BANNER_SURFACES).map(item => item.placement), promotion.PROMO_PLACEMENTS.originalsEngagement]
function campaign(geo, key, extra = {}) {
  const now = Date.now(), currency = { MX: 'MXN', CO: 'COP', PE: 'PEN' }[geo], text = `Prueba ${key} en ${currency}.`
  const verifiedAt = new Date(now - day).toISOString(), reviewBy = new Date(now + 7 * day).toISOString()
  return {
    id: `promo-${key}`, approved: true, active: true, cadence: { cycleMultiple: 3, delayMs: 0 },
    placements: [...sponsorPlacements, promotion.PROMO_PLACEMENTS.offersPage, promotion.PROMO_PLACEMENTS.discoveryGame],
    validFrom: verifiedAt, validUntil: reviewBy, verifiedTerms: [text],
    copy: { [`es-${geo}`]: { headline: `Oferta ${key}`, condition: text, cta: `Ver ${key}` } },
    offer: { id: `offer-${key}`, title: `Oferta ${key}`, description: text, terms: text, category: 'welcome', status: 'verified',
      source: 'https://partner.test/terms', lastVerifiedAt: verifiedAt,
      complianceReview: { status: 'reviewed-permitted', market: geo, legalSource: 'https://partner.test/legal', verifiedAt, reviewBy } },
    ...extra,
  }
}
// The extra brand per GEO: bwin is Colombia's primary (Betsson its fallback); Winpot and 1xBet are additional only.
const extraBrand = { MX: 'Winpot', CO: 'bwin', PE: '1xBet' }
const secondary = (geo, overrides = {}) => registration(geo, { id: `second-${geo.toLowerCase()}`, slug: 'second-partner', brand: extraBrand[geo],
  campaignKey: `second-${geo.toLowerCase()}`, priority: 0, ...overrides })
const sponsorOf = snapshot => snapshot.operators.filter(item => item.sponsor).map(item => item.name)

test('the sponsor chain decides sponsor slots and the popup; every other operator stays listed', () => {
  // Betsson (MX) and Inkabet (PE) keep sponsor surfaces even when the additional operator has a better priority number.
  for (const geo of ['MX', 'PE']) {
    const snapshot = commercial.snapshotFromRegistry(geo, [secondary(geo, { offer: campaign(geo, `s-${geo.toLowerCase()}`) }), registration(geo, { offer: campaign(geo, `p-${geo.toLowerCase()}`) })])
    assert.deepEqual(snapshot.operators.map(item => [item.slug, item.sponsor]), [['test-partner', true], ['second-partner', false]])
    const locale = `es-${geo}`
    for (const surface of Object.keys(promotion.BANNER_SURFACES)) {
      assert.equal(promotion.getSponsoredBanner(snapshot, geo, locale, surface)?.operatorSlug, 'test-partner', `${geo} ${surface}`)
    }
    assert.equal(promotion.getPromotion(snapshot, geo, locale, promotion.PROMO_PLACEMENTS.originalsEngagement)?.offerId, `offer-p-${geo.toLowerCase()}`)
    assert.deepEqual(data.getPublicOffers(geo, snapshot.offers, snapshot.operators).map(offer => offer.id), [`offer-p-${geo.toLowerCase()}`, `offer-s-${geo.toLowerCase()}`])
    assert.equal(promotion.getPromotion(snapshot, geo, locale, promotion.PROMO_PLACEMENTS.offersPage, { operatorId: `second-${geo.toLowerCase()}` })?.offerId, `offer-s-${geo.toLowerCase()}`)
  }
  // Colombia: a live bwin campaign takes sponsor surfaces and leads the list; Betsson stays listed with its offers.
  const co = commercial.snapshotFromRegistry('CO', [registration('CO', { offer: campaign('CO', 'betsson') }), secondary('CO', { priority: 5, offer: campaign('CO', 'bwin') })])
  assert.deepEqual(co.operators.map(item => [item.name, item.sponsor]), [['bwin', true], ['Betsson', false]])
  assert.equal(promotion.getSponsoredBanner(co, 'CO', 'es-CO', 'homepage')?.operatorSlug, 'second-partner')
  assert.equal(promotion.getPromotion(co, 'CO', 'es-CO', promotion.PROMO_PLACEMENTS.originalsEngagement)?.offerId, 'offer-bwin')
  assert.deepEqual(data.getPublicOffers('CO', co.offers, co.operators).map(offer => offer.id), ['offer-bwin', 'offer-betsson'])
})

test('a pending primary keeps the last working sponsor; additional operators never take sponsor surfaces', () => {
  // bwin configured without a live campaign: Betsson keeps Colombia's banners and popup.
  const pending = commercial.snapshotFromRegistry('CO', [secondary('CO'), registration('CO', { offer: campaign('CO', 'betsson') })])
  assert.deepEqual(sponsorOf(pending), ['Betsson'])
  assert.equal(promotion.getSponsoredBanner(pending, 'CO', 'es-CO', 'homepage')?.operatorSlug, 'test-partner')
  assert.equal(promotion.getPromotion(pending, 'CO', 'es-CO', promotion.PROMO_PLACEMENTS.originalsEngagement)?.offerId, 'offer-betsson')
  // Winpot / 1xBet alone never sponsor, but their offers remain listed.
  for (const geo of ['MX', 'PE']) {
    const only = commercial.snapshotFromRegistry(geo, [secondary(geo, { offer: campaign(geo, 'only') })])
    assert.deepEqual(sponsorOf(only), [])
    for (const surface of Object.keys(promotion.BANNER_SURFACES)) assert.equal(promotion.getSponsoredBanner(only, geo, `es-${geo}`, surface), null)
    assert.equal(promotion.getPromotion(only, geo, `es-${geo}`, promotion.PROMO_PLACEMENTS.originalsEngagement), null)
    assert.equal(data.getPublicOffers(geo, only.offers, only.operators).length, 1, 'the additional offer remains listed')
  }
  // Betsson MX without a campaign keeps the brand banner; the popup never borrows Winpot's offer.
  const noPrimaryOffer = commercial.snapshotFromRegistry('MX', [secondary('MX', { offer: campaign('MX', 'wp') }), registration('MX')])
  assert.deepEqual(sponsorOf(noPrimaryOffer), ['Betsson'])
  assert.equal(promotion.getSponsoredBanner(noPrimaryOffer, 'MX', 'es-MX', 'homepage')?.operatorSlug, 'test-partner')
  assert.equal(promotion.getPromotion(noPrimaryOffer, 'MX', 'es-MX', promotion.PROMO_PLACEMENTS.originalsEngagement), null)
})

test('an operator may publish several verified campaigns; expired or duplicate ones fail closed', () => {
  const now = Date.now()
  const expired = campaign('MX', 'old', { validFrom: new Date(now - 9 * day).toISOString(), validUntil: new Date(now - day).toISOString() })
  const snapshot = commercial.snapshotFromRegistry('MX', [registration('MX', { offer: campaign('MX', 'a'), offers: [campaign('MX', 'b'), expired] })])
  assert.deepEqual(snapshot.offers.map(offer => offer.id), ['offer-a', 'offer-b'])
  assert.deepEqual(snapshot.operators[0].verifiedOffers, ['offer-a', 'offer-b'])
  assert.deepEqual(data.getPublicOffers('MX', snapshot.offers, snapshot.operators).map(offer => offer.id), ['offer-a', 'offer-b'])
  // Repeating a campaign ID inside one record, or across operators in a GEO, withholds the record.
  assert.deepEqual(commercial.parseOperatorRegistry(JSON.stringify([registration('MX', { offer: campaign('MX', 'a'), offers: [campaign('MX', 'a')] })])), [])
  assert.equal(commercial.parseOperatorRegistry(JSON.stringify([registration('MX', { offer: campaign('MX', 'a') }), secondary('MX', { offers: [campaign('MX', 'a')] })])).length, 0)
  assert.deepEqual(commercial.parseOperatorRegistry(JSON.stringify([registration('MX', { offers: 'nope' })])), [])
  // Campaigns never cross GEOs.
  assert.equal(commercial.snapshotFromRegistry('CO', [registration('MX', { offer: campaign('MX', 'a') })]).offers.length, 0)
})
