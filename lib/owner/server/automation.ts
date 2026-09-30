import { videoProductionPolicy } from '../video-production'
import { randomUUID } from 'node:crypto'
import { SPOTLIGHT_GAMES } from '../../home/spotlight'
import { atOrAfterNine, dailyBatchId, dailyJobId, generationDate, dueBatch, refreshBatch, retentionCandidates, eligibleGenerationGames, type GenerationGame, type GenerationJob } from '../automation-model'
import { planBatch } from '../creative-planner'
import { logActivity, readOwnerState, updateOwnerState } from './store'
import type { Creative, OwnerState } from '../model'
import { inspectJob, inspectPrivateMedia } from './media-inventory'

export const generationGames = () => eligibleGenerationGames(SPOTLIGHT_GAMES.map(game => ({ id: game.id, slug: game.slug, title: game.title['pt-BR'], category: game.category.en, route: game.playPath, enabled: game.enabled })))
export async function enqueueBatch(mode: 'scheduled' | 'manual' | 'canary', now = new Date().toISOString(), catalog: GenerationGame[] = generationGames()) {
  videoProductionPolicy.assertEnabled()
  const games = eligibleGenerationGames(catalog)
  return updateOwnerState(state => {
    const automation = state.automation
    if (mode === 'scheduled') automation.lastSchedulerAt = now
    if (mode !== 'canary' && !automation.armed) return null
    if (mode === 'scheduled' && !dueBatch(automation, now)) return null
    const date = generationDate(now), slot = `${date}T05:00:00.000Z`
    const id = mode === 'canary' ? 'canary-v1' : dailyBatchId(date)
    if (mode === 'canary' && automation.batches.some(batch => batch.id === id)) return id
    const selected = mode === 'canary' ? games.filter(game => game.slug === 'crash') : games
    const missing = mode === 'canary' ? selected : selected.filter(game => !automation.jobs[dailyJobId(game, date)])
    const jobs = missing.length ? planBatch(missing, id, now, automation, mode === 'canary') : []
    let batch = automation.batches.find(batch => batch.id === id)
    if (!batch) { batch = { id, scheduledAt: mode === 'canary' ? now : slot, createdAt: now, kind: mode === 'canary' ? 'canary' : 'daily', state: 'queued', expected: selected.length, gameCount: selected.length }; automation.batches.push(batch) }
    batch.expected = selected.length; batch.gameCount = selected.length
    if (mode !== 'canary') batch.gameIds = selected.map(game => game.id ?? game.slug)
    for (const job of jobs) automation.jobs[job.id] = job
    if (jobs.length) { batch.completedAt = undefined; refreshBatch(automation, id, now); logActivity(state, 'batch_queued', id, `${jobs.length} missing daily PT-BR slots queued. No upload or publishing.`) }
    if (mode !== 'canary') automation.nextDueAt = atOrAfterNine(new Date(Date.parse(now) + 1))
    return id
  })
}
export async function armAutomation() {
  videoProductionPolicy.assertEnabled()
  return updateOwnerState(state => {
    if (!state.automation.batches.some(batch => batch.kind === 'canary' && batch.state === 'completed')) throw new Error('Social canary must pass before arming generation.')
    if (!state.automation.armed) {
      state.automation.armed = true
      state.automation.nextDueAt = atOrAfterNine(new Date())
      logActivity(state, 'automation_armed', 'social', 'Daily production at 09:00 Tbilisi; one slot per canonical game and calendar date.')
    }
  })
}
export async function claimJob(batchId?: string, now = new Date().toISOString()): Promise<GenerationJob | null> {
  videoProductionPolicy.assertEnabled()
  return updateOwnerState(state => {
    const automation = state.automation
    automation.lastWorkerAt = now
    for (const row of Object.values(automation.jobs)) {
      if (['rendering', 'qc'].includes(row.state) && row.leaseUntil && row.leaseUntil < now) {
        row.state = 'failed'; row.error = 'Worker lease expired; retry this failed job.'; row.leaseToken = undefined
        refreshBatch(automation, row.batchId, now)
      }
    }
    const eligible = new Set(generationGames().map(game => game.id ?? game.slug))
    const row = Object.values(automation.jobs).find(job => job.state === 'queued' && (batchId ? job.batchId === batchId : Boolean(job.generationDate)) && (!job.generationDate || eligible.has(job.canonicalGameId!)))
    if (!row) return null
    row.state = 'rendering'; row.attempts++; row.startedAt = now; row.error = undefined
    row.leaseToken = randomUUID(); row.leaseUntil = new Date(Date.parse(now) + 30 * 60000).toISOString()
    refreshBatch(automation, row.batchId, now)
    return structuredClone(row)
  })
}
export async function heartbeat(id: string, token: string, qc = false) {
  videoProductionPolicy.assertEnabled()
  return updateOwnerState(state => {
    const row = state.automation.jobs[id]
    if (!row || row.leaseToken !== token || !['rendering', 'qc'].includes(row.state)) throw new Error('Social worker lease was lost.')
    row.leaseUntil = new Date(Date.now() + 30 * 60000).toISOString()
    if (qc) row.state = 'qc'
    state.automation.lastWorkerAt = new Date().toISOString()
  })
}
export async function finishJob(id: string, token: string, result: { mediaKey: string; thumbnailKey: string; bytes: number; mediaSha256: string; qc: NonNullable<Creative['qc']>; duration: number } | { error: string }, inspect = inspectPrivateMedia) {
  videoProductionPolicy.assertEnabled()
  // Storage is verified before the state transaction. The lease is rechecked
  // inside CAS, so a late worker cannot overwrite a newer attempt.
  if (!('error' in result) && (!/^[a-f0-9]{64}$/.test(result.mediaSha256) || !(await inspect(result)).ready)) throw new Error('Social persistent media verification failed; job is not READY.')
  return updateOwnerState(state => {
    const row = state.automation.jobs[id], now = new Date().toISOString()
    if (!row || row.leaseToken !== token || !['rendering', 'qc'].includes(row.state)) throw new Error('Social worker lease was lost.')
    if ('error' in result) { row.state = 'failed'; row.error = result.error.slice(0, 400); row.creative.renderStatus = 'failed' }
    else {
      if (!result.qc.passed || result.qc.width !== 1080 || result.qc.height !== 1920 || result.qc.fps !== 30) throw new Error('Social QC did not meet the universal master standard.')
      row.state = 'completed'; row.completedAt = now; row.mediaStatus = 'available'; row.mediaKey = result.mediaKey; row.thumbnailKey = result.thumbnailKey; row.bytes = result.bytes
      row.mediaVerifiedAt = now; row.mediaSha256 = result.mediaSha256
      row.creative.qc = result.qc; row.creative.renderStatus = 'rendered'; row.creative.updatedAt = now; row.creative.duration = result.duration
    }
    row.leaseToken = undefined; row.leaseUntil = undefined
    refreshBatch(state.automation, row.batchId, now)
    logActivity(state, row.state === 'completed' ? 'creative_rendered' : 'render_failed', id, row.state === 'completed' ? 'Private master passed QC; owner review required.' : row.error!)
  })
}
/** Recover the same slot only after a definitive missing/invalid object result.
 * Transient provider failures do not discard a completed reference. */
