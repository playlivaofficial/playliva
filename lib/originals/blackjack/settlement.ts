import { BLACKJACK_RULES, type BlackjackRules } from './config'
import { handValue, type Card } from './cards'

export type HandOutcome = 'blackjack' | 'win' | 'loss' | 'push' | 'bust'
export interface HandSettlement { readonly outcome: HandOutcome; readonly returned: number; readonly profit: number }

/** Pure RETURN convention: includes the wager. Wallet code never receives
 * floating-point credits. Fractional subunits floor once; public presets make
 * the default 3:2 natural payout exact. A split 21 is NOT a natural. */
export function settleHand(player: readonly Card[], dealer: readonly Card[], stake: number,
  fromSplit = false, rules: BlackjackRules = BLACKJACK_RULES): HandSettlement {
  if (!Number.isSafeInteger(stake) || stake <= 0) throw new Error('Invalid wager')
  const p = handValue(player, fromSplit), d = handValue(dealer)
  const outcome: HandOutcome = p.bust ? 'bust' : d.blackjack ? (p.blackjack ? 'push' : 'loss') :
    p.blackjack ? 'blackjack' : d.bust || p.total > d.total ? 'win' : p.total === d.total ? 'push' : 'loss'
  const wager = BigInt(stake)
  const raw = outcome === 'blackjack' ? wager + wager * BigInt(rules.blackjackProfit[0]) / BigInt(rules.blackjackProfit[1]) :
    outcome === 'win' ? wager * BigInt(2) : outcome === 'push' ? wager : BigInt(0)
  if (raw > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Unsafe payout')
  const returned = Number(raw)
  return Object.freeze({ outcome, returned, profit: returned - stake })
}
