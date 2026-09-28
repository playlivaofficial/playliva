import { appendFile } from 'node:fs/promises'
import store from '../../lib/owner/server/store.ts'
import service from '../../lib/owner/server/automation.ts'
import { workerPlan } from './worker-plan.mjs'
const mode = process.env.WORKER_MODE || 'due'
if (!['due', 'today', 'canary', 'arm', 'retry', 'cleanup-dry-run'].includes(mode)) throw new Error('Unsupported worker mode.')
let batchId = process.env.OWNER_BATCH_ID
if (process.argv.includes('--plan') && ['due', 'today', 'retry', 'canary'].includes(mode)) {
  if (mode !== 'canary') await service.recoverInterruptedJobs()
  batchId = await service.enqueueBatch(mode === 'canary' ? 'canary' : mode === 'today' ? 'manual' : 'scheduled')
  if (batchId) {
    await service.reconcileDailyMedia(batchId)
    await service.retryFailures(batchId)
  }
  if (mode === 'retry') for (const batch of (await store.readOwnerState()).automation.batches.filter(row => row.kind === 'daily')) await service.retryFailures(batch.id)
}
const { automation } = await store.readOwnerState()
const eligible = new Set(service.generationGames().map(game => game.id ?? game.slug))
const count = Object.values(automation.jobs).filter(job => job.state === 'queued' && (mode === 'canary' ? job.batchId === batchId : job.generationDate && eligible.has(job.canonicalGameId))).length
const { slots } = workerPlan(count)
const workers = slots.length
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `has_jobs=${count > 0}\nslots=${JSON.stringify(slots)}\nbatch_id=${batchId ?? ''}\n`)
console.log(JSON.stringify({ mode, batchId, renderDependenciesNeeded: count > 0, workers, expectedJobs: count }))
