import type { LocaleSegment } from './locale'

/** Only these new regional pages currently contain a dedicated country guide.
 * Shared game/rules translations remain available without expanding the index. */
export const REGIONAL_EDITORIAL_PATHS = ['/', '/games'] as const
export function regionalEditorialIndexable(path: string, segment: LocaleSegment): boolean {
  return !['es-co', 'es-pe'].includes(segment) || (REGIONAL_EDITORIAL_PATHS as readonly string[]).includes(path)
    || path === '/offers' || path === '/operators'
    || path.startsWith('/where-to-play/') || path.startsWith('/operators/')
}

export const X_DEFAULT_LOCALE_SEGMENT: LocaleSegment = 'en'
