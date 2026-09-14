import type { Metadata } from 'next'
import { Section } from '@/components/section'
import { CatalogExplorer } from '@/components/catalog/catalog-explorer'
import { catalogSummaries } from '@/lib/catalog'
import { catalogLocale } from '@/lib/catalog/metadata'
import { catalogCopy } from '@/lib/catalog/copy'
import { GamesPageHero } from '@/components/games-page-hero'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'
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
    description: catalogCopy(locale).directoryIntro,
    path: '/games',
    localeSegment,
  })
}

export default async function GamesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <>
      <GamesPageHero />
      <BetssonSponsoredBanner surface="games" layout="full" />
      <Section className="py-8 sm:py-12">
        <CatalogExplorer entries={catalogSummaries(catalogLocale(locale))} />
      </Section>
    </>
  )
}
