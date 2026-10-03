import 'server-only'
import { cookies } from 'next/headers'
import { AVIA_COOKIE, aviaRequest, newGuest, validGuest, allowedAviaOrigin } from '@/lib/originals/avia/server'
import type { AviaAction } from '@/lib/originals/avia/engine'

export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
export async function POST(request: Request) {
  if (!allowedAviaOrigin(request) || !request.headers.get('content-type')?.startsWith('application/json')) return Response.json({ error: 'forbidden' }, { status: 403, headers })
  try {
    const text = await request.text()
    if (text.length > 1024) return Response.json({ error: 'invalid-request' }, { status: 400, headers })
    let action: AviaAction
    try { action = JSON.parse(text) as AviaAction }
    catch { return Response.json({ error: 'invalid-request' }, { status: 400, headers }) }
    if (!action || !['state', 'bet', 'cashout', 'next'].includes(action.type) || (action.type !== 'state' && (typeof action.roundId !== 'string' || !/^[\w-]{1,80}$/.test(action.roundId)))) return Response.json({ error: 'invalid-request' }, { status: 400, headers })
    const jar = await cookies(), existing = jar.get(AVIA_COOKIE)?.value, token = validGuest(existing) ? existing : newGuest()
    // A fresh session can only be created by a state read, never a bet/cashout retry.
    if (!validGuest(existing) && action.type !== 'state') return Response.json({ error: 'session-expired' }, { status: 409, headers })
    const { view, error, guestId } = await aviaRequest(token, action)
    if (token !== existing) jar.set(AVIA_COOKIE, token, { httpOnly: true, secure: Boolean(process.env.VERCEL), sameSite: 'strict', path: '/api/originals/avia', maxAge: 60 * 60 * 24 * 30 })
    return Response.json({ view, error, guestId }, { headers })
  } catch { return Response.json({ error: 'temporarily-unavailable' }, { status: 503, headers }) }
}
