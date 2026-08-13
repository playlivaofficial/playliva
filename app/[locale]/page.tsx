import { HomePageClient } from '@/components/home/home-page-client'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeSegment } = await params
  // Title/description must match the page's own LANGUAGE (URL locale
  // segment), never a fixed English default.
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  return pageMetadata({
    title: t('seo.homeTitle'),
    description: t('seo.homeDescription'),
    path: '/',
    localeSegment,
  })
}

export default function HomePage() {
  return <HomePageClient />
}
