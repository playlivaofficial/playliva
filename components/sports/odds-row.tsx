'use client'

import type { MatchOddsWithBookmaker } from '@/lib/sports-types'
import { formatOdds } from '@/lib/sports-format'
import { BookmakerLogo } from '@/components/sports/bookmaker-logo'
import { BestOddsBadge } from '@/components/sports/best-odds-badge'
import { AffiliateCTA } from '@/components/sports/affiliate-cta'
import { useTranslation } from '@/components/country-context'
import { cn } from '@/lib/utils'

interface OddsRowProps {
  odds: MatchOddsWithBookmaker
  hasDraw: boolean
  bestHome: number
  bestDraw?: number
  bestAway: number
}

function OddsCell({ value, isBest }: { value: number; isBest: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2',
        isBest ? 'bg-primary/15' : 'bg-secondary/40',
      )}
    >
      <span
        className={cn(
          'font-display text-sm font-bold',
          isBest ? 'text-primary' : 'text-foreground',
        )}
      >
        {formatOdds(value)}
      </span>
      {isBest && <BestOddsBadge />}
    </div>
  )
}

/** Desktop table row. */
export function OddsRow({ odds, hasDraw, bestHome, bestDraw, bestAway }: OddsRowProps) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2.5">
          <BookmakerLogo name={odds.bookmaker.name} />
          <span className="text-sm font-semibold text-foreground">
            {odds.bookmaker.name}
          </span>
        </div>
      </td>
      <td className="w-28 py-3 pr-3">
        <OddsCell value={odds.homeOdds} isBest={odds.homeOdds === bestHome} />
      </td>
      {hasDraw && odds.drawOdds != null && (
        <td className="w-28 py-3 pr-3">
          <OddsCell value={odds.drawOdds} isBest={odds.drawOdds === bestDraw} />
        </td>
      )}
      <td className="w-28 py-3 pr-3">
        <OddsCell value={odds.awayOdds} isBest={odds.awayOdds === bestAway} />
      </td>
      <td className="w-32 py-3">
        <AffiliateCTA
          affiliateUrl={odds.bookmaker.affiliateUrl}
          bookmakerId={odds.bookmakerId}
          matchSlug={odds.matchId}
          className="w-full"
        />
      </td>
    </tr>
  )
}

/** Mobile stacked card — avoids horizontal scrolling on small screens. */
export function OddsRowMobile({ odds, hasDraw, bestHome, bestDraw, bestAway }: OddsRowProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <BookmakerLogo name={odds.bookmaker.name} />
        <span className="text-sm font-semibold text-foreground">{odds.bookmaker.name}</span>
      </div>
      <div className={cn('grid gap-2', hasDraw ? 'grid-cols-3' : 'grid-cols-2')}>
        <MobileOdds label={t('sports.home')} value={odds.homeOdds} isBest={odds.homeOdds === bestHome} />
        {hasDraw && odds.drawOdds != null && (
          <MobileOdds label={t('sports.draw')} value={odds.drawOdds} isBest={odds.drawOdds === bestDraw} />
        )}
        <MobileOdds label={t('sports.away')} value={odds.awayOdds} isBest={odds.awayOdds === bestAway} />
      </div>
      <AffiliateCTA
        affiliateUrl={odds.bookmaker.affiliateUrl}
        bookmakerId={odds.bookmakerId}
        matchSlug={odds.matchId}
        className="w-full"
        size="default"
      />
    </div>
  )
}

function MobileOdds({
  label,
  value,
  isBest,
}: {
  label: string
  value: number
  isBest: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg py-2',
        isBest ? 'bg-primary/15' : 'bg-secondary/40',
      )}
    >
      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          'font-display text-sm font-bold',
          isBest ? 'text-primary' : 'text-foreground',
        )}
      >
        {formatOdds(value)}
      </span>
      {isBest && <BestOddsBadge className="mt-0.5" />}
    </div>
  )
}
