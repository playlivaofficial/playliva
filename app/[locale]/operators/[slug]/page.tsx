import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getOperator } from '@/lib/data'
import { OperatorProfileView } from '@/components/operator-profile-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'
import { commercialSnapshot } from '@/lib/commercial/server'
import { geoForLocale, getGeoConfig } from '@/lib/geo'
import { publishedOperatorLocales } from '@/lib/commercial/seo'

// Approval comes from private runtime configuration, and the parent layout
// reads request GEO/session headers. An empty pending registry must still
// produce a normal dynamic 404 rather than an on-demand static render.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
  const operator = getOperator(slug, commercialSnapshot(geoForLocale(localeSegment)).operators)
  if (!operator) return { title: 'Operator not found', robots: { index: false } }
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  const country = getGeoConfig(geoForLocale(locale))
  return pageMetadata({
    title: `${operator.name} en ${country?.name ?? ''}`,
    description: `${t('seo.operatorDescription', { operator: operator.name })} Información para ${country?.name ?? ''}, con moneda ${country?.currency ?? ''}.`,
    path: `/operators/${operator.slug}`,
    localeSegment,
    images: operator.logo ? [operator.logo] : undefined,
    // Only approved, non-mock partners may be indexed — pending onboarding
    // (real or mock) must stay out of search results.
    index: isLocaleSegment(localeSegment) && publishedOperatorLocales(slug).includes(localeSegment),
    alternateLocaleSegments: publishedOperatorLocales(slug),
  })
}

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug, locale } = await params
  const operator = getOperator(slug, commercialSnapshot(geoForLocale(locale)).operators)
  if (!operator) notFound()
  return <OperatorProfileView operator={operator} />
}
