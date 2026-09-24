import { GOLACO_CONFIG, PAYING_SYMBOLS, REELS, ROWS, SYMBOLS, validateGolacoConfig, type GolacoConfig } from './config'
import { evaluateSpin, generateGrid, reelWeights, type SlotRandom } from './math'

/** Test/simulation ONLY. Never imported by the public game. */
export function seededRandom(seed: number): SlotRandom {
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff) throw new Error('Seed must be a nonzero uint32')
  let value = seed >>> 0
  return { uint32: () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value >>> 0 } }
}

const probability = (reel: number, symbol: (typeof SYMBOLS)[number], bonus: boolean, config: GolacoConfig) => {
  const weights = reelWeights(reel, bonus, config), total = weights.reduce((a, b) => a + b, 0)
  return weights[SYMBOLS.indexOf(symbol)] / total
}

/**
 * Exact base-game return: cells are independent, so for each paying symbol
 * the expected ways of an exactly-L-reel run is Π_{r<L} 3·q_r × P(no match on reel L).
 */
export function exactBaseReturn(config: GolacoConfig = GOLACO_CONFIG) {
  validateGolacoConfig(config)
  let total = 0
  const bySymbol: Record<string, number> = {}
  for (const symbol of PAYING_SYMBOLS) {
    const q = Array.from({ length: REELS }, (_, reel) => probability(reel, symbol, false, config) + probability(reel, 'camisa', false, config))
    let part = 0, expectedWays = 1
    for (let reel = 0; reel < REELS; reel++) {
      expectedWays *= ROWS * q[reel]
      if (reel >= 2) {
        const stop = reel === REELS - 1 ? 1 : (1 - q[reel + 1]) ** ROWS
        part += expectedWays * stop * config.paytable[symbol][reel - 2] / config.payScale
      }
    }
    bySymbol[symbol] = part; total += part
  }
  return { total, bySymbol }
}

/** Exact trophy-count distribution on a paid spin. */
export function triggerProbabilities(config: GolacoConfig = GOLACO_CONFIG) {
  validateGolacoConfig(config)
  let distribution = [1]
  for (let reel = 0; reel < REELS; reel++) {
    const p = probability(reel, 'taca', false, config)
    for (let row = 0; row < ROWS; row++) {
      const next = Array(distribution.length + 1).fill(0)
      distribution.forEach((value, n) => { next[n] += value * (1 - p); next[n + 1] += value * p })
      distribution = next
    }
  }
  const three = distribution[3], four = distribution[4], fivePlus = distribution.slice(5).reduce((a, b) => a + b, 0)
  return { three, four, fivePlus, any: three + four + fivePlus }
}

/** One complete Final de Ouro session, exactly as the engine plays it. */
export function playBonus(random: SlotRandom, stake: number, awarded: number, config: GolacoConfig = GOLACO_CONFIG) {
  let streak = 1, remaining = awarded, total = 0, played = 0, retriggers = 0, capped = 0, goals = 0
  while (remaining > 0) {
    remaining--; played++
    const spin = evaluateSpin(generateGrid(random, true, config), stake, streak, config)
    streak = spin.streak; total += spin.payout; goals += spin.goals
    if (spin.capped) capped++
    const extra = Math.min(spin.awardedSpins, config.maxFreeSpins - awarded)
    awarded += extra; remaining += extra; retriggers += extra
  }
  return { total, played, retriggers, streak, capped, goals }
}

export function simulate(paidSpins: number, seed = 20260924, config: GolacoConfig = GOLACO_CONFIG) {
  if (!Number.isSafeInteger(paidSpins) || paidSpins < 1 || paidSpins > 10_000_000) throw new Error('Invalid simulation count')
  validateGolacoConfig(config)
  const random = seededRandom(seed), stake = 100
  let returned = 0, baseReturned = 0, hits = 0, bonuses = 0, bonusSpins = 0, retriggerSpins = 0, maxStreakBonuses = 0, maxWin = 0, capped = 0
  let wildSpins = 0, streakSum = 0
  const triggers = { three: 0, four: 0, fivePlus: 0 }
  for (let i = 0; i < paidSpins; i++) {
    const grid = generateGrid(random, false, config)
    if (grid.some(reel => reel.includes('camisa'))) wildSpins++
    const spin = evaluateSpin(grid, stake, null, config)
    let total = spin.payout
    baseReturned += spin.payout
    if (spin.capped) capped++
    if (spin.awardedSpins) {
      bonuses++
      triggers[spin.scatters >= config.scatterTrigger + 2 ? 'fivePlus' : spin.scatters === config.scatterTrigger + 1 ? 'four' : 'three']++
      const bonus = playBonus(random, stake, spin.awardedSpins, config)
      total += bonus.total; bonusSpins += bonus.played; retriggerSpins += bonus.retriggers; capped += bonus.capped
      streakSum += bonus.streak
      if (bonus.streak === config.maxStreak) maxStreakBonuses++
    }
    returned += total; if (total > 0) hits++; maxWin = Math.max(maxWin, total)
  }
  return {
    paidSpins, seed, estimatedRtp: returned / (paidSpins * stake), baseRtp: baseReturned / (paidSpins * stake),
    bonusRtp: (returned - baseReturned) / (paidSpins * stake), hitRate: hits / paidSpins,
    bonuses, bonusFrequency: bonuses / paidSpins, triggers, bonusSpins, averageBonusLength: bonuses ? bonusSpins / bonuses : 0,
    retriggerSpins, averageFinalStreak: bonuses ? streakSum / bonuses : 0, maxStreakBonuses,
    wildSpinRate: wildSpins / paidSpins, maxObservedWinMultiple: maxWin / stake, cappedSpins: capped,
  }
}

/** Exact base + exact trigger odds × simulated mean bonus value per award size. */
export function decompose(bonusSeries: number, seed = 20260924, config: GolacoConfig = GOLACO_CONFIG) {
  if (!Number.isSafeInteger(bonusSeries) || bonusSeries < 1 || bonusSeries > 1_000_000) throw new Error('Invalid simulation count')
  const odds = triggerProbabilities(config), base = exactBaseReturn(config), random = seededRandom(seed), stake = 100
  const value = config.scatterAwards.map(awarded => {
    let total = 0, played = 0, streak = 0
    for (let i = 0; i < bonusSeries; i++) { const run = playBonus(random, stake, awarded, config); total += run.total; played += run.played; streak += run.streak }
    return { awarded, meanStakeMultiple: total / bonusSeries / stake, meanSpinsPlayed: played / bonusSeries, meanFinalStreak: streak / bonusSeries }
  })
  const bonusRtp = odds.three * value[0].meanStakeMultiple + odds.four * value[1].meanStakeMultiple + odds.fivePlus * value[2].meanStakeMultiple
  return { odds, bonusOneIn: 1 / odds.any, value, baseRtp: base.total, bonusRtp, estimatedRtp: base.total + bonusRtp }
}
