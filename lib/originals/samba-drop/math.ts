export const ROWS = [8, 12, 16] as const
export const RISKS = ['low', 'medium', 'high'] as const
export type Rows = typeof ROWS[number]
export type Risk = typeof RISKS[number]
export interface RandomSource { uint32(): number }
export const secureRandom: RandomSource = { uint32: () => crypto.getRandomValues(new Uint32Array(1))[0] }
export const SCALE = 10000
export function binomial(n: number, k: number) { let value = 1; for (let i = 1; i <= k; i++) value = value * (n - i + 1) / i; return value }
/** Original symmetric risk curves, normalized to <=97% before integer-credit rounding. */
export function configuration(rows: Rows, risk: Risk) {
  if (!ROWS.includes(rows) || !RISKS.includes(risk)) throw Error('Invalid board configuration')
  const probability = Array.from({ length: rows + 1 }, (_, k) => binomial(rows, k) / 2 ** rows)
  const curvature = { low: .14, medium: .32, high: .5 }[risk]
  const weights = probability.map((_, k) => Math.exp(curvature * ((k - rows / 2) / Math.sqrt(rows / 4)) ** 2))
  const mean = weights.reduce((sum, w, i) => sum + w * probability[i], 0)
  const multipliers = weights.map(w => Math.floor(.97 * w / mean * SCALE))
  return Object.freeze({ rows, risk, probability: Object.freeze(probability), multipliers: Object.freeze(multipliers),
    expectedReturn: probability.reduce((sum, p, i) => sum + p * multipliers[i] / SCALE, 0),
    profitFrequency: probability.reduce((sum, p, i) => sum + (multipliers[i] > SCALE ? p : 0), 0),
    maxMultiplier: Math.max(...multipliers) / SCALE })
}
/** Every bit is an independent unbiased left/right decision, including rare outer paths. */
export function drawPath(rows: Rows, random: RandomSource = secureRandom): readonly number[] {
  if (!ROWS.includes(rows)) throw Error('Invalid rows')
  const value = random.uint32()
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) throw Error('Invalid random sample')
  return Object.freeze(Array.from({ length: rows }, (_, i) => (value >>> i) & 1))
}
export function bucketFor(path: readonly number[]) {
  if (!ROWS.includes(path.length as Rows) || path.some(bit => bit !== 0 && bit !== 1)) throw Error('Invalid path')
  return path.reduce((sum, bit) => sum + bit, 0)
}
export function payoutFor(stake: number, rate: number) {
  if (!Number.isSafeInteger(stake) || stake < 100 || stake > 5000 || !Number.isSafeInteger(rate) || rate < 0) throw Error('Invalid payout')
  return Number(BigInt(stake) * BigInt(rate) / BigInt(SCALE))
}
export const dropDuration = (rows: Rows) => 600 + rows * 170
