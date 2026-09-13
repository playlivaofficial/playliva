import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { LIVA_ROULETTE } from '@/lib/originals/roulette/config'
import { rouletteCopy } from '@/lib/originals/roulette/copy'
import RouletteEntry from '@/components/originals/roulette/roulette-entry'
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment)
  return pageMetadata({ title: LIVA_ROULETTE.title[locale], description: rouletteCopy(locale).description,
    path: '/play/roulette', localeSegment: segment })
}
export default function RoulettePage() { return <RouletteEntry /> }
