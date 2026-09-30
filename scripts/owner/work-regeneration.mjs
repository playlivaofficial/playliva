import videoPolicy from '../../lib/owner/video-production.ts'
if (!videoPolicy.VIDEO_PRODUCTION_ENABLED) { console.log(JSON.stringify({ status: 'disabled', expected: 0, workers: 0, slots: [], message: videoPolicy.VIDEO_PRODUCTION_DISABLED })); process.exit(0) }
// Explicit, single-job workstation execution. Never uploads or publishes.
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import store from '../../lib/owner/server/store.ts'
import social from '../../lib/owner/server/social.ts'
import model from '../../lib/owner/social-model.ts'

const root = resolve(import.meta.dirname, '../..')
const jobId = process.argv.find(value => value.startsWith('--job='))?.slice(6)
if (!jobId) throw new Error('Pass one --job=<id>. List queued jobs in the owner dashboard.')
const state = await store.readOwnerState(), job = state.jobs.find(item => item.id === jobId)
if (!job || job.state !== 'queued') throw new Error('A queued job with this ID is required.')
const source = model.normalizeManifest(await social.socialManifest()).find(item => item.id === job.creativeId)
if (!source) throw new Error('Creative no longer exists in the manifest.')
if (process.env.OWNER_SOCIAL_MANIFEST || process.env.OWNER_MEDIA_ROOT) throw new Error('This worker requires the standard Social Engine manifest/output paths. External media is read-only until migrated to the workstation workflow.')
if (!process.argv.includes('--execute')) {
  console.log(`Job ${job.id}: ${job.creativeId}. Dry run only. Explicit --execute will run voice, capture and QC for this one item; it will never upload.`)
  process.exit(0)
}
const scripts = ['run-voice.mjs', 'capture-shorts.mjs', 'inspect-shorts.mjs']
await store.updateOwnerState(current => {
  const next = current.jobs.find(item => item.id === jobId)
  if (!next || next.state !== 'queued') throw new Error('Job was already claimed.')
  next.state = 'running'; next.detail = 'Claimed by the workstation worker; voice, capture and QC in progress.'
  current.creatives[job.creativeId] = { ...current.creatives[job.creativeId], reviewStatus: 'needs_review', approvedAt: null, renderStatus: 'pending' }
  store.logActivity(current, 'regeneration_started', job.creativeId, `Workstation job ${job.id}`)
})
try {
  for (const script of scripts) await new Promise((success, failure) => {
    const child = spawn(process.execPath, ['--import', 'tsx', resolve(root, 'scripts/social', script), `--id=${job.creativeId}`], { cwd: root, stdio: 'inherit', shell: false })
    child.on('error', failure); child.on('exit', code => code === 0 ? success() : failure(new Error(`Rendering stage ${script} failed.`)))
  })
  const output = JSON.parse(await readFile(resolve(root, 'social/content/youtube-shorts-br.json'), 'utf8'))
  const fresh = model.normalizeManifest(output).find(item => item.id === job.creativeId)
  if (!fresh?.qc?.passed) throw new Error('Rendered creative did not pass QC.')
  await store.updateOwnerState(current => {
    const next = current.jobs.find(item => item.id === jobId)
    next.state = 'completed'; next.finishedAt = new Date().toISOString(); next.detail = 'Workstation render and QC completed. Human review required.'
    current.creatives[job.creativeId] = { ...current.creatives[job.creativeId], reviewStatus: 'needs_review', approvedAt: null, renderStatus: 'rendered', qc: fresh.qc, updatedAt: next.finishedAt }
    store.logActivity(current, 'regeneration_completed', job.creativeId, 'Passed QC; human approval still required. Nothing uploaded.')
  })
  console.log('Single creative regenerated and queued for human review. Nothing uploaded or published.')
} catch {
  await store.updateOwnerState(current => {
    const next = current.jobs.find(item => item.id === jobId)
    next.state = 'failed'; next.finishedAt = new Date().toISOString(); next.detail = 'A workstation render stage failed. Inspect local worker output before retrying.'
    current.creatives[job.creativeId] = { ...current.creatives[job.creativeId], renderStatus: 'failed', reviewStatus: 'needs_review', approvedAt: null }
    store.logActivity(current, 'regeneration_failed', job.creativeId, next.detail)
  })
  process.exitCode = 1
}
