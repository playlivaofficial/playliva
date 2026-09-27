import { createHmac, randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'
import { ANALYTICS_COOKIE } from '@/lib/consent'
import { eventInput } from '@/lib/owner/server/event-input'
import { recordEvent } from '@/lib/owner/server/event-store'
import { postgresConfigured } from '@/lib/owner/server/postgres'

export const runtime = 'nodejs'
const salt = randomBytes(32), buckets = new Map<string, { at: number; count: number }>()
const respond = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } })

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin'), host = request.headers.get('host')
  let source: URL
  try { source = new URL(origin ?? '') } catch { return respond(403) }
  if (source.host !== host || !['https:', ...(process.env.VERCEL ? [] : ['http:'])].includes(source.protocol) || request.headers.get('sec-fetch-site') === 'cross-site' || request.cookies.get(ANALYTICS_COOKIE)?.value !== 'granted') return respond(403)
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json' || Number(request.headers.get('content-length')) > 4096) return respond(413)
  // Short-lived in-memory buckets; no raw IP, hash, user ID or cookie is stored
  // in the event database. The database also imposes a 100k/day safety ceiling.
  const now = Date.now()
  for (const [key, value] of buckets) if (now - value.at > 60000) buckets.delete(key)
  const key = createHmac('sha256', salt).update(request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? 'local').digest('hex')
  const bucket = buckets.get(key) ?? { at: now, count: 0 }
  if (buckets.size >= 5000 && !buckets.has(key) || ++bucket.count > 240) return respond(429)
  buckets.set(key, bucket)
  let input: unknown
  try {
    const reader = request.body?.getReader()
    if (!reader) return respond(400)
    const chunks: Uint8Array[] = []; let bytes = 0
    while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 4096) { await reader.cancel(); return respond(413) }; chunks.push(value) }
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch { return respond(400) }
  const event = eventInput(input, request.headers)
  if (!event) return respond(400)
  if (!postgresConfigured()) return respond(503)
  try { return respond(await recordEvent(event) ? 202 : 429) } catch { return respond(503) }
}
