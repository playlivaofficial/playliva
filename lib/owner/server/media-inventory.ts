import { createHash } from 'node:crypto'
import { BlobNotFoundError, get } from '@vercel/blob'
import type { GenerationJob } from '../automation-model'
import type { Creative } from '../model'

export interface MediaReference { mediaKey?: string; thumbnailKey?: string; bytes?: number; mediaSha256?: string }
export interface MediaInspection { ready: boolean; missing: boolean; bytes: number; checkedAt: string; reason?: string }
export const validMediaKey = (key: string) => /^owner-social\/v1\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+\/(master\.mp4|poster\.jpg)$/.test(key)
export const openPrivateMedia = (key: string, range?: string, signal?: AbortSignal) => get(key, { access: 'private', useCache: false, abortSignal: signal ?? AbortSignal.timeout(15000), ...(range ? { headers: { Range: range } } : {}) })
type Reader = typeof openPrivateMedia
export async function inspectJob(job: GenerationJob, reader: Reader = openPrivateMedia): Promise<MediaInspection & { status: NonNullable<Creative['availability']> }> {
  const base = { ready: false, missing: false, bytes: 0, checkedAt: new Date().toISOString() }
  if (job.state === 'purged' || ['purging', 'purged'].includes(job.mediaStatus)) return { ...base, status: 'ARCHIVED' }
  if (['rendering', 'qc'].includes(job.state)) return { ...base, status: 'RENDERING' }
  if (job.state === 'queued') return { ...base, status: 'QUEUED' }
  if (job.state === 'failed') return { ...base, status: job.mediaStatus === 'missing' ? 'MISSING_MEDIA' : 'FAILED' }
  if (job.state !== 'completed' || !job.creative.qc?.passed || job.creative.renderStatus !== 'rendered') return { ...base, status: 'MISSING_MEDIA' }
  const result = await inspectPrivateMedia({ mediaKey: job.mediaKey, thumbnailKey: job.thumbnailKey, bytes: job.bytes }, reader)
  return { ...result, status: result.ready ? 'READY' : 'MISSING_MEDIA' }
}

/** Same storage reader used by both authenticated preview and download. Small
 * live reads check availability on every inventory request; completion also
 * reads/hash-checks the entire immutable MP4 before it can become READY. */
export async function inspectPrivateMedia(ref: MediaReference, reader: Reader = openPrivateMedia): Promise<MediaInspection> {
  const checkedAt = new Date().toISOString()
  const missing = (reason: string): MediaInspection => ({ ready: false, missing: true, bytes: 0, checkedAt, reason })
  if (!ref.mediaKey || !ref.thumbnailKey || !validMediaKey(ref.mediaKey) || !validMediaKey(ref.thumbnailKey) || !ref.bytes || ref.bytes <= 0) return missing('Media reference is missing or empty.')
  try {
    const preview = await reader(ref.mediaKey, 'bytes=0-31')
    if (!preview || preview.statusCode !== 200) return missing('Preview unavailable.')
    const prefix = Buffer.from(await new Response(preview.stream).arrayBuffer())
    const total = Number(preview.headers.get('content-range')?.split('/')[1])
    if (!prefix.subarray(0, 32).includes(Buffer.from('ftyp')) || total !== ref.bytes) return missing('Preview or video size is invalid.')
    const download = await reader(ref.mediaKey)
    if (!download || download.statusCode !== 200) return missing('Download unavailable.')
    const expected = Number(download.headers.get('content-length'))
    const stream = download.stream.getReader()
    let bytes = 0
    const hash = createHash('sha256')
    try {
      if (ref.mediaSha256) {
        while (true) { const chunk = await stream.read(); if (chunk.done) break; bytes += chunk.value.length; hash.update(chunk.value) }
      } else { const chunk = await stream.read(); bytes = chunk.value?.length ?? 0 }
    } finally { await stream.cancel().catch(() => {}) }
    if (expected !== ref.bytes || bytes <= 0 || (ref.mediaSha256 && (bytes !== ref.bytes || hash.digest('hex') !== ref.mediaSha256))) return missing('Persistent download is incomplete or invalid.')
    const thumbnail = await reader(ref.thumbnailKey, 'bytes=0-31')
    if (!thumbnail || thumbnail.statusCode !== 200) return missing('Thumbnail unavailable.')
    const image = Buffer.from(await new Response(thumbnail.stream).arrayBuffer())
    if (image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) return missing('Thumbnail is invalid.')
    return { ready: true, missing: false, bytes: ref.bytes, checkedAt }
  } catch (error) {
    if (error instanceof BlobNotFoundError) return missing('Persistent media object does not exist.')
    // Provider outage must hide READY, but must not trigger expensive duplicate
    // renders or overwrite an otherwise valid immutable object's reference.
    return { ready: false, missing: false, bytes: 0, checkedAt, reason: 'Storage verification is temporarily unavailable.' }
  }
}
