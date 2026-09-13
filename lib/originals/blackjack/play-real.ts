import { buildGoHref, resolveDestination } from '@/lib/affiliate'
import { getPublicOperators } from '@/lib/data'
import type { CountryCode, Locale } from '@/lib/types'

/** A separately labelled EXTERNAL recommendation, not an Original/provider
 * identity mapping. Only the existing verified Blackjack Live listing may
 * authorize this blackjack-specific referral. Category approval alone cannot.
 * The existing resolver retains its live-casino commercial classification. */
export function getVerifiedBlackjackReferrals(country: CountryCode, locale: Locale) {
  const gameSlug = 'blackjack-live', category = 'table-games' as const
  return getPublicOperators().flatMap(operator => {
    const context = { operatorSlug: operator.slug, country, category, gameSlug,
      pageType: 'play', placement: 'originals_play_real' }
    if (!resolveDestination(context)) return []
    return [{ operatorSlug: operator.slug, name: operator.name,
      href: buildGoHref({ operator: operator.slug, country, category, game: gameSlug,
        language: locale, page: 'play', placement: 'originals_play_real', cta: 'originals_play_real' }) }]
  })
}
