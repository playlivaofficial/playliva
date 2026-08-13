'use client'

import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, CalendarDays, Clock } from 'lucide-react'
import type { League, Match } from '@/lib/sports-types'
import { getBestOdds, getBookmakerCountForMatch, getOddsForMatch } from '@/lib/sports-data'
import { formatMatchDate, formatMatchTime, formatOdds } from '@/lib/sports-format'
import { useTranslation } from '@/components/country-context'

export function MatchCard({ match, league }: { match: Match; league: League }) {
  const { t, locale } = useTranslation()
  const odds = getOddsForMatch(match.id)
  const best = getBestOdds(odds)
  const bookmakerCount = getBookmakerCountForMatch(match.id)

  return (
    <LocaleLink
      href={`/sports/${match.sport}/${league.slug}/${match.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:glow-primary"
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate font-medium text-primary">{league.name}</span>
        <span className="inline-flex shrink-0 items-center gap-1">
          <CalendarDays className="size-3.5" aria-hidden />
          {formatMatchDate(match.startTime, locale)}
          <Clock className="ml-1.5 size-3.5" aria-hidden />
          {formatMatchTime(match.startTime, locale)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-balance font-display text-lg font-bold leading-tight text-foreground">
          {match.homeTeam}
        </p>
        <span className="shrink-0 text-xs font-semibold uppercase text-muted-foreground">
          vs
        </span>
        <p className="text-balance text-right font-display text-lg font-bold leading-tight text-foreground">
          {match.awayTeam}
        </p>
      </div>

      <div
        className={`mt-4 grid gap-2 ${best.draw != null ? 'grid-cols-3' : 'grid-cols-2'}`}
      >
        <OddsChip label="1" value={best.home} />
        {best.draw != null && <OddsChip label="X" value={best.draw} />}
        <OddsChip label="2" value={best.away} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          {t('sports.bookmakersCompared', { count: bookmakerCount })}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {t('sports.compareOdds')}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </LocaleLink>
  )
}

function OddsChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-secondary/40 py-2">
      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-sm font-bold text-foreground">
        {formatOdds(value)}
      </span>
    </div>
  )
}
