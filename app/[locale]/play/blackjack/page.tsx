import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { LIVA_BLACKJACK } from '@/lib/originals/blackjack/definition'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import BlackjackEntry from '@/components/originals/blackjack/blackjack-entry'
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment)
  return pageMetadata({ title: LIVA_BLACKJACK.title[locale], description: blackjackCopy(locale).description,
    path: '/play/blackjack', localeSegment: segment })
}
export default function BlackjackPage() { return <BlackjackEntry /> }
