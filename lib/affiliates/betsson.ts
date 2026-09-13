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
import { getOperator } from '../data'
import type { CountryCode, Locale } from '../types'

export const BETSSON_OPERATOR_SLUG = 'betsson-group-affiliates' as const
export const BETSSON_OPERATOR_ID = 'op-betsson' as const

export const HOMEPAGE_BANNER_PLACEMENT = 'homepage_banner' as const
export const GENERIC_OPERATOR_PLACEMENT = 'originals_generic_operator' as const
export const VERIFIED_PLAY_REAL_PLACEMENT = 'originals_play_real' as const

export type BetssonCtaMode = 'verified-category' | 'verified-game' | 'generic-brand'
export type CreativeLanguage = Locale | 'neutral'

export const GENERIC_BRAND_MODE: BetssonCtaMode = 'generic-brand'

const BRAND_PLACEMENTS = [HOMEPAGE_BANNER_PLACEMENT, GENERIC_OPERATOR_PLACEMENT] as const

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
  placements: [HOMEPAGE_BANNER_PLACEMENT, GENERIC_OPERATOR_PLACEMENT],
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

export function selectHomepageCreative(locale: Locale): BetssonCreative {
  const pool = HOMEPAGE_CREATIVES.filter((creative) => creative.placements.includes(HOMEPAGE_BANNER_PLACEMENT))
  return pool.find((creative) => creative.language === locale)
    ?? pool.find((creative) => creative.language === 'neutral')
    ?? BETSSON_LOGO_CREATIVE
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

export function getBetssonHomepageBanner(country: CountryCode, locale: Locale) {
  const operator = getBetssonOperator()
  if (!operator || country !== 'BR') return null
  const resolved = resolveGenericBrandDestination({
    operatorSlug: operator.slug,
    country,
    language: locale,
    pageType: 'home',
    placement: HOMEPAGE_BANNER_PLACEMENT,
  })
  if (!resolved) return null
  const campaigns = getBetssonCampaigns()
  const creative = selectHomepageCreative(locale)
  return {
    mode: GENERIC_BRAND_MODE,
    operatorId: operator.id,
    operatorSlug: operator.slug,
    operatorName: operator.name,
    geo: 'BR' as const,
    locale,
    creative,
    campaign: campaigns.brand,
    href: buildGoHref({
      operator: operator.slug,
      country,
      language: locale,
      page: 'home',
      placement: HOMEPAGE_BANNER_PLACEMENT,
      cta: HOMEPAGE_BANNER_PLACEMENT,
    }),
  }
}
