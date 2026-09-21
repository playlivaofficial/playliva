/**
 * Funnel events for the central Betsson BR campaign.
 *
 * `offer_impression` → `offer_dismiss` / `affiliate_click`, each carrying the
 * promo id, brand, placement, surface family, route, game slug (Originals and
 * game pages), language, market, device class and the preserved landing
 * attribution. Everything passes through the consented, allow-listed
 * `track()` layer; no wallet, identifier or free-text data is attached.
 */

import { attributionPayload } from '../attribution'
import { track, type TrackPayload } from '../tracking'
import type { BetssonPromoModel } from './betsson-promo'

export type BetssonPromoEvent = 'offer_impression' | 'offer_dismiss' | 'affiliate_click'

export interface BetssonPromoEventContext {
  /** Original slug or provider game slug the promo appeared next to. */
  gameSlug?: string
  /** Original id for Originals surfaces. */
  originalId?: string
  /** Localized route, e.g. `/pt-br/play/crash`; query strings are stripped by the tracker. */
  route?: string
}

export function betssonPromoPayload(model: BetssonPromoModel, context: BetssonPromoEventContext = {}): TrackPayload {
  return {
    promoId: model.promoId,
    brand: model.brand,
    placement: model.placement,
    ctaLocation: model.placement,
    surface: model.surface,
    pageType: model.pageType,
    pageSlug: model.pageSlug ?? context.gameSlug,
    gameSlug: context.gameSlug,
    originalId: context.originalId,
    operatorId: model.operatorId,
    operatorSlug: model.operatorSlug,
    offerId: model.offerId,
    destination: model.offerId,
    country: model.market,
    language: model.locale,
    url: context.route,
    ...attributionPayload(),
  }
}

export function trackBetssonPromo(event: BetssonPromoEvent, model: BetssonPromoModel, context: BetssonPromoEventContext = {}): void {
  track(event, betssonPromoPayload(model, context))
}
