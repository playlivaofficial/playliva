import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { LIVA_MINES } from '@/lib/originals/mines/config'
import { minesCopy } from '@/lib/originals/mines/copy'
import MinesEntry from '@/components/originals/mines/mines-entry'
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment)
  return pageMetadata({ title: LIVA_MINES.title[locale], description: minesCopy(locale).description, path: '/play/mines', localeSegment: segment })
}
export default function MinesPage() { return <MinesEntry/> }
