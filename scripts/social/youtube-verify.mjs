import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import content from '../../lib/social/content.ts'
import youtube from '../../lib/social/youtube.ts'

const root = resolve(import.meta.dirname, '../..')
const contentId = process.argv.find(value => value.startsWith('--id='))?.slice(5)
if (!contentId) throw new Error('Pass --id=<contentId>')

const manifest = content.validateManifest(JSON.parse(await readFile(resolve(root, 'social/content/youtube-shorts-br.json'), 'utf8')))
const item = manifest.items.find(entry => entry.contentId === contentId)
if (!item) throw new Error(`Unknown content id: ${contentId}`)
if (!item.youtubeVideoId) throw new Error(`${contentId}: no YouTube video ID is recorded`)

const token = JSON.parse(await readFile(resolve(root, process.env.YOUTUBE_OAUTH_TOKEN_FILE ?? '.youtube-oauth/token.json'), 'utf8'))
if (!process.env.YOUTUBE_OAUTH_CLIENT_FILE) throw new Error('Set YOUTUBE_OAUTH_CLIENT_FILE to the ignored OAuth client JSON path')
const clientRaw = JSON.parse(await readFile(resolve(root, process.env.YOUTUBE_OAUTH_CLIENT_FILE), 'utf8'))
const client = clientRaw.installed ?? clientRaw.web
if (!token.refresh_token || !client?.client_id || !client?.client_secret) throw new Error('OAuth credentials are incomplete')

const refresh = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: client.client_id,
    client_secret: client.client_secret,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  }),
})
if (!refresh.ok) throw new Error(`Token refresh failed (${refresh.status})`)
const bearer = (await refresh.json()).access_token

const headers = { Authorization: `Bearer ${bearer}` }
const channelResponse = await fetch(youtube.YOUTUBE_CHANNEL_ENDPOINT, { headers })
if (!channelResponse.ok) throw new Error(`Could not verify the upload channel (${channelResponse.status})`)
const channel = youtube.authorizedChannel(await channelResponse.json())

const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,status,processingDetails&id=${encodeURIComponent(item.youtubeVideoId)}`, { headers })
if (!response.ok) throw new Error(`Could not verify the uploaded video (${response.status})`)
const video = (await response.json()).items?.[0]
if (!video) throw new Error('The recorded video is not accessible to the authorized PlayLiva channel')

const expected = content.youtubeMetadata(item, video.status?.privacyStatus)
const trackedUrl = content.trackedTargetUrl(item)
if (video.snippet?.channelId !== channel.id) throw new Error('Uploaded video belongs to a different channel')
if (video.snippet?.title !== expected.title) throw new Error('Uploaded title does not match the approved manifest')
if (!video.snippet?.description?.includes(trackedUrl)) throw new Error('Uploaded description does not contain the approved tracked PlayLiva URL')
if (video.status?.privacyStatus !== 'private') throw new Error(`Expected private visibility, received ${video.status?.privacyStatus ?? 'unknown'}`)
if (video.status?.madeForKids === true) throw new Error('Uploaded video is unexpectedly marked made for kids')
if (video.processingDetails?.processingStatus !== 'succeeded') throw new Error(`Processing is ${video.processingDetails?.processingStatus ?? 'unknown'}`)

console.log(`Verified channel: ${channel.title} (${channel.id})`)
console.log(`Verified video: ${contentId}; private; processing succeeded; title, UTM destination and audience setting match the manifest.`)
