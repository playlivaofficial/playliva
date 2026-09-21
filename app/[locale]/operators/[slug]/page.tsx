import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicOperators, getOperator } from '@/lib/data'
import { OperatorProfileView } from '@/components/operator-profile-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

// Only pre-render/index pages for approved partners. Mock placeholders and
// real partners still `pending` onboarding (e.g. partners currently being
// activated) stay unbuilt here — they are not public pages yet.
export function generateStaticParams() {
  return getPublicOperators().map(
    (o) => ({ slug: o.slug }),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale: localeSegment } = await params
  const operator = getOperator(slug)
  if (!operator) return { title: 'Operator not found', robots: { index: false } }
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  return pageMetadata({
    title: operator.name,
    description: t('seo.operatorDescription', { operator: operator.name }),
    path: `/operators/${operator.slug}`,
    localeSegment,
    images: operator.logo ? [operator.logo] : undefined,
    // Only approved, non-mock partners may be indexed — pending onboarding
    // (real or mock) must stay out of search results.
    index: getPublicOperators().some((o) => o.id === operator.id),
  })
}

export default async function OperatorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const operator = getOperator(slug)
  if (!operator) notFound()
  return <OperatorProfileView operator={operator} />
}
