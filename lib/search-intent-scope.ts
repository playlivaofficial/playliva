import type { Locale } from './types'
import { isLocaleSegment, segmentToLocale, type LocaleSegment } from './locale'

/** Substantive reviews only; a deployment does not update editorial dates. */
export const SEARCH_INTENT_UPDATED_AT = '2026-10-14'
export const SEARCH_INTENT_PATHS: Partial<Record<Locale, readonly string[]>> = {
  'es-MX': ['/games/blackjack-live', '/games/aviator', '/games/gates-of-olympus', '/slots', '/best/best-crash-games-mexico', '/best/best-slots-mexico'],
  'es-CO': ['/games/aviator'],
  'es-PE': ['/where-to-play/aviator'],
}
export function hasSearchIntentReview(path: string, locale: Locale | LocaleSegment) {
  const active = isLocaleSegment(locale) ? segmentToLocale(locale) : locale
  return SEARCH_INTENT_PATHS[active]?.includes(path) ?? false
}
