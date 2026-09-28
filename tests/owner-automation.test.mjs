import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import model from '../lib/owner/model.ts'
import automationModel from '../lib/owner/automation-model.ts'
import planner from '../lib/owner/creative-planner.ts'
import automation from '../lib/owner/server/automation.ts'
import store from '../lib/owner/server/store.ts'
import media from '../lib/owner/server/object-storage.ts'
import social from '../lib/owner/server/social.ts'
import { cleanAttempt } from '../scripts/owner/worker-scratch.mjs'
import { workerPlan, JOBS_PER_WORKER } from '../scripts/owner/worker-plan.mjs'

const games = automation.generationGames()
test('cloud dispatch derives sequential bounded workers from the actual pending queue', () => {
  assert.equal(JOBS_PER_WORKER, 3)
  assert.equal(workerPlan(12).slots.length, 4)
  assert.equal(workerPlan(13).slots.length, 5)
  assert.equal(workerPlan(7).slots.length, 3)
  assert.equal(workerPlan(1).expectedJobs, 1)
  assert.equal(workerPlan(0).hasJobs, false)
  assert.deepEqual(workerPlan(0).slots, [0])
  assert.throws(() => workerPlan(-1), /Invalid/)
  assert.throws(() => workerPlan(769), /bounded/)
})
test('worker scratch cleanup only removes its validated two-level attempt directory', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'playliva-worker-'))
  const attempt = resolve(root, 'job', 'lease'), preserved = resolve(root, 'job', 'other-lease')
  await mkdir(attempt, { recursive: true }); await mkdir(preserved, { recursive: true })
  await writeFile(resolve(attempt, 'capture.mkv'), 'temporary')
  await assert.rejects(cleanAttempt(root, root), /boundary/)
  await assert.rejects(cleanAttempt(root, resolve(root, 'job')), /boundary/)
  await cleanAttempt(root, attempt)
  await assert.rejects(stat(attempt), { code: 'ENOENT' }); assert.ok((await stat(preserved)).isDirectory())
})
test('generation derives all current games; a new canonical game automatically receives one distinct daily slot', () => {
  assert.equal(games.length, 12)
  const state = automationModel.emptyAutomation()
  for (const registry of [games, [...games, { ...games[0], id: 'future-original', slug: 'future-original', title: 'Future Original' }]]) {
    const jobs = planner.planBatch(registry, 'batch-20261001', '2026-10-01T05:00:00Z', state)
    assert.equal(jobs.length, registry.length)
    assert.equal(new Set(jobs.map(job => job.id)).size, jobs.length)
    for (const game of registry) assert.equal(jobs.filter(job => job.gameSlug === game.slug).length, 1)
    assert.ok(jobs.every(job => job.creative.locale === 'pt-BR' && job.creative.publishStatus === 'unpublished' && job.creative.uploadStatus === 'not_uploaded'))
  }
})
test('daily due check uses canonical Tbilisi timezone, not day-of-month cron arithmetic', () => {
  assert.equal(new Intl.DateTimeFormat('en', { timeZone: automationModel.GENERATION_TIMEZONE, hour: '2-digit', hourCycle: 'h23' }).format(new Date('2026-10-01T05:00:00Z')), '09')
  assert.equal(automationModel.atOrAfterNine(new Date('2026-09-30T22:00:00Z')), '2026-10-01T05:00:00.000Z')
  assert.equal(automationModel.nextScheduledSlot('2026-10-01T05:00:00Z', '2026-10-01T08:30:00Z'), '2026-10-02T05:00:00.000Z')
  assert.equal(automationModel.nextScheduledSlot('2026-10-01T05:00:00Z', '2026-10-08T08:30:00Z'), '2026-10-09T05:00:00.000Z')
  const state = { ...automationModel.emptyAutomation(), armed: true, nextDueAt: '2026-10-04T05:00:00Z' }
  assert.equal(automationModel.dueBatch(state, '2026-10-04T04:59:59Z'), false)
  assert.equal(automationModel.dueBatch(state, '2026-10-04T05:00:00Z'), true)
})
test('hook and capture choices avoid near duplicates across the previous three batches', () => {
  const state = automationModel.emptyAutomation()
  for (let day = 1; day <= 25; day += 3) {
    const batchId = `batch-202610${String(day).padStart(2, '0')}`, now = `2026-10-${String(day).padStart(2, '0')}T05:00:00Z`
    const jobs = planner.planBatch(games, batchId, now, state)
    const previous = Object.values(state.jobs).filter(job => state.batches.slice(-3).some(batch => batch.id === job.batchId))
    for (const job of jobs) for (const old of previous.filter(old => old.gameSlug === job.gameSlug)) {
      assert.ok(automationModel.hookSimilarity(job.creative.hook, old.creative.hook) < .7)
      if (old.angle === job.angle) assert.notEqual(job.captureVariant, old.captureVariant)
    }
    for (const job of jobs) state.jobs[job.id] = job
    state.batches.push({ id: batchId, scheduledAt: now, createdAt: now, kind: 'scheduled', state: 'completed', expected: jobs.length, gameCount: games.length })
  }
})
test('durable queue deduplicates concurrent batches, leases claims, retries only failures and safely serializes pin vs purge', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'playliva-automation-'))
  process.env.OWNER_LOCAL_ENABLED = '1'; process.env.OWNER_DATA_DIR = directory
  delete process.env.OWNER_DATABASE_URL; delete process.env.OWNER_REDIS_REST_URL; delete process.env.VERCEL
  await store.updateOwnerState(state => { state.automation.armed = true; state.automation.nextDueAt = '2026-10-01T05:00:00Z' })
  const ids = await Promise.all(Array.from({ length: 8 }, () => automation.enqueueBatch('scheduled', '2026-10-01T05:01:00Z')))
  assert.equal(new Set(ids).size, 1)
  let state = await store.readOwnerState()
  assert.equal(Object.keys(state.automation.jobs).length, games.length)
  const claimed = await Promise.all([automation.claimJob(ids[0]), automation.claimJob(ids[0])])
  assert.notEqual(claimed[0].id, claimed[1].id)
  await assert.rejects(automation.finishJob(claimed[0].id, 'wrong-lease', { error: 'not the owner' }), /lease/)
  const qc = { passed: true, inspectedAt: new Date().toISOString(), width: 1080, height: 1920, fps: 30, bitrate: 10000, lufs: -16, notes: [] }
  await automation.finishJob(claimed[0].id, claimed[0].leaseToken, { mediaKey: 'fixture.mp4', thumbnailKey: 'fixture.jpg', bytes: 200, mediaSha256: 'a'.repeat(64), duration: 21, qc }, async () => ({ ready: true }))
  await automation.finishJob(claimed[1].id, claimed[1].leaseToken, { error: 'controlled failure' })
  assert.equal(await automation.retryFailures(ids[0]), 1)
  state = await store.readOwnerState()
  assert.equal(state.automation.jobs[claimed[0].id].state, 'completed')
  assert.equal(state.automation.jobs[claimed[0].id].attempts, 1)
  await store.updateOwnerState(state => {
    for (const job of Object.values(state.automation.jobs)) job.state = 'completed'
    state.automation.batches[0].state = 'completed'; state.automation.batches[0].kind = 'scheduled'
    for (let index = 2; index <= 3; index++) state.automation.batches.push({ id: `batch-${index}`, kind: 'scheduled', state: 'completed', expected: 1, gameCount: 1, createdAt: `2026-10-0${index}T05:00:00Z`, scheduledAt: `2026-10-0${index}T05:00:00Z` })
  })
  await automation.setPinned(claimed[0].id, true)
  assert.equal(await automation.claimCleanup(claimed[0].id), null)
  await automation.setPinned(claimed[0].id, false)
  const claim = await automation.claimCleanup(claimed[0].id)
  assert.ok(claim)
  await assert.rejects(automation.setPinned(claimed[0].id, true), /cleanup/)
  await automation.finishCleanup(claim.id, claim.token)
  state = await store.readOwnerState()
  assert.equal(state.automation.jobs[claim.id].mediaStatus, 'purged')
  assert.equal(state.automation.jobs[claim.id].creative.hook, claimed[0].creative.hook)
  assert.equal(state.automation.jobs[claim.id].pinHistory.length, 2)
  assert.equal(await automation.claimCleanup(claim.id), null)
  const library = await social.socialLibrary(state)
  assert.equal(library.data.length, 50 + games.length)
  assert.equal(library.data.filter(row => row.uploadStatus === 'uploaded_private').length, 1)
  // Legacy v1 data migrates without losing owner decisions.
  const legacy = model.emptyOwnerState(); legacy.version = 1; delete legacy.automation
  legacy.content.keep = { topic: 'Preserve me' }
  await writeFile(resolve(directory, 'state.json'), JSON.stringify(legacy))
  const migrated = await store.readOwnerState()
  assert.equal(migrated.version, 2); assert.equal(migrated.content.keep.topic, 'Preserve me')
})
test('private media keys are strictly scoped and automation cannot publish', async () => {
  assert.equal(media.validMediaKey('owner-social/v1/batch-20261001/job-1/attempt-1/master.mp4'), true)
  for (const key of ['https://example.com/video.mp4', '../secrets', 'owner-social/v1/a/b/../../secret', 'public/master.mp4']) assert.equal(media.validMediaKey(key), false)
  const worker = await readFile(new URL('../scripts/owner/cloud-worker.mjs', import.meta.url), 'utf8')
  const workflow = await readFile(new URL('../.github/workflows/owner-social.yml', import.meta.url), 'utf8')
  assert.ok(!/youtube-upload|youtube-validation-upload|tiktok.*upload|instagram.*publish/.test(worker + workflow))
  assert.match(workflow, /contents: read/); assert.match(workflow, /cancel-in-progress: false/)
  assert.ok(!/runs-on:.*self-hosted/.test(workflow))
})
test('partial success keeps every good daily master and never makes an active batch eligible for cleanup', () => {
  const state = automationModel.emptyAutomation(), id = 'batch-20261001', now = '2026-10-01T06:00:00Z'
  const jobs = planner.planBatch(games, id, now, state)
  state.batches.push({ id, kind: 'scheduled', state: 'running', createdAt: now, scheduledAt: '2026-10-01T05:00:00Z', expected: games.length, gameCount: games.length })
  jobs.forEach((job, index) => { job.state = index < games.length - 2 ? 'completed' : 'failed'; job.mediaStatus = index < games.length - 2 ? 'available' : 'pending'; state.jobs[job.id] = job })
  automationModel.refreshBatch(state, id, now)
  assert.equal(state.batches[0].state, 'partial')
  assert.equal(Object.values(state.jobs).filter(job => job.state === 'completed').length, games.length - 2)
  assert.equal(automationModel.retentionCandidates(state).length, 0)
  assert.equal(state.nextDueAt, null)
})
