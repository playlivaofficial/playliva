export const SYMBOLS = ['wild', 'coconut', 'emerald', 'flower', 'toucan', 'pearl', 'acai', 'leaf', 'scatter'] as const
export type SlotSymbol = typeof SYMBOLS[number]
export type PayingSymbol = Exclude<SlotSymbol, 'wild' | 'scatter'>
export const PAYING_SYMBOLS: readonly PayingSymbol[] = ['coconut', 'emerald', 'flower', 'toucan', 'pearl', 'acai', 'leaf']
export const REELS = 5, ROWS = 4, WAYS = ROWS ** REELS
export const STAKES = [100, 200, 500, 1000, 2500, 5000] as const
export interface SlotConfig {
  readonly weights: Readonly<Record<SlotSymbol, number>>
  /** Free-spin reels only: Wild density drives Gold Multiplier growth. */
  readonly bonusWildWeight: number
  /** Free-spin reels only: Sun density drives retriggers. */
  readonly bonusScatterWeight: number
  /** Each rate is a fraction of the TOTAL stake, denominator payScale. */
  readonly paytable: Readonly<Record<PayingSymbol, readonly [number, number, number]>>
  readonly payScale: number
  readonly wildMultipliers: readonly number[]
  readonly scatterTrigger: number
  /** Free spins for exactly 3, exactly 4 and 5+ Suns on a paid spin. */
  readonly scatterAwards: readonly [number, number, number]
  /** Extra free spins per Sun that lands during free spins. */
  readonly retriggerSpins: number
  /** Hard ceiling on free spins awarded in one bonus, including retriggers. */
  readonly maxFreeSpins: number
  readonly bonusStep: number
  readonly maxBonusMultiplier: number
  readonly maxWinMultiple: number
}
export const SLOT_CONFIG: SlotConfig = Object.freeze({
  weights: Object.freeze({ wild: 10, scatter: 22, coconut: 86, emerald: 102, flower: 125, toucan: 139, pearl: 148, acai: 180, leaf: 188 }),
  bonusWildWeight: 22, bonusScatterWeight: 8,
  paytable: Object.freeze({ coconut: Object.freeze([2100, 7000, 28000] as const), emerald: Object.freeze([1400, 4900, 16800] as const),
    flower: Object.freeze([1120, 3080, 11200] as const), toucan: Object.freeze([840, 2240, 8400] as const),
    pearl: Object.freeze([700, 1680, 6300] as const), acai: Object.freeze([490, 1120, 3500] as const), leaf: Object.freeze([420, 840, 2800] as const) }),
  payScale: 10000,
  wildMultipliers: Object.freeze([1, 2, 3, 5, 10]),
  scatterTrigger: 3, scatterAwards: Object.freeze([8, 12, 20] as const), retriggerSpins: 1, maxFreeSpins: 50,
  bonusStep: 1, maxBonusMultiplier: 5, maxWinMultiple: 1000,
})

export function validateConfig(config: SlotConfig) {
  const positive = (n: number, max = 1000000) => Number.isSafeInteger(n) && n > 0 && n <= max
  const awards = config.scatterAwards
  if (!positive(config.payScale) || !positive(config.bonusWildWeight) || !positive(config.bonusScatterWeight) ||
    !positive(config.maxWinMultiple, 1000) || !positive(config.maxBonusMultiplier, 100) ||
    !Array.isArray(awards) || awards.length !== 3 || awards.some((n, i) => !positive(n, 20) || (i > 0 && n < awards[i - 1])) ||
    !positive(config.maxFreeSpins, 50) || config.maxFreeSpins < awards[2] ||
    !positive(config.retriggerSpins, 5) || !positive(config.bonusStep, 10) ||
    !positive(config.scatterTrigger, 20) || config.scatterTrigger < 3 ||
    SYMBOLS.some(symbol => !positive(config.weights[symbol])) ||
    PAYING_SYMBOLS.some(symbol => config.paytable[symbol]?.length !== 3 || config.paytable[symbol].some(rate => !positive(rate))) ||
    config.wildMultipliers.length < 2 || config.wildMultipliers[0] !== 1 ||
    config.wildMultipliers.some((value, i, all) => !positive(value, 100) || (i > 0 && value < all[i - 1]))) throw new Error('Invalid slot configuration')
}
