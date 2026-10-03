import type { Locale } from './types'

export const TARGET_GEOS = ['MX', 'CO', 'PE'] as const
export type CommercialGeo = (typeof TARGET_GEOS)[number]
export type CommercialCurrency = 'MXN' | 'COP' | 'PEN'

export const GEO_CONFIG = {
  MX: { code: 'MX', name: 'México', locale: 'es-MX', currency: 'MXN', flag: '🇲🇽', responsible: 'Juega con responsabilidad. Solo para personas adultas. Revisa las condiciones y la autorización aplicable antes de elegir un operador.' },
  CO: { code: 'CO', name: 'Colombia', locale: 'es-CO', currency: 'COP', flag: '🇨🇴', responsible: 'Juega con responsabilidad. Solo para personas adultas. Consulta las condiciones y la autorización aplicable en Colombia.' },
  PE: { code: 'PE', name: 'Perú', locale: 'es-PE', currency: 'PEN', flag: '🇵🇪', responsible: 'Juega con responsabilidad. Solo para personas adultas. Comprueba las condiciones y la autorización aplicable en Perú.' },
} as const satisfies Record<CommercialGeo, { code: CommercialGeo; name: string; locale: string; currency: CommercialCurrency; flag: string; responsible: string }>

export function isCommercialGeo(value: unknown): value is CommercialGeo {
  return typeof value === 'string' && (TARGET_GEOS as readonly string[]).includes(value)
}
export function geoForLocale(locale: string): CommercialGeo | null {
  return locale.toLowerCase() === 'es-mx' ? 'MX' : locale.toLowerCase() === 'es-co' ? 'CO' : locale.toLowerCase() === 'es-pe' ? 'PE' : null
}
export function getGeoConfig(geo: unknown) { return isCommercialGeo(geo) ? GEO_CONFIG[geo] : null }
export function formatMarketMoney(value: number, geo: CommercialGeo, locale: Locale = GEO_CONFIG[geo].locale as Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: GEO_CONFIG[geo].currency, currencyDisplay: 'code' }).format(value)
}
