import { GEO_CONFIG, TARGET_GEOS, type CommercialGeo } from '../geo'

/** Owner-confirmed operator for each active commercial GEO. This mapping holds
 * no destinations, campaign IDs or offer terms: those come only from private
 * server configuration. It drives Owner diagnostics and legacy key scoping. */
export const GEO_OPERATORS = {
  MX: { brand: 'Betsson' },
  CO: { brand: 'Betsson' },
  PE: { brand: 'Inkabet' },
} as const satisfies Record<CommercialGeo, { brand: string }>

export function expectedOperator(geo: CommercialGeo) {
  return { geo, brand: GEO_OPERATORS[geo].brand, locale: GEO_CONFIG[geo].locale, currency: GEO_CONFIG[geo].currency }
}

export const EXPECTED_OPERATORS = TARGET_GEOS.map(expectedOperator)
