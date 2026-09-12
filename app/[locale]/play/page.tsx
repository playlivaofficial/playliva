import type { Metadata } from 'next'
import { PlayView } from '@/components/play-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { originalsDiscoveryCopy, ISLAND_CRASH_POSTER } from '@/lib/originals/discovery'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeSegment } = await params
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const copy = originalsDiscoveryCopy(locale)
  return pageMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    path: '/play',
    localeSegment,
    images: [ISLAND_CRASH_POSTER],
    index: true,
  })
}

export default function PlayPage() {
  return <PlayView />
}
