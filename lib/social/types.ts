export const SOCIAL_STATUSES = [
  'generated', 'needs_review', 'approved', 'uploaded_private',
  'uploaded_unlisted', 'scheduled', 'published', 'failed',
] as const

export type SocialStatus = (typeof SOCIAL_STATUSES)[number]
export type SocialFormat = 'cashout_challenge' | 'would_you_continue' | 'hit_or_stand' |
  'roulette_reaction' | 'original_highlight'

export interface SocialContentItem {
  contentId: string
  gameSlug: string
  gameName: string
  locale: 'pt-BR'
  contentFormat: SocialFormat
  hook: string
  body: string
  caption: string
  cta: string
  targetUrl: string
  utmSource: 'youtube'
  utmMedium: 'organic_social'
  utmCampaign: 'playliva_shorts'
  utmContent: string
  videoFile: string
  duration: number
  publishStatus: SocialStatus
  youtubeVideoId: string | null
  scheduledAt: string | null
  uploadedAt: string | null
  publishedAt: string | null
  performanceStatus: 'not_available' | 'collecting' | 'reviewed'
}

export interface SocialContentManifest {
  version: 1
  market: 'BR'
  locale: 'pt-BR'
  items: SocialContentItem[]
}

export interface YouTubeMetadata {
  title: string
  description: string
  tags: string[]
  categoryId: '20'
  defaultLanguage: 'pt-BR'
  privacyStatus: 'private' | 'unlisted' | 'public'
  madeForKids: false
  publishAt?: string
}