export async function reconcileDailyMedia(batchId: string, inspect = inspectJob) {
  videoProductionPolicy.assertEnabled()
  const snapshot = await readOwnerState()
  for (const job of Object.values(snapshot.automation.jobs).filter(job => job.batchId === batchId && job.state === 'completed')) {
    const result = await inspect(job)
    if (!result.ready && result.missing) await updateOwnerState(state => {
      const current = state.automation.jobs[job.id]
      if (current?.state !== 'completed' || current.mediaKey !== job.mediaKey) return
      current.state = 'failed'; current.mediaStatus = 'missing'; current.error = 'Persistent media is missing or invalid; recover this daily slot.'
      refreshBatch(state.automation, batchId, new Date().toISOString())
    })
  }
}
export async function retryFailures(batchId: string) {
  videoProductionPolicy.assertEnabled()
  return updateOwnerState(state => {
    let count = 0
    for (const row of Object.values(state.automation.jobs)) if (row.batchId === batchId && row.state === 'failed' && row.attempts < (row.manualRetryLimit ?? 3)) { row.state = 'queued'; row.error = undefined; count++ }
    if (count) { refreshBatch(state.automation, batchId, new Date().toISOString()); logActivity(state, 'failed_jobs_requeued', batchId, `${count} failed jobs queued. Completed jobs preserved; bounded automatic or explicit repair allowance.`) }
    return count
  })
}
/** Recover interrupted leases before planning runner dependencies. Live leases
 * and completed slots remain untouched, including previous daily batches. */
export async function recoverInterruptedJobs(now = new Date().toISOString()) {
  videoProductionPolicy.assertEnabled()
  return updateOwnerState(state => {
    let count = 0
    for (const row of Object.values(state.automation.jobs)) {
      if (!row.generationDate || !['rendering', 'qc'].includes(row.state) || !row.leaseUntil || row.leaseUntil >= now) continue
      row.state = row.attempts < (row.manualRetryLimit ?? 3) ? 'queued' : 'failed'
      row.error = row.state === 'failed' ? 'Worker lease expired; attempt limit reached.' : undefined
      row.leaseToken = undefined; row.leaseUntil = undefined
      refreshBatch(state.automation, row.batchId, now); count++
    }
    if (count) logActivity(state, 'interrupted_jobs_recovered', 'social', `${count} expired daily leases recovered without replacing completed slots.`)
    return count
  })
}
/** Explicit operator repair after visual QC. Never automatic: protects approved,
 * pinned and uploaded history; retains the rejected private object and slot ID. */
