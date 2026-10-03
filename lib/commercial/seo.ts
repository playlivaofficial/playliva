// Server SEO entry point. Request GEO never changes canonical inventory.
import { commercialSnapshot } from './server'
import { geoForLocale } from '../geo'
import { LOCALE_SEGMENTS, type LocaleSegment } from '../locale'
import { isWhereToPlayIndexable } from '../seo-market'
import type { Game } from '../types'

export function publishedWhereToPlayLocales(game: Game): LocaleSegment[] {
  return LOCALE_SEGMENTS.filter(segment => isWhereToPlayIndexable(game, segment, commercialSnapshot(geoForLocale(segment)).operators))
}
export function publishedOperatorLocales(slug: string): LocaleSegment[] {
  return LOCALE_SEGMENTS.filter(segment => commercialSnapshot(geoForLocale(segment)).operators.some(operator => operator.slug === slug))
}
export function publishedCommercialDirectoryLocales(kind: 'offers' | 'operators'): LocaleSegment[] {
  return LOCALE_SEGMENTS.filter(segment => commercialSnapshot(geoForLocale(segment))[kind].length > 0)
}
