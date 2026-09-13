import type { OriginalGameDefinition } from '../definition'

export const LIVA_ROULETTE: OriginalGameDefinition = Object.freeze({
  id: 'liva-roulette', slug: 'roulette', category: 'table-games',
  title: { en: 'Liva Roulette: Golden Orbit', 'pt-BR': 'Liva Roulette: Golden Orbit', 'es-MX': 'Liva Roulette: Golden Orbit' },
})
export const WHEEL_ORDER = Object.freeze([0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26])
export const RED_NUMBERS = Object.freeze([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
export const ROULETTE_CHIPS = Object.freeze([100,200,500,1000,2500,5000,10000])
export const ROULETTE_LIMITS = Object.freeze({ maxStake: 1_000_000, maxPlacements: 250 })
export const ROULETTE_TIMING = Object.freeze({ closingMs: 160, spinMs: 3800, settlingMs: 120, resultMs: 850 })
export function validPocket(n: number) { return Number.isInteger(n) && n >= 0 && n <= 36 }
export function pocketColor(n: number): 'green' | 'red' | 'black' {
  if (!validPocket(n)) throw new Error('Invalid roulette pocket')
  return n === 0 ? 'green' : RED_NUMBERS.includes(n) ? 'red' : 'black'
}

export interface RouletteRandom { uint32(): number }
export const secureRouletteRandom: RouletteRandom = { uint32: () => crypto.getRandomValues(new Uint32Array(1))[0] }
/** 2^32 is not divisible by 37. Reject the tail instead of introducing modulo bias. */
export function samplePocket(random: RouletteRandom = secureRouletteRandom): number {
  const limit = Math.floor(0x1_0000_0000 / 37) * 37
  for (let attempts = 0; attempts < 10000; attempts++) {
    const n = random.uint32()
    if (!Number.isInteger(n) || n < 0 || n > 0xffff_ffff) throw new Error('Invalid roulette entropy')
    if (n < limit) return n % 37
  }
  throw new Error('Roulette random source unavailable')
}
