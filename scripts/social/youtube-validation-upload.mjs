// One private validation artifact only. Never reads or advances the bulk queue.
import { readFile, writeFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import youtube from '../../lib/social/youtube.ts'
import content from '../../lib/social/content.ts'

const root = resolve(import.meta.dirname, '../..'), folder = resolve(root, 'social/output/crash-validation')
const reportPath = resolve(folder, 'youtube-upload.json'), sessionPath = resolve(root, '.youtube-oauth/crash-validation-session.json')
if (!process.argv.includes('--confirm-one-private')) throw new Error('Explicit approval for one private validation upload is required')
const qc = JSON.parse(await readFile(resolve(folder, 'ffprobe.json'), 'utf8'))
const cadence = JSON.parse(await readFile(resolve(folder, 'final-cadence.json'), 'utf8'))
const stream = qc.final.streams.find(row => row.codec_type === 'video')
if (!cadence.passed || stream.width !== 1080 || stream.height !== 1920 || stream.avg_frame_rate !== '25/1') throw new Error('Validation QC failed')
const file = await readFile(resolve(folder, 'island-crash-validation-final.mp4'))
const sha256 = createHash('sha256').update(file).digest('hex')
const manifest = JSON.parse(await readFile(resolve(root, 'social/content/youtube-shorts-br.json'), 'utf8'))
const item = { ...manifest.items[0], contentId: 'island-crash-validation-quality-v2', utmContent: 'island-crash-validation-quality-v2', title: 'Validação de qualidade: voo e queda', description: 'Prévia privada de qualidade do Island Crash: demonstração local reproduzível com créditos virtuais, nova trilha tropical e movimento revisado. Sem apostas ou prêmios em dinheiro.', scheduledAt: null, publishedAt: null }
const request = youtube.buildUploadRequest(item, 'private')
if (request.resource.status.publishAt || request.resource.status.privacyStatus !== 'private') throw new Error('Private-only guard failed')
async function save(path, data) { await writeFile(`${path}.tmp`, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 }); await rename(`${path}.tmp`, path) }
async function optional(path) { try { return JSON.parse(await readFile(path, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return {}; throw error } }
const state = await optional(sessionPath), report = await optional(reportPath)
if (state.sha256 && state.sha256 !== sha256) throw new Error('Saved upload belongs to a different master; do not overwrite or duplicate')
const rawClient = JSON.parse(await readFile(resolve(root, '.youtube-oauth/client_secret.json'), 'utf8')), client = rawClient.installed ?? rawClient.web
const token = JSON.parse(await readFile(resolve(root, '.youtube-oauth/token.json'), 'utf8'))
const refresh = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: token.refresh_token, grant_type: 'refresh_token' }) })
if (!refresh.ok) throw new Error(`OAuth refresh failed (${refresh.status})`)
const auth = { Authorization: `Bearer ${(await refresh.json()).access_token}` }
async function get(path) { const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, { headers: auth }); if (!response.ok) throw new Error(`YouTube verification failed (${response.status})`); return response.json() }
const channels = await get('channels?part=id,snippet,contentDetails&mine=true')
const channel = youtube.authorizedChannel(channels)
if (channel.title !== 'PlayLiva' || channels.items[0].snippet.customUrl?.toLowerCase() !== '@playliva') throw new Error('Exact channel identity mismatch')
console.log(`Verified target: PlayLiva @PLAYLIVA (${channel.id}); ONE private validation only.`)
Object.assign(report, { contentId: item.contentId, channel, sha256, fileBytes: file.length, expected: request.resource })
await save(reportPath, report)
let pageToken
do {
  const page = await get(`playlistItems?part=contentDetails&maxResults=50&playlistId=${channels.items[0].contentDetails.relatedPlaylists.uploads}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`)
  const ids = page.items.map(row => row.contentDetails.videoId)
  const videos = ids.length ? (await get(`videos?part=snippet,status&id=${ids.join(',')}`)).items : []
  for (const video of videos.filter(row => row.snippet.description.includes(content.trackedTargetUrl(item)))) {
    if (state.videoId && state.videoId !== video.id) throw new Error('Duplicate matching validation uploads; stop')
    state.videoId = video.id
  }
  pageToken = page.nextPageToken
} while (pageToken)
try {
  if (!state.videoId) {
    if (!state.sessionUrl) {
      if (state.creating) throw new Error('Ambiguous session creation; reconcile before retry')
      Object.assign(state, { sha256, creating: true, attempts: (state.attempts ?? 0) + 1 })
      await save(sessionPath, state)
      const session = await fetch(request.endpoint, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json', 'X-Upload-Content-Length': String(file.length), 'X-Upload-Content-Type': 'video/mp4' }, body: JSON.stringify(request.resource) })
      if (!session.ok) {
        const reason = (await session.json()).error?.errors?.[0]?.reason ?? 'unknown'
        state.creating = false; state.error = reason; await save(sessionPath, state)
        throw new Error(`YouTube upload rejected (${session.status}): ${reason}`)
      }
      state.sessionUrl = session.headers.get('location'); state.creating = false
      if (!state.sessionUrl) throw new Error('No resumable upload location')
      await save(sessionPath, state)
    }
    for (let attempt = 0; attempt < 5 && !state.videoId; attempt++) {
      try {
        const probe = await fetch(state.sessionUrl, { method: 'PUT', headers: { ...auth, 'Content-Length': '0', 'Content-Range': `bytes */${file.length}` } })
        if ([200, 201].includes(probe.status)) state.videoId = (await probe.json()).id
        else {
          if (probe.status !== 308) throw new Error(`Session status ${probe.status}; retain for reconciliation`)
          const start = Number(probe.headers.get('range')?.match(/bytes=0-(\d+)/)?.[1] ?? -1) + 1
          const uploaded = await fetch(state.sessionUrl, { method: 'PUT', headers: { ...auth, 'Content-Type': 'video/mp4', 'Content-Length': String(file.length - start), 'Content-Range': `bytes ${start}-${file.length - 1}/${file.length}` }, body: file.subarray(start) })
          if ([200, 201].includes(uploaded.status)) state.videoId = (await uploaded.json()).id
          else if (uploaded.status !== 308 && !youtube.isRetryableStatus(uploaded.status)) throw new Error(`Upload status ${uploaded.status}; retain session`)
        }
      } catch { if (attempt === 4) throw new Error('Session unresolved; saved for reconciliation without duplicate upload') }
      await save(sessionPath, state)
      if (!state.videoId) await new Promise(r => setTimeout(r, youtube.retryDelayMs(attempt)))
    }
    if (!state.videoId) throw new Error('No completed video ID; do not start another upload')
  }
  await save(sessionPath, state)
  report.videoId = state.videoId; report.attempts = state.attempts; await save(reportPath, report)
  for (let poll = 0; poll < 30; poll++) {
    const video = (await get(`videos?part=snippet,status,processingDetails,contentDetails&id=${state.videoId}`)).items?.[0]
    if (!video || video.snippet.channelId !== channel.id || video.status.privacyStatus !== 'private' || video.status.publishAt || video.status.selfDeclaredMadeForKids !== false) throw new Error('Channel/privacy/audience verification failed')
    if (video.snippet.title !== request.resource.snippet.title || video.snippet.description !== request.resource.snippet.description || video.snippet.defaultLanguage !== 'pt-BR') throw new Error('Metadata/UTM verification failed')
    report.processing = video.processingDetails?.processingStatus; report.privacy = video.status.privacyStatus
    report.contentRating = video.contentDetails?.contentRating; report.regionRestriction = video.contentDetails?.regionRestriction ?? null
    await save(reportPath, report)
    if (report.processing === 'succeeded') { delete report.error; report.verifiedAt = new Date().toISOString(); await save(reportPath, report); console.log(`Verified PRIVATE validation: ${state.videoId}; processing succeeded.`); process.exit(0) }
    if (['failed', 'terminated'].includes(report.processing)) throw new Error(`Processing ${report.processing}`)
    await new Promise(r => setTimeout(r, 15000))
  }
  throw new Error('Processing pending; preserve existing ID')
} catch (error) {
  report.error = error.message; report.attempts = state.attempts; await save(reportPath, report)
  console.log(error.message); process.exitCode = 2
}
