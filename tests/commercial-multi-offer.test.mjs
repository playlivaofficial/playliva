import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server.js'
import endpoint from '../app/go/route.ts'
import commercial from '../lib/commercial/server.ts'
import promotion from '../lib/affiliates/promotion.ts'
import { registration } from './fixtures/commercial.mjs'

const origin = 'https://www.playliva.com'
const day = 86_400_000
const targetGeos = ['MX', 'CO', 'PE']

function campaign(geo, name, overrides = {}) {
  const now = Date.now(), key = `${geo.toLowerCase()}-${name}`
  return {
    id: `${key}-promo`, campaignKey: `${key}-campaign`, affiliateUrl: `https://partner.test/${key}`,
    approved: true, active: true,
    offer: {
      id: `${key}-offer`, title: `Fixture ${name}`, description: 'Synthetic integration fixture.',
      terms: 'Approved fixture terms apply.', category: 'welcome', status: 'verified',
      source: 'https://partner.test/terms', lastVerifiedAt: new Date(now - day).toISOString(),
      complianceReview: { status: 'reviewed-permitted', market: geo, legalSource: 'https://partner.test/review',
        verifiedAt: new Date(now - day).toISOString(), reviewBy: new Date(now + 7 * day).toISOString() },
    },
    copy: { [`es-${geo}`]: { headline: `Oferta ${name}`, condition: 'Consulta las condiciones', cta: 'Regístrate' } },
    placements: name === 'casino' ? ['offers_page', 'originals_engagement_offer', 'crash_banner'] : ['offers_page'],
    cadence: { cycleMultiple: 3, delayMs: 650 },
    validFrom: new Date(now - day).toISOString(), validUntil: new Date(now + 7 * day).toISOString(),
    verifiedTerms: ['Approved fixture terms apply.'], ...overrides,
  }
}
const multi = (geo, offers = [campaign(geo, 'casino'), campaign(geo, 'sports')], overrides = {}) =>
  registration(geo, { offers, ...overrides })

function go(geo, params, actual = geo) {
  const search = new URLSearchParams({ country: geo, language: `es-${geo}`, operator: 'test-partner', ...params })
  return endpoint.GET(new NextRequest(`${origin}/go?${search}`, { headers: actual ? { 'x-vercel-ip-country': actual } : {} }))
}
function target(response) {
  assert.equal(response.status, 302)
  return new URL(response.headers.get('location'))
}

