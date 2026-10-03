import { buildGoHref, resolveDestination } from '../affiliate'
import { getGame, isCategorySlug, isGameVerifiedAtOperator } from '../data'
import { isCommercialGeo } from '../geo'
import type { CommercialSnapshot } from '../commercial/types'
import type { CategorySlug, CountryCode, Locale } from '../types'
import type { PageType } from '../tracking'

/** Placement identities stay stable across operator changes and analytics history. */
export const PROMO_PLACEMENTS = {
  originalsHeader: 'originals_header', originalsEngagement: 'originals_engagement_offer',
  discoveryGame: 'discovery_game_offer', offersPage: 'offers_page',
} as const
export type PromoPlacement = (typeof PROMO_PLACEMENTS)[keyof typeof PROMO_PLACEMENTS]
export type PromoSurface = 'originals' | 'discovery' | 'offers'
export type BannerLayout = 'full' | 'compact' | 'hub' | 'compact-header' | 'full-support'
export type OperatorCtaMode = 'verified-category' | 'verified-game' | 'generic-brand'
export const BANNER_SURFACES = {
  homepage: { placement: 'homepage_banner', pageType: 'home' },
  play: { placement: 'play_hub_banner', pageType: 'play' },
  games: { placement: 'games_directory_banner', pageType: 'games' },
  slots: { placement: 'slots_banner', pageType: 'category' },
  crash: { placement: 'crash_banner', pageType: 'category' },
  'live-casino': { placement: 'live_casino_banner', pageType: 'category' },
  'instant-games': { placement: 'instant_games_banner', pageType: 'category' },
  'table-games': { placement: 'table_games_banner', pageType: 'category' },
  offers: { placement: 'offers_banner', pageType: 'offers' },
  operators: { placement: 'operators_banner', pageType: 'operators' },
  game: { placement: 'game_detail_banner', pageType: 'content' },
  providers: { placement: 'providers_banner', pageType: 'content' },
  provider: { placement: 'provider_detail_banner', pageType: 'content' },
  'games-like': { placement: 'games_like_banner', pageType: 'content' },
  comparison: { placement: 'comparison_banner', pageType: 'comparison' },
  'best-list': { placement: 'best_list_banner', pageType: 'best_list' },
  originals: { placement: PROMO_PLACEMENTS.originalsHeader, pageType: 'play' },
} as const satisfies Record<string, { placement: string; pageType: PageType }>
export type BannerSurface = keyof typeof BANNER_SURFACES

export interface PromoCreative {
  id: string; kind: 'logo' | 'banner'; assetPath: string; width: number; height: number
  alt: Partial<Record<Locale, string>>; languages: readonly Locale[]
}
export interface PromotionModel {
  promoId: string; campaignKey?: string; brand: string; offerId: string; operatorId: string; operatorSlug: string
  operatorName: string; market: CountryCode; locale: Locale; campaignName: string
  headline: string; subheadline?: string; ctaLabel: string; href: string; termsUrl?: string
  creative: PromoCreative; logo: PromoCreative; placement: string; surface: PromoSurface
  pageType: PageType; pageSlug?: string; validUntil: string; expiresAt: number
  verifiedTerms: readonly string[]; frequencyCap: { scope: 'milestone'; max: number }
  engagement: { cycleMultiple: number; delayMs: number }
  engagementCopy: { headline: string; condition: string; cta: string }
}

const promoSurface = (placement: string): PromoSurface => placement === PROMO_PLACEMENTS.offersPage ? 'offers'
  : placement === PROMO_PLACEMENTS.discoveryGame ? 'discovery' : 'originals'
const promoPage = (placement: string): PageType => placement === PROMO_PLACEMENTS.offersPage ? 'offers'
  : placement === PROMO_PLACEMENTS.discoveryGame ? 'content' : 'play'
const sameMarket = (snapshot: CommercialSnapshot | undefined, country: CountryCode): snapshot is CommercialSnapshot =>
  Boolean(snapshot && isCommercialGeo(country) && snapshot.geo === country)
function operatorLogo(id: string, name: string, path: string, locale: Locale): PromoCreative {
  return { id: `${id}-logo`, kind: 'logo', assetPath: path, width: 48, height: 48, alt: { [locale]: name }, languages: [locale] }
}

