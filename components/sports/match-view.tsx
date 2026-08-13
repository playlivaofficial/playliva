'use client'

import { Info } from 'lucide-react'
import { getOddsForMatch, getSport } from '@/lib/sports-data'
import type { League, Match } from '@/lib/sports-types'
import { useTranslation } from '@/components/country-context'
import { Section } from '@/components/section'
import { MatchHeader } from '@/components/sports/match-header'
import { OddsComparison } from '@/components/sports/odds-comparison'
import { BettingMarketTabs } from '@/components/sports/betting-market-tabs'
import { AffiliateDisclosure, ResponsibleGamingNotice } from '@/components/notices'

export function MatchView({ match, league }: { match: Match; league: League }) {
  const { t } = useTranslation()
  const odds = getOddsForMatch(match.id)
  const sport = getSport(match.sport)
  const hasDraw = sport?.hasDraw ?? false

  return (
    <div>
      <MatchHeader match={match} league={league} />

      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-pretty leading-relaxed">{t('sports.demoNotice')}</p>
        </div>
      </div>

      <Section>
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {t('sports.oddsComparisonTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('sports.bookmakersCompared', { count: odds.length })}
            </p>
          </div>
          <OddsComparison odds={odds} hasDraw={hasDraw} />
        </div>

        {odds.some((o) => o.totalGoals || o.bothTeamsToScore || o.doubleChance) && (
          <div className="mt-10">
            <h2 className="mb-4 font-display text-xl font-bold text-foreground">
              {t('sports.moreMarkets')}
            </h2>
            <BettingMarketTabs odds={odds} />
          </div>
        )}
      </Section>

      <Section className="border-t border-border bg-card/30">
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          {t('sports.matchInfo')}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MatchInfoItem label={t('sports.competition')} value={league.name} />
          <MatchInfoItem label={t('sports.venue')} value={match.venue ?? t('sports.venueUnavailable')} />
        </dl>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <AffiliateDisclosure />
          <ResponsibleGamingNotice />
        </div>
      </Section>
    </div>
  )
}

function MatchInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  )
}
