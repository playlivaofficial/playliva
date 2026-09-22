import { SOCIAL_ARCHETYPES, SOCIAL_STATUSES, type OriginalSocialSlug, type SocialContentItem, type SocialContentManifest, type YouTubeMetadata } from './types'

export const ORIGINAL_ROUTES = Object.freeze({
  crash: '/pt-br/play/crash',
  mines: '/pt-br/play/mines',
  blackjack: '/pt-br/play/blackjack',
  roulette: '/pt-br/play/roulette',
  'capybara-gold': '/pt-br/play/capybara-gold',
} satisfies Record<OriginalSocialSlug, string>)

const CONTENT_ID = /^[a-z0-9][a-z0-9-]{5,79}$/
const UTM_VALUE = /^[a-z0-9][a-z0-9_.-]{0,99}$/
const SITE = 'https://www.playliva.com'
const GAME_SLUGS = Object.freeze(Object.keys(ORIGINAL_ROUTES) as OriginalSocialSlug[])

export function trackedTargetUrl(item: Pick<SocialContentItem, 'targetUrl' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmContent'>): string {
  const url = new URL(item.targetUrl)
  if (url.origin !== SITE) throw new Error('Social targets must stay on www.playliva.com')
  for (const [key, value] of Object.entries({
    utm_source: item.utmSource, utm_medium: item.utmMedium,
    utm_campaign: item.utmCampaign, utm_content: item.utmContent,
  })) {
    if (!UTM_VALUE.test(value)) throw new Error(`Invalid ${key}`)
    url.searchParams.set(key, value)
  }
  return url.toString()
}