export async function repairVisualQc(ids: string[], version: string, now = new Date().toISOString()) {
  videoProductionPolicy.assertEnabled()
  if (!/^[a-f0-9]{40}$/.test(version) || !ids.length || ids.some(id => !/^daily-\d{8}-[a-z0-9-]+$/.test(id))) throw new Error('Invalid visual repair request.')
  return updateOwnerState(state => {
    const rows = [...new Set(ids)].map(id => state.automation.jobs[id])
    for (const row of rows) {
      if (!row || row.generationDate !== generationDate(now)) throw new Error('Visual repair is limited to today’s existing slots.')
      if (row.visualRepairVersion === version) continue
      const creative = { ...row.creative, ...state.creatives[row.id] }
      if (!['completed', 'failed'].includes(row.state) || (row.state === 'completed' && !row.mediaKey) || row.pinned || creative.reviewStatus === 'approved' || creative.uploadStatus !== 'not_uploaded' || creative.publishStatus !== 'unpublished') throw new Error('Visual repair cannot replace active, protected or published work.')
    }
    let count = 0
    for (const row of rows) {
      if (row.visualRepairVersion === version) continue
      const reason = row.state === 'failed' ? `Explicit recovery after render failure: ${row.error ?? 'failed capture'}` : 'Capture failed visual QC; previous private master retained for audit.'
      if (row.mediaKey && !row.mediaHistory?.some(item => item.mediaKey === row.mediaKey)) (row.mediaHistory ??= []).push({ mediaKey: row.mediaKey, thumbnailKey: row.thumbnailKey, bytes: row.bytes, completedAt: row.completedAt, repairVersion: version, reason })
      row.manualRetryLimit = Math.max(row.manualRetryLimit ?? 3, row.attempts + 1)
      row.visualRepairVersion = version; row.state = 'failed'; row.mediaStatus = 'pending'; row.error = reason
      row.creative.renderStatus = 'failed'; row.creative.qc = null; row.completedAt = undefined
      const batch = state.automation.batches.find(batch => batch.id === row.batchId)
      if (batch) batch.completedAt = undefined
      refreshBatch(state.automation, row.batchId, now)
      logActivity(state, 'visual_qc_repair', row.id, `${reason} Version ${version}; cumulative attempts ${row.attempts}; explicit limit ${row.manualRetryLimit}.`); count++
    }
    return count
  })
}
export async function setPinned(id: string, pinned: boolean) {
  return updateOwnerState(state => {
    const row = state.automation.jobs[id]
    if (!row) throw new Error('Creative is not a generated master.')
    // Cleanup's CAS claim and this CAS mutation serialize pin-vs-delete races.
    if (row.mediaStatus !== 'available') throw new Error('Creative media is unavailable or cleanup has already started; pin was not saved.')
    row.pinned = pinned; row.pinHistory.push({ at: new Date().toISOString(), pinned })
    logActivity(state, pinned ? 'creative_pinned' : 'creative_unpinned', id, pinned ? 'Media protected from retention cleanup.' : 'Media follows the latest-two-batches retention policy.')
  })
}
export async function claimCleanup(id: string) {
  videoProductionPolicy.assertEnabled()
  return updateOwnerState(state => {
    const row = retentionCandidates(state.automation).find(job => job.id === id)
    if (!row) return null
    row.mediaStatus = 'purging'; row.cleanupToken ||= randomUUID()
    return { id, token: row.cleanupToken, keys: [row.mediaKey, row.thumbnailKey].filter((key): key is string => Boolean(key)) }
  })
}
export async function finishCleanup(id: string, token: string) {
  videoProductionPolicy.assertEnabled()
  return updateOwnerState(state => {
    const row = state.automation.jobs[id]
    if (!row || row.cleanupToken !== token || row.pinned || row.mediaStatus !== 'purging') throw new Error('Social cleanup claim is invalid.')
    row.mediaStatus = 'purged'; row.state = 'purged'; row.purgedAt = new Date().toISOString()
    state.automation.cleanup.push({ at: row.purgedAt, jobId: id, result: 'MP4 and thumbnail removed; metadata and review history retained.' })
    logActivity(state, 'media_purged', id, 'Retention cleanup completed; metadata retained.')
  })
}
export async function generationSummary(current?: OwnerState) {
  const { automation } = current ?? await readOwnerState()
  return { enabled: false, expectedDailyVideos: 0, armed: false, nextDueAt: null, lastSchedulerAt: automation.lastSchedulerAt, lastWorkerAt: automation.lastWorkerAt,
    batches: automation.batches.slice(-20).reverse().map(batch => ({ ...batch, completed: Object.values(automation.jobs).filter(job => job.batchId === batch.id && (!batch.gameIds || batch.gameIds.includes(job.canonicalGameId!)) && ['completed', 'purged'].includes(job.state)).length,
      failed: Object.values(automation.jobs).filter(job => job.batchId === batch.id && (!batch.gameIds || batch.gameIds.includes(job.canonicalGameId!)) && job.state === 'failed').length })),
    jobs: Object.values(automation.jobs).map(({ id, batchId, angle, state, attempts, error, pinned, mediaStatus, purgedAt, downloadCount }) => ({ id, batchId, angle, state, attempts, error, pinned, mediaStatus, purgedAt, downloadCount })) }
}
