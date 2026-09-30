import videoPolicy from '../../lib/owner/video-production.ts'
if (!videoPolicy.VIDEO_PRODUCTION_ENABLED) { console.log(JSON.stringify({ status: 'disabled', expected: 0, workers: 0, slots: [], message: videoPolicy.VIDEO_PRODUCTION_DISABLED })); process.exit(0) }
import { readFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { cleanAttempt } from './worker-scratch.mjs'
import automation from '../../lib/owner/server/automation.ts'
import store from '../../lib/owner/server/store.ts'
import automationModel from '../../lib/owner/automation-model.ts'
import objectStorage from '../../lib/owner/server/object-storage.ts'
import { renderMaster } from './render-master.mjs'
import { JOBS_PER_WORKER } from './worker-plan.mjs'
import { finishWorker } from './worker-exit.mjs'
const { enqueueBatch, armAutomation, claimJob, heartbeat, finishJob, retryFailures, claimCleanup, finishCleanup } = automation
const { readOwnerState, persistenceMode } = store
const { retentionCandidates } = automationModel
const { uploadPrivate, deletePrivate, privateStorageConfigured } = objectStorage

const mode = process.argv.find(arg => arg.startsWith('--mode='))?.slice(7) || 'due'
if (!['due', 'today', 'canary', 'arm', 'retry', 'cleanup-dry-run'].includes(mode)) throw new Error('Unsupported worker mode.')
if (persistenceMode() !== 'durable_postgres' || !privateStorageConfigured()) throw new Error('Cloud worker requires durable Postgres and private Blob configuration.')
if (mode === 'arm') { await armAutomation(); console.log('Social automation armed. No rendering or publishing ran.'); process.exit(0) }
if (mode === 'cleanup-dry-run') { console.log(JSON.stringify({ candidates: retentionCandidates((await readOwnerState()).automation).map(job => job.id), deleted: 0 })); process.exit(0) }
const batchId = process.env.OWNER_BATCH_ID || await enqueueBatch(mode === 'canary' ? 'canary' : mode === 'today' ? 'manual' : 'scheduled')
if (mode === 'retry' && process.env.OWNER_RETRY_PREPARED !== 'true') {
  const batches = (await readOwnerState()).automation.batches
  for (const batch of batches.filter(row => ['failed', 'partial'].includes(row.state))) await retryFailures(batch.id)
}
// One CPU render at a time. Leases also protect against duplicate workflow starts.
let completed = 0, failures = 0, attempted = 0
const scratchRoot = resolve(process.env.RUNNER_TEMP || 'social/output/owner-growth', 'social-worker')
while (attempted < JOBS_PER_WORKER) {
  if (!batchId) break
  const job = await claimJob(mode === 'canary' ? batchId : undefined)
  if (!job) break
  attempted++
  const folder = resolve(scratchRoot, job.id, job.leaseToken)
  await mkdir(folder, { recursive: true })
  const timer = setInterval(() => { heartbeat(job.id, job.leaseToken).catch(() => {}) }, 60000)
  const uploaded = []
  try {
    const result = await renderMaster(job, folder)
    await heartbeat(job.id, job.leaseToken, true)
    const prefix = `owner-social/v1/${job.batchId}/${job.id}/${job.leaseToken}`
    uploaded.push(`${prefix}/master.mp4`)
    const masterBytes = await readFile(result.master)
    const mediaSha256 = createHash('sha256').update(masterBytes).digest('hex')
    const mediaKey = await uploadPrivate(`${prefix}/master.mp4`, new Blob([masterBytes]), 'video/mp4')
    uploaded.push(`${prefix}/poster.jpg`)
    const thumbnailKey = await uploadPrivate(`${prefix}/poster.jpg`, new Blob([await readFile(result.poster)]), 'image/jpeg')
    await finishJob(job.id, job.leaseToken, { mediaKey, thumbnailKey, bytes: result.bytes, mediaSha256, qc: result.qc, duration: result.duration })
    completed++; console.log(JSON.stringify({ id: job.id, state: 'completed', bytes: result.bytes, seconds: result.duration }))
  } catch (error) {
    // Do not forward provider responses or credentials into logs / dashboard errors.
    const detail = /^(Capture |Native capture |Narration |Final resolution|Audio measurement|Media duration|Chrome runtime|Social worker)/.test(error.message) ? error.message.slice(0, 240) : 'Render, voice, encode or storage stage failed. Inspect the restricted worker run.'
    // Preserve blobs if the final commit succeeded but its response was lost.
    const current = (await readOwnerState()).automation.jobs[job.id]
    if (current.state !== 'completed') {
      if (uploaded.length) await deletePrivate(uploaded).catch(() => {})
      await finishJob(job.id, job.leaseToken, { error: detail }).catch(() => {})
      failures++; console.error(JSON.stringify({ id: job.id, state: 'failed', detail }))
    }
  } finally {
    clearInterval(timer)
    // Only this lease's temporary renders; durable media/history live elsewhere.
    await cleanAttempt(scratchRoot, folder)
  }
}
// Daily history is retained; no automatic deletion is part of daily production.
for (const job of mode === 'canary' ? retentionCandidates((await readOwnerState()).automation) : []) {
  const claim = await claimCleanup(job.id)
  if (!claim) continue
  try { await deletePrivate(claim.keys); await finishCleanup(claim.id, claim.token) }
  catch { console.error(JSON.stringify({ id: claim.id, cleanup: 'pending retry; metadata preserved' })); failures++ }
}
finishWorker({ batchId, completed, failures, attempted, workerJobLimit: JOBS_PER_WORKER, autoPublish: false }, failures ? 1 : 0)
