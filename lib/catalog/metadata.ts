import { contentLocale } from '@/lib/locale'
import { DEFAULT_LOCALE_SEGMENT, isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/discovery/seo'
import { catalogCopy } from './copy'
import { getReferenceGame, getReferenceProvider, REFERENCE_GAMES } from './index'
import { getReferenceComparison, getReferenceReadingList } from './editorial'

export const catalogLocale = (segment: string) => segmentToLocale(isLocaleSegment(segment) ? segment : DEFAULT_LOCALE_SEGMENT)
const referenceImage = (slug: string): string[] | undefined => {
  const game = getReferenceGame(slug)
  return game && game.artwork.status !== 'fallback' && game.artwork.assetPath
    ? [game.artwork.assetPath]
    : undefined
}
export function referenceMetadata(kind: 'games' | 'games-like' | 'compare' | 'providers', slug: string, segment: string) {
  const locale = catalogLocale(segment), c = catalogCopy(locale)
  if (kind === 'games') {
    const game = getReferenceGame(slug)
    if (game) {
      const ptBrSeo: Record<string, { title: string }> = {
        'dream-catcher': {
          title: 'Dream Catcher: Como Funciona a Roda ao Vivo | PlayLiva',
        },
        'monopoly-live': {
          title: 'MONOPOLY Live: Como Funciona o Game Show | PlayLiva',
        },
      }
      const override = locale === 'pt-BR' ? ptBrSeo[slug] : undefined
      return pageMetadata({ title: override?.title ?? `${game.title} — ${c.details}`, description: game.content[contentLocale(locale)].summary, path: `/games/${slug}`, localeSegment: segment, images: referenceImage(slug) })
    }
  }
  if (kind === 'games-like') {
    const list = getReferenceReadingList(slug), game = getReferenceGame(slug)
    if (list && game) return pageMetadata({ title: `${c.similar} ${game.title} — ${c.related}`, description: list.intro[contentLocale(locale)], path: `/games-like/${slug}`, localeSegment: segment, images: referenceImage(slug) })
  }
  if (kind === 'compare') {
    const item = getReferenceComparison(slug)
    if (item) return pageMetadata({ title: `${getReferenceGame(item.a)!.title} vs ${getReferenceGame(item.b)!.title} — ${c.features}`, description: item.shared[contentLocale(locale)], path: `/compare/${slug}`, localeSegment: segment, images: referenceImage(item.a) })
  }
  if (kind === 'providers') {
    const provider = getReferenceProvider(slug)
    if (provider) {
      const firstGame = REFERENCE_GAMES.find((game) => game.providerId === provider.id && game.artwork.status !== 'fallback')
      const title = locale === 'pt-BR' && provider.id === 'pragmatic-play'
        ? 'Jogos da Pragmatic Play: Catálogo e Mecânicas | PlayLiva'
        : locale === 'pt-BR' && provider.id === 'evolution'
          ? 'Jogos da Evolution: Cassino ao Vivo e Game Shows | PlayLiva'
          : `${provider.name} — ${c.collection}`
      return pageMetadata({ title, description: provider.overview[contentLocale(locale)], path: `/providers/${slug}`, localeSegment: segment, images: firstGame ? referenceImage(firstGame.slug) : undefined })
    }
  }
  return undefined
}
