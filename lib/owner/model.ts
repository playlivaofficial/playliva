import { emptyAutomation, type AutomationState } from './automation-model'
export type ConnectionState = 'connected' | 'not_connected' | 'no_data' | 'unavailable'
export interface Source<T> { state: ConnectionState; label: string; detail: string; observedAt?: string; data: T }
/** Future partner reporting only; never derived from PlayLiva demo credits or clicks. */
export interface PartnerConversionReport {
  provider: string; from: string; to: string; currency: string; verifiedAt: string
  ftd: number | null; cpaCommission: number | null; revShareCommission: number | null
  totalCommission: number | null; revenuePerThousandVisitors: number | null
}
export type ReviewStatus = 'draft' | 'needs_review' | 'approved' | 'rejected'
export type UploadStatus = 'not_uploaded' | 'upload_pending' | 'uploaded_private' | 'uploaded_unlisted' | 'uploaded_public' | 'failed' | 'historical_deleted'
export type PublishStatus = 'unpublished' | 'scheduled' | 'published'
export type YouTubeState = 'private' | 'unlisted' | 'public' | 'unavailable_deleted' | 'unknown'
export interface UploadHistory { videoId: string; uploadedAt: string | null; state: YouTubeState; source: string }
export interface Creative {
  id: string; gameSlug: string; gameTitle: string; title: string; hook: string; description: string; caption: string
  locale: string; platform: string; duration: number; createdAt: string; updatedAt: string | null
  reviewStatus: ReviewStatus; approvedAt: string | null; renderStatus: 'pending' | 'rendered' | 'failed'
  uploadStatus: UploadStatus; publishStatus: PublishStatus; publishedAt: string | null
  youtube: { videoId: string | null; state: YouTubeState; source: string; checkedAt: string | null; views: number | null; likes: number | null; comments: number | null }
  uploadHistory: UploadHistory[]; qc: { passed: boolean; inspectedAt: string; width: number; height: number; fps: number; bitrate: number; lufs: number; notes: string[] } | null
  media: { video: boolean; thumbnail: boolean }; utmCampaign: string; utmContent: string; targetUrl: string; hashtags: string[]
}
export interface Activity { id: string; at: string; action: string; target: string; detail: string }
export interface CreativeState { reviewStatus?: ReviewStatus; approvedAt?: string | null; updatedAt?: string; reason?: string; youtube?: Creative['youtube']; uploadHistory?: UploadHistory[]; renderStatus?: Creative['renderStatus']; qc?: Creative['qc'] }
export const CONTENT_STATES = ['idea', 'opportunity', 'planned', 'draft', 'review', 'published', 'refresh_needed'] as const
export type ContentStatus = typeof CONTENT_STATES[number]
export interface ContentItem { id: string; type: string; locale: string; topic: string; query: string; route: string; status: ContentStatus; reason: string; updatedAt: string | null; source: string }
export interface RegenJob { id: string; creativeId: string; requestedAt: string; state: 'queued' | 'running' | 'completed' | 'failed'; finishedAt?: string; detail: string }
export interface OwnerState {
  version: 2; automation: AutomationState; creatives: Record<string, CreativeState>; content: Record<string, ContentItem>; activity: Activity[]; jobs: RegenJob[]
  sessions: Record<string, { expiresAt: number; fingerprint: string }>; attempts: { count: number; resetsAt: number }
}
export const emptyOwnerState = (): OwnerState => ({ version: 2, automation: emptyAutomation(), creatives: {}, content: {}, activity: [], jobs: [], sessions: {}, attempts: { count: 0, resetsAt: 0 } })
export interface Filters { period: string; from: string; to: string; game: string; route: string; locale: string; operator: string; placement: string; geo: string; device: string; source: string }
export function readFilters(params: URLSearchParams, now = new Date()): Filters {
  const period = ['7', '30', '90', 'all', 'custom'].includes(params.get('period') ?? '') ? params.get('period')! : '30'
  const end = now.toISOString().slice(0, 10)
  const start = new Date(now.getTime() - (Number(period) - 1 || 29) * 86400000).toISOString().slice(0, 10)
  const date = (value: string | null, fallback: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) ? value : fallback
  const from = period === 'all' ? '' : period === 'custom' ? date(params.get('from'), start) : start
  const to = period === 'custom' ? date(params.get('to'), end) : end
  if (from > to) throw new Error('Start date must be before the end date.')
  const text = (key: string) => (params.get(key) ?? '').slice(0, 240)
  return { period, from, to, game: text('game'), route: text('route'), locale: text('locale'), operator: text('operator'), placement: text('placement'), geo: text('geo'), device: text('device'), source: text('source') }
}
export function inPeriod(date: string, filters: Pick<Filters, 'from' | 'to'>) { return (!filters.from || date.slice(0, 10) >= filters.from) && date.slice(0, 10) <= filters.to }
export function safeId(id: string) { return /^[a-z0-9][a-z0-9-]{0,99}$/.test(id) }
