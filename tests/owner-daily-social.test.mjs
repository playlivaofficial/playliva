import { mock } from 'node:test'
import videoPolicy from '../lib/owner/video-production.ts'
mock.method(videoPolicy.videoProductionPolicy, 'assertEnabled', () => {})
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import model from '../lib/owner/automation-model.ts'
import planner from '../lib/owner/creative-planner.ts'
import service from '../lib/owner/server/automation.ts'
import store from '../lib/owner/server/store.ts'
import media from '../lib/owner/server/media-inventory.ts'
import inventory from '../lib/owner/social-inventory.ts'
const games = service.generationGames(), now = '2026-10-01T06:00:00.000Z'
const qc = { passed: true, inspectedAt: now, width: 1080, height: 1920, fps: 30, bitrate: 10000, lufs: -16, notes: [] }
const video = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(4096)])
const ref = { mediaKey: 'owner-social/v1/daily-20261001/job-one/lease-one/master.mp4', thumbnailKey: 'owner-social/v1/daily-20261001/job-one/lease-one/poster.jpg', bytes: video.length, mediaSha256: createHash('sha256').update(video).digest('hex') }
const reader = async (key, range) => {
  const body = key.endsWith('.jpg') ? Buffer.from([255, 216, 255, 224, 0, 0]) : range ? video.subarray(0, 32) : video
  return { statusCode: 200, headers: new Headers({ 'content-length': String(body.length), ...(range ? { 'content-range': `bytes 0-${body.length - 1}/${key.endsWith('.jpg') ? body.length : video.length}` } : {}) }), stream: new Response(body).body, blob: { size: body.length } }
}
const readyCreative = () => ({ ...planner.planBatch([games[0]], model.dailyBatchId('2026-10-01'), now, model.emptyAutomation())[0].creative, renderStatus: 'rendered', qc, availability: 'READY', media: { video: true, thumbnail: true }, mediaBytes: video.length })

