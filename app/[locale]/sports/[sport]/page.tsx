import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SPORTS, getSport } from '@/lib/sports-data'
import { SportView } from '@/components/sports/sport-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

export function generateStaticParams() {
  return SPORTS.map((s) => ({ sport: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; locale: string }>
}): Promise<Metadata> {
  const { sport, locale: localeSegment } = await params
  const found = getSport(sport)
  if (!found) return { title: 'Sport not found', robots: { index: false } }
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  const sportName = t(`sports.sport.${found.slug}`)
  return pageMetadata({
    title: t('seo.sportOddsTitle', { sport: sportName }),
    description: t('seo.sportOddsDescription', { sport: sportName }),
    path: `/sports/${found.slug}`,
    localeSegment,
    index: false,
  })
}

export default async function SportPage({
  params,
}: {
  params: Promise<{ sport: string }>
}) {
  const { sport } = await params
  const found = getSport(sport)
  if (!found) notFound()
  return <SportView sport={found.slug} />
}
