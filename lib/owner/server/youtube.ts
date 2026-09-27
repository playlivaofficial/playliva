import { authorizedChannel, YOUTUBE_CHANNEL_ENDPOINT } from '@/lib/social/youtube'
import { googleAccessToken, googleCredentials, googleRead } from './google'
import { socialLibrary } from './social'
import { logActivity, updateOwnerState } from './store'
import { reconcileYouTube } from '../social-model'
export async function youtubeReadiness() { return Boolean(await googleCredentials('youtube')) }
export async function syncYouTube() {
  const library = await socialLibrary()
  if (library.state === 'unavailable') throw new Error('Social library is unavailable.')
  const token = await googleAccessToken('youtube')
  const channel = authorizedChannel(await googleRead(YOUTUBE_CHANNEL_ENDPOINT, token))
  const ids = [...new Set(library.data.map(item => item.youtube.videoId).filter((id): id is string => Boolean(id)))]
  const videos = []
  for (let offset = 0; offset < ids.length; offset += 50) {
    const data = await googleRead(`https://www.googleapis.com/youtube/v3/videos?part=status,snippet,statistics&id=${ids.slice(offset, offset + 50).map(encodeURIComponent).join(',')}`, token)
    if (!Array.isArray(data.items) || data.items.some((video: { snippet?: { channelId?: string } }) => video.snippet?.channelId !== channel.id)) throw new Error('YouTube channel mismatch; state was not updated.')
    videos.push(...data.items)
  }
  const updates = reconcileYouTube(library.data, { items: videos }, new Date().toISOString())
  await updateOwnerState(state => {
    for (const [id, update] of Object.entries(updates)) state.creatives[id] = { ...state.creatives[id], ...update }
    logActivity(state, 'youtube_sync', 'youtube', `Read-only check of ${ids.length} known IDs. No upload, delete or publish operation.`)
  })
  return `YouTube state synchronized for ${ids.length} known IDs. Nothing was uploaded or published.`
}
