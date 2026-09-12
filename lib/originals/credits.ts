// Every wallet/engine amount is an integer subunit; never a floating credit value.
export const CREDIT_SCALE = 100
export const INITIAL_CREDIT_UNITS = 10_000 * CREDIT_SCALE
export const MAX_CREDIT_UNITS = 1_000_000_000 * CREDIT_SCALE

/** Parse at the UI boundary without binary-decimal rounding or exponent syntax. */
export function parseCreditInput(value: string): number {
  const input = value.trim().replace(',', '.')
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(input)) return NaN
  const [whole, fraction = ''] = input.split('.')
  const units = Number(whole) * CREDIT_SCALE + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(units) && units <= MAX_CREDIT_UNITS ? units : NaN
}

/** Format the whole and fractional integers separately; display never mutates money. */
export function formatCredits(units: number, locale: string): string {
  if (!Number.isSafeInteger(units) || units < 0) return '—'
  const formatter = new Intl.NumberFormat(locale)
  const decimal = formatter.formatToParts(1.1).find(part => part.type === 'decimal')?.value ?? '.'
  return formatter.format(Math.floor(units / CREDIT_SCALE)) + decimal + String(units % CREDIT_SCALE).padStart(2, '0')
}
