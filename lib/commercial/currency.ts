import type { CommercialCurrency } from '../geo'

/** Bare $ remains country-contextual. Explicit foreign units must never survive
 * copied campaign text. Values still require the normal human evidence review. */
export function hasMatchingCurrencyCopy(text: string, currency: CommercialCurrency): boolean {
  const units = text.match(/\b(?:MXN|COP|PEN|BRL|USD|EUR)\b/gi) ?? []
  return units.every(unit => unit.toUpperCase() === currency) && !/R\$|US\$|€/i.test(text) &&
    (currency === 'PEN' || !/\bS\/(?=\s*\d)/.test(text))
}
