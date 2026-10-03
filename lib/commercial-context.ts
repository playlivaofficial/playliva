import type { PageType } from './tracking'
import { isLocaleSegment, segmentToLocale } from './locale'

/** Public editorial context only; never an affiliate destination or private ID. */
export function commercialContext(path: string, placement = '') {
  const [segment, family, slug] = path.split('?')[0].split('/').filter(Boolean)
  const language = isLocaleSegment(segment) ? segmentToLocale(segment) : 'en'
  const pageType: PageType = !family ? 'home' : family === 'play' ? 'play' : family === 'games' ? slug ? 'game' : 'games'
    : family === 'providers' ? 'provider' : family === 'games-like' ? 'games_like'
      : family === 'compare' ? 'comparison' : family === 'where-to-play' ? 'where_to_play'
        : ['crash', 'slots', 'live-casino', 'instant-games', 'table-games', 'arcade'].includes(family) ? 'category'
          : family === 'best' ? 'best_list' : family === 'operators' ? slug ? 'operator' : 'operators'
            : family === 'offers' ? 'offers' : 'content'
  const taxonomy = placement === 'originals_engagement_offer' ? 'playliva_original_popup'
    : pageType === 'play' && slug ? 'playliva_original_sponsor'
      : ({ game: 'playliva_real_game', where_to_play: 'playliva_where_to_play', comparison: 'playliva_comparison',
        games_like: 'playliva_games_like', category: 'playliva_category', provider: 'playliva_provider' } as Record<string, string>)[pageType] ?? 'playliva_banner'
  return { language, pageType, pageSlug: slug ?? family, taxonomy,
    ...(['game', 'play', 'games_like', 'where_to_play'].includes(pageType) && slug ? { gameSlug: slug } : {}),
    ...(pageType === 'provider' && slug ? { provider: slug } : {}),
    ...(pageType === 'category' ? { category: family } : {}) }
}
