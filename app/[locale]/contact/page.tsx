import type { Metadata } from 'next'
import { ContactView } from '@/components/contact-view'
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
  const page = getLegalPage('contact', locale)
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: '/contact',
    localeSegment,
  })
}

export default function ContactPage() {
  return <ContactView />
}
