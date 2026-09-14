/**
 * Central Betsson campaign / creative metadata.
 *
 * Destinations are the partner-issued HTTPS tracking links already stored on
 * the approved operator record. Components must not hard-code those URLs;
 * they resolve through `/go`. This module is the single place that names the
 * approved placements, creatives, GEO, provenance and CTA modes.
 *
 * Locale and market are independent. Homepage creatives are chosen by UI
 * language; GEO still gates eligibility and the `/go` destination. A
 * Portuguese Media Store banner must never render on EN or ES-MX pages.
 *
 * Two outbound modes are explicit and must not be mixed:
 *   - verified-category / verified-game: existing eligibility, which may
 *     require a category or verified listing.
 *   - generic-brand: approved operator homepage/brand destination only.
 *     Category and gameSlug are omitted on purpose so instant-games /
 *     unverified Originals cannot silently reuse another game's availability,
 *     and so category gates cannot hide a generic approved brand link.
 */

import { buildGoHref, resolveDestination, type ResolvedDestination } from '../affiliate'
import { getGame, getOperator, isCategorySlug, isGameVerifiedAtOperator } from '../data'
import type { CategorySlug, CountryCode, Locale } from '../types'
import type { PageType } from '../tracking'

export const BETSSON_OPERATOR_SLUG = 'betsson-group-affiliates' as const
export const BETSSON_OPERATOR_ID = 'op-betsson' as const

export const HOMEPAGE_BANNER_PLACEMENT = 'homepage_banner' as const
export const GENERIC_OPERATOR_PLACEMENT = 'originals_generic_operator' as const
export const VERIFIED_PLAY_REAL_PLACEMENT = 'originals_play_real' as const
export const GAME_DETAIL_CTA_PLACEMENT = 'game_detail_play_real' as const

export const PLAY_HUB_BANNER_PLACEMENT = 'play_hub_banner' as const
export const GAMES_DIRECTORY_BANNER_PLACEMENT = 'games_directory_banner' as const
export const SLOTS_BANNER_PLACEMENT = 'slots_banner' as const
export const CRASH_BANNER_PLACEMENT = 'crash_banner' as const
export const LIVE_CASINO_BANNER_PLACEMENT = 'live_casino_banner' as const
export const INSTANT_GAMES_BANNER_PLACEMENT = 'instant_games_banner' as const
export const TABLE_GAMES_BANNER_PLACEMENT = 'table_games_banner' as const
export const OFFERS_BANNER_PLACEMENT = 'offers_banner' as const
export const OPERATORS_BANNER_PLACEMENT = 'operators_banner' as const
export const GAME_DETAIL_BANNER_PLACEMENT = 'game_detail_banner' as const
export const PROVIDERS_BANNER_PLACEMENT = 'providers_banner' as const
export const PROVIDER_DETAIL_BANNER_PLACEMENT = 'provider_detail_banner' as const
export const GAMES_LIKE_BANNER_PLACEMENT = 'games_like_banner' as const
export const COMPARISON_BANNER_PLACEMENT = 'comparison_banner' as const
export const BEST_LIST_BANNER_PLACEMENT = 'best_list_banner' as const
export const ORIGINALS_BANNER_PLACEMENT = 'originals_banner' as const

export type BetssonCtaMode = 'verified-category' | 'verified-game' | 'generic-brand'
export type CreativeLanguage = Locale | 'neutral'
export type BetssonBannerLayout = 'full' | 'compact' | 'hub'
export type BetssonBannerCta = 'explore' | 'visit'

export const GENERIC_BRAND_MODE: BetssonCtaMode = 'generic-brand'

/**
 * Sitewide sponsored surfaces. `pageType` is chosen from values that do not
 * require a verified game slug, so generic brand banners stay visible on
 * game/games-like pages without inventing availability.
 */