export function youtubeMetadata(item: SocialContentItem, privacyStatus: YouTubeMetadata['privacyStatus'] = 'private'): YouTubeMetadata {
  const title = `${item.title} #Shorts`
  if (title.length > 100) throw new Error(`${item.contentId}: YouTube title exceeds 100 characters`)
  const hashtags = item.hashtags.join(' ')
  return {
    title,
    description: `${item.description}\n\n${item.cta}: ${trackedTargetUrl(item)}\n\n18+ | Jogue com responsabilidade | Créditos virtuais sem valor monetário\n\n${hashtags}`,
    tags: ['PlayLiva', item.gameName, item.hashtags.at(-1)?.slice(1) ?? item.gameName, 'Jogo grátis', 'Shorts'],
    categoryId: '20',
    defaultLanguage: 'pt-BR',
    privacyStatus,
    madeForKids: false,
    ...(item.scheduledAt ? { publishAt: item.scheduledAt } : {}),
  }
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`)
}

function assertUnique(set: Set<string>, value: string, name: string): void {
  const normalized = value.trim().toLocaleLowerCase('pt-BR')
  if (set.has(normalized)) throw new Error(`${name}: duplicate value`)
  set.add(normalized)
}

export function validateManifest(input: unknown): SocialContentManifest {
  if (!input || typeof input !== 'object') throw new Error('Manifest must be an object')
  const manifest = input as SocialContentManifest
  if (manifest.version !== 2 || manifest.market !== 'BR' || manifest.locale !== 'pt-BR' ||
    manifest.library !== 'playliva-originals-shorts-v1' || !Array.isArray(manifest.items)) {
    throw new Error('Manifest header is invalid')
  }
  if (manifest.items.length !== 50) throw new Error('Premium Originals library must contain exactly 50 Shorts')
  const ids = new Set<string>(), titles = new Set<string>(), descriptions = new Set<string>()
  const videos = new Set<string>(), thumbnails = new Set<string>(), voices = new Set<string>()
  const gameCounts = new Map<OriginalSocialSlug, number>()
  for (const item of manifest.items) {
    for (const field of ['contentId', 'gameSlug', 'gameName', 'archetype', 'hook', 'body', 'voiceLine', 'title',
      'description', 'cta', 'targetUrl', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'videoFile',
      'thumbnailFile', 'capturePace', 'compositionPreset'] as const) assertString(item[field], `${item.contentId || 'item'}.${field}`)
    if (!CONTENT_ID.test(item.contentId)) throw new Error(`${item.contentId}: invalid contentId`)
    assertUnique(ids, item.contentId, item.contentId)
    assertUnique(titles, item.title, `${item.contentId}.title`)
    assertUnique(descriptions, item.description, `${item.contentId}.description`)
    assertUnique(videos, item.videoFile, `${item.contentId}.videoFile`)
    assertUnique(thumbnails, item.thumbnailFile, `${item.contentId}.thumbnailFile`)
    assertUnique(voices, item.voiceLine, `${item.contentId}.voiceLine`)
    const route = ORIGINAL_ROUTES[item.gameSlug]
    if (!route || new URL(item.targetUrl).pathname !== route) throw new Error(`${item.contentId}: incorrect Original route`)
    if (item.locale !== 'pt-BR' || item.utmSource !== 'youtube' || item.utmMedium !== 'organic_social' ||
      item.utmCampaign !== 'playliva_originals_shorts') throw new Error(`${item.contentId}: unsupported locale or UTM scheme`)
    if (item.utmContent !== item.contentId || !UTM_VALUE.test(item.utmContent)) throw new Error(`${item.contentId}: utmContent must equal contentId`)
    if (!SOCIAL_ARCHETYPES.includes(item.archetype)) throw new Error(`${item.contentId}: unsupported archetype`)
    if (!Number.isInteger(item.captureVariant) || item.captureVariant < 1 || item.captureVariant > 10) throw new Error(`${item.contentId}: invalid capture variant`)
    if (item.compositionPreset !== item.gameSlug) throw new Error(`${item.contentId}: composition must match game`)
    if (!Number.isFinite(item.duration) || item.duration < 12 || item.duration > 20) throw new Error(`${item.contentId}: duration must be 12–20 seconds`)
    if (!Array.isArray(item.hashtags) || item.hashtags.length < 2 || item.hashtags.length > 4 ||
      !item.hashtags.includes('#Shorts') || !item.hashtags.includes('#PlayLiva') || item.hashtags.some(tag => !/^#[\p{L}\p{N}]+$/u.test(tag))) {
      throw new Error(`${item.contentId}: hashtags must be restrained and valid`)
    }
    if (item.voice?.engine !== 'kokoro-82m-v1.0' || item.voice.voice !== 'pf_dora' || item.voice.language !== 'pt-BR' ||
      !Number.isFinite(item.voice.speed)) throw new Error(`${item.contentId}: invalid PT-BR voice configuration`)
    if (item.audio?.sfxProfile !== item.gameSlug || item.audio.loudnessLufs !== -16 || item.audio.truePeakDb !== -1.5) {
      throw new Error(`${item.contentId}: invalid audio configuration`)
    }
    if (item.encoding?.width !== 1080 || item.encoding.height !== 1920 || ![30, 60].includes(item.encoding.fps) ||
      item.encoding.videoCodec !== 'h264' || item.encoding.videoProfile !== 'high' || item.encoding.pixelFormat !== 'yuv420p' ||
      item.encoding.crf > 18 || item.encoding.audioCodec !== 'aac' || item.encoding.audioBitrateKbps !== 192) {
      throw new Error(`${item.contentId}: invalid master encoding configuration`)
    }
    if (!['generated', 'needs_review', 'rejected'].includes(item.qualityStatus) ||
      !['needs_review', 'approved', 'rejected'].includes(item.reviewStatus) || !SOCIAL_STATUSES.includes(item.publishStatus)) {
      throw new Error(`${item.contentId}: invalid review or publishing state`)
    }
    if (item.publishStatus !== 'generated' && item.publishStatus !== 'needs_review' && item.reviewStatus !== 'approved') {
      throw new Error(`${item.contentId}: upload-capable state requires human approval`)
    }
    if (item.youtubeVideoId || item.uploadedAt || item.publishedAt || item.scheduledAt) throw new Error(`${item.contentId}: review library must not contain upload or schedule state`)
    if (/betsson|bookmaker|sportsbook|afiliad/i.test(`${item.title} ${item.description} ${item.targetUrl}`)) {
      throw new Error(`${item.contentId}: affiliate or sportsbook reference is forbidden`)
    }
    gameCounts.set(item.gameSlug, (gameCounts.get(item.gameSlug) ?? 0) + 1)
    trackedTargetUrl(item)
    youtubeMetadata(item)
  }
  for (const slug of GAME_SLUGS) if (gameCounts.get(slug) !== 10) throw new Error(`${slug}: expected exactly 10 Shorts`)
  return manifest
}

export function canUpload(item: SocialContentItem): boolean {
  return item.reviewStatus === 'approved' && item.publishStatus === 'approved' && !item.youtubeVideoId && !item.uploadedAt
}

export function nextUploadStatus(privacy: YouTubeMetadata['privacyStatus'], scheduledAt?: string): SocialContentItem['publishStatus'] {
  if (scheduledAt) return 'scheduled'
  if (privacy === 'private') return 'uploaded_private'
  if (privacy === 'unlisted') return 'uploaded_unlisted'
  return 'published'
}
