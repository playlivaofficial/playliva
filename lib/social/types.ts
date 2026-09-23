export const SOCIAL_STATUSES = [
  'generated', 'needs_review', 'approved', 'uploaded_private',
  'uploaded_unlisted', 'scheduled', 'published', 'failed',
] as const

export const SOCIAL_ARCHETYPES = [
  'decision', 'tension', 'challenge', 'gameplay-first', 'reaction',
  'close-call', 'how-far', 'quick-explanation', 'satisfying', 'personal-choice',
] as const

export type SocialStatus = (typeof SOCIAL_STATUSES)[number]
export type SocialArchetype = (typeof SOCIAL_ARCHETYPES)[number]
export type OriginalSocialSlug = 'crash' | 'mines' | 'blackjack' | 'roulette' | 'capybara-gold'

export interface SocialVoiceConfig {
  engine: 'kokoro-82m-v1.0'
  voice: 'pf_dora'
  language: 'pt-BR'
  speed: number
}

export interface SocialAudioConfig {
  musicProfile: string
  sfxProfile: OriginalSocialSlug
  loudnessLufs: -16
  truePeakDb: -1.5
}

export interface SocialEncodingConfig {
  width: 1080
  height: 1920
  fps: 30 | 60
  videoCodec: 'h264'
  videoProfile: 'high'
  pixelFormat: 'yuv420p'
  crf: number
  audioCodec: 'aac'
  audioBitrateKbps: 192
}

export interface SocialQcResult {
  inspectedAt: string
  width: number
  height: number
  fps: number
  duration: number
  videoCodec: string
  videoProfile: string
  videoBitrateKbps: number
  audioCodec: string
  audioBitrateKbps: number
  integratedLufs: number
  truePeakDbfs: number
  fileSizeBytes: number
  sha256: string
  frameHashes: string[]
  passed: boolean
  notes: string[]
}

export interface SocialContentItem {
  contentId: string
  gameSlug: OriginalSocialSlug
  gameName: string
  locale: 'pt-BR'
  archetype: SocialArchetype
  hook: string
  body: string
  voiceLine: string
  title: string
  description: string
  hashtags: string[]
  cta: 'Jogue grátis no PlayLiva'
  targetUrl: string
  utmSource: 'youtube'
  utmMedium: 'organic_social'
  utmCampaign: 'playliva_originals_shorts'
  utmContent: string
  videoFile: string
  thumbnailFile: string
  duration: number
  captureVariant: number
  capturePace: string
  compositionPreset: OriginalSocialSlug
  voice: SocialVoiceConfig
  audio: SocialAudioConfig
  encoding: SocialEncodingConfig
  qualityStatus: 'generated' | 'needs_review' | 'rejected'
  reviewStatus: 'needs_review' | 'approved' | 'rejected'
  privateUploadApprovedAt?: string
  publishStatus: SocialStatus
  youtubeVideoId: string | null
  scheduledAt: string | null
  uploadedAt: string | null
  publishedAt: string | null
  performanceStatus: 'not_available' | 'collecting' | 'reviewed'
  qc: SocialQcResult | null
}

export interface SocialContentManifest {
  version: 2
  market: 'BR'
  locale: 'pt-BR'
  library: 'playliva-originals-shorts-v1'
  generatedAt: string
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
