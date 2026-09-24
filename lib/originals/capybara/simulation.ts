import { REELS, ROWS, SLOT_CONFIG, SYMBOLS, validateConfig, type SlotConfig } from './config'
import { evaluateSpin, generateGrid, type SlotRandom } from './math'

/** Test/simulation ONLY. Never imported by the public game. */
export function seededRandom(seed: number): SlotRandom {
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff) throw new Error('Seed must be a nonzero uint32')
  let value = seed >>> 0
  return { uint32: () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value >>> 0 } }
}

/** Exact paid-spin Sun count distribution: every cell is an independent weighted draw. */
export function triggerProbabilities(config: SlotConfig = SLOT_CONFIG) {
  validateConfig(config)
  let distribution = [1]
  for (let reel = 0; reel < REELS; reel++) {
    const total = SYMBOLS.reduce((sum, symbol) => sum + (symbol === 'wild' ? reel === 0 ? 0 : config.weights.wild : config.weights[symbol]), 0)
    const p = config.weights.scatter / total
    for (let row = 0; row < ROWS; row++) {
      const next = Array(distribution.length + 1).fill(0)
      distribution.forEach((value, suns) => { next[suns] += value * (1 - p); next[suns + 1] += value * p })
      distribution = next
    }
  }
  const three = distribution[3], four = distribution[4], five = distribution.slice(5).reduce((a, b) => a + b, 0)
  return { three, four, fivePlus: five, any: three + four + five }
}

/** One complete free-spin session, exactly as the engine plays it. */
export function playBonus(random: SlotRandom, stake: number, awarded: number, config: SlotConfig = SLOT_CONFIG) {
  let multiplier = 1, remaining = awarded, total = 0, played = 0, retriggers = 0, capped = 0
  while (remaining > 0) {
    remaining--; played++
    const free = evaluateSpin(generateGrid(random, true, config), stake, multiplier, config)
    multiplier = free.bonusMultiplier; total += free.payout
    if (free.capped) capped++
    const extra = Math.min(free.awardedSpins, config.maxFreeSpins - awarded)
    awarded += extra; remaining += extra; retriggers += extra
  }
  return { total, played, retriggers, multiplier, capped }
}

export function simulate(paidSpins: number, seed = 6242026, config: SlotConfig = SLOT_CONFIG) {
  if (!Number.isSafeInteger(paidSpins) || paidSpins < 1 || paidSpins > 10000000) throw new Error('Invalid simulation count')
  validateConfig(config)
  const random = seededRandom(seed), stake = 100
  let returned = 0, baseReturned = 0, hits = 0, bonuses = 0, bonusSpins = 0, retriggerSpins = 0, maxMultiplierBonuses = 0, maxWin = 0, capped = 0
  const triggers = { three: 0, four: 0, fivePlus: 0 }
  for (let i = 0; i < paidSpins; i++) {
    const result = evaluateSpin(generateGrid(random, false, config), stake, null, config)
    let total = result.payout
    baseReturned += result.payout
    if (result.capped) capped++
    if (result.awardedSpins) {
      bonuses++
      triggers[result.scatters >= config.scatterTrigger + 2 ? 'fivePlus' : result.scatters === config.scatterTrigger + 1 ? 'four' : 'three']++
      const bonus = playBonus(random, stake, result.awardedSpins, config)
      total += bonus.total; bonusSpins += bonus.played; retriggerSpins += bonus.retriggers; capped += bonus.capped
      if (bonus.multiplier === config.maxBonusMultiplier) maxMultiplierBonuses++
    }
    returned += total; if (total > 0) hits++; maxWin = Math.max(maxWin, total)
  }
  return { paidSpins, seed, bonusSpins, bonuses, triggers, retriggerSpins, maxMultiplierBonuses,
    estimatedRtp: returned / (paidSpins * stake), baseRtp: baseReturned / (paidSpins * stake),
    bonusRtp: (returned - baseReturned) / (paidSpins * stake),
    hitRate: hits / paidSpins, bonusFrequency: bonuses / paidSpins, averageWinCredits: returned / paidSpins / 100,
    averageHitCredits: hits ? returned / hits / 100 : 0, maxObservedWinMultiple: maxWin / stake, cappedSpins: capped }
}

/**
 * Lower-variance decomposition: exact trigger odds × simulated mean bonus value
 * per award size, plus a simulated base game. Estimates, never certification.
 */
export function decompose(paidSpins: number, bonusSeries: number, seed = 6242026, config: SlotConfig = SLOT_CONFIG) {
  if (!Number.isSafeInteger(bonusSeries) || bonusSeries < 1 || bonusSeries > 1000000) throw new Error('Invalid simulation count')
  const odds = triggerProbabilities(config), random = seededRandom(seed), stake = 100
  const base = simulate(paidSpins, seed, config).baseRtp
  const value = config.scatterAwards.map(awarded => {
    let total = 0, played = 0, multiplier = 0
    for (let i = 0; i < bonusSeries; i++) { const run = playBonus(random, stake, awarded, config); total += run.total; played += run.played; multiplier += run.multiplier }
    return { awarded, meanStakeMultiple: total / bonusSeries / stake, meanSpinsPlayed: played / bonusSeries, meanFinalMultiplier: multiplier / bonusSeries }
  })
  const bonusRtp = odds.three * value[0].meanStakeMultiple + odds.four * value[1].meanStakeMultiple + odds.fivePlus * value[2].meanStakeMultiple
  return { odds, bonusOneIn: 1 / odds.any, value, baseRtp: base, bonusRtp, estimatedRtp: base + bonusRtp }
}
