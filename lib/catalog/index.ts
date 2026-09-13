// Server-only catalog projection. Client components import types/query/copy only.
import { GAMES } from '@/lib/data'
import { getGameContent, getCategoryName } from '@/lib/content'
import { getApprovedArtwork, hasApprovedArtwork } from '@/lib/game-artwork'
import { discoveryCategory } from '@/lib/product-discovery'
import type { Locale } from '@/lib/types'
import { REFERENCE_GAMES } from './games'
import { PROVIDERS, getReferenceProvider } from './providers'
import { catalogCopy } from './copy'
import { normalizeSearch } from './query'
import type { CatalogSummary, ReferenceGame } from './types'

export { REFERENCE_GAMES, PROVIDERS, getReferenceProvider }
export const getReferenceGame = (slug: string) => REFERENCE_GAMES.find(game => game.slug === slug)
export function referenceSummary(game: ReferenceGame, locale: Locale): CatalogSummary {
  const provider = getReferenceProvider(game.providerId)!.name
  const categoryLabel = getCategoryName(game.category, locale)
  const summary = game.content[locale].summary
  return { id: game.id, slug: game.slug, title: game.title, provider, providerId: game.providerId, category: game.category,
    categoryLabel, summary, image: game.artwork.status === 'fallback' ? null : game.artwork.assetPath, artworkLabel: catalogCopy(locale).fallback, reference: true,
    searchText: normalizeSearch([game.title, provider, game.category, categoryLabel, summary, ...game.tags].join(' ')),
  }
}
export function catalogSummaries(locale: Locale): CatalogSummary[] {
  const legacy: CatalogSummary[] = GAMES.map(game => {
    const category = discoveryCategory(game)
    const categoryLabel = getCategoryName(category, locale)
    const summary = getGameContent(game, locale).shortDescription
    const matchedProvider = PROVIDERS.find(p => normalizeSearch(p.name).replace(/\s/g, '') === normalizeSearch(game.provider).replace(/\s/g, ''))
    return { id: game.id, slug: game.slug, title: game.title, provider: matchedProvider?.name ?? game.provider,
      providerId: matchedProvider?.id ?? normalizeSearch(game.provider).replace(/\s+/g, '-'), category, categoryLabel, summary,
      image: hasApprovedArtwork(game) ? getApprovedArtwork(game)?.src ?? null : null,
      artworkLabel: catalogCopy(locale).fallback, reference: false,
      searchText: normalizeSearch([game.title, game.provider, category, categoryLabel, summary].join(' ')),
    }
  })
  return [...legacy, ...REFERENCE_GAMES.map(game => referenceSummary(game, locale))].sort((a, b) => a.title.localeCompare(b.title, locale))
}
