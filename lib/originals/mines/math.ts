import { MAX_CREDIT_UNITS } from '../credits'
import { BOARD_SIZE, MINE_COUNTS, MULTIPLIER_SCALE, RETURN_BPS } from './config'
export interface Fraction { readonly numerator: bigint; readonly denominator: bigint }
export function combinations(n: number, k: number): bigint {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || n > BOARD_SIZE || k < 0 || k > n) throw new RangeError('Invalid combination')
  let result = BigInt(1)
  for (let i = 1; i <= Math.min(k, n - k); i++) result = result * BigInt(n - i + 1) / BigInt(i)
  return result
}
function validate(mines: number, picks: number) {
  if (!MINE_COUNTS.includes(mines) || !Number.isInteger(picks) || picks < 0 || picks > BOARD_SIZE - mines) throw new RangeError('Invalid selection count')
}
/** Exact rational P(survive k) = C(25-m,k) / C(25,k). */
export function survivalProbability(mines: number, picks: number): Fraction {
  validate(mines, picks)
  return Object.freeze({ numerator: combinations(BOARD_SIZE - mines, picks), denominator: combinations(BOARD_SIZE, picks) })
}
export function fairMultiplier(mines: number, picks: number): Fraction {
  const p = survivalProbability(mines, picks)
  return Object.freeze({ numerator: p.denominator, denominator: p.numerator })
}
/** Integer millionths; one edge applied once, then floor to six decimal places. */
export function configuredMultiplier(mines: number, picks: number, returnBps = RETURN_BPS): number {
  const fair = fairMultiplier(mines, picks)
  if (!Number.isInteger(returnBps) || returnBps < 1 || returnBps > 10000) throw new RangeError('Invalid return factor')
  if (picks === 0) return MULTIPLIER_SCALE // preview only; cashout at zero picks is forbidden
  return Number(fair.numerator * BigInt(returnBps) * BigInt(MULTIPLIER_SCALE) / (fair.denominator * BigInt(10000)))
}
/** Floor only after multiplying the integer stake by the configured multiplier. */
export function minesPayout(stake: number, mines: number, picks: number): number {
  if (!Number.isSafeInteger(stake) || stake <= 0 || stake > MAX_CREDIT_UNITS || picks === 0) throw new RangeError('Invalid payout')
  const units = BigInt(stake) * BigInt(configuredMultiplier(mines, picks)) / BigInt(MULTIPLIER_SCALE)
  if (units > BigInt(MAX_CREDIT_UNITS)) throw new RangeError('Payout exceeds wallet bound')
  return Number(units)
}
export function multiplierLabel(units: number, locale: string): string {
  if (!Number.isSafeInteger(units) || units < 0) throw new RangeError('Invalid multiplier')
  // Public two-decimal multiplier is a floored label, never payout authority.
  const hundredths = Math.floor(units / (MULTIPLIER_SCALE / 100))
  return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(hundredths / 100)}×`
}
