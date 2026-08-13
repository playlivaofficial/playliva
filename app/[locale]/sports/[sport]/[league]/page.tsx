import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LEAGUES, getLeague, getSport } from '@/lib/sports-data'
import { LeagueView } from '@/components/sports/league-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

export function generateStaticParams() {
  return LEAGUES.map((l) => ({ sport: l.sport, league: l.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; league: string; locale: string }>
}): Promise<Metadata> {
  const { sport, league, locale: localeSegment } = await params
  const sportEntity = getSport(sport)
  const leagueEntity = sportEntity ? getLeague(sportEntity.slug, league) : undefined
  if (!leagueEntity) return { title: 'League not found', robots: { index: false } }
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  return pageMetadata({
    // League names (e.g. "Brasileirão", "Liga MX") are proper nouns and stay
    // as-is across locales; only the surrounding copy is translated.
    title: t('seo.leagueOddsTitle', { league: leagueEntity.name }),
    description: t('seo.leagueOddsDescription', { league: leagueEntity.name }),
    path: `/sports/${leagueEntity.sport}/${leagueEntity.slug}`,
    localeSegment,
    index: false,
  })
}

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ sport: string; league: string }>
}) {
  const { sport, league } = await params
  const sportEntity = getSport(sport)
  const leagueEntity = sportEntity ? getLeague(sportEntity.slug, league) : undefined
  if (!leagueEntity) notFound()
  return <LeagueView league={leagueEntity} />
}
