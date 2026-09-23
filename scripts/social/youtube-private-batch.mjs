// Private review uploads only. Session URLs are credentials and stay in .youtube-oauth.
import { readFile, writeFile, rename, stat, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import content from '../../lib/social/content.ts'
import youtube from '../../lib/social/youtube.ts'

const root = resolve(import.meta.dirname, '../..')
const manifestPath = resolve(root, 'social/content/youtube-shorts-br.json')
const statePath = resolve(root, '.youtube-oauth/private-upload-sessions.json')
const reportPath = resolve(root, 'social/output/private-upload-report.json')
const confirm = process.argv.includes('--confirm-all-private')
const sleep = ms => new Promise(done => setTimeout(done, ms))
async function save(path, value) {
  await writeFile(`${path}.tmp`, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  await rename(`${path}.tmp`, path)
}
async function optionalJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return fallback; throw error }
}
const manifest = content.validateManifest(JSON.parse(await readFile(manifestPath, 'utf8')))
const qc = JSON.parse(await readFile(resolve(root, 'social/content/youtube-shorts-br-qc.json'), 'utf8'))
const order = ['crash', 'mines', 'blackjack', 'roulette', 'capybara-gold']
manifest.items.sort((a, b) => order.indexOf(a.gameSlug) - order.indexOf(b.gameSlug) || a.captureVariant - b.captureVariant)
for (const item of manifest.items) {
  const bytes = await readFile(resolve(root, item.videoFile))
  const expected = qc.items.find(row => row.contentId === item.contentId)
  const hash = createHash('sha256').update(bytes).digest('hex')
  if (!expected?.passed || !item.qc?.passed || hash !== expected.sha256 || hash !== item.qc.sha256) throw new Error(`${item.contentId}: QC/hash mismatch`)
  if (item.scheduledAt || item.publishedAt) throw new Error('Public or scheduled state blocks this private queue')
}
console.log('Preflight: 50 unchanged QC-passed masters, unique metadata/UTMs, exact Original routes.')
const rawClient = JSON.parse(await readFile(resolve(root, process.env.YOUTUBE_OAUTH_CLIENT_FILE ?? '.youtube-oauth/client_secret.json'), 'utf8'))
const client = rawClient.installed ?? rawClient.web
const token = JSON.parse(await readFile(resolve(root, process.env.YOUTUBE_OAUTH_TOKEN_FILE ?? '.youtube-oauth/token.json'), 'utf8'))
let bearer, expires = 0
async function headers() {
  if (Date.now() >= expires) {
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: token.refresh_token, grant_type: 'refresh_token' }) })
    if (!response.ok) throw new Error(`OAuth refresh failed (${response.status})`)
    const result = await response.json(); bearer = result.access_token; expires = Date.now() + (result.expires_in - 60) * 1000
  }
  return { Authorization: `Bearer ${bearer}` }
}
async function get(endpoint) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/${endpoint}`, { headers: await headers() })
    if (youtube.isRetryableStatus(response.status) && attempt < 4) { await sleep(youtube.retryDelayMs(attempt)); continue }
    const result = await response.json()
    if (!response.ok) throw new Error(`YouTube read failed (${response.status}): ${result.error?.errors?.[0]?.reason ?? 'unknown'}`)
    return result
  }
}
const channelData = await get('channels?part=id,snippet,contentDetails&mine=true')
const channel = youtube.authorizedChannel(channelData)
if (channel.title !== 'PlayLiva' || channelData.items[0].snippet.customUrl?.toLowerCase() !== '@playliva') throw new Error('Exact PlayLiva channel identity mismatch')
console.log(`Verified PlayLiva @PLAYLIVA (${channel.id})`)
// Reconcile against the channel's uploads before creating any sessions.
const remote = []; let pageToken
do {
  const page = await get(`playlistItems?part=contentDetails&maxResults=50&playlistId=${channelData.items[0].contentDetails.relatedPlaylists.uploads}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`)
  const ids = page.items.map(row => row.contentDetails.videoId)
  if (ids.length) remote.push(...(await get(`videos?part=snippet,status,processingDetails,contentDetails&id=${ids.join(',')}`)).items)
  pageToken = page.nextPageToken
} while (pageToken)
const states = await optionalJson(statePath, {})
const report = await optionalJson(reportPath, { channel, startedAt: new Date().toISOString(), items: {} })
await mkdir(resolve(root, 'social/output'), { recursive: true })
for (const item of manifest.items) {
  const matches = remote.filter(video => video.snippet.description.includes(content.trackedTargetUrl(item)))
  if (matches.length > 1) throw new Error(`${item.contentId}: duplicate remote matches; manual reconciliation required`)
  if (matches.length && item.youtubeVideoId && item.youtubeVideoId !== matches[0].id) throw new Error(`${item.contentId}: conflicting remote ID`)
  if (matches.length && !item.youtubeVideoId) {
    if (matches[0].status.privacyStatus !== 'private' || matches[0].status.publishAt) throw new Error('Existing matching upload is not private/unscheduled')
    if (confirm) { item.youtubeVideoId = matches[0].id; item.uploadedAt = matches[0].snippet.publishedAt; item.privateUploadApprovedAt ??= new Date().toISOString(); item.publishStatus = 'uploaded_private' }
  }
}
console.log(`Remote duplicate check complete: ${remote.length} existing channel videos; ${manifest.items.filter(item => item.youtubeVideoId).length} current-library IDs recorded.`)
if (!confirm) { console.log('Dry preflight only; no upload or manifest mutation.'); process.exit(0) }
for (const item of manifest.items) item.privateUploadApprovedAt ??= new Date().toISOString()
content.validateManifest(manifest)
await save(manifestPath, manifest)

async function record(item, id) {
  if (!id) throw new Error('Upload completion has no video ID; reconcile before retry')
  states[item.contentId] = { ...states[item.contentId], videoId: id }
  await save(statePath, states)
  item.youtubeVideoId = id; item.uploadedAt ??= new Date().toISOString(); item.publishStatus = 'uploaded_private'
  await save(manifestPath, manifest)
}
async function inspect(item, waitForProcessing = false) {
  for (let poll = 0; poll < 30; poll++) {
    const video = (await get(`videos?part=snippet,status,processingDetails,contentDetails&id=${item.youtubeVideoId}`)).items?.[0]
    if (!video) throw new Error('Recorded video is unavailable')
    const expected = content.youtubeMetadata(item, 'private')
    if (video.snippet.channelId !== channel.id || video.status.privacyStatus !== 'private' || video.status.publishAt) throw new Error('Channel/privacy/schedule mismatch')
    if (video.snippet.title !== expected.title || video.snippet.description !== expected.description || video.snippet.defaultLanguage?.toLowerCase() !== 'pt-br' || video.snippet.categoryId !== '20' || video.status.selfDeclaredMadeForKids !== false) throw new Error('Uploaded metadata/audience mismatch')
    const processing = video.processingDetails?.processingStatus
    report.items[item.contentId] = { ...report.items[item.contentId], videoId: video.id, game: item.gameName, title: video.snippet.title, privacy: video.status.privacyStatus, channelId: video.snippet.channelId, processing, uploadStatus: video.status.uploadStatus, madeForKids: video.status.madeForKids, selfDeclaredMadeForKids: video.status.selfDeclaredMadeForKids, restrictions: video.contentDetails?.regionRestriction ?? null, contentRating: video.contentDetails?.contentRating ?? {}, rejectionReason: video.status.rejectionReason ?? null, verifiedAt: new Date().toISOString(), studioUrl: `https://studio.youtube.com/video/${video.id}/edit` }
    await save(reportPath, report)
    if (processing === 'succeeded') {
      if (JSON.stringify([...(video.snippet.tags ?? [])].sort()) !== JSON.stringify([...expected.tags].sort())) {
        if (!waitForProcessing) return false
        if (poll < 29) { await sleep(15000); continue }
        throw new Error('Processed video tags mismatch')
      }
      delete report.items[item.contentId].error
      await save(reportPath, report)
      return true
    }
    if (['failed', 'terminated'].includes(processing) || ['failed', 'rejected'].includes(video.status.uploadStatus)) throw new Error(`Processing ${processing}; ${video.status.rejectionReason ?? video.status.failureReason ?? 'unknown'}`)
    if (!waitForProcessing) return false
    await sleep(15000)
  }
  throw new Error('Processing still pending; do not re-upload')
}
let blocked = false
for (const [index, item] of manifest.items.entries()) {
  console.log(`[${index + 1}/50] ${item.contentId}`)
  try {
    const state = states[item.contentId]
    if (!item.youtubeVideoId && state?.videoId) await record(item, state.videoId)
    if (!item.youtubeVideoId) {
      if (!content.canUpload(item, 'private')) throw new Error('Private upload not eligible')
      const file = resolve(root, item.videoFile), size = (await stat(file)).size
      let sessionUrl = state?.sessionUrl
      if (!sessionUrl) {
        if (state?.creating) throw new Error('Ambiguous session creation; reconcile before retry')
        states[item.contentId] = { creating: true, attempts: (state?.attempts ?? 0) + 1 }
        await save(statePath, states)
        report.items[item.contentId] = { attempts: states[item.contentId].attempts, game: item.gameName }
        await save(reportPath, report)
        const request = youtube.buildUploadRequest(item, 'private')
        if (request.resource.status.publishAt || request.resource.status.privacyStatus !== 'private') throw new Error('Private-only guard failed')
        const response = await fetch(request.endpoint, { method: 'POST', headers: { ...await headers(), 'Content-Type': 'application/json', 'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': 'video/mp4' }, body: JSON.stringify(request.resource) })
        if (!response.ok) {
          const reason = (await response.json()).error?.errors?.[0]?.reason ?? 'unknown'
          states[item.contentId] = { attempts: states[item.contentId].attempts, error: reason }; await save(statePath, states)
          if (['quotaExceeded', 'dailyLimitExceeded', 'uploadLimitExceeded'].includes(reason)) blocked = true
          throw new Error(`Session rejected (${response.status}): ${reason}`)
        }
        sessionUrl = response.headers.get('location')
        if (!sessionUrl) throw new Error('Missing resumable location; reconcile before retry')
        states[item.contentId] = { attempts: states[item.contentId].attempts, sessionUrl }
        await save(statePath, states)
      }
      // Always ask the saved session for its actual offset before sending/retrying bytes.
      const bytes = await readFile(file)
      for (let attempt = 0; attempt < 6 && !item.youtubeVideoId; attempt++) {
        try {
          const probe = await fetch(sessionUrl, { method: 'PUT', headers: { ...await headers(), 'Content-Length': '0', 'Content-Range': `bytes */${size}` } })
          if ([200, 201].includes(probe.status)) { await record(item, (await probe.json()).id); break }
          if (probe.status !== 308) throw new Error(`Session probe ${probe.status}; retain session, do not create another`)
          const offset = Number(probe.headers.get('range')?.match(/bytes=0-(\d+)/)?.[1] ?? -1) + 1
          if (offset >= size) throw new Error('Session complete offset without ID; reconcile')
          const response = await fetch(sessionUrl, { method: 'PUT', headers: { ...await headers(), 'Content-Type': 'video/mp4', 'Content-Length': String(size - offset), 'Content-Range': `bytes ${offset}-${size - 1}/${size}` }, body: bytes.subarray(offset) })
          if ([200, 201].includes(response.status)) { await record(item, (await response.json()).id); break }
          if (response.status !== 308 && !youtube.isRetryableStatus(response.status)) throw new Error(`Upload rejected (${response.status}); preserve session`)
        } catch { if (attempt === 5) throw new Error('Upload session unresolved after bounded retries; preserved for reconciliation') }
        await sleep(youtube.retryDelayMs(attempt))
      }
      if (!item.youtubeVideoId) throw new Error('No completed upload ID; saved session preserved')
    }
    const ready = await inspect(item)
    console.log(`PRIVATE ${item.youtubeVideoId}: ${ready ? "verified, processed" : "processing/metadata verification pending"}`)
  } catch (error) {
    report.items[item.contentId] = { ...report.items[item.contentId], error: error.message, videoId: item.youtubeVideoId }
    if (!item.youtubeVideoId) { item.publishStatus = 'failed'; await save(manifestPath, manifest) }
    await save(reportPath, report)
    console.log(`Item stopped: ${error.message}`)
    if (blocked) { console.log('Channel/project quota or upload limit reached; queue paused without retrying other items.'); break }
  }
  await sleep(2000)
}
for (const item of manifest.items.filter(row => row.youtubeVideoId)) {
  try { await inspect(item, true); console.log(`Final verification passed: ${item.contentId}`) }
  catch (error) { report.items[item.contentId].error = error.message; console.log(`Verification pending: ${item.contentId}: ${error.message}`) }
}
report.finishedAt = new Date().toISOString(); report.blocked = blocked
await save(reportPath, report)
console.log(`Queue stopped: ${manifest.items.filter(item => item.youtubeVideoId).length}/50 IDs recorded; all requests private and unscheduled.`)
