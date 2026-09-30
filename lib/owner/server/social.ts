import { videoProductionPolicy } from '../video-production'
import { readLocalText, realLocalPath, localFileStat } from './local-files'
import { resolve, relative, isAbsolute, extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import manifestSeed from '@/social/content/youtube-shorts-br.json'
import { normalizeManifest } from '../social-model'
import type { Creative, OwnerState, Source } from '../model'
import { localEnabled, logActivity, readOwnerState, updateOwnerState } from './store'
import { inspectJob } from './media-inventory'

export async function socialManifest(): Promise<unknown> {
  return localEnabled() && process.env.OWNER_SOCIAL_MANIFEST ? JSON.parse(await readLocalText(resolve(process.env.OWNER_SOCIAL_MANIFEST))) : manifestSeed
}
export async function mediaFile(id: string, kind: 'video' | 'thumbnail') {
  if (!localEnabled()) return null // Production object storage is deliberately not fabricated.
  const manifest = await socialManifest() as { items: { contentId: string; videoFile?: string; thumbnailFile?: string }[] }
  const row = manifest.items.find(item => item.contentId === id), raw = row?.[kind === 'video' ? 'videoFile' : 'thumbnailFile']
  if (!raw) return null
  const root = resolve(process.env.OWNER_MEDIA_ROOT || 'social/output')
  const value = raw.replaceAll('\\', '/').replace(/^social\/output\//, '')
  if (isAbsolute(value) || value.split('/').includes('..')) return null
  try {
    const [actualRoot, path] = await Promise.all([realLocalPath(root), realLocalPath(resolve(root, value))]), rel = relative(actualRoot, path)
    if (rel.startsWith('..') || isAbsolute(rel) || !(kind === 'video' ? ['.mp4', '.webm'] : ['.jpg', '.jpeg', '.png', '.webp']).includes(extname(path).toLowerCase())) return null
    const info = await localFileStat(path)
    return info.isFile() ? { path, size: info.size, modified: info.mtime.toISOString(), type: kind === 'video' ? extname(path) === '.webm' ? 'video/webm' : 'video/mp4' : extname(path) === '.png' ? 'image/png' : extname(path) === '.webp' ? 'image/webp' : 'image/jpeg' } : null
  } catch { return null }
}
export async function socialLibrary(state?: OwnerState, inspectId?: string, inspect = inspectJob): Promise<Source<Creative[]>> {
  try {
    const current = state ?? await readOwnerState(), creatives = normalizeManifest(await socialManifest(), current.creatives)
    for (const item of creatives) item.availability = 'ARCHIVED'
    const jobs = Object.values(current.automation.jobs)
    for (let start = 0; start < jobs.length; start += 4) {
      const checked = await Promise.all(jobs.slice(start, start + 4).map(async job => {
        const stored = job.state === 'completed' && job.mediaStatus === 'available' && job.creative.renderStatus === 'rendered' && Boolean(job.mediaKey && job.thumbnailKey && job.bytes && job.creative.qc?.passed)
        const check = job.id === inspectId ? await inspect(job) : { status: stored ? 'STORED' as const : job.state === 'failed' ? 'FAILED' as const : job.state === 'queued' ? 'QUEUED' as const : ['rendering', 'qc'].includes(job.state) ? 'RENDERING' as const : 'ARCHIVED' as const, bytes: job.bytes, checkedAt: job.mediaVerifiedAt, ready: false }, override = current.creatives[job.id] ?? {}
        return { ...job.creative, ...override, availability: check.status, mediaBytes: check.bytes, mediaCheckedAt: check.checkedAt, generationDate: job.generationDate, canonicalGameId: job.canonicalGameId,
          media: { video: check.ready, thumbnail: check.ready } }
      }))
      creatives.push(...checked)
    }
    return { state: creatives.length ? 'connected' : 'no_data', label: 'Historical social library', detail: 'STORED means a preserved media reference, not a live verification. Opening one review checks that video on demand. Automatic production and background media scans are disabled.', data: creatives }
  } catch { return { state: 'unavailable', label: 'Social Engine metadata', detail: 'The manifest or owner state could not be read. Existing records have been preserved.', data: [] } }
}
export async function withMedia(item: Creative): Promise<Creative> {
  if (item.availability) return item
  if (item.id.startsWith('batch-') || item.id.startsWith('canary-')) return item
  const [video, thumbnail] = await Promise.all([mediaFile(item.id, 'video'), mediaFile(item.id, 'thumbnail')])
  return { ...item, media: { video: Boolean(video), thumbnail: Boolean(thumbnail) } }
}
export async function reviewCreative(id: string, action: 'approve' | 'reject' | 'regenerate', reason: string) {
  if (action === 'regenerate') videoProductionPolicy.assertEnabled()
  const manifest = await socialManifest()
  if (action === 'approve' && !(await socialLibrary(undefined, id)).data.find(item => item.id === id)?.media.video) throw new Error('Approval requires a verified available video.')
  return updateOwnerState(state => {
    const generated = state.automation.jobs[id]
    const item = generated?.creative ?? normalizeManifest(manifest, state.creatives).find(row => row.id === id)
    if (!item) throw new Error('Creative not found.')
    const now = new Date().toISOString()
    if (action === 'regenerate') {
      if (generated) throw new Error('Creative uses the cloud queue. Retry failed jobs from its batch; completed masters are preserved.')
      if (state.jobs.some(job => job.creativeId === id && ['queued', 'running'].includes(job.state))) throw new Error('This creative already has a pending regeneration request.')
      state.jobs.push({ id: randomUUID(), creativeId: id, requestedAt: now, state: 'queued', detail: 'Waiting for the authorized workstation worker. No render has started.' })
      state.creatives[id] = { ...state.creatives[id], reviewStatus: 'needs_review', approvedAt: null, updatedAt: now }
      logActivity(state, 'regeneration_requested', id, 'Queued for workstation; approval cleared. No upload or publishing action.')
      return 'Regeneration queued for the workstation. No video has been rendered yet.'
    }
    if (action === 'approve' && (!item.qc?.passed || item.renderStatus !== 'rendered' || state.jobs.some(job => job.creativeId === id && ['queued', 'running'].includes(job.state)))) throw new Error('Approval requires passed QC and no pending regeneration.')
    state.creatives[id] = { ...state.creatives[id], reviewStatus: action === 'approve' ? 'approved' : 'rejected', approvedAt: action === 'approve' ? now : null, updatedAt: now, reason: reason.slice(0, 240) }
    logActivity(state, `creative_${action === 'approve' ? 'approved' : 'rejected'}`, id, action === 'approve' ? 'Human review recorded. Upload and publishing are separate, disabled actions.' : reason.slice(0, 240) || 'Rejected; source and media preserved.')
    return action === 'approve' ? 'Approved for review. Nothing was uploaded or published.' : 'Rejected. Existing source and media were preserved.'
  })
}
