import { AlternativeFormats } from '@/components/discovery/alternatives'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAMES, getGame } from '@/lib/data'
import { GamesLikeView } from '@/components/games-like-view'
import { getGameContent } from '@/lib/content'
import { getGameOgImage } from '@/lib/game-artwork'
import { pageMetadata } from '@/lib/discovery/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'
import { REFERENCE_READING_LISTS, getReferenceReadingList } from '@/lib/catalog/editorial'
import { ReferenceReadingView } from '@/components/catalog/reference-views'
import { catalogLocale, referenceMetadata } from '@/lib/catalog/metadata'

export function generateStaticParams() {
  return [...GAMES.filter((g) => g.relatedGameIds.length > 0), ...REFERENCE_READING_LISTS].map((g) => ({
    slug: g.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
  const reference = referenceMetadata('games-like', slug, localeSegment)
  if (reference) return reference
  const game = getGame(slug)
  if (!game) return { title: 'Games Like — Not Found', robots: { index: false } }
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  const seoOverride = getGameContent(game, locale).seo?.gamesLike
  return pageMetadata({
    title: seoOverride?.title ?? t('seo.gamesLikeTitle', { game: game.title }),
    description:
      seoOverride?.description ??
      t('seo.gamesLikeDescription', { game: game.title }),
    path: `/games-like/${game.slug}`,
    localeSegment,
    images: getGameOgImage(game),
  })
}

export default async function GamesLikePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const reference = getReferenceReadingList(slug)
  if (reference) return <ReferenceReadingView list={reference} locale={catalogLocale(locale)} />
  const game = getGame(slug)
  if (!game) notFound()
  return <><GamesLikeView game={game} /><AlternativeFormats slug={slug} segment={locale}/></>
}
