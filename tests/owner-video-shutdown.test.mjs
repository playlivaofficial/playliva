import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import policy from '../lib/owner/video-production.ts'
import service from '../lib/owner/server/automation.ts'
import storage from '../lib/owner/server/object-storage.ts'
import social from '../lib/owner/server/social.ts'
import model from '../lib/owner/model.ts'
import planner from '../lib/owner/creative-planner.ts'
import { renderMaster } from '../scripts/owner/render-master.mjs'
import { capture } from '../scripts/owner/capture-frames.mjs'

test('video mutation, rendering and storage entrypoints stop before any I/O', async () => {
  assert.equal(policy.VIDEO_PRODUCTION_ENABLED, false)
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw Error('Unexpected provider call') }
  try {
    const actions = [() => service.enqueueBatch('scheduled'), () => service.enqueueBatch('manual'), () => service.armAutomation(),
      () => service.claimJob(), () => service.heartbeat('old-job', 'old-lease'), () => service.finishJob('old-job', 'old-lease', { error: 'stale worker' }),
      () => service.reconcileDailyMedia('old-batch'), () => service.retryFailures('old-batch'), () => service.recoverInterruptedJobs(),
      () => service.repairVisualQc(['old-job'], 'historical-repair'), () => service.claimCleanup('old-job'), () => service.finishCleanup('old-job', 'old-lease'),
      () => social.reviewCreative('old-job', 'regenerate', ''), () => storage.uploadPrivate('not-used', new Blob(['test']), 'video/mp4'),
      () => storage.deletePrivate(['not-used']), () => renderMaster({}, 'must-not-create'), () => capture({}, 'must-not-create', 20)]
    for (const action of actions) await assert.rejects(action(), /Automatic video generation is disabled/)
    assert.equal(calls, 0)
  } finally { globalThis.fetch = originalFetch }
})

test('stale worker commands return disabled without credentials, planning, leases or render attempts', () => {
  for (const script of ['preflight', 'cloud-worker', 'work-regeneration', 'render-local-canary']) {
    const result = execFileSync(process.execPath, ['--import', 'tsx', `scripts/owner/${script}.mjs`, '--plan', '--mode=retry', '--execute'], {
      encoding: 'utf8', env: { ...process.env, OWNER_DATABASE_URL: 'invalid-must-not-be-opened', BLOB_READ_WRITE_TOKEN: 'invalid-must-not-be-used', OWNER_SOCIAL_WORKER_ENABLED: 'true' }, timeout: 30000,
    })
    assert.deepEqual(JSON.parse(result), { status: 'disabled', expected: 0, workers: 0, slots: [], message: policy.VIDEO_PRODUCTION_DISABLED })
  }
})

test('historical records remain intact; ordinary owner reads do not inspect any Blob; one review checks only one file', async () => {
  const state = model.emptyOwnerState(), games = service.generationGames()
  assert.equal(games.length, 12)
  const job = planner.planCreative(games[0], 'wow', 'historical-batch', '2026-09-28T00:00:00.000Z', state.automation)
  Object.assign(job, { state: 'completed', mediaStatus: 'available', mediaKey: 'preserved/master.mp4', thumbnailKey: 'preserved/poster.jpg', bytes: 12345, pinned: true, attempts: 5 })
  Object.assign(job.creative, { renderStatus: 'rendered', qc: { passed: true }, reviewStatus: 'approved' })
  state.automation.armed = true
  state.automation.nextDueAt = '2026-09-30T05:00:00.000Z'
  state.automation.jobs[job.id] = job
  const before = JSON.stringify(state), calls = []
  const inspect = async row => { calls.push(row.id); return { ready: true, status: 'READY', missing: false, bytes: 12345, checkedAt: '2026-09-30' } }
  const library = await social.socialLibrary(state, undefined, inspect)
  assert.equal(library.data.find(row => row.id === job.id).availability, 'STORED')
  assert.equal(library.data.find(row => row.id === job.id).media.video, false)
  assert.deepEqual(calls, [])
  const selected = await social.socialLibrary(state, job.id, inspect)
  assert.equal(selected.data.find(row => row.id === job.id).availability, 'READY')
  assert.deepEqual(calls, [job.id])
  const summary = await service.generationSummary(state)
  assert.equal(summary.expectedDailyVideos, 0); assert.equal(summary.armed, false); assert.equal(summary.nextDueAt, null)
  assert.equal(summary.jobs[0].pinned, true); assert.equal(summary.jobs[0].attempts, 5)
  assert.equal(JSON.stringify(state), before)
})

test('video workflow has no timer and both jobs stay disabled; normal CI remains enabled', async () => {
  const workflow = await readFile('.github/workflows/owner-social.yml', 'utf8')
  assert.doesNotMatch(workflow, /\bcron:|^  schedule:/m)
  assert.equal((workflow.match(/if: \$\{\{ false \}\}/g) ?? []).length, 2)
  const ci = await readFile('.github/workflows/ci.yml', 'utf8')
  assert.match(ci, /pull_request:/); assert.match(ci, /pnpm test:routes/)
})
