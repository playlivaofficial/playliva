export interface BlackjackRules {
  readonly decks: number
  readonly penetration: number
  readonly dealerHitsSoft17: boolean
  readonly blackjackProfit: readonly [number, number]
  readonly pairRule: 'value' | 'rank'
  readonly maxHands: number
  readonly doubleAfterSplit: boolean
  readonly splitAcesOnce: true
  readonly splitAceCards: 1
}

/** M7: no insurance or surrender. Ten/J/Q/K may split by equal VALUE.
 * Split 21 is an ordinary win, never a natural blackjack. */
export const BLACKJACK_RULES: BlackjackRules = Object.freeze({
  decks: 6, penetration: .75, dealerHitsSoft17: false,
  blackjackProfit: Object.freeze([3, 2] as const), pairRule: 'value',
  maxHands: 3, doubleAfterSplit: true, splitAcesOnce: true, splitAceCards: 1,
})
export const BLACKJACK_STAKES = Object.freeze([100, 200, 500, 1000, 2500, 5000])
export const DEAL_CARD_MS = 180, ACTION_MS = 220, DEALER_CARD_MS = 240, RESULT_MS = 420

export function validateRules(rules: BlackjackRules) {
  if (!Number.isInteger(rules.decks) || rules.decks < 1 || rules.decks > 8 ||
    !Number.isFinite(rules.penetration) || rules.penetration < .7 || rules.penetration > .8 ||
    typeof rules.dealerHitsSoft17 !== 'boolean' || !['value', 'rank'].includes(rules.pairRule) ||
    !Number.isInteger(rules.maxHands) || rules.maxHands < 1 || rules.maxHands > 3 ||
    typeof rules.doubleAfterSplit !== 'boolean' || rules.splitAcesOnce !== true || rules.splitAceCards !== 1 ||
    rules.blackjackProfit.length !== 2 || !rules.blackjackProfit.every(n => Number.isInteger(n) && n > 0 && n <= 10)) {
    throw new Error('Invalid blackjack rules')
  }
}
