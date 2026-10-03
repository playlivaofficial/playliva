import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAMES, getGame } from '@/lib/data'
import { getGameContent } from '@/lib/content'
import { WhereToPlayView } from '@/components/where-to-play-view'
import { getGameOgImage } from '@/lib/game-artwork'
import { pageMetadata } from '@/lib/seo'
import { publishedWhereToPlayLocales } from '@/lib/commercial/seo'
import { geoEditorial } from '@/lib/geo-editorial'
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
  const segment = isLocaleSegment(localeSegment)
    ? localeSegment
    : DEFAULT_LOCALE_SEGMENT
  const eligibleSegments = publishedWhereToPlayLocales(game)
  const indexable = eligibleSegments.includes(segment)
  const country = geoEditorial(locale)
  const t = createTranslator(locale)
  const gc = getGameContent(game, locale)
  // gameType is a localized editorial label (e.g. "crash"), not the GEO.
  const gameType = gc.gameType
  const seoOverride = gc.seo?.whereToPlay
  return pageMetadata({
    title: country ? `Dónde jugar ${game.title} en ${country.name}` : seoOverride?.title ?? t('seo.whereToPlayTitle', { game: game.title }),
    description:
      (country ? `Guía de ${game.title} para ${country.name}: mecánicas de ${game.provider}, moneda ${country.currency} y comprobaciones de disponibilidad. Solo destinos con evidencia para este país.` : seoOverride?.description) ??
      t('seo.whereToPlayDescription', {
        game: game.title,
        gameType,
      }),
    path: `/where-to-play/${game.slug}`,
    localeSegment,
    images: getGameOgImage(game),
    index: indexable,
    alternateLocaleSegments: indexable ? eligibleSegments : [],
    includeXDefault: indexable && eligibleSegments.includes(DEFAULT_LOCALE_SEGMENT),
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
