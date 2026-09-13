import { SLOT_CONFIG, validateConfig, type SlotConfig } from './config'
import { evaluateSpin, generateGrid, type SlotRandom } from './math'

/** Test/simulation ONLY. Never imported by the public game. */
export function seededRandom(seed: number): SlotRandom {
  if (!Number.isInteger(seed) || seed <= 0 || seed > 0xffff_ffff) throw new Error('Seed must be a nonzero uint32')
  let value = seed >>> 0
  return { uint32: () => { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value >>> 0 } }
}
export function simulate(paidSpins: number, seed = 6242026, config: SlotConfig = SLOT_CONFIG) {
  if (!Number.isSafeInteger(paidSpins) || paidSpins < 1 || paidSpins > 10000000) throw new Error('Invalid simulation count')
  validateConfig(config)
  const random = seededRandom(seed), stake = 100
  let returned = 0, hits = 0, bonuses = 0, bonusSpins = 0, maxWin = 0, capped = 0
  for (let i = 0; i < paidSpins; i++) {
    const result = evaluateSpin(generateGrid(random, false, config), stake, null, config)
    let total = result.payout
    if (result.capped) capped++
    if (result.awardedSpins) {
      bonuses++; let multiplier = 1
      for (let j = 0; j < result.awardedSpins; j++) {
        const free = evaluateSpin(generateGrid(random, true, config), stake, multiplier, config)
        multiplier = free.bonusMultiplier; total += free.payout; bonusSpins++
        if (free.capped) capped++
      }
    }
    returned += total; if (total > 0) hits++; maxWin = Math.max(maxWin, total)
  }
  return { paidSpins, seed, bonusSpins, bonuses, estimatedRtp: returned / (paidSpins * stake),
    hitRate: hits / paidSpins, bonusFrequency: bonuses / paidSpins, averageWinCredits: returned / paidSpins / 100,
    averageHitCredits: hits ? returned / hits / 100 : 0, maxObservedWinMultiple: maxWin / stake, cappedSpins: capped }
}
