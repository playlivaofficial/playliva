import type { OriginalGameDefinition } from '../definition'

export const LIVA_MINES: OriginalGameDefinition = Object.freeze({ id: 'liva-mines', slug: 'mines', category: 'instant-games',
  title: Object.freeze({ en: 'Liva Mines: Jungle Gold', 'pt-BR': 'Liva Mines: Jungle Gold', 'es-MX': 'Liva Mines: Jungle Gold' }) })
export const BOARD_SIZE = 25
export const MINE_COUNTS: readonly number[] = Object.freeze([1, 3, 5, 7, 10])
export const DEFAULT_MINES = 3
export const MINES_STAKES: readonly number[] = Object.freeze([100, 200, 500, 1000, 2500, 5000])
export const MULTIPLIER_SCALE = 1_000_000
// A single 3% demo edge, applied to the inverse survival probability, not per pick.
export const RETURN_BPS = 9700
export const MINES_TIMING = Object.freeze({ impactMs: 260, readyMs: 600 })
export interface MinesRandom { uint32(): number }
const secure: MinesRandom = { uint32() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure entropy unavailable')
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
} }
export function boundedInteger(bound: number, random: MinesRandom = secure): number {
  if (!Number.isInteger(bound) || bound < 1 || bound > BOARD_SIZE) throw new RangeError('Invalid bound')
  const ceiling = Math.floor(0x100000000 / bound) * bound
  for (let attempt = 0; attempt < 128; attempt++) {
    const value = random.uint32()
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw new Error('Invalid entropy')
    if (value < ceiling) return value % bound
  }
  throw new Error('Entropy rejection limit')
}
/** Partial Fisher–Yates: every m-subset has probability 1 / C(25,m). */
export function generateMines(count: number, random?: MinesRandom): readonly number[] {
  if (!MINE_COUNTS.includes(count)) throw new RangeError('Unsupported mine count')
  const cells = Array.from({ length: BOARD_SIZE }, (_, i) => i)
  for (let i = 0; i < count; i++) {
    const j = i + boundedInteger(BOARD_SIZE - i, random)
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  return Object.freeze(cells.slice(0, count).sort((a, b) => a - b))
}
