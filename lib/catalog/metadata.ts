import { DEFAULT_LOCALE_SEGMENT, isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { catalogCopy } from './copy'
import { getReferenceGame, getReferenceProvider } from './index'
import { getReferenceComparison, getReferenceReadingList } from './editorial'

export const catalogLocale = (segment: string) => segmentToLocale(isLocaleSegment(segment) ? segment : DEFAULT_LOCALE_SEGMENT)
export function referenceMetadata(kind: 'games' | 'games-like' | 'compare' | 'providers', slug: string, segment: string) {
  const locale = catalogLocale(segment), c = catalogCopy(locale)
  if (kind === 'games') {
    const game = getReferenceGame(slug)
    if (game) return pageMetadata({ title: `${game.title} — ${c.details}`, description: game.content[locale].summary, path: `/games/${slug}`, localeSegment: segment })
  }
  if (kind === 'games-like') {
    const list = getReferenceReadingList(slug), game = getReferenceGame(slug)
    if (list && game) return pageMetadata({ title: `${c.similar} ${game.title} — ${c.related}`, description: list.intro[locale], path: `/games-like/${slug}`, localeSegment: segment })
  }
  if (kind === 'compare') {
    const item = getReferenceComparison(slug)
    if (item) return pageMetadata({ title: `${getReferenceGame(item.a)!.title} vs ${getReferenceGame(item.b)!.title} — ${c.features}`, description: item.shared[locale], path: `/compare/${slug}`, localeSegment: segment })
  }
  if (kind === 'providers') {
    const provider = getReferenceProvider(slug)
    if (provider) return pageMetadata({ title: `${provider.name} — ${c.collection}`, description: provider.overview[locale], path: `/providers/${slug}`, localeSegment: segment })
  }
  return undefined
}
