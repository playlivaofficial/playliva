import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAMES, getGame } from '@/lib/data'
import { getGameContent, getCategoryName } from '@/lib/content'
import { GameDetailView } from '@/components/game-detail-view'
import { pageMetadata } from '@/lib/seo'
import { getGameOgImage } from '@/lib/game-artwork'
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
  if (!game) return { title: 'Game not found', robots: { index: false } }
  // Metadata copy must match the page's own LANGUAGE (URL locale segment),
  // never a fixed default — game title/brand stays as-is either way.
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  const content = getGameContent(game, locale)
  const categoryName = getCategoryName(game.category, locale)
  return pageMetadata({
    title: `${game.title} — ${categoryName}`,
    description: `${content.description} ${t('seo.gameDescriptionSuffix', { game: game.title })}`,
    path: `/games/${game.slug}`,
    localeSegment,
    images: getGameOgImage(game),
  })
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const game = getGame(slug)
  if (!game) notFound()
  return <GameDetailView game={game} />
}
