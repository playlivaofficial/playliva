import type { Metadata } from 'next'
import {
  DEFAULT_LOCALE_SEGMENT,
  LOCALE_SEGMENTS,
  isLocaleSegment,
  segmentToOgLocale,
  type LocaleSegment,
} from './locale'
import { seoImagesForPath } from './seo-images'
import { regionalEditorialIndexable, X_DEFAULT_LOCALE_SEGMENT } from './regional-seo-policy'
import { geoEditorialMetadata } from './geo-editorial'
import { segmentToLocale } from './locale'

/** Canonicals describe URL content, independently of trusted commercial GEO.
 * Five locale routes share catalog/game strings. Only distinct regional intent
 * enters reciprocal hreflang/sitemap clusters; pending commercial pages stay
 * noindex. Historical PT-BR content remains available, with English x-default. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.playliva.com'
).replace(/\/$/, '')

export const SITE_NAME = 'PlayLiva'

/** Primary document language + every language locale the interface supports. */
export const PRIMARY_LOCALE = 'pt-BR'
export const SUPPORTED_LOCALES = ['pt-BR', 'es-MX', 'es-CO', 'es-PE', 'en'] as const

/**
 * Current commercial target locales. This list never grants affiliate eligibility.
 */
export const MARKET_LOCALES = [
  { market: 'MX', language: 'es-MX', hreflang: 'es-MX' },
  { market: 'CO', language: 'es-CO', hreflang: 'es-CO' },
  { market: 'PE', language: 'es-PE', hreflang: 'es-PE' },
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
  /** Locale variants that represent the same indexable intent. */
  alternateLocaleSegments?: readonly LocaleSegment[]
  /** Include x-default only when the default locale is a valid equivalent. */
  includeXDefault?: boolean
}): Metadata {
  const {
    title: inputTitle,
    description: inputDescription = DEFAULT_DESCRIPTION,
    path,
    localeSegment,
    images,
    index: inputIndex = true,
    alternateLocaleSegments: inputAlternates = LOCALE_SEGMENTS,
    includeXDefault = true,
  } = opts

  const segment: LocaleSegment = isLocaleSegment(localeSegment)
    ? localeSegment
    : DEFAULT_LOCALE_SEGMENT
  const index = inputIndex && regionalEditorialIndexable(path, segment)
  const alternateLocaleSegments = index ? inputAlternates.filter(s => regionalEditorialIndexable(path, s)) : []
  const regionalCopy = geoEditorialMetadata(path, segmentToLocale(segment))
  const title = regionalCopy?.title ?? inputTitle
  const description = regionalCopy?.description ?? inputDescription

  const localizedPath = (forSegment: LocaleSegment) =>
    `/${forSegment}${path === '/' ? '' : path}`

  const languages = Object.fromEntries([
    ...alternateLocaleSegments.map((s) => [s, absoluteUrl(localizedPath(s))]),
    ...(includeXDefault && alternateLocaleSegments.includes(X_DEFAULT_LOCALE_SEGMENT)
      ? [['x-default', absoluteUrl(localizedPath(X_DEFAULT_LOCALE_SEGMENT))]]
      : []),
  ])

  const alternateLocales = alternateLocaleSegments.filter((s) => s !== segment).map(
    segmentToOgLocale,
  )
  const resolvedImages = images ?? seoImagesForPath(path)
  const cleanTitle = title?.replace(/(?:\s*[|—–-]\s*PlayLiva)+\s*$/i, '').trim()

  return {
    title: cleanTitle && /\bPlayLiva\b/i.test(cleanTitle) ? { absolute: cleanTitle } : cleanTitle,
    description,
    alternates: {
      canonical: absoluteUrl(localizedPath(segment)),
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } }
      : { index: false, follow: true, googleBot: { index: false, follow: true } },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: cleanTitle ?? DEFAULT_TITLE,
      description,
      url: absoluteUrl(localizedPath(segment)),
      locale: segmentToOgLocale(segment),
      alternateLocale: alternateLocales,
      ...(resolvedImages ? { images: resolvedImages } : {}),
    },
    twitter: {
      card: resolvedImages ? 'summary_large_image' : 'summary',
      title: cleanTitle ?? DEFAULT_TITLE,
      description,
      ...(resolvedImages ? { images: resolvedImages } : {}),
    },
  }
}
