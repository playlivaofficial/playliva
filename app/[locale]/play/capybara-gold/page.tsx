import { contentLocale } from '@/lib/locale'
import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { CAPYBARA_GOLD } from '@/lib/originals/capybara/definition'
import { capybaraCopy } from '@/lib/originals/capybara/copy'
import CapybaraEntry from '@/components/originals/capybara/capybara-entry'
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment)
  return pageMetadata({ title: CAPYBARA_GOLD.title[contentLocale(locale)], description: capybaraCopy(locale).description,
    path: '/play/capybara-gold', localeSegment: segment })
}
export default function CapybaraPage() { return <CapybaraEntry /> }
