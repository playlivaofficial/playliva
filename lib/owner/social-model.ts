import { inPeriod, type Creative, type CreativeState, type Filters, type UploadHistory, type YouTubeState } from './model'

type RecordValue = Record<string, unknown>
const object = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {}
const text = (value: unknown) => typeof value === 'string' ? value : ''
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0
const nullable = (value: unknown) => text(value) || null
export const REMAINING_YOUTUBE_ID = 'l1x4jFmamyw'

/** Reads historical versions without rewriting them or imposing the old 50-item limit. */
export function normalizeManifest(input: unknown, overrides: Record<string, CreativeState> = {}): Creative[] {
  const manifest = object(input)
  if (!Array.isArray(manifest.items)) throw new Error('Social manifest has no items.')
  const ids = new Set<string>()
  const batchDate = text(manifest.generatedAt).slice(0, 10)
  const historicalBatch = manifest.items.filter(value => Boolean(object(value).youtubeVideoId)).length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(batchDate) && batchDate <= '2026-09-27'
  return manifest.items.map(raw => {
    const row = object(raw), id = text(row.contentId), qc = object(row.qc)
    if (!/^[a-z0-9][a-z0-9-]{0,99}$/.test(id) || ids.has(id) || !text(row.gameSlug) || !text(row.title)) throw new Error('Invalid or duplicate creative record.')
    ids.add(id)
    const override = overrides[id] ?? {}, videoId = nullable(row.youtubeVideoId)
    const uploadHistory: UploadHistory[] = videoId ? [{ videoId, uploadedAt: nullable(row.uploadedAt), state: 'unknown', source: 'Historical Social Engine manifest' }] : []
    // Owner evidence is explicit and dated. Missing old IDs are not invented.
    const remaining = row.gameSlug === 'crash' && id.startsWith('island-crash-10-')
    const recordedState = object(row.currentYouTubeState)
    const validRecordedState = ['private', 'unlisted', 'public', 'unavailable_deleted', 'unknown'].includes(text(recordedState.state))
    const youtube: Creative['youtube'] = override.youtube ?? {
      videoId: remaining ? REMAINING_YOUTUBE_ID : videoId,
      state: validRecordedState ? recordedState.state as YouTubeState : remaining ? 'private' : videoId && historicalBatch ? 'unavailable_deleted' : 'unknown',
      source: validRecordedState ? 'Imported current YouTube observation' : remaining || (videoId && historicalBatch) ? 'Owner-confirmed historical state, 2026-09-27; not a live API check' : videoId ? 'Historical ID; current availability unverified' : 'No current upload recorded',
      checkedAt: null, views: null, likes: null, comments: null,
    }
    if (remaining && !uploadHistory.some(item => item.videoId === REMAINING_YOUTUBE_ID)) uploadHistory.push({ videoId: REMAINING_YOUTUBE_ID, uploadedAt: null, state: 'private', source: 'Owner-confirmed, 2026-09-27; upload date unavailable' })
    const review = ['draft', 'needs_review', 'approved', 'rejected'].includes(text(row.reviewStatus)) ? row.reviewStatus as Creative['reviewStatus'] : 'needs_review'
    return {
      id, gameSlug: text(row.gameSlug), gameTitle: text(row.gameName), title: text(row.title), hook: text(row.hook), description: text(row.description), caption: text(row.caption) || text(row.body),
      locale: text(row.locale), platform: text(row.platform) || 'youtube', duration: number(row.duration), createdAt: text(row.createdAt) || text(manifest.generatedAt), updatedAt: override.updatedAt ?? nullable(row.updatedAt),
      reviewStatus: override.reviewStatus ?? review, approvedAt: override.approvedAt !== undefined ? override.approvedAt : nullable(row.approvedAt),
      renderStatus: override.renderStatus ?? (qc.passed === true ? 'rendered' : Object.keys(qc).length ? 'failed' : 'pending'),
      uploadStatus: youtube.state === 'unavailable_deleted' ? 'historical_deleted' : youtube.state === 'private' ? 'uploaded_private' : youtube.state === 'unlisted' ? 'uploaded_unlisted' : youtube.state === 'public' ? 'uploaded_public' : 'not_uploaded',
      publishStatus: youtube.state === 'public' ? 'published' : row.scheduledAt && youtube.state === 'private' ? 'scheduled' : 'unpublished', publishedAt: nullable(row.publishedAt),
      youtube, uploadHistory: override.uploadHistory ?? uploadHistory.map(entry => entry.videoId === youtube.videoId ? { ...entry, state: youtube.state } : entry),
      qc: override.qc ?? (Object.keys(qc).length ? { passed: qc.passed === true, inspectedAt: text(qc.inspectedAt), width: number(qc.width), height: number(qc.height), fps: number(qc.fps), bitrate: number(qc.videoBitrateKbps), lufs: number(qc.integratedLufs), notes: Array.isArray(qc.notes) ? qc.notes.map(text) : [] } : null),
      media: { video: false, thumbnail: false }, utmCampaign: text(row.utmCampaign), utmContent: text(row.utmContent), targetUrl: text(row.targetUrl), hashtags: Array.isArray(row.hashtags) ? row.hashtags.map(text) : [],
    }
  })
}
export function filterCreatives(items: Creative[], params: URLSearchParams, filters: Filters) {
  const query = (params.get('q') ?? '').toLocaleLowerCase(), sort = params.get('sort') ?? 'newest'
  return items.filter(item => inPeriod(item.createdAt, filters) && (!filters.game || item.gameSlug === filters.game) && (!filters.locale || item.locale.toLowerCase() === filters.locale.toLowerCase()) &&
    (!query || `${item.id} ${item.title} ${item.hook}`.toLocaleLowerCase().includes(query)) &&
    ['platform', 'reviewStatus', 'uploadStatus', 'publishStatus', 'renderStatus'].every(key => !params.get(key) || item[key as keyof Creative] === params.get(key)))
    .sort((a, b) => sort === 'game' ? a.gameTitle.localeCompare(b.gameTitle) : sort === 'status' ? a.reviewStatus.localeCompare(b.reviewStatus) : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id) : b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
}
export function reconcileYouTube(items: Creative[], response: unknown, now: string): Record<string, CreativeState> {
  const payload = object(response)
  if (!Array.isArray(payload.items)) throw new Error('Invalid YouTube response.')
  const videos = payload.items.map(object), result: Record<string, CreativeState> = {}
  for (const item of items) {
    if (!item.youtube.videoId) continue
    const video = videos.find(row => row.id === item.youtube.videoId), status = object(video?.status), stats = object(video?.statistics)
    const state: YouTubeState = !video ? 'unavailable_deleted' : ['private', 'public', 'unlisted'].includes(text(status.privacyStatus)) ? status.privacyStatus as YouTubeState : 'unknown'
    const metric = (value: unknown) => typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : null
    result[item.id] = { youtube: { videoId: item.youtube.videoId, state, checkedAt: now, source: 'YouTube Data API · authenticated channel', views: metric(stats.viewCount), likes: metric(stats.likeCount), comments: metric(stats.commentCount) },
      uploadHistory: item.uploadHistory.map(entry => entry.videoId === item.youtube.videoId ? { ...entry, state } : entry), updatedAt: now }
  }
  return result
}
export function canIntentionallyUpload(creative: Creative) {
  return creative.reviewStatus === 'approved' && creative.qc?.passed === true && creative.media.video &&
    (creative.uploadStatus === 'historical_deleted' || (creative.uploadStatus === 'not_uploaded' && !creative.youtube.videoId))
}