export const BETSSON_BANNER_SURFACES = {
  homepage: { placement: HOMEPAGE_BANNER_PLACEMENT, pageType: 'home' as const satisfies PageType, surface: 'homepage' },
  play: { placement: PLAY_HUB_BANNER_PLACEMENT, pageType: 'play' as const satisfies PageType, surface: 'play' },
  games: { placement: GAMES_DIRECTORY_BANNER_PLACEMENT, pageType: 'games' as const satisfies PageType, surface: 'games' },
  slots: { placement: SLOTS_BANNER_PLACEMENT, pageType: 'category' as const satisfies PageType, surface: 'slots' },
  crash: { placement: CRASH_BANNER_PLACEMENT, pageType: 'category' as const satisfies PageType, surface: 'crash' },
  'live-casino': { placement: LIVE_CASINO_BANNER_PLACEMENT, pageType: 'category' as const satisfies PageType, surface: 'live-casino' },
  'instant-games': { placement: INSTANT_GAMES_BANNER_PLACEMENT, pageType: 'category' as const satisfies PageType, surface: 'instant-games' },
  'table-games': { placement: TABLE_GAMES_BANNER_PLACEMENT, pageType: 'category' as const satisfies PageType, surface: 'table-games' },
  offers: { placement: OFFERS_BANNER_PLACEMENT, pageType: 'offers' as const satisfies PageType, surface: 'offers' },
  operators: { placement: OPERATORS_BANNER_PLACEMENT, pageType: 'operators' as const satisfies PageType, surface: 'operators' },
  game: { placement: GAME_DETAIL_BANNER_PLACEMENT, pageType: 'content' as const satisfies PageType, surface: 'game' },
  providers: { placement: PROVIDERS_BANNER_PLACEMENT, pageType: 'content' as const satisfies PageType, surface: 'providers' },
  provider: { placement: PROVIDER_DETAIL_BANNER_PLACEMENT, pageType: 'content' as const satisfies PageType, surface: 'provider' },
  'games-like': { placement: GAMES_LIKE_BANNER_PLACEMENT, pageType: 'content' as const satisfies PageType, surface: 'games-like' },
  comparison: { placement: COMPARISON_BANNER_PLACEMENT, pageType: 'comparison' as const satisfies PageType, surface: 'comparison' },
  'best-list': { placement: BEST_LIST_BANNER_PLACEMENT, pageType: 'best_list' as const satisfies PageType, surface: 'best-list' },
  originals: { placement: ORIGINALS_BANNER_PLACEMENT, pageType: 'play' as const satisfies PageType, surface: 'originals' },
} as const

export type BetssonBannerSurface = keyof typeof BETSSON_BANNER_SURFACES

const BRAND_PLACEMENTS = [
  HOMEPAGE_BANNER_PLACEMENT,
  GENERIC_OPERATOR_PLACEMENT,
  PLAY_HUB_BANNER_PLACEMENT,
  GAMES_DIRECTORY_BANNER_PLACEMENT,
  SLOTS_BANNER_PLACEMENT,
  CRASH_BANNER_PLACEMENT,
  LIVE_CASINO_BANNER_PLACEMENT,
  INSTANT_GAMES_BANNER_PLACEMENT,
  TABLE_GAMES_BANNER_PLACEMENT,
  OFFERS_BANNER_PLACEMENT,
  OPERATORS_BANNER_PLACEMENT,
  GAME_DETAIL_BANNER_PLACEMENT,
  PROVIDERS_BANNER_PLACEMENT,
  PROVIDER_DETAIL_BANNER_PLACEMENT,
  GAMES_LIKE_BANNER_PLACEMENT,
  COMPARISON_BANNER_PLACEMENT,
  BEST_LIST_BANNER_PLACEMENT,
  ORIGINALS_BANNER_PLACEMENT,
  GAME_DETAIL_CTA_PLACEMENT,
] as const

export interface BetssonCreative {
  id: string
  kind: 'logo' | 'banner'
  assetPath: string
  alt: Record<Locale, string>
  language: CreativeLanguage
  geo: readonly CountryCode[]
  placements: readonly string[]
  source: string
  verifiedAt: string
  inspectedAt: string
  width?: number
  height?: number
}

/** Language-neutral approved mark: no promotional copy in any locale. */
export const BETSSON_LOGO_CREATIVE: BetssonCreative = {
  id: 'betsson-operator-logo',
  kind: 'logo',
  assetPath: '/operators/betsson.png',
  alt: { en: 'Betsson', 'pt-BR': 'Betsson', 'es-MX': 'Betsson' },
  language: 'neutral',
  geo: ['BR'],
  placements: BRAND_PLACEMENTS,
  source: 'Approved Betsson operator logo already on file in the PlayLiva repository. Used as the language-neutral homepage creative whenever a locale-matched Media Store banner is not on file, so Portuguese promotional artwork never appears on EN or ES-MX pages.',
  verifiedAt: '2026-08-14',
  inspectedAt: '2026-09-13',
  width: 447,
  height: 447,
}

/**
 * Homepage creatives. Locale-specific Media Store banners belong here with
 * `language` set to that UI locale only. Never list a PT-BR promo banner as
 * `neutral` or as `en` / `es-MX`.
 */
export const HOMEPAGE_CREATIVES: readonly BetssonCreative[] = [BETSSON_LOGO_CREATIVE]

export const BETSSON_CREATIVES = {
  logo: BETSSON_LOGO_CREATIVE,
} as const

/**
 * Prefer a creative whose `language` matches the UI locale. Fall back to an
 * approved language-neutral mark. Never use a Portuguese promo banner for
 * `en` or `es-MX`, even if it is the only banner in the pool.
 */
