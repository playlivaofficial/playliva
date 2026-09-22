import { SOCIAL_STATUSES, type SocialContentItem, type SocialContentManifest, type YouTubeMetadata } from './types'

export const ORIGINAL_ROUTES = Object.freeze({
  crash: '/pt-br/play/crash',
  mines: '/pt-br/play/mines',
  blackjack: '/pt-br/play/blackjack',
  roulette: '/pt-br/play/roulette',
  'capybara-gold': '/pt-br/play/capybara-gold',
})

const CONTENT_ID = /^[a-z0-9][a-z0-9-]{5,79}$/
const UTM_VALUE = /^[a-z0-9][a-z0-9_.-]{0,99}$/
const SITE = 'https://www.playliva.com'

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
  const title = `${item.hook} | ${item.gameName} #Shorts`
  if (title.length > 100) throw new Error(`${item.contentId}: YouTube title exceeds 100 characters`)
  const tag = item.gameSlug === 'capybara-gold' ? 'CapybaraGold' : item.gameName.replace(/[^\p{L}\p{N}]/gu, '')
  return {
    title,
    description: `${item.caption}\n\n${item.cta}: ${trackedTargetUrl(item)}\n\n18+ | Jogue com responsabilidade\n\n#Shorts #PlayLiva #${tag}`,
    tags: ['PlayLiva', item.gameName, 'Jogo grátis', 'Shorts'],
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

export function validateManifest(input: unknown): SocialContentManifest {
  if (!input || typeof input !== 'object') throw new Error('Manifest must be an object')
  const manifest = input as SocialContentManifest
  if (manifest.version !== 1 || manifest.market !== 'BR' || manifest.locale !== 'pt-BR' || !Array.isArray(manifest.items)) {
    throw new Error('Manifest header is invalid')
  }
  const ids = new Set<string>(), fingerprints = new Set<string>()
  for (const item of manifest.items) {
    for (const field of ['contentId', 'gameSlug', 'gameName', 'hook', 'body', 'caption', 'cta', 'targetUrl',
      'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'videoFile'] as const) assertString(item[field], `${item.contentId || 'item'}.${field}`)
    if (!CONTENT_ID.test(item.contentId)) throw new Error(`${item.contentId}: invalid contentId`)
    if (ids.has(item.contentId)) throw new Error(`${item.contentId}: duplicate contentId`)
    ids.add(item.contentId)
    const route = ORIGINAL_ROUTES[item.gameSlug as keyof typeof ORIGINAL_ROUTES]
    if (!route || new URL(item.targetUrl).pathname !== route) throw new Error(`${item.contentId}: incorrect Original route`)
    if (item.locale !== 'pt-BR' || item.utmSource !== 'youtube' || item.utmMedium !== 'organic_social' || item.utmCampaign !== 'playliva_shorts') {
      throw new Error(`${item.contentId}: unsupported locale or UTM scheme`)
    }
    if (item.utmContent !== item.contentId || !UTM_VALUE.test(item.utmContent)) throw new Error(`${item.contentId}: utmContent must equal contentId`)
    if (!Number.isFinite(item.duration) || item.duration < 12 || item.duration > 25) throw new Error(`${item.contentId}: duration must be 12–25 seconds`)
    if (!SOCIAL_STATUSES.includes(item.publishStatus)) throw new Error(`${item.contentId}: invalid status`)
    const fingerprint = `${item.gameSlug}|${item.hook.toLowerCase()}|${item.utmContent}`
    if (fingerprints.has(fingerprint)) throw new Error(`${item.contentId}: duplicate content fingerprint`)
    fingerprints.add(fingerprint)
    trackedTargetUrl(item)
    youtubeMetadata(item)
  }
  return manifest
}

export function canUpload(item: SocialContentItem): boolean {
  return item.publishStatus === 'approved' && !item.youtubeVideoId && !item.uploadedAt
}

export function nextUploadStatus(privacy: YouTubeMetadata['privacyStatus'], scheduledAt?: string): SocialContentItem['publishStatus'] {
  if (scheduledAt) return 'scheduled'
  if (privacy === 'private') return 'uploaded_private'
  if (privacy === 'unlisted') return 'uploaded_unlisted'
  return 'published'
}
