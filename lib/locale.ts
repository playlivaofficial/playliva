import type { ContentLocale, Locale } from './types'
import { getGeoConfig } from './geo'

/** Actual locale routes. Regional Spanish reuses shared strings, with explicit
 * country editorial/monetary context. A locale never grants commercial GEO. */
export const LOCALE_SEGMENTS = ['en', 'pt-br', 'es-mx', 'es-co', 'es-pe'] as const

export type LocaleSegment = (typeof LOCALE_SEGMENTS)[number]

/** Matches `DEFAULT_LOCALE` ('pt-BR') in `lib/i18n.ts`. */
export const DEFAULT_LOCALE_SEGMENT: LocaleSegment = 'pt-br'

export const SEGMENT_TO_LOCALE: Record<LocaleSegment, Locale> = {
  en: 'en',
  'pt-br': 'pt-BR',
  'es-mx': 'es-MX',
  'es-co': 'es-CO',
  'es-pe': 'es-PE',
}

export const LOCALE_TO_SEGMENT: Record<Locale, LocaleSegment> = {
  en: 'en',
  'pt-BR': 'pt-br',
  'es-MX': 'es-mx',
  'es-CO': 'es-co',
  'es-PE': 'es-pe',
}

/** Open Graph locale identifiers (underscore-separated) per URL segment. */
const SEGMENT_TO_OG_LOCALE: Record<LocaleSegment, string> = {
  en: 'en_US',
  'pt-br': 'pt_BR',
  'es-mx': 'es_MX',
  'es-co': 'es_CO',
  'es-pe': 'es_PE',
}

/** Shared editorial/game strings; the actual URL locale and request GEO stay distinct. */
export function contentLocale(locale: Locale): ContentLocale {
  return locale === 'es-CO' || locale === 'es-PE' ? 'es-MX' : locale
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
  fallback: LocaleSegment = DEFAULT_LOCALE_SEGMENT,
  regionalSpanish: LocaleSegment = 'es-mx',
): LocaleSegment {
  if (!acceptLanguage) return fallback
  const preferred = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [language, ...parameters] = part.trim().toLowerCase().split(';')
      const quality = parameters.find(parameter => parameter.trim().startsWith('q='))
      return { language, weight: quality ? Number(quality.trim().slice(2)) : 1, index }
    })
    .filter(({ weight }) => Number.isFinite(weight) && weight > 0 && weight <= 1)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)

  for (const { language: lang } of preferred) {
    if (lang === 'es-mx' || lang.startsWith('es-mx-')) return 'es-mx'
    if (lang === 'es-co' || lang.startsWith('es-co-')) return 'es-co'
    if (lang === 'es-pe' || lang.startsWith('es-pe-')) return 'es-pe'
    if (lang === 'en' || lang.startsWith('en-')) return 'en'
    if (lang === 'pt' || lang.startsWith('pt-')) return 'pt-br'
    if (lang === 'es' || lang.startsWith('es-')) return regionalSpanish
  }
  return fallback
}

/** First-visit presentation only. GEO remains independently verified by the
 * commercial layer; a language preference never enables a market or operator. */
export function detectRootLocaleSegment({ cookieLocale, acceptLanguage, country }: {
  cookieLocale?: string | null
  acceptLanguage: string | null
  country: string | null
}): LocaleSegment {
  if (cookieLocale && isLocaleSegment(cookieLocale)) return cookieLocale
  const normalizedCountry = country?.trim().toUpperCase()
  const market = getGeoConfig(normalizedCountry)
  const fallback = market ? localeToSegment(market.locale) : normalizedCountry === 'BR' ? 'pt-br' : 'en'
  return detectLocaleSegmentFromAcceptLanguage(acceptLanguage, fallback, market ? fallback : 'es-mx')
}
