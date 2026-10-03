import { authorizedSession, hashToken, ownerCookie, passwordConfig } from './auth'
import { updateOwnerState } from './store'
import { visitorMarket } from '../../visitor-market'
import { isCommercialGeo, type CommercialGeo } from '../../geo'

export type PreviewGeo = CommercialGeo | null
export interface OwnerGeoStatus { authorized: boolean; previewGeo: PreviewGeo; realCountry: string | null }

/** Only the existing opaque owner credential is accepted; duplicate cookies fail closed. */
export function requestOwnerToken(headers: Pick<Headers, 'get'>) {
  const name = ownerCookie() + '='
  const values = (headers.get('cookie') ?? '').split(';').map(value => value.trim()).filter(value => value.startsWith(name))
  return values.length === 1 ? values[0].slice(name.length) : undefined
}

export async function ownerGeoStatus(headers: Pick<Headers, 'get'>): Promise<OwnerGeoStatus> {
  const session = await authorizedSession(requestOwnerToken(headers))
  const country = headers.get('x-vercel-ip-country')?.toUpperCase() ?? ''
  return {
    authorized: Boolean(session),
    previewGeo: isCommercialGeo(session?.previewGeo) ? session.previewGeo : null,
    realCountry: /^[A-Z]{2}$/.test(country) ? country : null,
  }
}

/** One server boundary for rendered commercial surfaces and outbound redirects.
 * Never changes the real GEO resolver used for ordinary traffic and reporting. */
export async function commercialMarket(headers: Pick<Headers, 'get'>) {
  return (await ownerGeoStatus(headers)).previewGeo ?? visitorMarket(headers)
}

export async function setOwnerPreviewGeo(token: string | undefined, geo: unknown) {
  if (geo !== null && !isCommercialGeo(geo)) throw new Error('Invalid preview GEO.')
  if (!token || !await authorizedSession(token)) return false
  const config = await passwordConfig()
  if (!config) return false
  // Recheck inside the atomic update: expiry/logout must never resurrect a session.
  return updateOwnerState(state => {
    const session = state.sessions[hashToken(token)]
    if (!session || session.expiresAt <= Date.now() || session.fingerprint !== hashToken(config)) return false
    session.previewGeo = geo
    return true
  })
}
