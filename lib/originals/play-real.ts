import { buildGoHref, resolveDestination } from '../affiliate'
import { getPublicOperators, isCategorySlug } from '../data'
import type { CategorySlug, CountryCode, Locale } from '../types'

/** Category referral only. Never pass an Original ID as a verified provider game. */
export function getPlayRealOptions(country: CountryCode, category: CategorySlug, locale: Locale) {
  if (!isCategorySlug(category)) return []
  return getPublicOperators().flatMap(operator => {
    const context = { operatorSlug: operator.slug, country, category,
      pageType: 'play', placement: 'originals_play_real' }
    if (!resolveDestination(context)) return []
    return [{ operatorSlug: operator.slug, name: operator.name,
      href: buildGoHref({ operator: operator.slug, country, category, language: locale,
        page: 'play', placement: 'originals_play_real', cta: 'originals_play_real' }) }]
  })
}
