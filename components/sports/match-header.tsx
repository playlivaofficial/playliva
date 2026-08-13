'use client'

import { LocaleLink } from '@/components/locale-link'
import { CalendarDays, ChevronLeft, Clock, MapPin } from 'lucide-react'
import type { League, Match } from '@/lib/sports-types'
import { formatMatchDate, formatMatchTime } from '@/lib/sports-format'
import { useTranslation } from '@/components/country-context'

export function MatchHeader({ match, league }: { match: Match; league: League }) {
  const { t, locale } = useTranslation()

  return (
    <div className="relative overflow-hidden border-b border-border bg-grid">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-3xl rounded-full bg-primary/20 blur-[100px]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6">
          <LocaleLink
            href={`/sports/${match.sport}/${league.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
            {t('sports.backToLeague', { league: league.name })}
          </LocaleLink>
        </div>

        <LocaleLink
          href={`/sports/${match.sport}/${league.slug}`}
          className="block text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
        >
          {league.name}
        </LocaleLink>

        <h1 className="mt-3 flex flex-col items-center gap-3 text-balance font-display text-2xl font-bold tracking-tight text-foreground sm:flex-row sm:justify-center sm:gap-6 sm:text-4xl">
          <span>{match.homeTeam}</span>
          <span className="text-sm font-semibold uppercase text-muted-foreground">vs</span>
          <span>{match.awayTeam}</span>
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            {formatMatchDate(match.startTime, locale)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {formatMatchTime(match.startTime, locale)}
          </span>
          {match.venue && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {match.venue}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