export function selectCreativeForLocale(
  creatives: readonly BetssonCreative[],
  locale: Locale,
  placement: string = HOMEPAGE_BANNER_PLACEMENT,
): BetssonCreative {
  const pool = creatives.filter((creative) => creative.placements.includes(placement))
  return pool.find((creative) => creative.language === locale)
    ?? pool.find((creative) => creative.language === 'neutral')
    ?? BETSSON_LOGO_CREATIVE
}

export function selectHomepageCreative(locale: Locale): BetssonCreative {
  return selectCreativeForLocale(HOMEPAGE_CREATIVES, locale)
}

/** Partner-issued NetRefer path key from an approved destination. Never invent IDs. */
export function netreferTrackingKey(destination: string): string | null {
  try {
    const match = new URL(destination).pathname.match(/^\/(_[A-Za-z0-9_-]+)\/1\/?$/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export function getBetssonOperator() {
  return getOperator(BETSSON_OPERATOR_SLUG)
}

export function getBetssonCampaigns() {
  const operator = getBetssonOperator()
  const brand = operator?.affiliateUrl.BR
  const crash = operator?.categoryAffiliateUrl?.crash?.BR
  const liveCasino = operator?.categoryAffiliateUrl?.['live-casino']?.BR
  const verifiedAt = operator?.lastVerifiedAt
  const source = 'Betsson Affiliate NetRefer tracking link on the approved operator record'
  return {
    brand: {
      id: 'betsson-br-brand',
      mode: GENERIC_BRAND_MODE,
      geo: 'BR' as const,
      destination: brand,
      trackingKey: brand ? netreferTrackingKey(brand) : null,
      source,
      verifiedAt,
      placements: BRAND_PLACEMENTS,
    },
    crash: {
      id: 'betsson-br-crash',
      mode: 'verified-category' as const,
      geo: 'BR' as const,
      category: 'crash' as const,
      destination: crash,
      trackingKey: crash ? netreferTrackingKey(crash) : null,
      source,
      verifiedAt,
      placements: [VERIFIED_PLAY_REAL_PLACEMENT] as const,
    },
    liveCasino: {
      id: 'betsson-br-live-casino',
      mode: 'verified-category' as const,
      geo: 'BR' as const,
      category: 'live-casino' as const,
      destination: liveCasino,
      trackingKey: liveCasino ? netreferTrackingKey(liveCasino) : null,
      source,
      verifiedAt,
      placements: [VERIFIED_PLAY_REAL_PLACEMENT] as const,
    },
    slots: {
      id: 'betsson-br-slots-via-brand',
      mode: 'verified-category' as const,
      geo: 'BR' as const,
      category: 'slots' as const,
      destination: brand,
      trackingKey: brand ? netreferTrackingKey(brand) : null,
      source: `${source}. No slots-specific tracking link is on file; slots CTAs use the brand destination without claiming a slots campaign ID.`,
      verifiedAt,
      placements: [VERIFIED_PLAY_REAL_PLACEMENT] as const,
    },
  }
}

/**
 * Approved brand/home destination only. Callers must not pass category or
 * gameSlug — those belong to verified category/game CTAs.
 */
export function resolveGenericBrandDestination(params: {
  operatorSlug: string
  country: CountryCode
  language?: string | null
  pageType?: string | null
  placement: string
  analyticsAllowed?: boolean
}): ResolvedDestination | null {
  return resolveDestination({
    operatorSlug: params.operatorSlug,
    country: params.country,
    language: params.language,
    pageType: params.pageType,
    placement: params.placement,
    analyticsAllowed: params.analyticsAllowed,
  })
}

export interface BetssonSponsoredBannerModel {
  mode: 'generic-brand'
  operatorId: string
  operatorSlug: string
  operatorName: string
  geo: 'BR'
  locale: Locale
  creative: BetssonCreative
  campaign: ReturnType<typeof getBetssonCampaigns>['brand']
  href: string
  placement: string
  pageType: string
  surface: string
}

export function getBetssonSponsoredBanner(
  country: CountryCode,
  locale: Locale,
  surface: BetssonBannerSurface,
): BetssonSponsoredBannerModel | null {
  const operator = getBetssonOperator()
  if (!operator || country !== 'BR') return null
  const config = BETSSON_BANNER_SURFACES[surface]
  const resolved = resolveGenericBrandDestination({
    operatorSlug: operator.slug,
    country,
    language: locale,
    pageType: config.pageType,
    placement: config.placement,
  })
  if (!resolved) return null
  const campaigns = getBetssonCampaigns()
  const creative = selectCreativeForLocale(HOMEPAGE_CREATIVES, locale, config.placement)
  return {
    mode: 'generic-brand',
    operatorId: operator.id,
    operatorSlug: operator.slug,
    operatorName: operator.name,
    geo: 'BR',
    locale,
    creative,
    campaign: campaigns.brand,
    href: buildGoHref({
      operator: operator.slug,
      country,
      language: locale,
      page: config.pageType,
      placement: config.placement,
      cta: config.placement,
    }),
    placement: config.placement,
    pageType: config.pageType,
    surface: config.surface,
  }
}

export function getBetssonHomepageBanner(country: CountryCode, locale: Locale) {
  const banner = getBetssonSponsoredBanner(country, locale, 'homepage')
  if (!banner) return null
  return {
    mode: banner.mode,
    operatorId: banner.operatorId,
    operatorSlug: banner.operatorSlug,
    operatorName: banner.operatorName,
    geo: banner.geo,
    locale: banner.locale,
    creative: banner.creative,
    campaign: banner.campaign,
    href: banner.href,
  }
}

export interface BetssonGamePlayCta {
  mode: BetssonCtaMode
  operatorId: string
  operatorSlug: string
  operatorName: string
  geo: 'BR'
  locale: Locale
  href: string
  pageType: PageType
  placement: typeof GAME_DETAIL_CTA_PLACEMENT
  gameSlug?: string
  category?: CategorySlug
}

/**
 * Real-provider Play Real CTA. Verified game destinations win, then a
 * verified category destination, then the approved generic brand link.
 * Unverified titles never attach a game slug, so the CTA cannot claim
 * exact-game availability.
 */
export function getBetssonGamePlayCta(
  country: CountryCode,
  locale: Locale,
  options: { gameSlug?: string; category?: CategorySlug },
): BetssonGamePlayCta | null {
  const operator = getBetssonOperator()
  if (!operator || country !== 'BR') return null
  const game = options.gameSlug ? getGame(options.gameSlug) : undefined
  const category = options.category
    ?? game?.affiliateCategory
    ?? (game && isCategorySlug(game.category) ? game.category : undefined)

  if (game && isGameVerifiedAtOperator(operator, game.id, country)) {
    const commercialCategory = game.affiliateCategory ?? game.category
    const resolved = resolveDestination({
      operatorSlug: operator.slug,
      country,
      language: locale,
      pageType: 'game',
      pageSlug: game.slug,
      gameSlug: game.slug,
      category: commercialCategory,
      placement: GAME_DETAIL_CTA_PLACEMENT,
    })
    if (resolved) {
      return {
        mode: 'verified-game',
        operatorId: operator.id,
        operatorSlug: operator.slug,
        operatorName: operator.name,
        geo: 'BR',
        locale,
        href: buildGoHref({
          operator: operator.slug,
          country,
          language: locale,
          game: game.slug,
          category: commercialCategory,
          page: 'game',
          pageSlug: game.slug,
          placement: GAME_DETAIL_CTA_PLACEMENT,
          cta: GAME_DETAIL_CTA_PLACEMENT,
        }),
        pageType: 'game',
        placement: GAME_DETAIL_CTA_PLACEMENT,
        gameSlug: game.slug,
        category: commercialCategory,
      }
    }
  }

  if (category && isCategorySlug(category)) {
    const resolved = resolveDestination({
      operatorSlug: operator.slug,
      country,
      language: locale,
      pageType: 'content',
      category,
      placement: GAME_DETAIL_CTA_PLACEMENT,
    })
    if (resolved) {
      return {
        mode: 'verified-category',
        operatorId: operator.id,
        operatorSlug: operator.slug,
        operatorName: operator.name,
        geo: 'BR',
        locale,
        href: buildGoHref({
          operator: operator.slug,
          country,
          language: locale,
          category,
          page: 'content',
          placement: GAME_DETAIL_CTA_PLACEMENT,
          cta: GAME_DETAIL_CTA_PLACEMENT,
        }),
        pageType: 'content',
        placement: GAME_DETAIL_CTA_PLACEMENT,
        category,
      }
    }
  }

  const resolved = resolveGenericBrandDestination({
    operatorSlug: operator.slug,
    country,
    language: locale,
    pageType: 'content',
    placement: GAME_DETAIL_CTA_PLACEMENT,
  })
  if (!resolved) return null
  return {
    mode: GENERIC_BRAND_MODE,
    operatorId: operator.id,
    operatorSlug: operator.slug,
    operatorName: operator.name,
    geo: 'BR',
    locale,
    href: buildGoHref({
      operator: operator.slug,
      country,
      language: locale,
      page: 'content',
      placement: GAME_DETAIL_CTA_PLACEMENT,
      cta: GAME_DETAIL_CTA_PLACEMENT,
    }),
    pageType: 'content',
    placement: GAME_DETAIL_CTA_PLACEMENT,
  }
}
