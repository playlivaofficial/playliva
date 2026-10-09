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
const secondary = (geo, overrides = {}) => registration(geo, { id: `second-${geo.toLowerCase()}`, slug: 'second-partner', brand: geo === 'CO' ? 'bwin' : '1xBet',
  campaignKey: `second-${geo.toLowerCase()}`, priority: 0, ...overrides })

test('primary brand leads each GEO and alone fills sponsor slots and the gameplay popup', () => {
  for (const geo of ['CO', 'PE']) {
    // The secondary has a better priority number and its own campaign; it must still never take sponsor surfaces.
    const snapshot = commercial.snapshotFromRegistry(geo, [secondary(geo, { offer: campaign(geo, `s-${geo.toLowerCase()}`) }), registration(geo, { offer: campaign(geo, `p-${geo.toLowerCase()}`) })])
    assert.deepEqual(snapshot.operators.map(item => [item.slug, item.sponsor]), [['test-partner', true], ['second-partner', false]])
    const locale = `es-${geo}`
    for (const surface of Object.keys(promotion.BANNER_SURFACES)) {
      assert.equal(promotion.getSponsoredBanner(snapshot, geo, locale, surface)?.operatorSlug, 'test-partner', `${geo} ${surface}`)
    }
    assert.equal(promotion.getPromotion(snapshot, geo, locale, promotion.PROMO_PLACEMENTS.originalsEngagement)?.offerId, `offer-p-${geo.toLowerCase()}`)
    // Secondary offers stay available in Offers and discovery flows.
    assert.deepEqual(data.getPublicOffers(geo, snapshot.offers, snapshot.operators).map(offer => offer.id), [`offer-p-${geo.toLowerCase()}`, `offer-s-${geo.toLowerCase()}`])
    assert.equal(promotion.getPromotion(snapshot, geo, locale, promotion.PROMO_PLACEMENTS.offersPage, { operatorId: `second-${geo.toLowerCase()}` })?.offerId, `offer-s-${geo.toLowerCase()}`)
  }
})

test('a secondary operator never replaces a missing or offer-less primary in sponsor surfaces', () => {
  const onlySecondary = commercial.snapshotFromRegistry('PE', [secondary('PE', { offer: campaign('PE', 'only') })])
  assert.equal(onlySecondary.operators.length, 1)
  for (const surface of Object.keys(promotion.BANNER_SURFACES)) assert.equal(promotion.getSponsoredBanner(onlySecondary, 'PE', 'es-PE', surface), null)
  assert.equal(promotion.getPromotion(onlySecondary, 'PE', 'es-PE', promotion.PROMO_PLACEMENTS.originalsEngagement), null)
  assert.equal(data.getPublicOffers('PE', onlySecondary.offers, onlySecondary.operators).length, 1, 'the secondary offer remains listed')
  // Primary without a campaign keeps the brand banner; the popup never borrows the secondary's offer.
  const noPrimaryOffer = commercial.snapshotFromRegistry('CO', [secondary('CO', { offer: campaign('CO', 'bw') }), registration('CO')])
  assert.equal(promotion.getSponsoredBanner(noPrimaryOffer, 'CO', 'es-CO', 'homepage')?.operatorSlug, 'test-partner')
  assert.equal(promotion.getPromotion(noPrimaryOffer, 'CO', 'es-CO', promotion.PROMO_PLACEMENTS.originalsEngagement), null)
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
