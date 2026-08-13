import type { Metadata } from 'next'
import {
  DEFAULT_LOCALE_SEGMENT,
  LOCALE_SEGMENTS,
  isLocaleSegment,
  segmentToOgLocale,
  type LocaleSegment,
} from './locale'

/**
 * Central SEO configuration.
 *
 * LANGUAGE and GEO/MARKET are independent concepts and must be modeled
 * separately here — the same language can serve several distinct markets
 * (e.g. Spanish serves Mexico, Argentina, Colombia, Peru, Chile and Ecuador
 * as separate markets, not one merged "Spanish" SEO surface), and the same
 * market only ever has one primary language today, but that may change.
 *
 * The app now serves real, crawlable locale-prefixed URLs (`/en/...`,
 * `/pt-br/...`, `/es-mx/...` — see `lib/locale.ts`), so every page emits a
 * self-referencing canonical for its own locale plus a fully reciprocal
 * `hreflang` cluster (one entry per supported locale, plus `x-default`
 * pointing at the default locale). GEO/market stays independent of this —
 * it is not part of the URL and never changes what hreflang is emitted.
 *
 * Scaling to dedicated per-MARKET URLs later (e.g. distinguishing `es-mx`
 * from `es-ar`) is a further routing change, not a content change —
 * MARKET_LOCALES below documents the intended language+market pairs so that
 * future routing can key hreflang off of it directly, without ever merging
 * two markets that merely share a language.
 *
 * The site base URL can be overridden with NEXT_PUBLIC_SITE_URL so preview and
 * production deployments produce correct absolute URLs.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.playliva.com'
).replace(/\/$/, '')

export const SITE_NAME = 'PlayLiva'

/** Primary document language + every language locale the interface supports. */
export const PRIMARY_LOCALE = 'pt-BR'
export const SUPPORTED_LOCALES = ['pt-BR', 'es-MX', 'en'] as const

/**
 * Future language x market pairs, kept distinct even when they share a
 * language, for scalable hreflang once per-market URLs exist. Not consumed
 * by routing yet — documentation for the next iteration.
 */
export const MARKET_LOCALES = [
  { market: 'BR', language: 'pt-BR', hreflang: 'pt-BR' },
  { market: 'MX', language: 'es-MX', hreflang: 'es-MX' },
  { market: 'AR', language: 'es-MX', hreflang: 'es-AR' },
  { market: 'CO', language: 'es-MX', hreflang: 'es-CO' },
  { market: 'PE', language: 'es-MX', hreflang: 'es-PE' },
  { market: 'CL', language: 'es-MX', hreflang: 'es-CL' },
  { market: 'EC', language: 'es-MX', hreflang: 'es-EC' },
] as const

/** Neutral, market-agnostic default copy (English fallback for crawlers). */
export const DEFAULT_TITLE = 'PlayLiva — Game Discovery for Your Market'
export const DEFAULT_DESCRIPTION =
  'PlayLiva is an independent game discovery service. Explore popular games, ' +
  'compare similar titles and see where to play them in your market. ' +
  'We do not accept bets or process payments.'

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${clean === '/' ? '' : clean}`
}

/**
 * Standard metadata for a page. `path` is the locale-agnostic path (e.g.
 * `/games/aviator`, no leading locale segment). `localeSegment` is the
 * current page's URL locale segment (from `params.locale` — see
 * `lib/locale.ts`); an unrecognized value falls back to the default locale
 * rather than throwing, since layout-level validation already 404s truly
 * invalid segments before metadata is generated.
 *
 * Sets a self-referencing canonical for the current locale plus a fully
 * reciprocal `hreflang` cluster (every supported locale + `x-default`),
 * so the page is only ever canonicalized to itself.
 */
export function pageMetadata(opts: {
  title?: string
  description?: string
  path: string
  localeSegment: string
  images?: string[]
  /** Set false for template/pre-launch/mock pages that should not be indexed. */
  index?: boolean
}): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path,
    localeSegment,
    images,
    index = true,
  } = opts

  const segment: LocaleSegment = isLocaleSegment(localeSegment)
    ? localeSegment
    : DEFAULT_LOCALE_SEGMENT

  const localizedPath = (forSegment: LocaleSegment) =>
    `/${forSegment}${path === '/' ? '' : path}`

  const languages = Object.fromEntries([
    ...LOCALE_SEGMENTS.map((s) => [s, absoluteUrl(localizedPath(s))]),
    ['x-default', absoluteUrl(localizedPath(DEFAULT_LOCALE_SEGMENT))],
  ])

  const alternateLocales = LOCALE_SEGMENTS.filter((s) => s !== segment).map(
    segmentToOgLocale,
  )

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(localizedPath(segment)),
      languages,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: title ?? DEFAULT_TITLE,
      description,
      url: absoluteUrl(localizedPath(segment)),
      locale: segmentToOgLocale(segment),
      alternateLocale: alternateLocales,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: title ?? DEFAULT_TITLE,
      description,
      ...(images ? { images } : {}),
    },
  }
}
