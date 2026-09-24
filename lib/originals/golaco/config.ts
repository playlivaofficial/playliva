/**
 * Liva Golaço — slot configuration (independent of Capybara Gold).
 *
 * 5 reels × 3 rows, 243 left-to-right ways. Symbols:
 * - Paying: golden boot, goalkeeper gloves, whistle, medal (premium);
 *   corner flag, referee cards, stadium floodlight, training cone (regular).
 * - `camisa` (No. 10 shirt) is WILD on reels 2–5: substitutes for paying symbols.
 * - `taca` (trophy) is the Scatter: 3 / 4 / 5+ anywhere → 8 / 12 / 20 free spins.
 * - `gol` (golden ball) exists only on free-spin reels: every one that lands
 *   raises the Goal Streak by +1 (×1 → ×5) for the rest of the bonus.
 */
export const SYMBOLS = ['camisa', 'taca', 'gol', 'chuteira', 'luvas', 'apito', 'medalha', 'bandeira', 'cartoes', 'refletor', 'cone'] as const
export type GolacoSymbol = typeof SYMBOLS[number]
export type PayingSymbol = Exclude<GolacoSymbol, 'camisa' | 'taca' | 'gol'>
export const PAYING_SYMBOLS: readonly PayingSymbol[] = ['chuteira', 'luvas', 'apito', 'medalha', 'bandeira', 'cartoes', 'refletor', 'cone']
export const REELS = 5, ROWS = 3, WAYS = ROWS ** REELS
export const STAKES = [100, 200, 500, 1000, 2500, 5000] as const

export interface GolacoConfig {
  /** Paid reels. `gol` must be 0 here. Wild never appears on reel 1. */
  readonly weights: Readonly<Record<GolacoSymbol, number>>
  /** Free-spin reels. */
  readonly bonusWeights: Readonly<Record<GolacoSymbol, number>>
  /** Per-way pay for 3 / 4 / 5 reels as a fraction of the TOTAL bet, denominator payScale. */
  readonly paytable: Readonly<Record<PayingSymbol, readonly [number, number, number]>>
  readonly payScale: number
  readonly scatterTrigger: number
  readonly scatterAwards: readonly [number, number, number]
  readonly retriggerSpins: number
  readonly maxFreeSpins: number
  readonly maxStreak: number
  readonly maxWinMultiple: number
}

const w = (weights: Record<GolacoSymbol, number>) => Object.freeze(weights)
export const GOLACO_CONFIG: GolacoConfig = Object.freeze({
  weights: w({ camisa: 34, taca: 27, gol: 0, chuteira: 52, luvas: 64, apito: 78, medalha: 90, bandeira: 128, cartoes: 140, refletor: 152, cone: 166 }),
  bonusWeights: w({ camisa: 58, taca: 13, gol: 22, chuteira: 56, luvas: 66, apito: 78, medalha: 90, bandeira: 126, cartoes: 138, refletor: 150, cone: 162 }),
  paytable: Object.freeze({
    chuteira: Object.freeze([13000, 34000, 108000] as const), luvas: Object.freeze([9500, 24000, 69000] as const),
    apito: Object.freeze([7300, 17000, 47000] as const), medalha: Object.freeze([6000, 14000, 34000] as const),
    bandeira: Object.freeze([3000, 6900, 17200] as const), cartoes: Object.freeze([2600, 6000, 15000] as const),
    refletor: Object.freeze([2150, 5200, 13000] as const), cone: Object.freeze([1950, 4300, 10800] as const),
  }),
  payScale: 10000,
  scatterTrigger: 3, scatterAwards: Object.freeze([8, 12, 20] as const), retriggerSpins: 1, maxFreeSpins: 40,
  maxStreak: 5, maxWinMultiple: 1000,
})

export function validateGolacoConfig(config: GolacoConfig) {
  const positive = (n: number, max = 1_000_000) => Number.isSafeInteger(n) && n > 0 && n <= max
  const weightsOk = (weights: Readonly<Record<GolacoSymbol, number>>, allowGol: boolean) =>
    SYMBOLS.every(symbol => Number.isSafeInteger(weights[symbol]) && weights[symbol] >= 0 && (symbol === 'gol' ? allowGol ? weights[symbol] > 0 : weights[symbol] === 0 : weights[symbol] > 0))
  const awards = config.scatterAwards
  if (!positive(config.payScale) || !weightsOk(config.weights, false) || !weightsOk(config.bonusWeights, true) ||
    !Array.isArray(awards) || awards.length !== 3 || awards.some((n, i) => !positive(n, 20) || (i > 0 && n < awards[i - 1])) ||
    !positive(config.maxFreeSpins, 60) || config.maxFreeSpins < awards[2] || !positive(config.retriggerSpins, 2) ||
    !positive(config.maxStreak, 10) || !positive(config.maxWinMultiple, 5000) || !positive(config.scatterTrigger, 15) || config.scatterTrigger < 3 ||
    PAYING_SYMBOLS.some(symbol => config.paytable[symbol]?.length !== 3 ||
      config.paytable[symbol].some((rate, i, all) => !positive(rate) || (i > 0 && rate < all[i - 1])))) throw new Error('Invalid Golaço configuration')
}
