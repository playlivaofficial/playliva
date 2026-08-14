import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAMES, getGame } from '@/lib/data'
import { GamesLikeView } from '@/components/games-like-view'
import { getGameContent } from '@/lib/content'
import { getGameOgImage } from '@/lib/game-artwork'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

export function generateStaticParams() {
  return GAMES.filter((g) => g.relatedGameIds.length > 0).map((g) => ({
    slug: g.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
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
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = getGame(slug)
  if (!game) notFound()
  return <GamesLikeView game={game} />
}
