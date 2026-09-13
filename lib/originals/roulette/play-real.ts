import { buildGoHref, resolveDestination } from '@/lib/affiliate'
import { getPublicOperators } from '@/lib/data'
import type { CountryCode, Locale } from '@/lib/types'

/** Exact separately verified EXTERNAL roulette listing, never a mapping of the
 * Original to a provider game. Preserve existing Live Casino/GEO approval. */
export function getVerifiedRouletteReferrals(country: CountryCode, locale: Locale) {
  const gameSlug = 'lightning-roulette', category = 'live-casino' as const
  return getPublicOperators().flatMap(operator => {
    const context = { operatorSlug: operator.slug, country, category, gameSlug,
      pageType: 'play', placement: 'originals_play_real' }
    if (!resolveDestination(context)) return []
    return [{ operatorSlug: operator.slug, name: operator.name,
      href: buildGoHref({ operator: operator.slug, country, category, game: gameSlug,
        language: locale, page: 'play', placement: 'originals_play_real', cta: 'originals_play_real' }) }]
  })
}
