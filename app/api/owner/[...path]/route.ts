import { cookies } from 'next/headers'
import { localMediaStream } from '@/lib/owner/server/local-files'
import { Readable } from 'node:stream'
import { apiAuthorized, ownerJson, PRIVATE_HEADERS } from '@/lib/owner/server/gate'
import { allowedOrigin, login, ownerCookie, SESSION_SECONDS, sessionCookieOptions, refreshSession, revokeSession } from '@/lib/owner/server/auth'
import { mediaFile, reviewCreative } from '@/lib/owner/server/social'
import { syncYouTube } from '@/lib/owner/server/youtube'
import { saveContent } from '@/lib/owner/server/content'
import { growthData } from '@/lib/owner/server/overview'
import { safeId } from '@/lib/owner/model'
import { generatedMediaResponse, privateStorageConfigured } from '@/lib/owner/server/object-storage'
import { enqueueBatch, retryFailures, setPinned } from '@/lib/owner/server/automation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
type Context = { params: Promise<{ path: string[] }> }
async function smallJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('JSON request required.')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Request body required.')
  let text = '', size = 0
  const decoder = new TextDecoder()
  while (true) {
    const part = await reader.read()
    if (part.done) break
    size += part.value.length
    if (size > 8192) { await reader.cancel(); throw new Error('Request is too large.') }
    text += decoder.decode(part.value, { stream: true })
  }
  const body = JSON.parse(text + decoder.decode())
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request.')
  return body
}
export async function POST(request: Request, context: Context) {
  const { path } = await context.params
  if (!allowedOrigin(request)) return ownerJson({ error: 'Origin not allowed.' }, 403)
  if (path.join('/') !== 'login' && !await apiAuthorized(request, true)) return ownerJson({ error: 'Owner authentication required.' }, 401)
  try {
    const body = await smallJson(request)
    if (path.join('/') === 'login') {
      const token = await login(typeof body.password === 'string' ? body.password : '')
      ;(await cookies()).set(ownerCookie(), token, sessionCookieOptions(Date.now() + SESSION_SECONDS * 1000))
      return ownerJson({ message: 'Signed in.', redirect: '/owner/growth' })
    }
    if (path.join('/') === 'logout') {
      const jar = await cookies(), token = jar.get(ownerCookie())?.value
      await revokeSession(token)
      jar.set(ownerCookie(), '', sessionCookieOptions(0))
      return ownerJson({ message: 'Signed out.', redirect: '/owner/login' })
    }
    if (path.join('/') === 'session') {
      const jar = await cookies(), token = jar.get(ownerCookie())?.value
      const session = await refreshSession(token)
      if (!session || !token) return ownerJson({ error: 'Owner authentication required.' }, 401)
      // Also return the existing expiry on a concurrent renewal / lost response,
      // so browser and durable state never diverge. This does not extend idle sessions.
      jar.set(ownerCookie(), token, sessionCookieOptions(session.expiresAt))
      return ownerJson({ renewed: session.renewed })
    }
    if (path[0] === 'social' && path.length === 2 && safeId(path[1]) && ['approve', 'reject', 'regenerate'].includes(String(body.action))) {
      if (body.action === 'approve' && body.reviewed !== 'on') return ownerJson({ error: 'Confirm that you have reviewed this creative before approving it.' }, 400)
      return ownerJson({ message: await reviewCreative(path[1], body.action as 'approve' | 'reject' | 'regenerate', typeof body.reason === 'string' ? body.reason : '') })
    }
    if (path.join('/') === 'youtube/sync') return ownerJson({ message: await syncYouTube() })
    if (path.join('/') === 'generation/batch') {
      if (body.confirmed !== 'yes' || !privateStorageConfigured()) throw new Error('Social generation requires confirmation and private storage.')
      const id = await enqueueBatch('manual')
      return ownerJson({ message: id ? `Batch ${id} queued. The cloud worker will pick it up; nothing is published.` : 'Generation is not armed. Complete the production canary first.' })
    }
    if (path[0] === 'generation' && path[1] === 'retry' && path.length === 3 && safeId(path[2])) return ownerJson({ message: `${await retryFailures(path[2])} failed jobs queued for the next worker run.` })
    if (path[0] === 'pin' && path.length === 2 && safeId(path[1]) && ['yes', 'no'].includes(String(body.pinned))) {
      await setPinned(path[1], body.pinned === 'yes')
      return ownerJson({ message: body.pinned === 'yes' ? 'Pinned. Media is protected from cleanup.' : 'Unpinned. Normal retention applies.' })
    }
    if (path.join('/') === 'content') return ownerJson({ message: await saveContent(body) })
    return ownerJson({ error: 'Unknown owner action.' }, 404)
  } catch (error) {
    // Only application-owned messages are exposed. Filesystem/OAuth details never leave the server.
    const message = error instanceof Error ? error.message : ''
    const safe = /^(Owner |Sign-in |Too many |Creative |This creative |Approval |Google |YouTube |Social |Provide |Use a clean |Published status |Invalid content |Durable owner |JSON request |Request |Content |Start date)/.test(message)
    return ownerJson({ error: safe ? message : 'This action could not be completed. Existing data was preserved.' }, 400)
  }
}
export async function GET(request: Request, context: Context) {
  if (!await apiAuthorized(request)) return ownerJson({ error: 'Owner authentication required.' }, 401)
  const { path } = await context.params
  if (path[0] === 'media' && path.length === 3 && safeId(path[1]) && ['video', 'thumbnail'].includes(path[2])) {
    try {
      const generated = await generatedMediaResponse(path[1], path[2] as 'video' | 'thumbnail', request)
      if (generated) return generated
    } catch { return ownerJson({ error: 'Private media is temporarily unavailable.' }, 503) }
    const file = await mediaFile(path[1], path[2] as 'video' | 'thumbnail')
    if (!file) return ownerJson({ error: 'Media is not available in the connected storage.' }, 404)
    let start = 0, end = file.size - 1
    const range = request.headers.get('range')
    if (range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range)
      if (!match) return new Response(null, { status: 416, headers: { ...PRIVATE_HEADERS, 'Content-Range': `bytes */${file.size}` } })
      start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end
      if (!Number.isSafeInteger(start) || start > end || start < 0) return new Response(null, { status: 416, headers: { ...PRIVATE_HEADERS, 'Content-Range': `bytes */${file.size}` } })
    }
    const stream = localMediaStream(file.path, start, end)
    request.signal.addEventListener('abort', () => stream.destroy(), { once: true })
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { status: range ? 206 : 200, headers: { ...PRIVATE_HEADERS, 'Content-Type': file.type, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes', ...(range ? { 'Content-Range': `bytes ${start}-${end}/${file.size}` } : {}) } })
  }
  if (path.join('/') === 'data') {
    try { return ownerJson(await growthData(new URL(request.url).searchParams)) } catch { return ownerJson({ error: 'Owner data is temporarily unavailable.' }, 503) }
  }
  return ownerJson({ error: 'Unknown owner endpoint.' }, 404)
}
