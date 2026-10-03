import { publishedCommercialDirectoryLocales } from '@/lib/commercial/seo'
import { geoEditorial } from '@/lib/geo-editorial'
import type { Metadata } from 'next'
import { OffersView } from '@/components/offers-view'
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
  const segments = publishedCommercialDirectoryLocales('offers')
  const segment = isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT
  const country = geoEditorial(locale)
  return pageMetadata({
    title: country ? `Ofertas para ${country.name}` : t('seo.offersPageTitle'),
    description: country ? `Ofertas publicadas solo tras verificar condiciones, moneda y elegibilidad para ${country.name}. Referencia monetaria: ${country.currency}. PlayLiva no acepta depósitos.` : t('seo.offersPageDescription'),
    index: segments.includes(segment),
    alternateLocaleSegments: segments.includes(segment) ? segments : [],
    includeXDefault: false,
    path: '/offers',
    localeSegment,
  })
}

export default function OffersPage() {
  return <OffersView />
}
