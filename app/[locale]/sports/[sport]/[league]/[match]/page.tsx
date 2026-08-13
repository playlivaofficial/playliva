import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MATCHES, getLeagueById, getLeague, getMatch, getSport } from '@/lib/sports-data'
import { MatchView } from '@/components/sports/match-view'
import { pageMetadata } from '@/lib/seo'
import {
  DEFAULT_LOCALE_SEGMENT,
  isLocaleSegment,
  segmentToLocale,
} from '@/lib/locale'
import { createTranslator } from '@/lib/i18n'

export function generateStaticParams() {
  return MATCHES.map((m) => {
    const league = getLeagueById(m.leagueId)
    return { sport: m.sport, league: league?.slug ?? '', match: m.slug }
  }).filter((p) => p.league !== '')
}

async function resolve(sport: string, league: string, match: string) {
  const sportEntity = getSport(sport)
  const leagueEntity = sportEntity ? getLeague(sportEntity.slug, league) : undefined
  const matchEntity = getMatch(match)
  if (!sportEntity || !leagueEntity || !matchEntity) return undefined
  if (matchEntity.sport !== sportEntity.slug || matchEntity.leagueId !== leagueEntity.id) {
    return undefined
  }
  return { league: leagueEntity, match: matchEntity }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; league: string; match: string; locale: string }>
}): Promise<Metadata> {
  const { sport, league, match, locale: localeSegment } = await params
  const resolved = await resolve(sport, league, match)
  if (!resolved) return { title: 'Match not found', robots: { index: false } }
  const { match: matchEntity, league: leagueEntity } = resolved
  const locale = segmentToLocale(
    isLocaleSegment(localeSegment) ? localeSegment : DEFAULT_LOCALE_SEGMENT,
  )
  const t = createTranslator(locale)
  // Team and league names are proper nouns and stay as-is across locales;
  // only the surrounding copy is translated.
  return pageMetadata({
    title: t('seo.matchOddsTitle', {
      home: matchEntity.homeTeam,
      away: matchEntity.awayTeam,
    }),
    description: t('seo.matchOddsDescription', {
      home: matchEntity.homeTeam,
      away: matchEntity.awayTeam,
      league: leagueEntity.name,
    }),
    path: `/sports/${matchEntity.sport}/${leagueEntity.slug}/${matchEntity.slug}`,
    localeSegment,
    index: false,
  })
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ sport: string; league: string; match: string }>
}) {
  const { sport, league, match } = await params
  const resolved = await resolve(sport, league, match)
  if (!resolved) notFound()
  return <MatchView match={resolved.match} league={resolved.league} />
}
