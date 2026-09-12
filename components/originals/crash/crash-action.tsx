import type { Locale } from '@/lib/types'
import { crashCopy } from '@/lib/originals/crash/copy'
import { formatCredits } from '@/lib/originals/credits'
import { payoutFor, type CrashSnapshot } from '@/lib/originals/crash/engine'

/** One production control shared with UI regression tests. Amounts are subunits. */
export function CrashAction({ round, locale, loaded, onStart, onCashOut, className, cashoutClassName }: {
  round: CrashSnapshot; locale: Locale; loaded: boolean; onStart: () => void; onCashOut: () => void
  className?: string; cashoutClassName?: string
}) {
  const copy = crashCopy(locale)
  if (round.phase === 'flying' && round.wager === 'active') return <button
    className={`${className ?? ''} ${cashoutClassName ?? ''}`} type="button" onClick={onCashOut} data-action="cashout">
    <span>{copy.cashOut}</span><strong>{formatCredits(payoutFor(round.stake, round.multiplier), locale)}</strong>
  </button>
  if (round.phase !== 'ready' && round.wager === 'cashed_out' && round.result) return <button
    className={className} type="button" disabled data-action="locked">
    <span>{copy.cashed_out}</span><strong>{formatCredits(round.result.payout, locale)}</strong>
  </button>
  return <button className={className} type="button" disabled={round.phase !== 'ready' || !loaded} onClick={onStart} data-action="start">
    {round.phase === 'ready' ? round.history.length ? copy.again : copy.start : copy[round.phase]}
  </button>
}
