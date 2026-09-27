import { getOperatorsForGame } from './data'
import type { Game, GameList, CountryCode } from './types'
import type { LocaleSegment } from './locale'

/**
 * Market represented by a crawlable editorial route. This controls SEO policy
 * and internal guide discovery, never runtime affiliate eligibility. Request
 * GEO and the saved market preference remain separate.
 */
export function seoMarketForLocaleSegment(
  segment: LocaleSegment,
): CountryCode | null {
  if (segment === 'pt-br') return 'BR'
  if (segment === 'es-mx') return 'MX'
  return null
}

export function isGameListIndexableForLocale(
  list: GameList,
  segment: LocaleSegment,
): boolean {
  return seoMarketForLocaleSegment(segment) === list.country
}

export function isWhereToPlayIndexable(
  game: Game,
  segment: LocaleSegment,
): boolean {
  const market = seoMarketForLocaleSegment(segment)
  return market !== null && getOperatorsForGame(game, market).length > 0
}

export function whereToPlayLocaleSegments(
  game: Game,
): LocaleSegment[] {
  return (['pt-br', 'es-mx', 'en'] as const).filter((segment) =>
    isWhereToPlayIndexable(game, segment),
  )
}
