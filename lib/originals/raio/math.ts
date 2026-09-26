import { randomBelow, secureCardRandom, type CardRandom } from '../blackjack/cards'
import { aggregateBets, rouletteBet, type BetPlacement } from '../roulette/bets'
import { validPocket } from '../roulette/config'

export const RAIO_MULTIPLIERS = [40, 80, 160, 260] as const
export const RAIO_WEIGHTS = [50, 40, 9, 1] as const
export interface PowerNumber { readonly number: number; readonly multiplier: number }
export function selectPowerNumbers(random: CardRandom = secureCardRandom): readonly PowerNumber[] {
  const pool = Array.from({ length: 37 }, (_, n) => n)
  return Object.freeze(Array.from({ length: 4 }, () => {
    const number = pool.splice(randomBelow(random, pool.length), 1)[0]
    const roll = randomBelow(random, 100)
    const multiplier = roll < 50 ? 40 : roll < 90 ? 80 : roll < 99 ? 160 : 260
    return Object.freeze({ number, multiplier })
  }))
}
/** All multipliers are TOTAL return including stake; boosts replace, never add. */
export function settleRaio(ticket: readonly BetPlacement[], number: number, powers: readonly PowerNumber[]) {
  if (!validPocket(number) || powers.length !== 4 || new Set(powers.map(p => p.number)).size !== 4 ||
    powers.some(p => !validPocket(p.number) || !RAIO_MULTIPLIERS.includes(p.multiplier as typeof RAIO_MULTIPLIERS[number]))) throw Error('Invalid result')
  const boost = powers.find(p => p.number === number)
  const bets = aggregateBets(ticket).map(p => {
    const bet = rouletteBet(p.betId)!, won = bet.numbers.includes(number)
    const boosted = won && bet.type === 'straight' && Boolean(boost)
    const returned = won ? p.amount * (bet.type === 'straight' ? boost?.multiplier ?? 32 : bet.profitOdds + 1) : 0
    return { ...p, returned, boosted }
  })
  const stake = bets.reduce((s,b) => s+b.amount,0), returned = bets.reduce((s,b) => s+b.returned,0)
  return Object.freeze({ number, stake, returned, profit: returned-stake, boosted: bets.some(b=>b.boosted) })
}
export const RAIO_EXPECTED_RETURN = (33 * 32 + 4 * (40*.5 + 80*.4 + 160*.09 + 260*.01)) / (37*37)
