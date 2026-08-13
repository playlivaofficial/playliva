'use client'

import { useMemo, useState } from 'react'
import type { MatchOddsWithBookmaker } from '@/lib/sports-types'
import { formatOdds } from '@/lib/sports-format'
import { BookmakerLogo } from '@/components/sports/bookmaker-logo'
import { useTranslation } from '@/components/country-context'
import { cn } from '@/lib/utils'

type MarketKey = 'totalGoals' | 'bothTeamsToScore' | 'doubleChance'

interface Outcome {
  key: string
  labelKey: string
  labelVars?: Record<string, string | number>
}

/** Additional markets, prepared for future expansion — kept intentionally lean. */
export function BettingMarketTabs({ odds }: { odds: MatchOddsWithBookmaker[] }) {
  const { t } = useTranslation()

  const available: MarketKey[] = useMemo(() => {
    const keys: MarketKey[] = []
    if (odds.some((o) => o.totalGoals)) keys.push('totalGoals')
    if (odds.some((o) => o.bothTeamsToScore)) keys.push('bothTeamsToScore')
    if (odds.some((o) => o.doubleChance)) keys.push('doubleChance')
    return keys
  }, [odds])

  const [active, setActive] = useState<MarketKey | undefined>(available[0])

  if (available.length === 0) return null

  const MARKET_LABEL: Record<MarketKey, string> = {
    totalGoals: t('sports.totalGoals'),
    bothTeamsToScore: t('sports.bothTeamsToScore'),
    doubleChance: t('sports.doubleChance'),
  }

  const outcomesFor = (market: MarketKey): Outcome[] => {
    const sample = odds.find((o) => o[market])
    if (!sample) return []
    if (market === 'totalGoals') {
      const line = sample.totalGoals?.line ?? 2.5
      return [
        { key: 'over', labelKey: 'sports.over', labelVars: { line } },
        { key: 'under', labelKey: 'sports.under', labelVars: { line } },
      ]
    }
    if (market === 'bothTeamsToScore') {
      return [
        { key: 'yes', labelKey: 'sports.yes' },
        { key: 'no', labelKey: 'sports.no' },
      ]
    }
    return [
      { key: 'homeOrDraw', labelKey: 'sports.doubleChanceHomeOrDraw' },
      { key: 'drawOrAway', labelKey: 'sports.doubleChanceDrawOrAway' },
      { key: 'homeOrAway', labelKey: 'sports.doubleChanceHomeOrAway' },
    ]
  }

  const valueFor = (o: MatchOddsWithBookmaker, market: MarketKey, outcomeKey: string) => {
    const marketData = o[market] as Record<string, number> | undefined
    return marketData?.[outcomeKey]
  }

  const bestFor = (market: MarketKey, outcomeKey: string) => {
    const values = odds
      .map((o) => valueFor(o, market, outcomeKey))
      .filter((v): v is number => v != null)
    return values.length > 0 ? Math.max(...values) : undefined
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {available.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              active === key
                ? 'border-primary bg-primary/15 text-foreground'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {MARKET_LABEL[key]}
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card p-4">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 pr-4">{t('sports.bookmaker')}</th>
                {outcomesFor(active).map((outcome) => (
                  <th key={outcome.key} className="w-24 pb-3 pr-3">
                    {t(outcome.labelKey, outcome.labelVars)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {odds
                .filter((o) => o[active])
                .map((o) => (
                  <tr key={o.bookmakerId} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <BookmakerLogo name={o.bookmaker.name} />
                        <span className="text-sm font-semibold text-foreground">
                          {o.bookmaker.name}
                        </span>
                      </div>
                    </td>
                    {outcomesFor(active).map((outcome) => {
                      const value = valueFor(o, active, outcome.key)
                      const best = bestFor(active, outcome.key)
                      if (value == null) return <td key={outcome.key} className="py-3 pr-3" />
                      const isBest = value === best
                      return (
                        <td key={outcome.key} className="py-3 pr-3">
                          <span
                            className={cn(
                              'inline-flex w-full items-center justify-center rounded-lg py-2 font-display text-sm font-bold',
                              isBest ? 'bg-primary/15 text-primary' : 'bg-secondary/40 text-foreground',
                            )}
                          >
                            {formatOdds(value)}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
