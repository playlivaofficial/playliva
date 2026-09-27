import { randomUUID } from 'node:crypto'
import { SPOTLIGHT_GAMES } from '../../home/spotlight'
import { atOrAfterNine, dueBatch, refreshBatch, retentionCandidates, type GenerationJob } from '../automation-model'
import { planBatch } from '../creative-planner'
import { logActivity, readOwnerState, updateOwnerState } from './store'
import type { Creative, OwnerState } from '../model'

export const generationGames = () => SPOTLIGHT_GAMES.map(game => ({ slug: game.slug, title: game.title['pt-BR'], category: game.category.en, route: game.playPath }))
export async function enqueueBatch(mode: 'scheduled' | 'manual' | 'canary', now = new Date().toISOString()) {
  const games = generationGames()
  return updateOwnerState(state => {
    const automation = state.automation
    if (mode === 'scheduled') automation.lastSchedulerAt = now
    if (mode !== 'canary' && !automation.armed) return null
    const active = automation.batches.find(batch => batch.kind === (mode === 'canary' ? 'canary' : 'scheduled') && ['queued', 'running', 'partial', 'failed'].includes(batch.state))
    if (active) return active.id
    if (mode === 'scheduled' && !dueBatch(automation, now)) return null
    const slot = mode === 'canary' ? 'canary-v1' : automation.nextDueAt ?? atOrAfterNine(new Date(now))
    const id = mode === 'canary' ? slot : `batch-${slot.slice(0, 10).replaceAll('-', '')}`
    if (automation.batches.some(batch => batch.id === id)) return id
    const selected = mode === 'canary' ? games.filter(game => game.slug === 'crash') : games
    const jobs = planBatch(selected, id, now, automation, mode === 'canary')
    automation.batches.push({ id, scheduledAt: mode === 'canary' ? now : slot, createdAt: now, kind: mode === 'canary' ? 'canary' : 'scheduled', state: 'queued', expected: jobs.length, gameCount: selected.length })
    for (const job of jobs) automation.jobs[job.id] = job
    logActivity(state, 'batch_queued', id, `${jobs.length} universal PT-BR masters queued. No upload or publishing.`)
    return id
  })
}
export async function armAutomation() {
  return updateOwnerState(state => {
    if (!state.automation.batches.some(batch => batch.kind === 'canary' && batch.state === 'completed')) throw new Error('Social canary must pass before arming generation.')
    if (!state.automation.armed) {
      state.automation.armed = true
      state.automation.nextDueAt = atOrAfterNine(new Date())
      logActivity(state, 'automation_armed', 'social', 'Daily scheduler evaluates the 72-hour due date at 09:00 Tbilisi.')
    }
  })
}
export async function claimJob(batchId?: string, now = new Date().toISOString()): Promise<GenerationJob | null> {
  return updateOwnerState(state => {
    const automation = state.automation
    automation.lastWorkerAt = now
    for (const row of Object.values(automation.jobs)) {
      if (['rendering', 'qc'].includes(row.state) && row.leaseUntil && row.leaseUntil < now) {
        row.state = 'failed'; row.error = 'Worker lease expired; retry this failed job.'; row.leaseToken = undefined
        refreshBatch(automation, row.batchId, now)
      }
    }
    const row = Object.values(automation.jobs).find(job => job.state === 'queued' && (!batchId || job.batchId === batchId))
    if (!row) return null
    row.state = 'rendering'; row.attempts++; row.startedAt = now; row.error = undefined
    row.leaseToken = randomUUID(); row.leaseUntil = new Date(Date.parse(now) + 30 * 60000).toISOString()
    refreshBatch(automation, row.batchId, now)
    return structuredClone(row)
  })
}
export async function heartbeat(id: string, token: string, qc = false) {
  return updateOwnerState(state => {
    const row = state.automation.jobs[id]
    if (!row || row.leaseToken !== token || !['rendering', 'qc'].includes(row.state)) throw new Error('Social worker lease was lost.')
    row.leaseUntil = new Date(Date.now() + 30 * 60000).toISOString()
    if (qc) row.state = 'qc'
    state.automation.lastWorkerAt = new Date().toISOString()
  })
}
export async function finishJob(id: string, token: string, result: { mediaKey: string; thumbnailKey: string; bytes: number; qc: NonNullable<Creative['qc']>; duration: number } | { error: string }) {
  return updateOwnerState(state => {
    const row = state.automation.jobs[id], now = new Date().toISOString()
    if (!row || row.leaseToken !== token || !['rendering', 'qc'].includes(row.state)) throw new Error('Social worker lease was lost.')
    if ('error' in result) { row.state = 'failed'; row.error = result.error.slice(0, 400); row.creative.renderStatus = 'failed' }
    else {
      if (!result.qc.passed || result.qc.width !== 1080 || result.qc.height !== 1920 || result.qc.fps !== 30) throw new Error('Social QC did not meet the universal master standard.')
      row.state = 'completed'; row.completedAt = now; row.mediaStatus = 'available'; row.mediaKey = result.mediaKey; row.thumbnailKey = result.thumbnailKey; row.bytes = result.bytes
      row.creative.qc = result.qc; row.creative.renderStatus = 'rendered'; row.creative.updatedAt = now; row.creative.duration = result.duration
    }
    row.leaseToken = undefined; row.leaseUntil = undefined
    refreshBatch(state.automation, row.batchId, now)
    logActivity(state, row.state === 'completed' ? 'creative_rendered' : 'render_failed', id, row.state === 'completed' ? 'Private master passed QC; owner review required.' : row.error!)
  })
}
export async function retryFailures(batchId: string) {
  return updateOwnerState(state => {
    let count = 0
    for (const row of Object.values(state.automation.jobs)) if (row.batchId === batchId && row.state === 'failed' && row.attempts < 3) { row.state = 'queued'; row.error = undefined; count++ }
    if (count) refreshBatch(state.automation, batchId, new Date().toISOString())
    logActivity(state, 'failed_jobs_requeued', batchId, `${count} failed jobs queued. Completed jobs were preserved; three-attempt cap.`)
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
  return updateOwnerState(state => {
    const row = retentionCandidates(state.automation).find(job => job.id === id)
    if (!row) return null
    row.mediaStatus = 'purging'; row.cleanupToken ||= randomUUID()
    return { id, token: row.cleanupToken, keys: [row.mediaKey, row.thumbnailKey].filter((key): key is string => Boolean(key)) }
  })
}
export async function finishCleanup(id: string, token: string) {
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
  return { armed: automation.armed, nextDueAt: automation.nextDueAt, lastSchedulerAt: automation.lastSchedulerAt, lastWorkerAt: automation.lastWorkerAt,
    batches: automation.batches.slice(-20).reverse().map(batch => ({ ...batch, completed: Object.values(automation.jobs).filter(job => job.batchId === batch.id && ['completed', 'purged'].includes(job.state)).length,
      failed: Object.values(automation.jobs).filter(job => job.batchId === batch.id && job.state === 'failed').length })),
    jobs: Object.values(automation.jobs).map(({ id, batchId, angle, state, attempts, error, pinned, mediaStatus, purgedAt, downloadCount }) => ({ id, batchId, angle, state, attempts, error, pinned, mediaStatus, purgedAt, downloadCount })) }
}
