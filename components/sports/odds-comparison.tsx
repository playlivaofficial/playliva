'use client'

import { getBestOdds } from '@/lib/sports-data'
import type { MatchOddsWithBookmaker } from '@/lib/sports-types'
import { OddsRow, OddsRowMobile } from '@/components/sports/odds-row'
import { useTranslation } from '@/components/country-context'

export function OddsComparison({
  odds,
  hasDraw,
}: {
  odds: MatchOddsWithBookmaker[]
  hasDraw: boolean
}) {
  const { t } = useTranslation()
  const best = getBestOdds(odds)

  if (odds.length === 0) {
    return <p className="text-muted-foreground">{t('sports.noMatches')}</p>
  }

  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card p-4 md:block">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4">{t('sports.bookmaker')}</th>
              <th className="w-28 pb-3 pr-3">{t('sports.home')}</th>
              {hasDraw && <th className="w-28 pb-3 pr-3">{t('sports.draw')}</th>}
              <th className="w-28 pb-3 pr-3">{t('sports.away')}</th>
              <th className="w-32 pb-3" />
            </tr>
          </thead>
          <tbody>
            {odds.map((o) => (
              <OddsRow
                key={o.bookmakerId}
                odds={o}
                hasDraw={hasDraw}
                bestHome={best.home}
                bestDraw={best.draw}
                bestAway={best.away}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {odds.map((o) => (
          <OddsRowMobile
            key={o.bookmakerId}
            odds={o}
            hasDraw={hasDraw}
            bestHome={best.home}
            bestDraw={best.draw}
            bestAway={best.away}
          />
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {t('sports.oddsDisclaimer')}
      </p>
    </div>
  )
}
