import { discoveryIndexability } from '@/lib/discovery/indexability'
import type { MetadataRoute } from 'next'
import {
  GAMES,
  COMPARISONS,
  GAME_LISTS,
  getPublicOperators,
} from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'
import { REFERENCE_PATHS } from '@/lib/catalog/paths'
import { DEFAULT_LOCALE_SEGMENT, LOCALE_SEGMENTS, type LocaleSegment } from '@/lib/locale'
import { editorialRecord } from '@/lib/editorial'
import {
  isGameListIndexableForLocale,
  whereToPlayLocaleSegments,
} from '@/lib/seo-market'

/**
 * Only public, indexable URLs belong in the sitemap. Mock / pre-launch
 * operators are excluded — they are hidden behind empty states in the UI and
 * marked noindex, so surfacing them here would contradict that.
 *
 * Every resource is now served under a real `/{locale}` URL for each
 * supported locale (see `lib/locale.ts`), so each logical page produces one
 * sitemap entry per locale, and each entry's `alternates.languages` lists
 * every locale variant (including `x-default`) — mirroring the reciprocal
 * hreflang cluster emitted by `pageMetadata()` in `lib/seo.ts`.
 */
function localizedEntry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  segments: readonly LocaleSegment[] = LOCALE_SEGMENTS,
): MetadataRoute.Sitemap {
  const localizedPath = (segment: LocaleSegment) =>
    `/${segment}${path === '/' ? '' : path}`

  segments = segments.filter(segment => discoveryIndexability(path, segment).index)
  const languages = Object.fromEntries([
    ...segments.map((s) => [s, absoluteUrl(localizedPath(s))]),
    ...(segments.includes(DEFAULT_LOCALE_SEGMENT)
      ? [['x-default', absoluteUrl(localizedPath(DEFAULT_LOCALE_SEGMENT))]]
      : []),
  ])

  return segments.map((segment) => ({
    url: absoluteUrl(localizedPath(segment)),
    ...(editorialRecord(path)?.updatedAt ? { lastModified: editorialRecord(path)!.updatedAt } : {}),
    changeFrequency,
    priority,
    alternates: { languages },
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths: Array<{ path: string; priority: number }> = [
    { path: '/', priority: 1 },
    { path: '/games', priority: 0.9 },
    { path: '/play', priority: 0.8 },
    { path: '/play/avia-de-janeiro', priority: 0.8 },
    { path: '/play/crash', priority: 0.8 },
    { path: '/play/liva-ginga', priority: 0.8 },
    { path: '/play/capybara-gold', priority: 0.8 },
    { path: '/play/golaco', priority: 0.8 },
    { path: '/play/samba-drop', priority: 0.8 },
    { path: '/play/skuptu-levanta', priority: 0.8 },
    { path: '/play/carnaval-gold', priority: 0.8 },
    { path: '/play/blackjack', priority: 0.8 },
    { path: '/play/roulette', priority: 0.8 },
    { path: '/play/liva-raio', priority: 0.8 },
    { path: '/play/liva-21-brasil', priority: 0.8 },
    { path: '/play/mines', priority: 0.8 },
    { path: '/offers', priority: 0.7 },
    { path: '/operators', priority: 0.6 },
    { path: '/crash', priority: 0.7 },
    { path: '/best/crash-games', priority: 0.7 },
    { path: '/slots', priority: 0.7 },
    { path: '/live-casino', priority: 0.7 },
    { path: '/table-games', priority: 0.7 },
    { path: '/instant-games', priority: 0.7 },
    // Sports archive URLs remain accessible but noindex and outside the sitemap.
    { path: '/about', priority: 0.4 },
    { path: '/editorial-policy', priority: 0.4 },
    { path: '/authors/playliva', priority: 0.3 },
    { path: '/responsible-gaming', priority: 0.5 },
    { path: '/contact', priority: 0.3 },
    // terms / privacy-policy / cookie-policy are noindex template pages and
    // are intentionally excluded until legally reviewed.
    { path: '/affiliate-disclosure', priority: 0.2 },
  ]

  const entries: MetadataRoute.Sitemap = staticPaths.flatMap((p) =>
    localizedEntry(p.path, 'weekly', p.priority),
  )

  for (const game of GAMES) {
    entries.push(...localizedEntry(`/games/${game.slug}`, 'weekly', 0.8))
    entries.push(...localizedEntry(`/games-like/${game.slug}`, 'weekly', 0.6))
    entries.push(...localizedEntry(
      `/where-to-play/${game.slug}`,
      'weekly',
      0.6,
      whereToPlayLocaleSegments(game),
    ))
  }

  for (const comparison of COMPARISONS) {
    entries.push(...localizedEntry(`/compare/${comparison.slug}`, 'weekly', 0.6))
  }

  for (const list of GAME_LISTS) {
    const segments = LOCALE_SEGMENTS.filter((segment) =>
      isGameListIndexableForLocale(list, segment),
    )
    entries.push(...localizedEntry(`/best/${list.slug}`, 'weekly', 0.7, segments))
  }

  // Only verified (non-mock) operator profiles are indexable.
  for (const operator of getPublicOperators()) {
    entries.push(...localizedEntry(`/operators/${operator.slug}`, 'monthly', 0.5))
  }

  // M11 neutral reference pages do not extend commercial availability routes.
  for (const path of REFERENCE_PATHS) {
    entries.push(...localizedEntry(path, 'monthly', 0.6))
  }
  return entries
}
