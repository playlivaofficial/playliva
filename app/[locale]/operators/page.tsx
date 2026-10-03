import { publishedCommercialDirectoryLocales } from '@/lib/commercial/seo'
import { geoEditorial } from '@/lib/geo-editorial'
import type { Metadata } from 'next'
import { OperatorsDirectory } from '@/components/operators-directory'
import { OperatorsPageHero } from '@/components/operators-page-hero'
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
  const segments = publishedCommercialDirectoryLocales('operators')
  const segment = isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT
  const country = geoEditorial(locale)
  return pageMetadata({
    title: country ? `Operadores para ${country.name}` : t('seo.operatorsPageTitle'),
    description: country ? `Directorio de operadores con relación de afiliación aprobada y disponibilidad verificada para ${country.name}. Referencia monetaria: ${country.currency}. PlayLiva no acepta depósitos.` : t('seo.operatorsPageDescription'),
    index: segments.includes(segment),
    alternateLocaleSegments: segments.includes(segment) ? segments : [],
    includeXDefault: false,
    path: '/operators',
    localeSegment,
  })
}

export default function OperatorsPage() {
  return (
    <div>
      <OperatorsPageHero />
      <OperatorsDirectory />
    </div>
  )
}
