'use client'

import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import type { DateFilterValue } from '@/lib/sports-data'
import { filterMatchesByDate, getMatchesForLeague } from '@/lib/sports-data'
import type { League } from '@/lib/sports-types'
import { useTranslation } from '@/components/country-context'
import { PageHero } from '@/components/page-hero'
import { Section } from '@/components/section'
import { SportTabs } from '@/components/sports/sport-tabs'
import { DateFilter } from '@/components/sports/date-filter'
import { MatchCard } from '@/components/sports/match-card'
import { AffiliateDisclosureLine, ResponsibleGamingNotice } from '@/components/notices'

export function LeagueView({ league }: { league: League }) {
  const { t } = useTranslation()
  const [dateFilter, setDateFilter] = useState<DateFilterValue | 'all'>('all')

  const matches = useMemo(
    () => filterMatchesByDate(getMatchesForLeague(league.id), dateFilter),
    [league.id, dateFilter],
  )

  return (
    <div>
      <PageHero
        eyebrow={t('sports.eyebrow')}
        title={league.name}
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
          <SportTabs active={league.sport} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-foreground">
              {t('sports.leagueMatchesTitle', { league: league.name })}
            </h2>
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        {matches.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} league={league} />
            ))}
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
