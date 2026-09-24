import { GOLACO_CONFIG, PAYING_SYMBOLS, REELS, ROWS, SYMBOLS, validateGolacoConfig, type GolacoConfig, type GolacoSymbol, type PayingSymbol } from './config'

export interface SlotRandom { uint32(): number }
export const secureRandom: SlotRandom = { uint32: () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] }
export type GolacoGrid = readonly (readonly GolacoSymbol[])[] // reel-major: five columns of three
export interface WaysWin { readonly symbol: PayingSymbol; readonly reels: number; readonly ways: number; readonly rate: number; readonly cells: readonly number[] }
export interface GolacoEvaluation {
  readonly wins: readonly WaysWin[]; readonly winningCells: readonly number[]
  readonly scatters: number; readonly goals: number
  /** Multiplier applied to this spin's ways wins: 1 in the base game, the Goal Streak in free spins. */
  readonly multiplier: number
  /** Goal Streak after this spin's goals (free spins); 1 on paid spins. */
  readonly streak: number
  /** Paid spin: the 8/12/20 award. Free spin: the uncapped +1-per-trophy retrigger request. */
  readonly awardedSpins: number
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

export function reelWeights(reel: number, bonus: boolean, config: GolacoConfig = GOLACO_CONFIG): number[] {
  const table = bonus ? config.bonusWeights : config.weights
  return SYMBOLS.map(symbol => symbol === 'camisa' && reel === 0 ? 0 : table[symbol])
}

export function generateGrid(random: SlotRandom = secureRandom, bonus = false, config: GolacoConfig = GOLACO_CONFIG): GolacoGrid {
  return Object.freeze(Array.from({ length: REELS }, (_, reel) => {
    const weights = reelWeights(reel, bonus, config)
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

export function validateGrid(grid: GolacoGrid) {
  if (!Array.isArray(grid) || grid.length !== REELS || grid.some((reel, i) =>
    !Array.isArray(reel) || reel.length !== ROWS || reel.some(symbol => !SYMBOLS.includes(symbol) || (i === 0 && symbol === 'camisa')))) throw new Error('Invalid slot grid')
}

/** Longest left-to-right run per paying symbol; ways = product of matching cells per reel. */
export function evaluateWays(grid: GolacoGrid, config: GolacoConfig = GOLACO_CONFIG): readonly WaysWin[] {
  validateGrid(grid)
  const wins: WaysWin[] = []
  for (const symbol of PAYING_SYMBOLS) {
    let ways = 1, reels = 0
    const cells: number[] = []
    for (let reel = 0; reel < REELS; reel++) {
      const matches = grid[reel].flatMap((value, row) => value === symbol || value === 'camisa' ? [reel * ROWS + row] : [])
      if (!matches.length) break
      ways *= matches.length; reels++; cells.push(...matches)
    }
    if (reels >= 3) wins.push(Object.freeze({ symbol, reels, ways, rate: config.paytable[symbol][reels - 3], cells: Object.freeze(cells) }))
  }
  return Object.freeze(wins)
}

/** BigInt aggregation, one floor at 0.01 credit, capped at maxWinMultiple × stake. */
export function settleAmount(stake: number, wins: readonly Pick<WaysWin, 'ways' | 'rate'>[], multiplier: number, config: GolacoConfig = GOLACO_CONFIG) {
  if (!Number.isSafeInteger(stake) || stake <= 0 || stake > 5000 || !Number.isSafeInteger(multiplier) || multiplier < 1 || multiplier > config.maxStreak) throw new Error('Invalid payout inputs')
  const rate = wins.reduce((sum, win) => sum + BigInt(win.ways) * BigInt(win.rate), BigInt(0))
  const uncapped = BigInt(stake) * rate * BigInt(multiplier) / BigInt(config.payScale)
  const cap = BigInt(stake) * BigInt(config.maxWinMultiple)
  return { payout: Number(uncapped > cap ? cap : uncapped), capped: uncapped > cap }
}

/** Paid-spin award: 3 / 4 / 5+ trophies anywhere (adjacency irrelevant) → 8 / 12 / 20. */
export function scatterAward(scatters: number, config: GolacoConfig = GOLACO_CONFIG) {
  return scatters < config.scatterTrigger ? 0 : config.scatterAwards[Math.min(scatters - config.scatterTrigger, 2)]
}

/**
 * `streak === null` evaluates a paid spin. Otherwise it is the Goal Streak
 * before this free spin: every golden ball that lands raises it by one (cap
 * ×5) BEFORE this spin pays, and the streak multiplies this spin's wins.
 */
export function evaluateSpin(grid: GolacoGrid, stake: number, streak: number | null = null, config: GolacoConfig = GOLACO_CONFIG): GolacoEvaluation {
  if (streak !== null && (!Number.isInteger(streak) || streak < 1 || streak > config.maxStreak)) throw new Error('Invalid streak')
  const wins = evaluateWays(grid, config)
  const winningCells = [...new Set(wins.flatMap(win => win.cells))].sort((a, b) => a - b)
  const all = grid.flat()
  const scatters = all.filter(symbol => symbol === 'taca').length
  const goals = all.filter(symbol => symbol === 'gol').length
  if (streak === null && goals) throw new Error('Golden balls only exist on free-spin reels')
  const next = streak === null ? 1 : Math.min(config.maxStreak, streak + goals)
  return Object.freeze({ wins, winningCells: Object.freeze(winningCells), scatters, goals, multiplier: next, streak: next,
    awardedSpins: streak === null ? scatterAward(scatters, config) : scatters * config.retriggerSpins,
    ...settleAmount(stake, wins, next, config) })
}

export function preparedMath(config: GolacoConfig = GOLACO_CONFIG) {
  validateGolacoConfig(config)
  return { draw: (random: SlotRandom, bonus: boolean) => generateGrid(random, bonus, config),
    evaluate: (grid: GolacoGrid, stake: number, streak: number | null) => evaluateSpin(grid, stake, streak, config) }
}
