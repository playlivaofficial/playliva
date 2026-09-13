/** Developer-only verification. Never imported by the public game. */
import { samplePocket, pocketColor, type RouletteRandom } from './config'
import { ROULETTE_BETS, settleRoulette } from './bets'

export function rouletteSeed(seed: number): RouletteRandom {
  let state = seed >>> 0 || 1
  return { uint32() { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return state >>> 0 } }
}
export function rouletteTheory() {
  return ROULETTE_BETS.map(bet => {
    const returnedAcrossWheel = Array.from({ length: 37 }, (_, n) => settleRoulette([{ betId: bet.id, amount: 100 }], n).returned).reduce((a, b) => a + b, 0)
    return { betId: bet.id, covered: bet.numbers.length, profitOdds: bet.profitOdds,
      returnNumerator: returnedAcrossWheel / 100, returnDenominator: 37 }
  })
}
export function simulateRoulette(rounds: number, seed = 8132026) {
  if (!Number.isSafeInteger(rounds) || rounds < 1 || rounds > 10_000_000) throw new Error('Invalid sample size')
  const random = rouletteSeed(seed), pockets = Array(37).fill(0), dozens = [0,0,0], columns = [0,0,0]
  let red = 0, black = 0, odd = 0, even = 0
  for (let i = 0; i < rounds; i++) {
    const number = samplePocket(random); pockets[number]++
    if (number > 0) {
      if (pocketColor(number) === 'red') red++; else black++
      if (number % 2) odd++; else even++
      dozens[Math.floor((number - 1) / 12)]++; columns[(number - 1) % 3]++
    }
  }
  return { purpose: 'Developer engine verification only; sampled output is not certified RTP.', rounds, seed, pockets,
    red, black, odd, even, zero: pockets[0], dozens, columns,
    theoreticalReturn: '36/37 = 97.297297...%', theoreticalHouseEdge: '1/37 = 2.702702...%',
    derivation: 'For every configured bet, covered pockets × (profit odds + 1) = 36; 37 equiprobable outcomes. No la partage/en prison.',
    theory: rouletteTheory() }
}
