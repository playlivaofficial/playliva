import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { getLegalPage } from '@/lib/legal-content'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: localeSegment } = await params
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const page = getLegalPage('cookie-policy', locale)
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: '/cookie-policy',
    localeSegment,
    // Template legal text pending review — do not index until finalized.
    index: false,
  })
}

export default function CookiePolicyPage() {
  return <LegalPage pageKey="cookie-policy" />
}
