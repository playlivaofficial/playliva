import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { COMPARISONS, getComparison, getGameById } from '@/lib/data'
import { getComparisonContent } from '@/lib/content'
import { ComparisonView } from '@/components/comparison-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
  const comparison = getComparison(slug)
  if (!comparison) return { title: 'Game Comparison Not Found' }
  const a = getGameById(comparison.gameAId)
  const b = getGameById(comparison.gameBId)
  // Description copy must match the page's own LANGUAGE (URL locale
  // segment), never a fixed default.
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const content = getComparisonContent(comparison, locale)
  return pageMetadata({
    title: content.seo?.title ?? `${a?.title} vs ${b?.title} — Game Comparison`,
    description: content.seo?.description ?? content.intro,
    path: `/compare/${comparison.slug}`,
    localeSegment,
  })
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) notFound()
  return <ComparisonView comparison={comparison} />
}
