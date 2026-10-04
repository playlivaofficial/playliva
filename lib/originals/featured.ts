import { isCommercialGeo, type CommercialGeo } from '@/lib/geo'

/** Editorial priority only. This configuration never grants affiliate eligibility. */
export const FLAGSHIP_ORIGINAL_IDS = ['island-crash', 'liva-embaixadinha'] as const

const secondaryOrder = [
  'liva-capybara-gold', 'samba-drop', 'skuptu-levanta', 'liva-golaco',
  'carnaval-gold', 'liva-blackjack', 'liva-roulette', 'liva-mines',
  'liva-raio', 'liva-21-brasil', 'avia-de-janeiro', 'rio-drift',
] as const

export type FeaturedOriginalId = (typeof FLAGSHIP_ORIGINAL_IDS)[number] | (typeof secondaryOrder)[number]
export type FeaturedGeo = CommercialGeo | 'ROW'

/**
 * Reorder a GEO's secondary titles here; the protected anchors are always added
 * first. All three launch markets intentionally share the same quality priority.
 * Keep stable internal IDs: display names and historical route slugs may differ.
 */
export const ORIGINALS_FEATURED_CONFIG: Readonly<Record<FeaturedGeo, readonly FeaturedOriginalId[]>> = {
  MX: [...FLAGSHIP_ORIGINAL_IDS, ...secondaryOrder],
  CO: [...FLAGSHIP_ORIGINAL_IDS, ...secondaryOrder],
  PE: [...FLAGSHIP_ORIGINAL_IDS, ...secondaryOrder],
  ROW: [...FLAGSHIP_ORIGINAL_IDS, ...secondaryOrder],
}

export function featuredGeo(geo: unknown): FeaturedGeo {
  return isCommercialGeo(geo) ? geo : 'ROW'
}

/** Apply the same priority to full catalogs or smaller, relevant featured shelves. */
export function orderFeaturedOriginals<T extends { id: string }>(games: readonly T[], geo?: unknown): T[] {
  const order = ORIGINALS_FEATURED_CONFIG[featuredGeo(geo)]
  const ranks = new Map<string, number>(order.map((id, index) => [id, index]))
  return games.map((game, index) => ({ game, index }))
    .sort((a, b) => (ranks.get(a.game.id) ?? order.length) - (ranks.get(b.game.id) ?? order.length) || a.index - b.index)
    .map(({ game }) => game)
}
