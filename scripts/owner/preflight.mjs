import { appendFile } from 'node:fs/promises'
import store from '../../lib/owner/server/store.ts'
import model from '../../lib/owner/automation-model.ts'
import service from '../../lib/owner/server/automation.ts'
import { workerPlan } from './worker-plan.mjs'
const mode = process.env.WORKER_MODE || 'due'
// Retry once per workflow, never once per matrix worker.
if (process.argv.includes('--plan') && mode === 'retry') {
  for (const batch of (await store.readOwnerState()).automation.batches.filter(row => ['failed', 'partial'].includes(row.state))) await service.retryFailures(batch.id)
}
const { automation } = await store.readOwnerState(), now = new Date().toISOString()
const plan = workerPlan(automation, mode === 'retry' && process.env.OWNER_RETRY_PREPARED === 'true' ? 'due' : mode, service.generationGames().length * model.CREATIVES_PER_GAME, now, model.dueBatch)
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `has_jobs=${plan.hasJobs}\nslots=${JSON.stringify(plan.slots)}\n`)
console.log(JSON.stringify({ mode, renderDependenciesNeeded: plan.hasJobs, workers: plan.slots.length, expectedJobs: plan.expectedJobs }))
