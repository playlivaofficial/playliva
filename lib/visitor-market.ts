import type { CountryCode } from './types'

/** Vercel supplies this country independently of language and browser preferences.
 * Missing/unsupported GEO fails closed. Local QA may supply the same request header. */
export function visitorMarket(headers: Pick<Headers, 'get'>): CountryCode | null {
  const country = headers.get('x-vercel-ip-country')?.toUpperCase()
  return country === 'BR' || country === 'MX' ? country : null
}
