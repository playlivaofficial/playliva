import { MAX_CREDIT_UNITS } from '../credits'
import { pocketColor, validPocket } from './config'

export type BetType = 'straight' | 'split' | 'street' | 'corner' | 'six-line' | 'first-four' | 'dozen' | 'column' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high'
export interface RouletteBet { readonly id: string; readonly type: BetType; readonly numbers: readonly number[]; readonly profitOdds: number }
export interface BetPlacement { readonly betId: string; readonly amount: number }
export const PROFIT_ODDS = Object.freeze({ straight: 35, split: 17, street: 11, corner: 8, 'six-line': 5, 'first-four': 8, dozen: 2, column: 2, red: 1, black: 1, odd: 1, even: 1, low: 1, high: 1 })
const list: RouletteBet[] = []
function add(type: BetType, numbers: number[], name = numbers.join('-')) {
  list.push(Object.freeze({ id: `${type}:${name}`, type, numbers: Object.freeze(numbers), profitOdds: PROFIT_ODDS[type] }))
}
for (let n = 0; n <= 36; n++) add('straight', [n])
for (let n = 1; n <= 36; n++) {
  if (n % 3 !== 0) add('split', [n, n + 1])
  if (n <= 33) add('split', [n, n + 3])
  if (n <= 32 && n % 3 !== 0) add('corner', [n, n + 1, n + 3, n + 4])
}
for (let n = 1; n <= 3; n++) add('split', [0, n])
for (let n = 1; n <= 34; n += 3) {
  add('street', [n, n + 1, n + 2])
  if (n <= 31) add('six-line', Array.from({ length: 6 }, (_, i) => n + i))
}
add('first-four', [0,1,2,3])
for (let n = 1; n <= 3; n++) {
  add('dozen', Array.from({ length: 12 }, (_, i) => (n - 1) * 12 + i + 1), String(n))
  add('column', Array.from({ length: 12 }, (_, i) => n + 3 * i), String(n))
}
const positive = Array.from({ length: 36 }, (_, i) => i + 1)
for (const color of ['red', 'black'] as const) add(color, positive.filter(n => pocketColor(n) === color), color)
add('odd', positive.filter(n => n % 2 === 1), 'odd'); add('even', positive.filter(n => n % 2 === 0), 'even')
add('low', positive.filter(n => n <= 18), 'low'); add('high', positive.filter(n => n >= 19), 'high')
export const ROULETTE_BETS: readonly RouletteBet[] = Object.freeze(list)
const byId = new Map(ROULETTE_BETS.map(b => [b.id, b]))
export function rouletteBet(id: string): RouletteBet | undefined { return byId.get(id) }

export interface BetReturn { readonly betId: string; readonly stake: number; readonly returned: number; readonly profit: number; readonly won: boolean }
export interface RouletteSettlement { readonly number: number; readonly stake: number; readonly returned: number; readonly profit: number; readonly bets: readonly BetReturn[] }
const safe = (n: bigint) => { if (n < BigInt(0) || n > BigInt(MAX_CREDIT_UNITS)) throw new Error('Roulette amount out of bounds'); return Number(n) }
/** Validate/aggregate only canonical definitions. Callers cannot supply custom winning sets or odds. */
export function aggregateBets(placements: readonly BetPlacement[]) {
  const aggregated = new Map<string, number>()
  for (const p of placements) {
    if (!rouletteBet(p.betId) || !Number.isSafeInteger(p.amount) || p.amount <= 0 || p.amount > MAX_CREDIT_UNITS) throw new Error('Invalid roulette bet')
    aggregated.set(p.betId, safe(BigInt(aggregated.get(p.betId) ?? 0) + BigInt(p.amount)))
  }
  return [...aggregated].map(([betId, amount]) => Object.freeze({ betId, amount }))
}
/** RETURN includes the winning stake. PROFIT is net return minus ALL wagered credits. */
export function settleRoulette(placements: readonly BetPlacement[], number: number): RouletteSettlement {
  if (!validPocket(number)) throw new Error('Invalid roulette result')
  const bets = aggregateBets(placements).map(p => {
    const bet = rouletteBet(p.betId)!, won = bet.numbers.includes(number)
    const returned = won ? safe(BigInt(p.amount) * BigInt(bet.profitOdds + 1)) : 0
    return Object.freeze({ betId: bet.id, stake: p.amount, returned, profit: returned - p.amount, won })
  })
  const stake = safe(bets.reduce((n, b) => n + BigInt(b.stake), BigInt(0)))
  const returned = safe(bets.reduce((n, b) => n + BigInt(b.returned), BigInt(0)))
  return Object.freeze({ number, stake, returned, profit: returned - stake, bets: Object.freeze(bets) })
}
