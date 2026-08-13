import type { Metadata } from 'next'
import { CategoryPageView } from '@/components/category-page-view'
import { getCategoryContent } from '@/lib/content'
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
  const category = getCategoryContent('live-casino', locale)
  return pageMetadata({
    title: category.name,
    description: `${category.description} ${t('seo.categoryAvailabilitySuffix')}`,
    path: '/live-casino',
    localeSegment,
  })
}

export default function LiveCasinoPage() {
  return <CategoryPageView slug="live-casino" />
}
