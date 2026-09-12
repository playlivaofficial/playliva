import type { Locale } from './types'

/**
 * URL path segments for the locales the site serves at real, crawlable
 * locale-prefixed URLs (`/en/...`, `/pt-br/...`, `/es-mx/...`).
 *
 * Future GEO-only locales (e.g. `es-ar`, `es-co`, `pt-pt`) are intentionally
 * NOT added here — GEO/market selection stays independent of language and
 * continues to work across all three URL locales, matching the doc-only
 * `MARKET_LOCALES` pattern in `lib/seo.ts`. Only add a new segment here once
 * that language actually ships its own dictionary in `lib/i18n.ts`.
 */
export const LOCALE_SEGMENTS = ['en', 'pt-br', 'es-mx'] as const

export type LocaleSegment = (typeof LOCALE_SEGMENTS)[number]

/** Matches `DEFAULT_LOCALE` ('pt-BR') in `lib/i18n.ts`. */
export const DEFAULT_LOCALE_SEGMENT: LocaleSegment = 'pt-br'

export const SEGMENT_TO_LOCALE: Record<LocaleSegment, Locale> = {
  en: 'en',
  'pt-br': 'pt-BR',
  'es-mx': 'es-MX',
}

export const LOCALE_TO_SEGMENT: Record<Locale, LocaleSegment> = {
  en: 'en',
  'pt-BR': 'pt-br',
  'es-MX': 'es-mx',
}

/** Open Graph locale identifiers (underscore-separated) per URL segment. */
const SEGMENT_TO_OG_LOCALE: Record<LocaleSegment, string> = {
  en: 'en_US',
  'pt-br': 'pt_BR',
  'es-mx': 'es_MX',
}

export function isLocaleSegment(value: string): value is LocaleSegment {
  return (LOCALE_SEGMENTS as readonly string[]).includes(value)
}

export function segmentToLocale(segment: LocaleSegment): Locale {
  return SEGMENT_TO_LOCALE[segment]
}

export function localeToSegment(locale: Locale): LocaleSegment {
  return LOCALE_TO_SEGMENT[locale]
}

export function segmentToOgLocale(segment: LocaleSegment): string {
  return SEGMENT_TO_OG_LOCALE[segment]
}

/**
 * Replaces the first path segment of `pathname` with `newSegment`, assuming
 * `pathname` is already locale-prefixed (e.g. `/en/games/aviator`). Used by
 * the language selector to preserve the current logical page when switching
 * locales.
 */
export function swapLocaleInPath(pathname: string, newSegment: LocaleSegment): string {
  const parts = pathname.split('/')
  // parts[0] is '' (leading slash), parts[1] is the current locale segment.
  if (parts.length > 1 && isLocaleSegment(parts[1])) {
    parts[1] = newSegment
    return parts.join('/') || '/'
  }
  // Not locale-prefixed (shouldn't normally happen post-migration) — just
  // prefix it.
  return `/${newSegment}${pathname === '/' ? '' : pathname}`
}

/**
 * Removes the leading `/{locale}` segment from a pathname, returning the
 * locale-agnostic path (e.g. `/en/games/aviator` → `/games/aviator`,
 * `/pt-br` → `/`). Used for "is this nav item active" checks and other
 * comparisons that should ignore which locale is currently active.
 */
export function stripLocaleFromPath(pathname: string): string {
  const parts = pathname.split('/')
  if (parts.length > 1 && isLocaleSegment(parts[1])) {
    const rest = `/${parts.slice(2).join('/')}`
    return rest === '/' ? '/' : rest.replace(/\/$/, '') || '/'
  }
  return pathname
}

export function localizedPath(path: string, segment: LocaleSegment): string {
  if (isLocaleSegment(path.split('/')[1] ?? '')) return path
  return `/${segment}${path === '/' ? '' : path}`
}

/** Best-effort Accept-Language header parsing → nearest supported segment. */
export function detectLocaleSegmentFromAcceptLanguage(
  acceptLanguage: string | null,
): LocaleSegment {
  if (!acceptLanguage) return DEFAULT_LOCALE_SEGMENT
  const preferred = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())

  for (const lang of preferred) {
    if (lang.startsWith('en')) return 'en'
    if (lang.startsWith('pt')) return 'pt-br'
    if (lang.startsWith('es')) return 'es-mx'
  }
  return DEFAULT_LOCALE_SEGMENT
}
