/** Compatibility exports for existing placements. Commercial selection is GEO/operator driven. */
import { resolveDestination } from '../affiliate'
import type { CountryCode, Locale } from '../types'
import type { CommercialSnapshot } from '../commercial/types'
import { BANNER_SURFACES, getSponsoredBanner, getProviderGameCta, resolveBannerLayout,
  type BannerLayout, type BannerSurface, type OperatorCtaMode } from './promotion'

export const HOMEPAGE_BANNER_PLACEMENT = 'homepage_banner'
export const GENERIC_OPERATOR_PLACEMENT = 'originals_generic_operator'
export const VERIFIED_PLAY_REAL_PLACEMENT = 'originals_play_real'
export const GAME_DETAIL_CTA_PLACEMENT = 'game_detail_play_real'
export const ORIGINALS_BANNER_PLACEMENT = 'originals_header'
export const GENERIC_BRAND_MODE = 'generic-brand' as const
export const BETSSON_BANNER_SURFACES = BANNER_SURFACES
export type BetssonCtaMode = OperatorCtaMode
export type BetssonBannerSurface = BannerSurface
export type BetssonBannerLayout = BannerLayout
export type BetssonBannerCta = 'explore' | 'visit'
export type BetssonBannerVariant = 'compact-header' | 'full-support'
export const resolveBetssonBannerLayout = resolveBannerLayout
export function getBetssonSponsoredBanner(country: CountryCode, locale: Locale, surface: BannerSurface, snapshot?: CommercialSnapshot) {
  return getSponsoredBanner(snapshot, country, locale, surface)
}
export function getBetssonHomepageBanner(country: CountryCode, locale: Locale, snapshot?: CommercialSnapshot) {
  return getSponsoredBanner(snapshot, country, locale, 'homepage')
}
export function getBetssonGamePlayCta(country: CountryCode, locale: Locale, options: Parameters<typeof getProviderGameCta>[3], snapshot?: CommercialSnapshot) {
  return getProviderGameCta(snapshot, country, locale, options)
}
export function resolveGenericBrandDestination(params: Parameters<typeof resolveDestination>[0], snapshot?: CommercialSnapshot) {
  return resolveDestination(params, snapshot)
}
/** Retained for historic reports only. No current placement reads a BR campaign. */
export function netreferTrackingKey(destination: string): string | null {
  try { return new URL(destination).pathname.match(/^\/(_[A-Za-z0-9_-]+)\/1\/?$/)?.[1] ?? null } catch { return null }
}
