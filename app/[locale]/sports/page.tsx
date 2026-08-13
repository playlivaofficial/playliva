import type { Metadata } from 'next'
import { SportsLandingView } from '@/components/sports/sports-landing-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeSegment } = await params
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  return pageMetadata({
    title: t('seo.sportsPageTitle'),
    description: t('seo.sportsPageDescription'),
    path: '/sports',
    localeSegment,
  })
}

export default function SportsPage() {
  return <SportsLandingView />
}
