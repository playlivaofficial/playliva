import { appendFile } from 'node:fs/promises'
import store from '../../lib/owner/server/store.ts'
import model from '../../lib/owner/automation-model.ts'
const mode = process.env.WORKER_MODE || 'due'
const { automation } = await store.readOwnerState(), now = new Date().toISOString()
const hasJobs = mode === 'canary' ? !automation.batches.some(batch => batch.kind === 'canary' && batch.state === 'completed') : mode === 'retry' ? Object.values(automation.jobs).some(job => job.state === 'failed' && job.attempts < 3) : mode === 'due' ? model.dueBatch(automation, now) || Object.values(automation.jobs).some(job => job.state === 'queued' || (['rendering','qc'].includes(job.state) && job.leaseUntil < now)) : false
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `has_jobs=${hasJobs}\n`)
console.log(JSON.stringify({ mode, renderDependenciesNeeded: hasJobs }))
