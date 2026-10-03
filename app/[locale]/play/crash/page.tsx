import { contentLocale } from '@/lib/locale'
import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { ISLAND_CRASH } from '@/lib/originals/crash/definition'
import { crashCopy } from '@/lib/originals/crash/copy'
import IslandCrashGame from '@/components/originals/crash/crash-game'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment)
  return pageMetadata({ title: ISLAND_CRASH.title[contentLocale(locale)], description: crashCopy(locale).description,
    path: '/play/crash', localeSegment: segment })
}

export default function CrashPage() { return <IslandCrashGame /> }