test('calendar identity uses Tbilisi date and stable canonical ID, never a title or mutable slug', () => {
  assert.equal(model.generationDate('2026-10-01T20:00:00Z'), '2026-10-02')
  assert.equal(model.generationDate('2026-10-01T19:59:59Z'), '2026-10-01')
  assert.equal(model.dailyJobId(games[0], '2026-10-01'), model.dailyJobId({ ...games[0], slug: 'renamed-route' }, '2026-10-01'))
  assert.notEqual(model.dailyJobId(games[0], '2026-10-01'), model.dailyJobId(games[0], '2026-10-02'))
})
test('registry is dynamic, disabled games excluded and every eligible game gets exactly one creative', () => {
  const added = { ...games[0], id: 'new-original', slug: 'new-original' }
  const catalog = [{ ...games[0], enabled: false }, ...games.slice(1), added]
  const planned = planner.planBatch(catalog, 'daily-20261001', now, model.emptyAutomation())
  assert.equal(planned.length, games.length)
  assert.equal(new Set(planned.map(row => row.canonicalGameId)).size, planned.length)
  assert.ok(planned.some(row => row.canonicalGameId === added.id))
  assert.ok(!planned.some(row => row.canonicalGameId === games[0].id))
})
test('READY requires actual preview, download, non-zero bytes, valid MP4, thumbnail and persistent checksum', async () => {
  assert.equal((await media.inspectPrivateMedia(ref, reader)).ready, true)
  for (const input of [{}, { ...ref, bytes: 0 }, { ...ref, bytes: video.length + 1 }, { ...ref, mediaSha256: 'a'.repeat(64) }]) assert.equal((await media.inspectPrivateMedia(input, reader)).ready, false)
  for (const failure of ['preview', 'download', 'thumbnail']) {
    const failing = async (key, range) => (failure === 'preview' && range && key.endsWith('.mp4')) || (failure === 'download' && !range) || (failure === 'thumbnail' && key.endsWith('.jpg')) ? null : reader(key, range)
    assert.equal((await media.inspectPrivateMedia(ref, failing)).ready, false, failure)
  }
  const invalid = async (key, range) => { const r = await reader(key, range); if (key.endsWith('.mp4')) r.stream = new Response(Buffer.alloc(32)).body; return r }
  assert.equal((await media.inspectPrivateMedia(ref, invalid)).ready, false)
  const outage = await media.inspectPrivateMedia(ref, async () => { throw Error('provider offline') })
  assert.equal(outage.ready, false); assert.equal(outage.missing, false, 'outage does not authorize replacing a completed object')
})
test('metadata labels, missing bytes, preview and download failure never count as usable inventory', () => {
  const item = readyCreative()
  assert.equal(inventory.dailyInventory(games, [item], now).ready, 1)
  for (const bad of [{ ...item, mediaBytes: 0 }, { ...item, media: { video: false, thumbnail: true } }, { ...item, availability: 'ARCHIVED' }, { ...item, availability: 'MISSING_MEDIA' }, { ...item, renderStatus: 'pending' }, { ...item, qc: null }]) {
    assert.equal(inventory.isReadyVideo(bad), false)
    const tally = inventory.dailyInventory(games, [bad], now)
    assert.equal(tally.ready, 0); assert.equal(tally.expected, games.length)
  }
  assert.equal(inventory.dailyInventory([...games, { ...games[0], id: 'new', slug: 'new' }], [item], now).expected, games.length + 1)
})
test('daily queue is concurrent/idempotent, adds new games, excludes disabled games, and recovers only the failed slot', async () => {
  process.env.OWNER_LOCAL_ENABLED = '1'; process.env.OWNER_DATA_DIR = await mkdtemp(resolve(tmpdir(), 'daily-social-'))
  delete process.env.OWNER_DATABASE_URL; delete process.env.OWNER_REDIS_REST_URL; delete process.env.VERCEL
  await store.updateOwnerState(s => { s.automation.armed = true })
  const ids = await Promise.all(Array.from({ length: 6 }, () => service.enqueueBatch('scheduled', now)))
  assert.equal(new Set(ids).size, 1)
  const id = ids[0]
  assert.equal(Object.keys((await store.readOwnerState()).automation.jobs).length, games.length)
  const good = await service.claimJob(id, now), bad = await service.claimJob(id, now)
  await assert.rejects(service.finishJob(good.id, good.leaseToken, { ...ref, qc, duration: 20 }, async () => ({ ready: false })), /not READY/)
  assert.equal((await store.readOwnerState()).automation.jobs[good.id].state, 'rendering', 'failed persistence never commits READY')
  await service.finishJob(good.id, good.leaseToken, { ...ref, qc, duration: 20 }, input => media.inspectPrivateMedia(input, reader))
  await service.finishJob(bad.id, bad.leaseToken, { error: 'Controlled render failure' })
  assert.equal(await service.retryFailures(id), 1)
  const completed = (await store.readOwnerState()).automation.jobs[good.id]
  await service.enqueueBatch('scheduled', now)
  assert.deepEqual((await store.readOwnerState()).automation.jobs[good.id], completed, 'rerun preserves the successful slot and its immutable file')
  const added = { ...games[0], id: 'new-canonical-game', slug: 'new-canonical-game' }
  await service.enqueueBatch('manual', now, [...games, added])
  assert.ok((await store.readOwnerState()).automation.jobs[model.dailyJobId(added, '2026-10-01')])
  const tomorrow = '2026-10-02T06:00:00.000Z'
  await service.enqueueBatch('scheduled', tomorrow, [{ ...games[0], enabled: false }, ...games.slice(1), added])
  let s = await store.readOwnerState()
  assert.equal(Object.values(s.automation.jobs).filter(row => row.generationDate === '2026-10-02').length, games.length)
  assert.ok(!s.automation.jobs[model.dailyJobId(games[0], '2026-10-02')])
  await service.reconcileDailyMedia(id, async () => ({ ready: false, missing: false }))
  assert.equal((await store.readOwnerState()).automation.jobs[good.id].state, 'completed')
  await service.reconcileDailyMedia(id, async () => ({ ready: false, missing: true }))
  s = await store.readOwnerState();assert.equal(s.automation.jobs[good.id].mediaStatus, 'missing')
  assert.equal(await service.retryFailures(id), 1)
  assert.equal((await store.readOwnerState()).automation.jobs[good.id].id, good.id)
  assert.equal(model.retentionCandidates(s.automation).length, 0, 'daily history is not deleted by legacy retention')
  const interrupted = await service.claimJob(id, tomorrow)
  const live = await service.claimJob(id, '2026-10-02T06:29:00.000Z')
  assert.equal(await service.recoverInterruptedJobs('2026-10-02T06:31:00.000Z'), 1)
  s = await store.readOwnerState()
  assert.equal(s.automation.jobs[interrupted.id].state, 'queued')
  assert.equal(s.automation.jobs[interrupted.id].leaseToken, undefined)
  assert.equal(s.automation.jobs[live.id].state, 'rendering', 'live lease is preserved')
})
test('daily hook rotation retains recent per-game history without repeating adjacent days', () => {
  const state = model.emptyAutomation()
  for (let day = 1; day <= 28; day++) {
    const date = `2026-10-${String(day).padStart(2, '0')}`, id = model.dailyBatchId(date), at = date + 'T06:00:00Z'
    const jobs = planner.planBatch(games, id, at, state)
    const previous = Object.values(state.jobs).filter(job => state.batches.slice(-3).some(b => b.id === job.batchId))
    for (const job of jobs) assert.ok(previous.filter(p => p.canonicalGameId === job.canonicalGameId).every(p => model.hookSimilarity(p.creative.hook, job.creative.hook) < .7))
    jobs.forEach(job => { state.jobs[job.id] = job });state.batches.push({ id })
  }
})
test('explicit visual repair preserves private originals and the daily identity, refuses protected history, and is idempotent', async () => {
  process.env.OWNER_LOCAL_ENABLED='1';process.env.OWNER_DATA_DIR=await mkdtemp(resolve(tmpdir(),'social-visual-repair-'))
  delete process.env.OWNER_DATABASE_URL;delete process.env.OWNER_REDIS_REST_URL;delete process.env.VERCEL
  await store.updateOwnerState(s=>{s.automation.armed=true})
  const batch=await service.enqueueBatch('manual',now),job=await service.claimJob(batch,now),other=await service.claimJob(batch,now)
  await service.finishJob(job.id,job.leaseToken,{...ref,qc,duration:20},input=>media.inspectPrivateMedia(input,reader))
  await service.finishJob(other.id,other.leaseToken,{...ref,qc,duration:20},input=>media.inspectPrivateMedia(input,reader))
  const version='b'.repeat(40),before=await store.readOwnerState()
  await store.updateOwnerState(s=>{s.creatives[other.id]={reviewStatus:'approved'}})
  await assert.rejects(service.repairVisualQc([job.id,other.id],version,now),/protected/)
  assert.equal((await store.readOwnerState()).automation.jobs[job.id].state,'completed','all requested IDs are validated before any mutation')
  assert.equal(await service.repairVisualQc([job.id],version,now),1)
  assert.equal(await service.repairVisualQc([job.id],version,now),0)
  let state=await store.readOwnerState(),row=state.automation.jobs[job.id]
  assert.equal(row.state,'failed');assert.equal(row.mediaHistory.length,1);assert.equal(row.mediaHistory[0].mediaKey,ref.mediaKey)
  assert.equal(row.mediaKey,ref.mediaKey,'no private file is deleted')
  assert.equal(Object.keys(state.automation.jobs).length,Object.keys(before.automation.jobs).length)
  assert.deepEqual(state.automation.jobs[other.id],before.automation.jobs[other.id])
  assert.equal(await service.retryFailures(batch),1)
  state=await store.readOwnerState();assert.equal(state.automation.jobs[job.id].state,'queued')
  await assert.rejects(service.repairVisualQc([job.id],version,'2026-10-02T06:00:00Z'),/today/)
})

