import type { Metadata } from 'next'
import { CategoryPageView } from '@/components/category-page-view'
import { CategoryReferenceSection } from '@/components/catalog/reference-views'
import { catalogLocale } from '@/lib/catalog/metadata'
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
  const category = getCategoryContent('slots', locale)
  return pageMetadata({
    title: category.name,
    description: `${category.description} ${t('seo.categoryAvailabilitySuffix')}`,
    path: '/slots',
    localeSegment,
  })
}

export default async function SlotsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CategoryPageView slug="slots" referenceCatalog={<CategoryReferenceSection category="slots" locale={catalogLocale(locale)} />} />
}
