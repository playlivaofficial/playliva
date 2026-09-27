import type { Metadata } from 'next'
import { CategoryPageView } from '@/components/category-page-view'
import { CategoryReferenceSection } from '@/components/catalog/reference-views'
import { catalogLocale } from '@/lib/catalog/metadata'
import { getCategoryContent } from '@/lib/content'
import { pageMetadata } from '@/lib/discovery/seo'
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
    title: category.seoTitle ?? category.name,
    description:
      category.seoDescription ??
      `${category.description} ${t('seo.categoryAvailabilitySuffix')}`,
    path: '/live-casino',
    localeSegment,
    images: ['/games/crazy-time.webp'],
  })
}

export default async function LiveCasinoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CategoryPageView slug="live-casino" referenceCatalog={<CategoryReferenceSection category="live-casino" locale={catalogLocale(locale)} />} />
}
