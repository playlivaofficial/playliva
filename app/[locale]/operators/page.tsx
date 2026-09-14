import type { Metadata } from 'next'
import { OperatorsDirectory } from '@/components/operators-directory'
import { OperatorsPageHero } from '@/components/operators-page-hero'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'
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
    title: t('seo.operatorsPageTitle'),
    description: t('seo.operatorsPageDescription'),
    path: '/operators',
    localeSegment,
  })
}

export default function OperatorsPage() {
  return (
    <div>
      <OperatorsPageHero />
      <BetssonSponsoredBanner surface="operators" layout="full" />
      <OperatorsDirectory />
    </div>
  )
}
