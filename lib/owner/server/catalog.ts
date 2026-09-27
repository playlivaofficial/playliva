import { SPOTLIGHT_GAMES } from '@/lib/home/spotlight'
import { serverDestination } from '@/lib/affiliates/server-destinations'
import sitemap from '@/app/sitemap'
import { OPERATORS, isAffiliateEligible } from '@/lib/data'
import { BETSSON_PROMO } from '@/lib/affiliates/betsson-promo-config'
export const ownerGames = SPOTLIGHT_GAMES.map(game => ({ id: game.id, slug: game.slug, title: game.title['pt-BR'], category: game.category.en, poster: game.poster, route: game.playPath }))
export const publishedInventory = () => sitemap().map(row => {
  const path = new URL(row.url).pathname, parts = path.split('/').filter(Boolean), game = ownerGames.find(item => path.endsWith(item.route))
  return { id: `page-${parts.join('-') || 'home'}`, type: game ? 'Original game' : parts[1] === 'games' || parts[1] === 'providers' ? 'Catalog' : 'Editorial / discovery', locale: parts[0], topic: game?.title ?? (parts.slice(1).join(' / ') || 'Homepage'), query: '', route: path, status: 'published' as const, reason: 'Existing indexable route in the production sitemap configuration.', updatedAt: row.lastModified ? String(row.lastModified) : null, source: 'Public sitemap configuration' }
})
export function operatorOverview() {
  return OPERATORS.filter(operator => !operator.isMock).map(operator => ({ id: operator.id, slug: operator.slug, name: operator.name, status: operator.affiliateStatus, active: operator.active, verified: operator.verified,
    eligibleGeo: operator.countries.filter(country => isAffiliateEligible(operator, country, {})), configuredGeo: operator.countries,
    destinationConfigured: Object.values(operator.affiliateUrl).some(value => Boolean(value && serverDestination(value))), verifiedAt: operator.lastVerifiedAt ?? null,
    campaign: operator.id === BETSSON_PROMO.operatorId ? BETSSON_PROMO.campaignName : null,
    placements: operator.id === BETSSON_PROMO.operatorId ? [...BETSSON_PROMO.placements] : [],
    campaignReviewBy: operator.id === BETSSON_PROMO.operatorId ? BETSSON_PROMO.validUntil : null,
  }))
}
