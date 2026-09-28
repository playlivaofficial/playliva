import type { Creative } from './model'

export const CADENCE_HOURS = 24
export const CREATIVES_PER_GAME = 1
// IANA's canonical name for Tbilisi is Asia/Tbilisi, not Europe/Tbilisi.
export const GENERATION_TIMEZONE = 'Asia/Tbilisi'
export const ANGLES = ['wow', 'challenge', 'feature'] as const
export type Angle = typeof ANGLES[number]
export type JobStatus = 'queued' | 'rendering' | 'qc' | 'completed' | 'failed' | 'purged'
export interface GenerationGame { id?: string; slug: string; title: string; category: string; route: string; enabled?: boolean }
export const eligibleGenerationGames = (games: GenerationGame[]) => games.filter(game => game.enabled !== false)
export const generationDate = (instant = new Date().toISOString()) => new Date(Date.parse(instant) + 4 * 3600000).toISOString().slice(0, 10)
export const dailyBatchId = (date: string) => `daily-${date.replaceAll('-', '')}`
export const dailyJobId = (game: GenerationGame, date: string) => `${dailyBatchId(date)}-${game.id ?? game.slug}`
export interface GenerationJob {
  id: string; batchId: string; gameSlug: string; angle: Angle; state: JobStatus; attempts: number
  canonicalGameId?: string; generationDate?: string
  leaseToken?: string; leaseUntil?: string; startedAt?: string; completedAt?: string; error?: string
  creative: Creative; voiceLine: string; captureVariant: number; pinned: boolean; pinHistory: { at: string; pinned: boolean }[]
  mediaStatus: 'pending' | 'available' | 'missing' | 'purging' | 'purged'; mediaKey?: string; thumbnailKey?: string
  mediaVerifiedAt?: string; mediaSha256?: string
  purgedAt?: string; cleanupToken?: string; bytes?: number; downloadCount: number
}
export interface GenerationBatch {
  id: string; scheduledAt: string; createdAt: string; completedAt?: string; kind: 'scheduled' | 'canary' | 'daily'
  state: 'queued' | 'running' | 'partial' | 'completed' | 'failed'; expected: number; gameCount: number
  gameIds?: string[]
}
export interface AutomationState {
  version: 1; armed: boolean; nextDueAt: string | null; batches: GenerationBatch[]; jobs: Record<string, GenerationJob>
  lastSchedulerAt?: string; lastWorkerAt?: string; cleanup: { at: string; jobId: string; result: string }[]
}
export const emptyAutomation = (): AutomationState => ({ version: 1, armed: false, nextDueAt: null, batches: [], jobs: {}, cleanup: [] })

/** First 09:00 Tbilisi boundary on/after the instant; Tbilisi is UTC+04 without DST. */
export function atOrAfterNine(instant: Date): string {
  const day = new Date(instant.getTime() + 4 * 3600000).toISOString().slice(0, 10)
  const boundary = new Date(`${day}T05:00:00.000Z`)
  if (boundary.getTime() < instant.getTime()) boundary.setUTCDate(boundary.getUTCDate() + 1)
  return boundary.toISOString()
}
export function nextScheduledSlot(scheduledAt: string, completedAt: string) {
  // Anchor cadence to the scheduled start, not render duration. Skip missed slots
  // after an outage instead of bursting several expensive catch-up batches.
  let next = Date.parse(scheduledAt) + CADENCE_HOURS * 3600000
  while (next <= Date.parse(completedAt)) next += CADENCE_HOURS * 3600000
  return new Date(next).toISOString()
}
export function dueBatch(state: AutomationState, now: string) {
  return state.armed && now >= `${generationDate(now)}T05:00:00.000Z`
}
export function refreshBatch(state: AutomationState, id: string, now: string) {
  const batch = state.batches.find(row => row.id === id)
  if (!batch) throw new Error('Social batch not found.')
  const jobs = Object.values(state.jobs).filter(job => job.batchId === id && (!batch.gameIds || batch.gameIds.includes(job.canonicalGameId!)))
  const complete = jobs.filter(job => ['completed', 'purged'].includes(job.state)).length
  const pending = jobs.some(job => ['queued', 'rendering', 'qc'].includes(job.state))
  batch.state = complete === batch.expected ? 'completed' : pending ? 'running' : complete ? 'partial' : 'failed'
  if (batch.state === 'completed' && !batch.completedAt) {
    batch.completedAt = now
    if (batch.kind === 'daily') state.nextDueAt = nextScheduledSlot(batch.scheduledAt, now)
  }
}
export function retentionCandidates(state: AutomationState) {
  // Daily history is retained. No automatic deletion of daily masters or any
  // uploaded/published record; legacy retention never applies to daily batches.
  const complete = state.batches.filter(batch => batch.kind !== 'daily' && batch.state === 'completed')
    .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))
  const old = new Set(complete.slice(2).map(batch => batch.id))
  return Object.values(state.jobs).filter(job => old.has(job.batchId) && job.state === 'completed' && !job.pinned && job.creative.uploadStatus === 'not_uploaded' && job.creative.publishStatus === 'unpublished' && ['available', 'purging'].includes(job.mediaStatus))
}
export function hookSimilarity(a: string, b: string) {
  const words = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) ?? [])
  const aa = words(a), bb = words(b), union = new Set([...aa, ...bb])
  return union.size ? [...aa].filter(word => bb.has(word)).length / union.size : 1
}
