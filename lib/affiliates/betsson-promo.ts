/** Legacy import compatibility. The retired BR campaign is never a runtime fallback. */
import { getPromotion, type PromotionModel } from './promotion'
import type { CommercialSnapshot } from '../commercial/types'
import type { CountryCode, Locale } from '../types'
import { BETSSON_PROMO, type BetssonPromoConfig, type BetssonPromoPlacement } from './betsson-promo-config'
export { BETSSON_PROMO, BETSSON_PROMO_ID, BETSSON_PROMO_OFFER_ID, BETSSON_PROMO_PLACEMENTS, isBetssonPromoLive } from './betsson-promo-config'
export type { BetssonPromoConfig, BetssonPromoCreative, BetssonPromoPlacement, BetssonPromoSurface } from './betsson-promo-config'
export type BetssonPromoModel = PromotionModel
export function getBetssonPromo(country: CountryCode, locale: Locale, placement: BetssonPromoPlacement,
  options: { pageSlug?: string; now?: number; snapshot?: CommercialSnapshot } = {}): PromotionModel | null {
  return getPromotion(options.snapshot, country, locale, placement, options)
}
export function betssonPromoExpiresAt(config: BetssonPromoConfig = BETSSON_PROMO): number {
  return Math.min(Date.parse(config.validUntil), Date.parse(config.verifiedAt) + 30 * 86_400_000)
}