test('explicit versioned repair grants one bounded attempt after failure without resetting history or reopening automatic retries', async () => {
  process.env.OWNER_LOCAL_ENABLED='1';process.env.OWNER_DATA_DIR=await mkdtemp(resolve(tmpdir(),'social-failed-repair-'))
  delete process.env.OWNER_DATABASE_URL;delete process.env.OWNER_REDIS_REST_URL;delete process.env.VERCEL
  await store.updateOwnerState(s=>{s.automation.armed=true})
  const batch=await service.enqueueBatch('manual',now),job=await service.claimJob(batch,now)
  await store.updateOwnerState(s=>{s.automation.jobs[job.id].attempts=3})
  await service.finishJob(job.id,job.leaseToken,{error:'Capture startup failed'})
  assert.equal(await service.retryFailures(batch),0)
  const version='c'.repeat(40)
  assert.equal(await service.repairVisualQc([job.id],version,now),1)
  assert.equal(await service.repairVisualQc([job.id],version,now),0)
  let row=(await store.readOwnerState()).automation.jobs[job.id]
  assert.equal(row.attempts,3);assert.equal(row.manualRetryLimit,4)
  assert.equal(await service.retryFailures(batch),1)
  const retry=await service.claimJob(batch,now)
  assert.equal(retry.id,job.id);assert.equal(retry.attempts,4)
  await service.finishJob(retry.id,retry.leaseToken,{error:'Controlled failure'})
  assert.equal(await service.retryFailures(batch),0)
  assert.equal(await service.repairVisualQc([job.id],version,now),0)
  row=(await store.readOwnerState()).automation.jobs[job.id]
  assert.equal(row.attempts,4);assert.equal(row.state,'failed')
})
