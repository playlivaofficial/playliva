import { videoProductionPolicy } from '../video-production'
import { put, del } from '@vercel/blob'
import { openPrivateMedia, validMediaKey } from './media-inventory'
export { validMediaKey } from './media-inventory'
import { PRIVATE_HEADERS } from '../private-headers'
import { readOwnerState, updateOwnerState } from './store'

export const privateStorageConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL))
export async function uploadPrivate(key: string, body: Blob, type: string) {
  videoProductionPolicy.assertEnabled()
  if (!validMediaKey(key)) throw new Error('Social media key is invalid.')
  const result = await put(key, body, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: type, multipart: body.size > 5000000 })
  if (!new URL(result.url).hostname.endsWith('.private.blob.vercel-storage.com')) throw new Error('Social storage is not private.')
  return result.pathname
}
export async function deletePrivate(keys: string[]) {
  videoProductionPolicy.assertEnabled()
  if (keys.some(key => !validMediaKey(key))) throw new Error('Social cleanup path is invalid.')
  if (keys.length) await del(keys)
}
export async function generatedMediaResponse(id: string, kind: 'video' | 'thumbnail', request: Request): Promise<Response | null> {
  const row = (await readOwnerState()).automation.jobs[id]
  if (!row) return null
  if (!privateStorageConfigured() || row.state !== 'completed' || row.mediaStatus !== 'available' || !row.bytes || !row.creative.qc?.passed) return new Response(null, { status: 404, headers: PRIVATE_HEADERS })
  const key = kind === 'video' ? row.mediaKey : row.thumbnailKey
  if (!key || !validMediaKey(key)) return new Response(null, { status: 404, headers: PRIVATE_HEADERS })
  const range = request.headers.get('range')
  if (range && !/^bytes=(\d+-\d*|-\d+)$/.test(range)) return new Response(null, { status: 416, headers: PRIVATE_HEADERS })
  const result = await openPrivateMedia(key, range ?? undefined, request.signal)
  if (!result || result.statusCode !== 200) return new Response(null, { status: 404, headers: PRIVATE_HEADERS })
  const headers = new Headers(PRIVATE_HEADERS)
  headers.set('Content-Type', kind === 'video' ? 'video/mp4' : 'image/jpeg')
  for (const name of ['content-length', 'content-range', 'accept-ranges']) {
    const value = result.headers.get(name); if (value) headers.set(name, value)
  }
  if (new URL(request.url).searchParams.get('download') === '1' && kind === 'video') {
    headers.set('Content-Disposition', `attachment; filename="playliva_${row.gameSlug}_${row.creative.createdAt.slice(0, 10)}_${id}.mp4"`)
    // A telemetry write cannot turn an otherwise readable MP4 into a broken download.
    if (!range) await updateOwnerState(state => { state.automation.jobs[id].downloadCount++ }).catch(() => {})
  }
  return new Response(result.stream, { status: headers.has('content-range') ? 206 : 200, headers })
}
