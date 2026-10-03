import sitemap from '@/app/sitemap'
import { catalogSummaries, PROVIDERS } from '@/lib/catalog'
import { getReferenceComparison, getReferenceReadingList } from '@/lib/catalog/editorial'
import { getComparison, getGame, getGameList } from '@/lib/data'
import { SPOTLIGHT_GAMES } from '@/lib/home/spotlight'
import { isLocaleSegment } from '@/lib/locale'
import type { CommercialSnapshot } from '@/lib/commercial/types'

const editorialRoutes = new Set(sitemap().map(row => new URL(row.url).pathname))
const games = new Set(catalogSummaries('en').map(game => game.slug))
const sharedPaths = new Set(['', 'games', 'providers', 'offers', 'operators', 'play', 'crash', 'slots', 'live-casino', 'instant-games', 'table-games', 'arcade',
  'about', 'affiliate-disclosure', 'contact', 'cookie-policy', 'editorial-policy', 'privacy-policy', 'responsible-gaming', 'terms', 'authors/playliva', 'best/crash-games'])

/** Measurement follows existing rendered routes, not a search-engine indexing
 * rollout. In particular, usable regional pages may deliberately be noindex. */
export function isMeasuredPublicRoute(path: string, commercial: CommercialSnapshot): boolean {
  if (!/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/.test(path)) return false
  const [segment, family, slug, ...extra] = path.slice(1).split('/')
  if (!isLocaleSegment(segment)) return false
  if (editorialRoutes.has(path) || sharedPaths.has(path.split('/').slice(2).join('/'))) return true
  if (!slug || extra.length) return false
  if (family === 'games') return games.has(slug)
  if (family === 'play') return SPOTLIGHT_GAMES.some(game => game.playPath === `/play/${slug}`)
  if (family === 'providers') return PROVIDERS.some(provider => provider.id === slug)
  if (family === 'where-to-play') return Boolean(getGame(slug))
  if (family === 'games-like') return Boolean(getGame(slug) || getReferenceReadingList(slug))
  if (family === 'compare') return Boolean(getComparison(slug) || getReferenceComparison(slug))
  if (family === 'best') return Boolean(getGameList(slug))
  if (family === 'operators') return commercial.operators.some(operator => operator.slug === slug)
  return false
}