/** Only sanitized production configuration may provide campaigns. Empty means no promotion. */
export function getPromotion(snapshot: CommercialSnapshot | undefined, country: CountryCode, locale: Locale,
  placement: string, options: { pageSlug?: string; operatorId?: string; now?: number; pageType?: PageType } = {}): PromotionModel | null {
  if (!sameMarket(snapshot, country)) return null
  const now = options.now ?? Date.now()
  for (const campaign of snapshot.campaigns) {
    const from = Date.parse(campaign.validFrom), until = Date.parse(campaign.validUntil)
    if (!campaign.approved || !campaign.active || campaign.geo !== country || campaign.currency !== snapshot.currency ||
      !campaign.placements.includes(placement) || !Number.isFinite(now) || !Number.isFinite(from) || !Number.isFinite(until) ||
      now < from || now >= until || from >= until || !Number.isInteger(campaign.cadence.cycleMultiple) || campaign.cadence.cycleMultiple < 1 ||
      !Number.isFinite(campaign.cadence.delayMs) || campaign.cadence.delayMs < 0) continue
    const operator = snapshot.operators.find(item => item.id === campaign.operatorId)
    if (!operator || (options.operatorId && options.operatorId !== operator.id)) continue
    const offer = snapshot.offers.find(item => item.id === campaign.offer.id && item.operatorId === operator.id && item.country === country)
    const copy = campaign.copy[locale] ?? (locale.startsWith('es-') ? campaign.copy['es-MX'] : undefined)
    if (!offer || typeof copy?.headline !== 'string' || !copy.headline.trim() ||
      typeof copy.condition !== 'string' || !copy.condition.trim() || typeof copy.cta !== 'string' || !copy.cta.trim()) continue
    const pageType = options.pageType ?? promoPage(placement)
    const resolved = resolveDestination({ offerId: offer.id, operatorSlug: operator.slug, country, language: locale,
      pageType, pageSlug: options.pageSlug, placement }, snapshot)
    if (!resolved) continue
    const logo = operatorLogo(operator.id, operator.name, operator.logo, locale)
    const asset = offer.creative?.languages.includes(locale) ? offer.creative : undefined
    return { promoId: campaign.id, campaignKey: operator.campaignKey, brand: offer.brand ?? operator.slug, offerId: offer.id, operatorId: operator.id,
      operatorSlug: operator.slug, operatorName: operator.name, market: country, locale, campaignName: copy.headline,
      headline: copy.headline, subheadline: undefined, ctaLabel: copy.cta,
      href: buildGoHref({ offer: offer.id, operator: operator.slug, country, language: locale, page: pageType,
        pageSlug: options.pageSlug, placement, cta: placement }),
      termsUrl: offer.termsUrl, creative: asset ? { ...asset, kind: 'banner' } : logo, logo, placement,
      surface: promoSurface(placement), pageType, pageSlug: options.pageSlug, validUntil: campaign.validUntil,
      expiresAt: Math.min(until, Date.parse(offer.validUntil ?? campaign.validUntil),
        Date.parse(offer.complianceReview?.reviewBy ?? campaign.validUntil), Date.parse(offer.lastVerifiedAt ?? '') + 30 * 86_400_000),
      verifiedTerms: campaign.verifiedTerms,
      frequencyCap: { scope: 'milestone', max: 1 }, engagement: campaign.cadence, engagementCopy: copy }
  }
  return null
}

export interface SponsoredBannerModel {
  mode: 'generic-brand'; operatorId: string; operatorSlug: string; operatorName: string; geo: CountryCode; locale: Locale
  creative: PromoCreative; href: string; ctaLabel?: string; placement: string; pageType: PageType; surface: BannerSurface; promo: PromotionModel | null
}
export function resolveBannerLayout(layout: BannerLayout = 'compact-header'): 'compact-header' | 'full-support' {
  return layout === 'full' || layout === 'full-support' ? 'full-support' : 'compact-header'
}
export function getSponsoredBanner(snapshot: CommercialSnapshot | undefined, country: CountryCode, locale: Locale, surface: BannerSurface): SponsoredBannerModel | null {
  if (!sameMarket(snapshot, country)) return null
  const config = BANNER_SURFACES[surface]
  for (const operator of snapshot.operators) {
    const resolved = resolveDestination({ operatorSlug: operator.slug, country, language: locale,
      pageType: config.pageType, placement: config.placement }, snapshot)
    if (!resolved) continue
    const promo = getPromotion(snapshot, country, locale, config.placement, { operatorId: operator.id, pageType: config.pageType })
    return { mode: 'generic-brand', operatorId: operator.id, operatorSlug: operator.slug, operatorName: operator.name,
      geo: country, locale, creative: promo?.creative ?? operatorLogo(operator.id, operator.name, operator.logo, locale), ctaLabel: operator.ctaText?.[locale],
      href: promo?.href ?? buildGoHref({ operator: operator.slug, country, language: locale, page: config.pageType,
        placement: config.placement, cta: config.placement }), placement: config.placement, pageType: config.pageType, surface, promo }
  }
  return null
}

export interface ProviderGameCta {
  mode: OperatorCtaMode; operatorId: string; operatorSlug: string; operatorName: string; geo: CountryCode; locale: Locale
  href: string; ctaLabel?: string; pageType: PageType; placement: 'game_detail_play_real'; gameSlug?: string; category?: CategorySlug
}
/** Exact game availability is explicit; a brand referral never claims the named game is offered. */
export function getProviderGameCta(snapshot: CommercialSnapshot | undefined, country: CountryCode, locale: Locale,
  options: { gameSlug?: string; category?: CategorySlug }): ProviderGameCta | null {
  if (!sameMarket(snapshot, country)) return null
  const game = options.gameSlug ? getGame(options.gameSlug) : undefined
  const candidateCategory = options.category ?? game?.affiliateCategory ?? game?.category
  const category = candidateCategory && isCategorySlug(candidateCategory) ? candidateCategory : undefined
  for (const operator of snapshot.operators) {
    const candidates: Array<{ mode: OperatorCtaMode; pageType: PageType; gameSlug?: string; category?: CategorySlug }> = []
    if (game && isGameVerifiedAtOperator(operator, game.id, country)) candidates.push({ mode: 'verified-game', pageType: 'game', gameSlug: game.slug, category })
    if (category) candidates.push({ mode: 'verified-category', pageType: 'content', category })
    candidates.push({ mode: 'generic-brand', pageType: 'content' })
    for (const candidate of candidates) {
      const placement = 'game_detail_play_real'
      const resolved = resolveDestination({ operatorSlug: operator.slug, country, language: locale, ...candidate, placement }, snapshot)
      if (!resolved) continue
      return { ...candidate, operatorId: operator.id, operatorSlug: operator.slug, operatorName: operator.name, geo: country, locale, placement, ctaLabel: operator.ctaText?.[locale],
        href: buildGoHref({ operator: operator.slug, country, language: locale, game: candidate.gameSlug,
          category: candidate.category, page: candidate.pageType, placement, cta: placement }) }
    }
  }
  return null
}
