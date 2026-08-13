import type { Metadata } from 'next'
import { Section } from '@/components/section'
import { GamesExplorer } from '@/components/games-explorer'
import { GamesPageHero } from '@/components/games-page-hero'
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
  return pageMetadata({
    title: t('seo.gamesPageTitle'),
    description: t('seo.gamesPageDescription'),
    path: '/games',
    localeSegment,
  })
}

export default function GamesPage() {
  return (
    <>
      <GamesPageHero />
      <Section>
        <GamesExplorer />
      </Section>
    </>
  )
}
