import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAMES, getGame } from '@/lib/data'
import { getGameContent } from '@/lib/content'
import { WhereToPlayView } from '@/components/where-to-play-view'
import { getGameOgImage } from '@/lib/game-artwork'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
  const game = getGame(slug)
  if (!game) return { title: 'Not Found', robots: { index: false } }
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  // gameType is a localized editorial label (e.g. "crash"), not the GEO.
  const gameType = getGameContent(game, locale).gameType
  return pageMetadata({
    title: t('seo.whereToPlayTitle', { game: game.title }),
    description: t('seo.whereToPlayDescription', {
      game: game.title,
      gameType,
    }),
    path: `/where-to-play/${game.slug}`,
    localeSegment,
    images: getGameOgImage(game),
  })
}

export default async function WhereToPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = getGame(slug)
  if (!game) notFound()
  return <WhereToPlayView game={game} />
}
