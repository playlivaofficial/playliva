/**
 * Resolvers for the central Betsson BR campaign (`./betsson-promo-config.ts`).
 *
 * A placement asks for the promo with the visitor's market and UI language
 * and receives either a fully resolved, GEO-gated model or `null`. Every
 * outbound click goes through `/go?offer=…`, so the official campaign link is
 * resolved server-side by the existing offer eligibility rules (active market,
 * licensed BR domain, dated evidence, validity window) and never appears in
 * the DOM.
 */

import { buildGoHref, resolveDestination } from '../affiliate'
import { getOperatorById } from '../data'
import type { CountryCode, Locale } from '../types'
import type { PageType } from '../tracking'
import {
  BETSSON_PROMO,
  BETSSON_PROMO_OFFER_ID,
  BETSSON_PROMO_PLACEMENTS,
  betssonPromoSurface,
  isBetssonPromoLive,
  type BetssonPromoConfig,
  type BetssonPromoCreative,
  type BetssonPromoPlacement,
  type BetssonPromoSurface,
} from './betsson-promo-config'

export {
  BETSSON_PROMO,
  BETSSON_PROMO_ID,
  BETSSON_PROMO_OFFER_ID,
  BETSSON_PROMO_PLACEMENTS,
  isBetssonPromoLive,
} from './betsson-promo-config'
export type { BetssonPromoConfig, BetssonPromoCreative, BetssonPromoPlacement, BetssonPromoSurface } from './betsson-promo-config'

const PAGE_TYPE_BY_PLACEMENT: Record<BetssonPromoPlacement, PageType> = {
  [BETSSON_PROMO_PLACEMENTS.originalsHeader]: 'play',
  [BETSSON_PROMO_PLACEMENTS.originalsEngagement]: 'play',
  [BETSSON_PROMO_PLACEMENTS.discoveryGame]: 'content',
  [BETSSON_PROMO_PLACEMENTS.offersPage]: 'offers',
}

export interface BetssonPromoModel {
  promoId: string
  brand: 'betsson'
  offerId: string
  operatorId: string
  operatorSlug: string
  operatorName: string
  market: CountryCode
  locale: Locale
  campaignName: string
  headline: string
  subheadline?: string
  /** Official Portuguese CTA on pt-BR; localized "Play at Betsson" elsewhere. */
  ctaLabel: string
  /** Internal tracked redirect; never the partner URL. */
  href: string
  landingPageUrl: string
  termsUrl: string
  /** Locale-gated artwork; falls back to the neutral logo. */
  creative: BetssonPromoCreative
  logo: BetssonPromoCreative
  placement: BetssonPromoPlacement
  surface: BetssonPromoSurface
  pageType: PageType
  pageSlug?: string
  validUntil: string
  verifiedTerms: readonly string[]
  frequencyCap: BetssonPromoConfig['frequencyCap']
  engagement: BetssonPromoConfig['engagement']
}

const CTA_BY_LOCALE: Record<Locale, (name: string) => string> = {
  'pt-BR': () => BETSSON_PROMO.ctaLabel,
  en: (name) => `Play at ${name}`,
  'es-MX': (name) => `Jugar en ${name}`,
}

/** Prefer locale-matched promo artwork; never show Portuguese promo art on EN / ES-MX. */
export function selectPromoCreative(config: BetssonPromoConfig, locale: Locale): BetssonPromoCreative {
  return config.creative.languages.includes(locale) ? config.creative : config.logo
}

export function getBetssonPromo(
  country: CountryCode,
  locale: Locale,
  placement: BetssonPromoPlacement,
  options: { pageSlug?: string; config?: BetssonPromoConfig; now?: number } = {},
): BetssonPromoModel | null {
  const config = options.config ?? BETSSON_PROMO
  if (!isBetssonPromoLive(config, options.now) || country !== config.market) return null
  if (!config.placements.includes(placement)) return null
  const operator = getOperatorById(config.operatorId)
  if (!operator || operator.slug !== config.operatorSlug) return null
  const pageType = PAGE_TYPE_BY_PLACEMENT[placement]
  const resolved = resolveDestination({
    offerId: BETSSON_PROMO_OFFER_ID,
    operatorSlug: operator.slug,
    country,
    language: locale,
    pageType,
    pageSlug: options.pageSlug,
    placement,
  })
  if (!resolved || resolved.url !== config.affiliateUrl) return null
  return {
    promoId: config.promoId,
    brand: config.brand,
    offerId: BETSSON_PROMO_OFFER_ID,
    operatorId: operator.id,
    operatorSlug: operator.slug,
    operatorName: operator.name,
    market: country,
    locale,
    campaignName: config.campaignName,
    headline: config.headline,
    subheadline: config.subheadline,
    ctaLabel: CTA_BY_LOCALE[locale](operator.name),
    href: buildGoHref({
      offer: BETSSON_PROMO_OFFER_ID,
      operator: operator.slug,
      country,
      language: locale,
      page: pageType,
      pageSlug: options.pageSlug,
      placement,
      cta: placement,
    }),
    landingPageUrl: config.landingPageUrl,
    termsUrl: config.termsUrl,
    creative: selectPromoCreative(config, locale),
    logo: config.logo,
    placement,
    surface: betssonPromoSurface(placement),
    pageType,
    pageSlug: options.pageSlug,
    validUntil: config.validUntil,
    verifiedTerms: config.verifiedTerms,
    frequencyCap: config.frequencyCap,
    engagement: config.engagement,
  }
}

/** Evidence expiry for the BR ad warning: the earliest of validity and source verification age. */
export function betssonPromoExpiresAt(config: BetssonPromoConfig = BETSSON_PROMO): number {
  return Math.min(
    Date.parse(`${config.validUntil}T00:00:00Z`),
    Date.parse(`${config.verifiedAt}T00:00:00Z`) + 30 * 86_400_000,
  )
}
