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
test('cloud dispatch splits 36/39 jobs into sequential bounded workers; canary and idle remain single jobs', () => {
  const state = { ...automationModel.emptyAutomation(), armed: true, nextDueAt: '2026-10-01T05:00:00Z' }, now = '2026-10-01T05:01:00Z'
  const plan = (mode, size = 36) => workerPlan(state, mode, size, now, automationModel.dueBatch)
  assert.equal(JOBS_PER_WORKER, 3)
  assert.equal(plan('due').slots.length, 12)
  assert.equal(plan('due', 39).slots.length, 13)
  assert.equal(plan('canary').expectedJobs, 1)
  assert.deepEqual(plan('arm').slots, [0])
  state.armed = false
  assert.equal(plan('due').hasJobs, false)
  state.batches.push({ id: 'canary-v1', kind: 'canary', state: 'completed' })
  assert.equal(plan('canary').hasJobs, false)
  state.jobs.a = { batchId: 'batch-old', state: 'failed', attempts: 3 }
  state.jobs.b = { batchId: 'batch-old', state: 'failed', attempts: 1 }
  state.jobs.c = { batchId: 'batch-old', state: 'completed', attempts: 1 }
  assert.equal(plan('retry').expectedJobs, 1)
  state.armed = true
  state.batches.push({ id: 'batch-old', kind: 'scheduled', state: 'failed' })
  assert.equal(plan('due').hasJobs, false, 'failed batches do not allocate an empty 12-worker matrix')
  for (let i = 0; i < 7; i++) state.jobs[`queued-${i}`] = { state: 'queued' }
  assert.equal(plan('due').slots.length, 3, 'resume only remaining queued jobs')
  assert.throws(() => workerPlan(automationModel.emptyAutomation(), 'invalid', 36, now, automationModel.dueBatch), /Unsupported/)
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
test('generation derives all current games; a thirteenth registry entry automatically yields 39 distinct jobs', () => {
  assert.equal(games.length, 12)
  const state = automationModel.emptyAutomation()
  for (const registry of [games, [...games, { ...games[0], slug: 'future-original', title: 'Future Original' }]]) {
    const jobs = planner.planBatch(registry, 'batch-20261001', '2026-10-01T05:00:00Z', state)
    assert.equal(jobs.length, registry.length * 3)
    assert.equal(new Set(jobs.map(job => job.id)).size, jobs.length)
    for (const game of registry) assert.deepEqual(jobs.filter(job => job.gameSlug === game.slug).map(job => job.angle), ['wow', 'challenge', 'feature'])
    assert.ok(jobs.every(job => job.creative.locale === 'pt-BR' && job.creative.publishStatus === 'unpublished' && job.creative.uploadStatus === 'not_uploaded'))
  }
})
test('daily due check uses canonical Tbilisi timezone, not day-of-month cron arithmetic', () => {
  assert.equal(new Intl.DateTimeFormat('en', { timeZone: automationModel.GENERATION_TIMEZONE, hour: '2-digit', hourCycle: 'h23' }).format(new Date('2026-10-01T05:00:00Z')), '09')
  assert.equal(automationModel.atOrAfterNine(new Date('2026-09-30T22:00:00Z')), '2026-10-01T05:00:00.000Z')
  assert.equal(automationModel.nextScheduledSlot('2026-10-01T05:00:00Z', '2026-10-01T08:30:00Z'), '2026-10-04T05:00:00.000Z')
  assert.equal(automationModel.nextScheduledSlot('2026-10-01T05:00:00Z', '2026-10-08T08:30:00Z'), '2026-10-10T05:00:00.000Z')
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
  assert.equal(Object.keys(state.automation.jobs).length, 36)
  const claimed = await Promise.all([automation.claimJob(ids[0]), automation.claimJob(ids[0])])
  assert.notEqual(claimed[0].id, claimed[1].id)
  await assert.rejects(automation.finishJob(claimed[0].id, 'wrong-lease', { error: 'not the owner' }), /lease/)
  const qc = { passed: true, inspectedAt: new Date().toISOString(), width: 1080, height: 1920, fps: 30, bitrate: 10000, lufs: -16, notes: [] }
  await automation.finishJob(claimed[0].id, claimed[0].leaseToken, { mediaKey: 'fixture.mp4', thumbnailKey: 'fixture.jpg', bytes: 200, duration: 21, qc })
  await automation.finishJob(claimed[1].id, claimed[1].leaseToken, { error: 'controlled failure' })
  assert.equal(await automation.retryFailures(ids[0]), 1)
  state = await store.readOwnerState()
  assert.equal(state.automation.jobs[claimed[0].id].state, 'completed')
  assert.equal(state.automation.jobs[claimed[0].id].attempts, 1)
  await store.updateOwnerState(state => {
    for (const job of Object.values(state.automation.jobs)) job.state = 'completed'
    state.automation.batches[0].state = 'completed'
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
  assert.equal(library.data.length, 86)
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
test('partial success keeps all 34 good masters and never makes an active batch eligible for cleanup', () => {
  const state = automationModel.emptyAutomation(), id = 'batch-20261001', now = '2026-10-01T06:00:00Z'
  const jobs = planner.planBatch(games, id, now, state)
  state.batches.push({ id, kind: 'scheduled', state: 'running', createdAt: now, scheduledAt: '2026-10-01T05:00:00Z', expected: 36, gameCount: 12 })
  jobs.forEach((job, index) => { job.state = index < 34 ? 'completed' : 'failed'; job.mediaStatus = index < 34 ? 'available' : 'pending'; state.jobs[job.id] = job })
  automationModel.refreshBatch(state, id, now)
  assert.equal(state.batches[0].state, 'partial')
  assert.equal(Object.values(state.jobs).filter(job => job.state === 'completed').length, 34)
  assert.equal(automationModel.retentionCandidates(state).length, 0)
  assert.equal(state.nextDueAt, null)
})
