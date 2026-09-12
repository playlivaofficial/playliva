import type { MetadataRoute } from 'next'
import {
  GAMES,
  COMPARISONS,
  GAME_LISTS,
  getPublicOperators,
} from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'
import { DEFAULT_LOCALE_SEGMENT, LOCALE_SEGMENTS, type LocaleSegment } from '@/lib/locale'

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
  now: Date,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
): MetadataRoute.Sitemap {
  const localizedPath = (segment: LocaleSegment) =>
    `/${segment}${path === '/' ? '' : path}`

  const languages = Object.fromEntries([
    ...LOCALE_SEGMENTS.map((s) => [s, absoluteUrl(localizedPath(s))]),
    ['x-default', absoluteUrl(localizedPath(DEFAULT_LOCALE_SEGMENT))],
  ])

  return LOCALE_SEGMENTS.map((segment) => ({
    url: absoluteUrl(localizedPath(segment)),
    lastModified: now,
    changeFrequency,
    priority,
    alternates: { languages },
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPaths: Array<{ path: string; priority: number }> = [
    { path: '/', priority: 1 },
    { path: '/games', priority: 0.9 },
    { path: '/play', priority: 0.8 },
    { path: '/play/crash', priority: 0.8 },
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
    { path: '/responsible-gaming', priority: 0.5 },
    { path: '/contact', priority: 0.3 },
    // terms / privacy-policy / cookie-policy are noindex template pages and
    // are intentionally excluded until legally reviewed.
    { path: '/affiliate-disclosure', priority: 0.2 },
  ]

  const entries: MetadataRoute.Sitemap = staticPaths.flatMap((p) =>
    localizedEntry(p.path, now, 'weekly', p.priority),
  )

  for (const game of GAMES) {
    entries.push(...localizedEntry(`/games/${game.slug}`, now, 'weekly', 0.8))
    entries.push(...localizedEntry(`/games-like/${game.slug}`, now, 'weekly', 0.6))
    entries.push(...localizedEntry(`/where-to-play/${game.slug}`, now, 'weekly', 0.6))
  }

  for (const comparison of COMPARISONS) {
    entries.push(...localizedEntry(`/compare/${comparison.slug}`, now, 'weekly', 0.6))
  }

  for (const list of GAME_LISTS) {
    entries.push(...localizedEntry(`/best/${list.slug}`, now, 'weekly', 0.7))
  }

  // Only verified (non-mock) operator profiles are indexable.
  for (const operator of getPublicOperators()) {
    entries.push(...localizedEntry(`/operators/${operator.slug}`, now, 'monthly', 0.5))
  }

  return entries
}
