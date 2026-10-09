import { SPOTLIGHT_GAMES } from '@/lib/home/spotlight'
import sitemap from '@/app/sitemap'
import { isAffiliateEligible } from '@/lib/data'
import { TARGET_GEOS, GEO_CONFIG } from '@/lib/geo'
import { commercialSnapshot, diagnoseCommercialConfiguration } from '@/lib/commercial/server'
import { PROMO_PLACEMENTS } from '@/lib/affiliates/promotion'
export const ownerGames = SPOTLIGHT_GAMES.map(game => ({ id: game.id, slug: game.slug, title: game.title['pt-BR'], category: game.category.en, poster: game.poster, route: game.playPath }))
export const publishedInventory = () => sitemap().map(row => {
  const path = new URL(row.url).pathname, parts = path.split('/').filter(Boolean), game = ownerGames.find(item => path.endsWith(item.route))
  return { id: `page-${parts.join('-') || 'home'}`, type: game ? 'Original game' : parts[1] === 'games' || parts[1] === 'providers' ? 'Catalog' : 'Editorial / discovery', locale: parts[0], topic: game?.title ?? (parts.slice(1).join(' / ') || 'Homepage'), query: '', route: path, status: 'published' as const, reason: 'Existing indexable route in the production sitemap configuration.', updatedAt: row.lastModified ? String(row.lastModified) : null, source: 'Public sitemap configuration' }
})
export function operatorOverview() {
  return TARGET_GEOS.flatMap(geo => {
    const snapshot = commercialSnapshot(geo)
    return snapshot.operators.map(operator => {
      const campaigns = snapshot.campaigns.filter(campaign => campaign.operatorId === operator.id)
      const popup = campaigns.some(campaign => campaign.placements.includes(PROMO_PLACEMENTS.originalsEngagement))
      return { id: operator.id, slug: operator.slug, name: operator.name, geo, status: operator.affiliateStatus, active: operator.active, verified: operator.verified,
        role: operator.sponsor ? 'primary' as const : 'secondary' as const, activeOffers: snapshot.offers.filter(offer => offer.operatorId === operator.id).length,
        sponsorPlacements: operator.sponsor ? 'Live on sponsor slots' : 'Offers and comparison only',
        popup: !operator.sponsor ? 'Not eligible (secondary)' : popup ? 'Active every third completed round' : 'No verified campaign for the popup',
        eligibleGeo: operator.countries.filter(country => isAffiliateEligible(operator, country, {})), configuredGeo: operator.countries,
        destinationConfigured: operator.destinationReady === true, verifiedAt: operator.lastVerifiedAt ?? campaigns.map(campaign => campaign.offer.lastVerifiedAt).filter(Boolean).sort().at(-1) ?? null,
        campaign: campaigns.map(campaign => campaign.id).join(', ') || null,
        placements: [...new Set(campaigns.flatMap(campaign => [...campaign.placements]))],
        campaignReviewBy: campaigns.map(campaign => campaign.validUntil).sort()[0] ?? null,
      }
    })
  })
}
export function commercialReadiness() {
  const diagnostics = diagnoseCommercialConfiguration()
  return TARGET_GEOS.map(geo => {
    const snapshot = commercialSnapshot(geo), diagnosis = diagnostics.geos.find(row => row.geo === geo)!
    return { geo, locale: GEO_CONFIG[geo].locale, currency: GEO_CONFIG[geo].currency, expectedOperator: diagnosis.brand,
      operators: snapshot.operators.length, offers: snapshot.offers.length, campaigns: snapshot.campaigns.length,
      ready: snapshot.operators.some(operator => operator.sponsor), issues: diagnosis.issues, legacyKeys: diagnosis.legacyKeys,
      registry: diagnostics.registry, legacyDestinations: diagnostics.legacyDestinations, retiredLegacyKeys: diagnostics.retiredLegacyKeys }
  })
}
