import { allowedOrigin } from '@/lib/owner/server/auth'
import { ownerGeoStatus, requestOwnerToken, setOwnerPreviewGeo } from '@/lib/owner/server/geo-preview'
import { PRIVATE_HEADERS } from '@/lib/owner/private-headers'
import { isCommercialGeo } from '@/lib/geo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { ...PRIVATE_HEADERS, Vary: 'Cookie' } })

export async function GET(request: Request) {
  const status = await ownerGeoStatus(request.headers)
  return status.authorized ? reply(status) : reply({ error: 'Owner authentication required.' }, 401)
}

export async function POST(request: Request) {
  if (!allowedOrigin(request) || new URL(request.url).search) return reply({ error: 'Origin or request not allowed.' }, 403)
  if (!(await ownerGeoStatus(request.headers)).authorized) return reply({ error: 'Owner authentication required.' }, 401)
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({ error: 'JSON request required.' }, 400)
  try {
    const reader = request.body?.getReader()
    if (!reader) return reply({ error: 'Invalid preview GEO.' }, 400)
    let text = '', bytes = 0
    const decoder = new TextDecoder()
    while (true) {
      const part = await reader.read()
      if (part.done) break
      bytes += part.value.length
      if (bytes > 128) { await reader.cancel(); return reply({ error: 'Request is too large.' }, 413) }
      text += decoder.decode(part.value, { stream: true })
    }
    const body = JSON.parse(text + decoder.decode())
    if (!body || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'country') || (body.country !== null && !isCommercialGeo(body.country))) return reply({ error: 'Invalid preview GEO.' }, 400)
    if (!await setOwnerPreviewGeo(requestOwnerToken(request.headers), body.country)) return reply({ error: 'Owner authentication required.' }, 401)
    return reply(await ownerGeoStatus(request.headers))
  } catch { return reply({ error: 'Preview could not be updated. Refresh and try again.' }, 400) }
}
