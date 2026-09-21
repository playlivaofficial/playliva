import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGameList, getGameById } from '@/lib/data'
import { getGameListContent } from '@/lib/content'
import { BestListView } from '@/components/best-list-view'
import { GAME_LISTS } from '@/lib/data'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { isGameListIndexableForLocale } from '@/lib/seo-market'
import { getGameOgImage } from '@/lib/game-artwork'

export function generateStaticParams() {
  return GAME_LISTS.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
  const list = getGameList(slug)
  if (!list) return { title: 'List Not Found | PlayLiva' }
  // SEO copy must match the page's own LANGUAGE (URL locale segment), never
  // a fixed default — GEO (list.country) stays exactly as authored either way.
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const segment = isLocaleSegment(localeSegment)
    ? localeSegment
    : DEFAULT_LOCALE_SEGMENT
  const indexable = isGameListIndexableForLocale(list, segment)
  const content = getGameListContent(list, locale)
  return pageMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: `/best/${list.slug}`,
    localeSegment,
    index: indexable,
    alternateLocaleSegments: indexable ? [segment] : [],
    includeXDefault: false,
    images: getGameOgImage(getGameById(list.gameIds[0])!),
  })
}

export default async function BestListPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const list = getGameList(slug)
  if (!list) notFound()
  return <BestListView list={list} />
}
