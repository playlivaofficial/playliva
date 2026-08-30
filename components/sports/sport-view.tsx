'use client'

import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import type { DateFilterValue } from '@/lib/sports-data'
import {
  filterMatchesByDate,
  getLeagueById,
  getMatchesForSport,
  getPriorityLeaguesForCountry,
} from '@/lib/sports-data'
import type { SportSlug } from '@/lib/sports-types'
import { useCountry } from '@/components/country-context'
import { PageHero } from '@/components/page-hero'
import { Section } from '@/components/section'
import { SportTabs } from '@/components/sports/sport-tabs'
import { DateFilter } from '@/components/sports/date-filter'
import { LeagueFilter } from '@/components/sports/league-filter'
import { MatchCard } from '@/components/sports/match-card'
import { AffiliateDisclosureLine, ResponsibleGamingNotice } from '@/components/notices'

export function SportView({ sport }: { sport: SportSlug }) {
  const { t, countryCode } = useCountry()
  const [leagueId, setLeagueId] = useState<string | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<DateFilterValue | 'all'>('all')

  const leagues = useMemo(
    () => getPriorityLeaguesForCountry(countryCode, sport),
    [countryCode, sport],
  )

  const matches = useMemo(() => {
    const bySport = getMatchesForSport(sport)
    const byLeague =
      leagueId === 'all' ? bySport : bySport.filter((m) => m.leagueId === leagueId)
    return filterMatchesByDate(byLeague, dateFilter)
  }, [sport, leagueId, dateFilter])

  return (
    <div>
      <PageHero
        eyebrow={t('sports.eyebrow')}
        title={t(`sports.sport.${sport}`)}
        description={t('sports.pageSub')}
      />

      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-pretty leading-relaxed">{t('sports.demoNotice')}</p>
        </div>
      </div>

      <Section>
        <div className="flex flex-col gap-4">
          <SportTabs active={sport} />
          <div className="flex flex-wrap items-center gap-2">
            <LeagueFilter leagues={leagues} value={leagueId} onChange={setLeagueId} />
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        {matches.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => {
              const league = getLeagueById(match.leagueId)
              if (!league) return null
              return <MatchCard key={match.id} match={match} league={league} />
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">{t('sports.noMatches')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('sports.comingSoonForMarket')}
            </p>
          </div>
        )}
      </Section>

      <Section className="border-t border-border bg-card/30">
        <ResponsibleGamingNotice />
        <AffiliateDisclosureLine className="mt-4" />
      </Section>
    </div>
  )
}
