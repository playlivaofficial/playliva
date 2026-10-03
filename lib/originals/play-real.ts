import { buildGoHref, resolveDestination } from '../affiliate'
import {
  GENERIC_BRAND_MODE,
  GENERIC_OPERATOR_PLACEMENT,
  VERIFIED_PLAY_REAL_PLACEMENT,
  resolveGenericBrandDestination,
  type BetssonCtaMode,
} from '../affiliates/betsson'
import { getPublicOperators, isCategorySlug } from '../data'
import type { CategorySlug, CountryCode, Locale } from '../types'
import type { CommercialSnapshot } from '../commercial/types'
import { LIVA_BLACKJACK } from './blackjack/definition'
import { getVerifiedBlackjackReferrals } from './blackjack/play-real'
import type { OriginalGameDefinition } from './definition'
import { LIVA_ROULETTE } from './roulette/config'
import { getVerifiedRouletteReferrals } from './roulette/play-real'

export type OperatorCtaMode = BetssonCtaMode

export interface OperatorCtaOption {
  operatorSlug: string
  name: string
  href: string
  mode: OperatorCtaMode
}

/** Category referral only. Never pass an Original ID as a verified provider game. */
export function getPlayRealOptions(country: CountryCode, category: CategorySlug, locale: Locale, snapshot?: CommercialSnapshot): OperatorCtaOption[] {
  if (!isCategorySlug(category)) return []
  return getPublicOperators(snapshot?.operators).flatMap(operator => {
    const context = { operatorSlug: operator.slug, country, category,
      pageType: 'play', placement: VERIFIED_PLAY_REAL_PLACEMENT }
    if (!resolveDestination(context, snapshot)) return []
    return [{ operatorSlug: operator.slug, name: operator.name, mode: 'verified-category' as const,
      href: buildGoHref({ operator: operator.slug, country, category, language: locale,
        page: 'play', placement: VERIFIED_PLAY_REAL_PLACEMENT, cta: VERIFIED_PLAY_REAL_PLACEMENT }) }]
  })
}

/**
 * Generic approved-operator brand CTA. Separate from category/game eligibility:
 * never attaches category or game identifiers, never reuses another listing's
 * availability, and still resolves when instant-games / table-games category
 * gates would hide the brand destination.
 */
export function getGenericApprovedOperatorCtas(country: CountryCode, locale: Locale, snapshot?: CommercialSnapshot): OperatorCtaOption[] {
  return getPublicOperators(snapshot?.operators).flatMap(operator => {
    const resolved = resolveGenericBrandDestination({
      operatorSlug: operator.slug,
      country,
      language: locale,
      pageType: 'play',
      placement: GENERIC_OPERATOR_PLACEMENT,
    }, snapshot)
    if (!resolved) return []
    return [{ operatorSlug: operator.slug, name: operator.name, mode: GENERIC_BRAND_MODE,
      href: buildGoHref({ operator: operator.slug, country, language: locale,
        page: 'play', placement: GENERIC_OPERATOR_PLACEMENT, cta: GENERIC_OPERATOR_PLACEMENT }) }]
  })
}

/** Verified listing or category first; generic brand only when those are empty. */
export function getOriginalOperatorCtas(game: OriginalGameDefinition, country: CountryCode, locale: Locale, snapshot?: CommercialSnapshot): OperatorCtaOption[] {
  // Arcade has no operator-equivalent game/category. The shared sponsor stays separate.
  if (!isCategorySlug(game.category)) return []
  if (game.id === LIVA_BLACKJACK.id) {
    return getVerifiedBlackjackReferrals(country, locale, snapshot).map(option => ({ ...option, mode: 'verified-game' as const }))
  }
  if (game.id === LIVA_ROULETTE.id) {
    return getVerifiedRouletteReferrals(country, locale, snapshot).map(option => ({ ...option, mode: 'verified-game' as const }))
  }
  const verifiedCategory = getPlayRealOptions(country, game.category, locale, snapshot)
  if (verifiedCategory.length) return verifiedCategory
  return getGenericApprovedOperatorCtas(country, locale, snapshot)
}
