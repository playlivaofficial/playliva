import { PAYING_SYMBOLS, REELS, ROWS, SLOT_CONFIG, SYMBOLS, validateConfig, type PayingSymbol, type SlotConfig, type SlotSymbol } from './config'
export interface SlotRandom { uint32(): number }
export const slotSecureRandom: SlotRandom = { uint32: () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] }
export type SlotGrid = readonly (readonly SlotSymbol[])[] // reel-major, five columns of four
export interface WaysWin { readonly symbol: PayingSymbol; readonly reels: number; readonly ways: number; readonly rate: number; readonly cells: readonly number[] }
export interface SlotEvaluation {
  readonly wins: readonly WaysWin[]; readonly winningCells: readonly number[]
  readonly scatters: number; readonly wilds: number; readonly winningWilds: number
  readonly multiplier: number; readonly bonusMultiplier: number; readonly awardedSpins: number
  readonly payout: number; readonly capped: boolean
}

/** Rejection sampling: no modulo bias and no fallback to Math.random. */
export function randomBelow(max: number, random: SlotRandom): number {
  if (!Number.isSafeInteger(max) || max <= 0 || max > 0x1_0000_0000) throw new Error('Invalid random range')
  const limit = Math.floor(0x1_0000_0000 / max) * max
  for (let i = 0; i < 128; i++) {
    const value = random.uint32()
    if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) throw new Error('Invalid random sample')
    if (value < limit) return value % max
  }
  throw new Error('Random source unavailable')
}

export function generateGrid(random: SlotRandom = slotSecureRandom, bonus = false, config: SlotConfig = SLOT_CONFIG): SlotGrid {
  return Object.freeze(Array.from({ length: REELS }, (_, reel) => {
    // Wild substitutes on reels 2–5. A normal first reel anchors every way,
    // avoiding ambiguous/double-paid all-Wild combinations.
    // Free-spin reels swap in their own Wild/Sun densities; every other weight is shared.
    const weights = SYMBOLS.map(symbol => symbol === 'wild' ? reel === 0 ? 0 : bonus ? config.bonusWildWeight : config.weights.wild
      : symbol === 'scatter' && bonus ? config.bonusScatterWeight : config.weights[symbol])
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    return Object.freeze(Array.from({ length: ROWS }, () => {
      let value = randomBelow(total, random)
      for (let i = 0; i < SYMBOLS.length; i++) {
        if (value < weights[i]) return SYMBOLS[i]
        value -= weights[i]
      }
      throw new Error('Invalid symbol weights')
    }))
  }))
}

export function validateGrid(grid: SlotGrid) {
  if (!Array.isArray(grid) || grid.length !== REELS || grid.some((reel, i) =>
    !Array.isArray(reel) || reel.length !== ROWS || reel.some(symbol => !SYMBOLS.includes(symbol) || (i === 0 && symbol === 'wild')))) throw new Error('Invalid slot grid')
}

export function evaluateWays(grid: SlotGrid, config: SlotConfig = SLOT_CONFIG): readonly WaysWin[] {
  validateGrid(grid)
  const wins: WaysWin[] = []
  for (const symbol of PAYING_SYMBOLS) {
    let ways = 1, reels = 0
    const cells: number[] = []
    for (let reel = 0; reel < REELS; reel++) {
      const matches = grid[reel].flatMap((value, row) => value === symbol || value === 'wild' ? [reel * ROWS + row] : [])
      if (!matches.length) break
      ways *= matches.length; reels++; cells.push(...matches)
    }
    if (reels >= 3) wins.push(Object.freeze({ symbol, reels, ways, rate: config.paytable[symbol][reels - 3], cells: Object.freeze(cells) }))
  }
  return Object.freeze(wins)
}

/** Floor once at the final hundredth, after ways and the actual multiplier.
 * BigInt intermediates make stake × rate × ways independent of float rounding. */
export function settleAmount(stake: number, wins: readonly WaysWin[], multiplier: number, config: SlotConfig = SLOT_CONFIG) {
  if (!Number.isSafeInteger(stake) || stake <= 0 || stake > 5000 || !Number.isSafeInteger(multiplier) || multiplier < 1 || multiplier > 100) throw new Error('Invalid payout inputs')
  const rate = wins.reduce((sum, win) => sum + BigInt(win.ways) * BigInt(win.rate), BigInt(0))
  const uncapped = BigInt(stake) * rate * BigInt(multiplier) / BigInt(config.payScale)
  const cap = BigInt(stake) * BigInt(config.maxWinMultiple)
  return { payout: Number(uncapped > cap ? cap : uncapped), capped: uncapped > cap }
}

/** Paid-spin award: 3 / 4 / 5+ Suns anywhere (adjacency irrelevant) → 8 / 12 / 20. */
export function scatterAward(scatters: number, config: SlotConfig = SLOT_CONFIG) {
  return scatters < config.scatterTrigger ? 0 : config.scatterAwards[Math.min(scatters - config.scatterTrigger, 2)]
}

export function evaluateSpin(grid: SlotGrid, stake: number, bonusMultiplier: number | null = null, config: SlotConfig = SLOT_CONFIG): SlotEvaluation {
  if (bonusMultiplier !== null && (!Number.isInteger(bonusMultiplier) || bonusMultiplier < 1 || bonusMultiplier > config.maxBonusMultiplier)) throw new Error('Invalid bonus multiplier')
  const wins = evaluateWays(grid, config)
  const winningCells = [...new Set(wins.flatMap(win => win.cells))].sort((a, b) => a - b)
  const all = grid.flat(), wilds = all.filter(symbol => symbol === 'wild').length
  const winningWilds = winningCells.filter(index => all[index] === 'wild').length
  const scatters = all.filter(symbol => symbol === 'scatter').length
  const nextBonusMultiplier = bonusMultiplier === null ? 1 : Math.min(config.maxBonusMultiplier, bonusMultiplier + wilds * config.bonusStep)
  // Gold Multiplier replaces (does not multiply by) the base Wild ladder and
  // already includes the Wilds of this spin: they land before it pays.
  const multiplier = bonusMultiplier === null ? config.wildMultipliers[Math.min(winningWilds, config.wildMultipliers.length - 1)] : nextBonusMultiplier
  return Object.freeze({ wins, winningCells: Object.freeze(winningCells), scatters, wilds, winningWilds, multiplier,
    // Paid spins: the trigger award. Free spins: the uncapped retrigger request;
    // the engine alone clamps it to the per-bonus maxFreeSpins ceiling.
    bonusMultiplier: nextBonusMultiplier, awardedSpins: bonusMultiplier === null ? scatterAward(scatters, config) : scatters * config.retriggerSpins,
    ...settleAmount(stake, wins, multiplier, config) })
}

export function preparedMath(config: SlotConfig = SLOT_CONFIG) {
  validateConfig(config)
  return { draw: (random: SlotRandom, bonus: boolean) => generateGrid(random, bonus, config),
    evaluate: (grid: SlotGrid, stake: number, bonusMultiplier: number | null) => evaluateSpin(grid, stake, bonusMultiplier, config) }
}
