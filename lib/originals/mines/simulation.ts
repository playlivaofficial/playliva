import { BOARD_SIZE, MINE_COUNTS, RETURN_BPS, generateMines } from './config'
import { combinations, configuredMultiplier, survivalProbability } from './math'
/** Seeded verification only; never used by the production engine. */
export function simulateMines(rounds = 100000, seed = 9132026) {
  if (!Number.isInteger(rounds) || rounds < 1000 || rounds > 1000000) throw new RangeError('Invalid sample size')
  let state = seed >>> 0
  if (!state) throw new RangeError('Seed must be nonzero')
  const random = { uint32() { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0 } }
  return MINE_COUNTS.map(mines => {
    const cells = Array<number>(BOARD_SIZE).fill(0), survivors = Array<number>(BOARD_SIZE - mines + 1).fill(0)
    for (let n = 0; n < rounds; n++) {
      const layout = generateMines(mines, random)
      if (layout.length !== mines || new Set(layout).size !== mines) throw new Error('Invalid layout')
      layout.forEach(cell => { cells[cell]++ }); survivors[0]++
      for (let k = 0; k < BOARD_SIZE - mines && !layout.includes(k); k++) survivors[k + 1]++
    }
    const progression = survivors.map((survived, picks) => {
      const probability = survivalProbability(mines, picks), multiplier = configuredMultiplier(mines, picks)
      if (picks && multiplier <= configuredMultiplier(mines, picks - 1)) throw new Error('Multiplier regression')
      if (probability.numerator * combinations(BOARD_SIZE, mines) !== probability.denominator * combinations(BOARD_SIZE - picks, mines)) throw new Error('Combination mismatch')
      return { picks, survived, probability: Number(probability.numerator) / Number(probability.denominator), multiplier }
    })
    return { mines, rounds, seed, returnBps: RETURN_BPS, expectedPerCell: rounds * mines / BOARD_SIZE, cells, progression }
  })
}
