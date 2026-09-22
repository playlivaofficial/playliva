import type { SocialContentItem, YouTubeMetadata } from './types'
import { youtubeMetadata } from './content'

export const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload'
export const YOUTUBE_READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'
export const YOUTUBE_OAUTH_SCOPES = `${YOUTUBE_UPLOAD_SCOPE} ${YOUTUBE_READONLY_SCOPE}`
export const PLAYLIVA_YOUTUBE_CHANNEL_ID = 'UC66mms712dnc7_2O6R_jqyg'
export const YOUTUBE_CHANNEL_ENDPOINT = 'https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true'

export interface AuthorizedChannel {
  id: string
  title: string
}

export function authorizedChannel(input: unknown): AuthorizedChannel {
  const item = (input as { items?: Array<{ id?: unknown; snippet?: { title?: unknown } }> })?.items?.[0]
  if (!item || typeof item.id !== 'string' || typeof item.snippet?.title !== 'string') {
    throw new Error('YouTube did not return an authorized channel')
  }
  if (item.id !== PLAYLIVA_YOUTUBE_CHANNEL_ID) {
    throw new Error(`Upload blocked: authorized channel ${item.id} is not PlayLiva (${PLAYLIVA_YOUTUBE_CHANNEL_ID})`)
  }
  return { id: item.id, title: item.snippet.title }
}

export interface UploadRequest {
  endpoint: string
  resource: {
    snippet: { title: string; description: string; tags: string[]; categoryId: string; defaultLanguage: string }
    status: { privacyStatus: YouTubeMetadata['privacyStatus']; selfDeclaredMadeForKids: false; publishAt?: string }
  }
}

export function validateSchedule(privacyStatus: YouTubeMetadata['privacyStatus'], publishAt?: string, now = Date.now()): void {
  if (!publishAt) return
  const timestamp = Date.parse(publishAt)
  if (!Number.isFinite(timestamp) || timestamp <= now) throw new Error('publishAt must be a future ISO date')
  if (privacyStatus !== 'private') throw new Error('YouTube scheduling requires a private upload')
}

export function buildUploadRequest(item: SocialContentItem, privacyStatus: YouTubeMetadata['privacyStatus'] = 'private'): UploadRequest {
  const metadata = youtubeMetadata(item, privacyStatus)
  validateSchedule(metadata.privacyStatus, metadata.publishAt)
  return {
    endpoint: 'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable',
    resource: {
      snippet: {
        title: metadata.title, description: metadata.description, tags: metadata.tags,
        categoryId: metadata.categoryId, defaultLanguage: metadata.defaultLanguage,
      },
      status: {
        privacyStatus: metadata.privacyStatus,
        selfDeclaredMadeForKids: false,
        ...(metadata.publishAt ? { publishAt: metadata.publishAt } : {}),
      },
    },
  }
}

export function retryDelayMs(attempt: number, random = Math.random): number {
  if (!Number.isInteger(attempt) || attempt < 0) throw new Error('attempt must be a non-negative integer')
  return Math.min(60_000, 1_000 * 2 ** attempt) + Math.floor(random() * 500)
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}
