import type { Metadata } from 'next'
import { CrashGamesHubView } from '@/components/crash-games-hub-view'
import { getCrashHubContent } from '@/lib/content'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeSegment } = await params
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const content = getCrashHubContent(locale)
  return pageMetadata({
    title: content.seoTitle,
    description: content.seoDescription,
    path: '/best/crash-games',
    localeSegment,
  })
}

export default function BestCrashGamesPage() {
  return <CrashGamesHubView />
}
