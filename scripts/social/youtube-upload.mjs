import { createReadStream } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import content from '../../lib/social/content.ts'
import youtube from '../../lib/social/youtube.ts'

const root = resolve(import.meta.dirname, '../..')
if (process.argv.includes('--all-private')) {
  await import('./youtube-private-batch.mjs')
  process.exit(0)
}
const manifestPath = resolve(root, 'social/content/youtube-shorts-br.json')
const contentId = process.argv.find(value => value.startsWith('--id='))?.slice(5)
const privacy = process.argv.find(value => value.startsWith('--privacy='))?.slice(10) ?? 'private'
if (!contentId) throw new Error('Pass --id=<contentId>')
if (!['private', 'unlisted', 'public'].includes(privacy)) throw new Error('privacy must be private, unlisted or public')
if (!process.argv.includes('--confirm-upload')) throw new Error('Upload blocked: pass --confirm-upload only after explicit action-time approval')
if (privacy === 'public' && !process.argv.includes('--confirm-public')) throw new Error('Public publishing requires separate --confirm-public approval')
const manifest = content.validateManifest(JSON.parse(await readFile(manifestPath, 'utf8')))
const item = manifest.items.find(entry => entry.contentId === contentId)
if (!item) throw new Error(`Unknown content id: ${contentId}`)
if (!content.canUpload(item, privacy)) throw new Error(`${contentId}: item must be approved and not previously uploaded`)
const file = resolve(root, item.videoFile), size = (await stat(file)).size
const tokenPath = resolve(root, process.env.YOUTUBE_OAUTH_TOKEN_FILE ?? '.youtube-oauth/token.json')
const token = JSON.parse(await readFile(tokenPath, 'utf8'))
if (!process.env.YOUTUBE_OAUTH_CLIENT_FILE) throw new Error('Set YOUTUBE_OAUTH_CLIENT_FILE to the ignored OAuth client JSON path')
const clientPath = resolve(root, process.env.YOUTUBE_OAUTH_CLIENT_FILE)
const clientRaw = JSON.parse(await readFile(clientPath, 'utf8')), client = clientRaw.installed ?? clientRaw.web
async function accessToken() {
  if (!token.refresh_token) throw new Error('OAuth refresh token missing; re-authorize with offline access')
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: token.refresh_token, grant_type: 'refresh_token' }) })
  if (!response.ok) throw new Error(`Token refresh failed (${response.status})`)
  return (await response.json()).access_token
}
async function requestWithRetry(url, init, attempts = 5) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetch(url, init)
    if (!youtube.isRetryableStatus(response.status) || attempt === attempts - 1) return response
    await new Promise(resolveDelay => setTimeout(resolveDelay, youtube.retryDelayMs(attempt)))
  }
}
const bearer = await accessToken()
const channelResponse = await fetch(youtube.YOUTUBE_CHANNEL_ENDPOINT, { headers: { Authorization: `Bearer ${bearer}` } })
if (!channelResponse.ok) throw new Error(`Could not verify the upload channel (${channelResponse.status})`)
const channel = youtube.authorizedChannel(await channelResponse.json())
console.log(`Verified upload target: ${channel.title} (${channel.id})`)
const request = youtube.buildUploadRequest(item, privacy)
const session = await requestWithRetry(request.endpoint, { method: 'POST', headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json; charset=UTF-8',
  'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': 'video/mp4' }, body: JSON.stringify(request.resource) })
if (!session.ok) throw new Error(`Could not create resumable session (${session.status}): ${(await session.text()).slice(0, 500)}`)
const uploadUrl = session.headers.get('location')
if (!uploadUrl) throw new Error('YouTube did not return a resumable upload URL')
let sent = 0, response
for await (const chunk of createReadStream(file, { highWaterMark: 8 * 1024 * 1024 })) {
  const start = sent, end = start + chunk.length - 1
  response = await requestWithRetry(uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${bearer}`, 'Content-Length': String(chunk.length),
    'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${size}` }, body: chunk, duplex: 'half' })
  if (![200, 201, 308].includes(response.status)) throw new Error(`Upload failed (${response.status}): ${(await response.text()).slice(0, 500)}`)
  sent = end + 1; console.log(`Upload progress: ${Math.floor(sent / size * 100)}%`)
}
const uploaded = await response.json()
if (!uploaded.id) throw new Error('Upload completed without a YouTube video ID')
item.youtubeVideoId = uploaded.id
item.uploadedAt = new Date().toISOString()
item.publishStatus = content.nextUploadStatus(privacy, item.scheduledAt ?? undefined)
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
for (let poll = 0; poll < 20; poll++) {
  const status = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=${encodeURIComponent(uploaded.id)}`, { headers: { Authorization: `Bearer ${bearer}` } })
  const details = (await status.json()).items?.[0]
  const processing = details?.processingDetails?.processingStatus
  console.log(`Processing: ${processing ?? 'unknown'}`)
  if (processing === 'succeeded' || processing === 'failed' || processing === 'terminated') break
  await new Promise(resolveDelay => setTimeout(resolveDelay, 15_000))
}
console.log(`Uploaded ${contentId} as ${privacy}; video ID recorded without printing credentials.`)
