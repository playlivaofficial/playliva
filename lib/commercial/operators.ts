import { GEO_CONFIG, TARGET_GEOS, type CommercialGeo } from '../geo'

/** Owner-confirmed commercial hierarchy for each active GEO. `brand` is the
 * primary operator. `sponsors` is the ordered chain allowed to fill GEO-wide
 * sponsor slots and the gameplay popup: the first brand with a live
 * sponsor-eligible campaign wins, so a pending primary never blanks a working
 * placement and a non-listed secondary never takes one. Every other approved
 * operator stays in Offers and Where to Play. This mapping holds no
 * destinations, campaign IDs or offer terms: those come only from private
 * server configuration. */
export const GEO_OPERATORS = {
  MX: { brand: 'Betsson', sponsors: ['Betsson'] },
  CO: { brand: 'bwin', sponsors: ['bwin', 'Betsson'] },
  PE: { brand: 'Inkabet', sponsors: ['Inkabet'] },
} as const satisfies Record<CommercialGeo, { brand: string; sponsors: readonly string[] }>

export function expectedOperator(geo: CommercialGeo) {
  return { geo, brand: GEO_OPERATORS[geo].brand, locale: GEO_CONFIG[geo].locale, currency: GEO_CONFIG[geo].currency }
}

export const EXPECTED_OPERATORS = TARGET_GEOS.map(expectedOperator)

const normalize = (brand: string) => brand.trim().toLowerCase()

/** Position in the GEO's sponsor chain, or -1 when the brand may never sponsor there. */
export function sponsorRank(geo: CommercialGeo, brand: string): number {
  return (GEO_OPERATORS[geo].sponsors as readonly string[]).findIndex(item => normalize(item) === normalize(brand))
}

/** The owner-confirmed primary brand of a GEO. */
export function isPrimaryBrand(geo: CommercialGeo, brand: string): boolean {
  return normalize(brand) === normalize(GEO_OPERATORS[geo].brand)
}
