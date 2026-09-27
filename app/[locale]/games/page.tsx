import type { Metadata } from 'next'
import { Section } from '@/components/section'
import { GameDirectory } from '@/components/discovery/directory'
import { hasDirectoryFacets, type DirectoryParams } from '@/lib/discovery/query'
import { catalogLocale } from '@/lib/catalog/metadata'
import { catalogCopy } from '@/lib/catalog/copy'
import { GamesPageHero } from '@/components/games-page-hero'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

export async function generateMetadata({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const { locale: localeSegment } = await params
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  return pageMetadata({
    title: t('seo.gamesPageTitle'),
    description: catalogCopy(locale).directoryIntro,
    index: !hasDirectoryFacets(await searchParams),
    alternateLocaleSegments: hasDirectoryFacets(await searchParams) ? [] : undefined,
    path: '/games',
    localeSegment,
  })
}

export default async function GamesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params
  const raw = await searchParams
  const query: DirectoryParams = Object.fromEntries(['q','category','provider','kind','format','page'].map(key => [key, typeof raw[key] === 'string' ? raw[key] : undefined]))
  return (
    <>
      <GamesPageHero />
      <Section className="py-8 sm:py-12">
        <GameDirectory locale={catalogLocale(locale)} segment={locale} params={query} />
      </Section>
    </>
  )
}