test('one operator publishes several offers, each through its own tracked destination', async t => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  const configure = records => { process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify(records) }
  try {
    await t.test('each offer has a distinct opaque reference and private destination', async () => {
      configure(targetGeos.map(geo => multi(geo)))
      for (const geo of targetGeos) {
        const lower = geo.toLowerCase(), snapshot = commercial.commercialSnapshot(geo)
        assert.equal(snapshot.operators.length, 1, 'one operator card, not one per campaign')
        assert.deepEqual(snapshot.offers.map(offer => offer.id), [`${lower}-casino-offer`, `${lower}-sports-offer`])
        assert.deepEqual(snapshot.operators[0].verifiedOffers, [`${lower}-casino-offer`, `${lower}-sports-offer`])
        assert.deepEqual(snapshot.offers.map(offer => offer.affiliateUrl), [
          `playliva-affiliate:${geo}:test-${lower}:${lower}-casino-campaign`,
          `playliva-affiliate:${geo}:test-${lower}:${lower}-sports-campaign`])
        assert.doesNotMatch(JSON.stringify(snapshot), /partner\.test\/[a-z]{2}-(casino|sports)|private-test-id/, 'destinations stay server-side')
        for (const name of ['casino', 'sports']) {
          const url = target(await go(geo, { offer: `${lower}-${name}-offer`, placement: 'offers_page' }))
          assert.equal(`${url.origin}${url.pathname}`, `https://partner.test/${lower}-${name}`)
          assert.equal(url.searchParams.get('market'), geo)
        }
        // The brand-level CTA keeps the operator's own destination.
        assert.equal(target(await go(geo, { placement: 'where-to-play' })).pathname, `/${lower}`)
      }
    })

    await t.test('promotions attribute the selected offer campaign, not the operator key', () => {
      configure([multi('PE')])
      const snapshot = commercial.commercialSnapshot('PE')
      const popup = promotion.getPromotion(snapshot, 'PE', 'es-PE', 'originals_engagement_offer')
      assert.equal(popup.offerId, 'pe-casino-offer')
      assert.equal(popup.campaignKey, 'pe-casino-campaign')
      assert.equal(popup.engagement.cycleMultiple, 3)
      assert.equal(promotion.getPromotion(snapshot, 'PE', 'es-PE', 'homepage_banner'), null, 'unlisted placements stay empty')
      assert.equal(promotion.getPromotion(snapshot, 'MX', 'es-MX', 'originals_engagement_offer'), null, 'no cross-GEO reuse')
    })

    await t.test('an invalid campaign entry is withheld alone and never borrows another link', async () => {
      for (const broken of [
        campaign('MX', 'sports', { affiliateUrl: undefined }),
        campaign('MX', 'sports', { affiliateUrl: 'http://partner.test/insecure' }),
        campaign('MX', 'sports', { affiliateUrl: 'https://www.betsson.bet.br/retired' }),
        campaign('MX', 'sports', { campaignKey: 'test-mx-campaign' }),
        campaign('MX', 'sports', { campaignKey: 'mx-casino-campaign' }),
      ]) {
        configure([multi('MX', [campaign('MX', 'casino'), broken])])
        const snapshot = commercial.commercialSnapshot('MX')
        assert.deepEqual(snapshot.offers.map(offer => offer.id), ['mx-casino-offer'])
        assert.equal(target(await go('MX', { offer: 'mx-sports-offer' })).origin, origin, 'withheld offer falls back internally')
        assert.equal(target(await go('MX', { offer: 'mx-casino-offer' })).pathname, '/mx-casino')
        const diagnostics = commercial.diagnoseCommercialConfiguration(Date.now(), process.env)
        assert.ok(diagnostics.geos.find(item => item.geo === 'MX').issues.includes('campaign_destination_invalid'))
      }
    })

    await t.test('an expired campaign stops publishing and redirecting while siblings continue', async () => {
      const expired = campaign('CO', 'sports', { validUntil: new Date(Date.now() - 60_000).toISOString() })
      configure([multi('CO', [campaign('CO', 'casino'), expired])])
      assert.deepEqual(commercial.commercialSnapshot('CO').offers.map(offer => offer.id), ['co-casino-offer'])
      assert.equal(commercial.privateCommercialDestination('playliva-affiliate:CO:test-co:co-sports-campaign'), null)
      assert.equal(target(await go('CO', { offer: 'co-sports-offer' })).origin, origin)
      assert.equal(target(await go('CO', { offer: 'co-casino-offer' })).pathname, '/co-casino')
    })

    await t.test('references are bound to their GEO and trusted visitor market', async () => {
      configure(targetGeos.map(geo => multi(geo)))
      assert.equal(commercial.privateCommercialDestination('playliva-affiliate:CO:test-co:mx-casino-campaign'), null)
      assert.equal(commercial.privateCommercialDestination('playliva-affiliate:CO:test-mx:mx-casino-campaign'), null)
      for (const actual of ['CO', 'GE', 'BR', null]) {
        assert.equal(target(await go('MX', { offer: 'mx-casino-offer' }, actual)).origin, origin)
      }
      assert.equal(target(await go('PE', { offer: 'mx-casino-offer' })).origin, origin, 'another GEO offer id is unknown here')
    })

    await t.test('legacy destination keys resolve per campaign only inside the record GEO', async () => {
      const previousDestinations = process.env.PLAYLIVA_AFFILIATE_DESTINATIONS
      try {
        process.env.PLAYLIVA_AFFILIATE_DESTINATIONS = JSON.stringify({
          'partner-pe-sports': 'https://partner.test/pe-legacy', 'partner-mx-sports': 'https://partner.test/mx-legacy' })
        const scoped = { ...campaign('PE', 'sports'), affiliateUrl: undefined, destinationKey: 'partner-pe-sports' }
        configure([multi('PE', [campaign('PE', 'casino'), scoped])])
        assert.equal(target(await go('PE', { offer: 'pe-sports-offer' })).pathname, '/pe-legacy')
        const foreign = { ...campaign('PE', 'sports'), affiliateUrl: undefined, destinationKey: 'partner-mx-sports' }
        configure([multi('PE', [campaign('PE', 'casino'), foreign])])
        assert.deepEqual(commercial.commercialSnapshot('PE').offers.map(offer => offer.id), ['pe-casino-offer'])
      } finally {
        if (previousDestinations === undefined) delete process.env.PLAYLIVA_AFFILIATE_DESTINATIONS
        else process.env.PLAYLIVA_AFFILIATE_DESTINATIONS = previousDestinations
      }
    })
  } finally {
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})
