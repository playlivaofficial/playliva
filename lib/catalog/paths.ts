import { REFERENCE_GAMES } from './games'
import { PROVIDERS } from './providers'
import { REFERENCE_COMPARISONS, REFERENCE_READING_LISTS } from './editorial'

// Explicitly enumerated reference routes. Never generate /where-to-play here.
export const REFERENCE_PATHS = [
  ...REFERENCE_GAMES.map(game => `/games/${game.slug}`),
  ...REFERENCE_READING_LISTS.map(list => `/games-like/${list.slug}`),
  ...REFERENCE_COMPARISONS.map(item => `/compare/${item.slug}`),
  '/providers',
  ...PROVIDERS.map(provider => `/providers/${provider.id}`),
]
