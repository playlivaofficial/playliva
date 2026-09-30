import { CrossDiscovery } from '@/components/discovery/related'
import { JsonLd } from '@/components/json-ld'
import { entitySchema } from '@/lib/discovery/schema'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAMES, getGame } from '@/lib/data'
import { getGameContent, getCategoryName } from '@/lib/content'
import { GameDetailView } from '@/components/game-detail-view'
import { pageMetadata } from '@/lib/discovery/seo'
import { getGameOgImage } from '@/lib/game-artwork'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'
import { REFERENCE_GAMES, getReferenceGame } from '@/lib/catalog'
import { ReferenceGameView } from '@/components/catalog/reference-views'
import { catalogLocale, referenceMetadata } from '@/lib/catalog/metadata'
import { applySearchTitle } from '@/lib/owner/server/search-metadata'

export function generateStaticParams() {
  return [...GAMES, ...REFERENCE_GAMES].map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
  const reference = referenceMetadata('games', slug, localeSegment)
  if (reference) return applySearchTitle(reference)
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
  const seoOverride = content.seo?.game
  return applySearchTitle(pageMetadata({
    title: seoOverride?.title ?? `${game.title} — ${categoryName}`,
    description:
      seoOverride?.description ??
      `${content.description} ${t('seo.gameDescriptionSuffix', { game: game.title })}`,
    path: `/games/${game.slug}`,
    localeSegment,
    images: getGameOgImage(game),
  }))
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const reference = getReferenceGame(slug)
  if (reference) return <><JsonLd data={entitySchema(slug, isLocaleSegment(locale) ? locale : DEFAULT_LOCALE_SEGMENT)!} /><ReferenceGameView game={reference} locale={catalogLocale(locale)} /><CrossDiscovery slug={slug} segment={locale}/></>
  const game = getGame(slug)
  if (!game) notFound()
  return <><JsonLd data={entitySchema(slug, isLocaleSegment(locale) ? locale : DEFAULT_LOCALE_SEGMENT)!} /><GameDetailView game={game} /><CrossDiscovery slug={slug} segment={locale}/></>
}
