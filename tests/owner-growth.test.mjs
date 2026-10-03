import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { scryptSync } from 'node:crypto'
import model from '../lib/owner/model.ts'
import socialModel from '../lib/owner/social-model.ts'
import metrics from '../lib/owner/metrics.ts'
import store from '../lib/owner/server/store.ts'
import auth from '../lib/owner/server/auth.ts'
import social from '../lib/owner/server/social.ts'
import content from '../lib/owner/server/content.ts'
import catalog from '../lib/owner/server/catalog.ts'
import analytics from '../lib/owner/server/analytics.ts'
import seo from '../lib/owner/server/seo.ts'
import youtube from '../lib/owner/server/youtube.ts'

const manifest = JSON.parse(await readFile(new URL('../social/content/youtube-shorts-br.json', import.meta.url), 'utf8'))
const rows = socialModel.normalizeManifest(manifest)
const filters = model.readFilters(new URLSearchParams('period=30'), new Date('2026-09-27T12:00:00Z'))
test('owner social import preserves 50 immutable records and separates all four status dimensions', () => {
  assert.equal(rows.length, 50)
  assert.equal(rows.filter(item => item.reviewStatus === 'needs_review').length, 50)
  assert.equal(rows.filter(item => item.renderStatus === 'rendered').length, 50)
  assert.equal(rows.filter(item => item.publishStatus === 'published').length, 0)
  assert.equal(manifest.items[0].reviewStatus, 'needs_review')
  assert.throws(() => socialModel.normalizeManifest({ items: [manifest.items[0], manifest.items[0]] }), /duplicate/)
})
test('owner-confirmed Island Crash 10 is the only remaining private upload; absent IDs are not invented', () => {
  const current = rows.filter(item => item.uploadStatus === 'uploaded_private')
  assert.equal(current.length, 1)
  assert.equal(current[0].youtube.videoId, 'l1x4jFmamyw')
  assert.equal(current[0].youtube.checkedAt, null)
  assert.equal(current[0].youtube.views, null)
  assert.equal(current[0].uploadHistory[0].uploadedAt, null)
  assert.match(current[0].youtube.source, /Owner-confirmed/)
})
test('authenticated YouTube sync separates deleted history from upload eligibility and preserves audit', () => {
  const item = rows.find(row => row.youtube.videoId)
  const changes = socialModel.reconcileYouTube([item], { items: [] }, '2026-09-27T12:00:00Z')
  const updated = socialModel.normalizeManifest(manifest, changes).find(row => row.id === item.id)
  assert.equal(updated.youtube.state, 'unavailable_deleted')
  assert.equal(updated.uploadStatus, 'historical_deleted')
  assert.equal(updated.publishStatus, 'unpublished')
  assert.equal(updated.uploadHistory[0].videoId, 'l1x4jFmamyw')
  assert.equal(socialModel.canIntentionallyUpload({ ...updated, reviewStatus: 'approved', media: { video: true, thumbnail: true } }), true)
  assert.equal(socialModel.canIntentionallyUpload({ ...updated, reviewStatus: 'needs_review', media: { video: true, thumbnail: true } }), false)
  assert.equal(socialModel.canIntentionallyUpload({ ...updated, reviewStatus: 'approved', uploadStatus: 'not_uploaded', youtube: { ...updated.youtube, state: 'unknown' }, media: { video: true, thumbnail: true } }), false)
  assert.throws(() => socialModel.reconcileYouTube([item], {}, 'today'), /Invalid/)
})
test('social filtering composes game, review, platform, locale, upload state, search and sort', () => {
  const params = new URLSearchParams('game=crash&locale=pt-br&platform=youtube&uploadStatus=uploaded_private&q=10&sort=game')
  assert.equal(socialModel.filterCreatives(rows, params, model.readFilters(params)).length, 1)
  assert.equal(socialModel.filterCreatives(rows, new URLSearchParams('platform=tiktok'), filters).length, 0)
  const many = Array.from({ length: 2000 }, (_, index) => ({ ...manifest.items[0], contentId: `creative-${index}` }))
  assert.equal(socialModel.normalizeManifest({ ...manifest, items: many }).length, 2000)
})
test('period filters validate dates and default to 30 days', () => {
  assert.equal(filters.from, '2026-08-29')
  assert.equal(model.readFilters(new URLSearchParams('period=7'), new Date('2026-09-27')).from, '2026-09-21')
  assert.equal(model.readFilters(new URLSearchParams('period=all')).from, '')
  assert.throws(() => model.readFilters(new URLSearchParams('period=custom&from=2026-09-27&to=2026-09-20')), /Start date/)
})
test('affiliate aggregation respects all dimensions, counts events and never infers revenue', () => {
  const base = { date: '2026-09-26', route: '/pt-br/play/crash', game: 'crash', locale: 'pt-BR', operator: 'op-betsson', placement: 'originals_engagement_offer', geo: 'BR', device: 'mobile', source: 'youtube', utmContent: 'creative-1' }
  const events = [{ ...base, event: 'affiliate_impression', count: 20 }, { ...base, event: 'affiliate_click', count: 3 }, { ...base, geo: 'MX', event: 'affiliate_click', count: 9 }, { ...base, date: '2026-07-01', event: 'affiliate_click', count: 10 }]
  const result = metrics.aggregateEvents(events, { ...filters, geo: 'BR', device: 'mobile', source: 'youtube', game: 'crash', locale: 'pt-br', operator: 'op-betsson', placement: 'originals_engagement_offer' })
  assert.equal(result.impressions, 20); assert.equal(result.clicks, 3); assert.equal(result.ctr, .15); assert.equal(result.popupClicks, 3)
  assert.equal(result.revenue, undefined)
  assert.equal(metrics.aggregateEvents(events, { ...filters, route: '/en/play/crash' }).clicks, 0)
  assert.equal(metrics.groupEvents(events, filters, 'geo').find(row => row.value === 'MX').clicks, 9)
})
test('SEO rules require actual evidence and distinguish indexing requests from indexing', () => {
  assert.equal(metrics.indexingState('URL is unknown to Google', 'accepted'), 'Requested')
  assert.equal(metrics.indexingState('Crawled - currently not indexed', 'accepted'), 'Crawled — currently not indexed')
  assert.equal(metrics.indexingState('URL is on Google'), 'Indexed')
  assert.equal(metrics.indexingState('Unknown'), 'Unknown')
  assert.equal(metrics.indexingState('Inspection unavailable'), 'Inspection unavailable')
  assert.deepEqual(metrics.seoOpportunities([]), [])
  const report = [{ query: 'plinko grátis', page: 'https://www.playliva.com/pt-br/play/samba-drop', clicks: 4, impressions: 500, ctr: .008, position: 8 }]
  assert.deepEqual(metrics.seoOpportunities(report).map(row => row.kind), ['low-ctr', 'within-reach'])
  assert.equal(metrics.seoOpportunities([{ ...report[0], impressions: 10 }]).length, 0)
  assert.ok(metrics.seoOpportunities([{ ...report[0], position: 18, previousImpressions: 200, internalLinks: 1 }]).some(row => row.kind === 'rising-query'))
})
test('owner catalog reuses all 14 Originals and public inventory never includes private routes', () => {
  assert.equal(catalog.ownerGames.length, 14)
  assert.ok(catalog.ownerGames.some(row => row.slug === 'skuptu-levanta'))
  assert.ok(catalog.publishedInventory().length > 300)
  assert.ok(catalog.publishedInventory().every(row => !row.route.includes('/owner')))
  assert.deepEqual(catalog.operatorOverview(), [], 'no pending or archived BR operator is a current commercial recommendation')
  assert.deepEqual(catalog.commercialReadiness().map(row => [row.geo, row.ready]), [['MX', false], ['CO', false], ['PE', false]])
  assert.ok(catalog.operatorOverview().every(row => !('affiliateUrl' in row)))
  const pipeline = content.contentPipeline(model.emptyOwnerState(), rows, [])
  assert.equal(pipeline.filter(row => row.type === 'Social opportunity').length, 9)
})
test('persistent owner auth, review actions, queue and content states survive readback without editing history', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'playliva-owner-test-'))
  process.env.OWNER_LOCAL_ENABLED = '1'; process.env.OWNER_DATA_DIR = directory
  const salt = 'abcdef0123456789abcdef0123456789', password = 'test-fixture-owner-password-with-entropy'
  await writeFile(resolve(directory, 'auth.json'), JSON.stringify({ passwordHash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}` }))
  assert.equal(await auth.validSession('fake'), false)
  assert.equal(auth.allowedOrigin(new Request('http://127.0.0.1:3122/api/owner/login', { headers: { origin: 'https://evil.example' } })), false)
  assert.equal(auth.allowedOrigin(new Request('http://127.0.0.1:3122/api/owner/login', { headers: { origin: 'http://127.0.0.1:3122' } })), true)
  const token = await auth.login(password)
  assert.equal(await auth.validSession(token), true)
  assert.equal((await store.readOwnerState()).sessions[token], undefined)
  const id = rows[0].id
  // Preserve prior approvals as history, but missing bytes cannot receive a new approval.
  await store.updateOwnerState(state => { state.creatives[id] = { reviewStatus: 'approved', approvedAt: new Date().toISOString() } })
  await assert.rejects(social.reviewCreative(id, 'approve', ''), /verified available video/)
  let state = await store.readOwnerState()
  assert.equal(state.creatives[id].reviewStatus, 'approved'); assert.ok(state.creatives[id].approvedAt)
  await social.reviewCreative(id, 'reject', 'Needs pacing review')
  state = await store.readOwnerState()
  assert.equal(state.creatives[id].reviewStatus, 'rejected'); assert.equal(state.creatives[id].approvedAt, null)
  await Promise.all([social.reviewCreative(rows[1].id, 'reject', 'Missing master'), social.reviewCreative(rows[2].id, 'reject', 'Check framing')])
  state = await store.readOwnerState(); assert.equal(state.creatives[rows[1].id].reviewStatus, 'rejected'); assert.equal(state.creatives[rows[2].id].reviewStatus, 'rejected')
  await assert.rejects(social.reviewCreative(id, 'regenerate', ''), /generation is disabled/)
  await assert.rejects(social.reviewCreative(id, 'approve', ''), /Approval requires/)
  const planned = { topic: 'PT-BR Samba rules', locale: 'pt-br', status: 'planned', route: '/pt-br/new-guide', type: 'Editorial plan', reason: 'Owner plan' }
  await content.saveContent(planned)
  await assert.rejects(content.saveContent({ ...planned, status: 'published' }), /existing sitemap/)
  await assert.rejects(content.saveContent({ ...planned, route: 'https://evil.example' }), /clean public route/)
  state = await store.readOwnerState(); assert.equal(state.jobs.length, 0); assert.equal(Object.values(state.content)[0].status, 'planned')
  assert.ok(state.activity.some(row => row.action === 'creative_rejected' && row.detail === 'Needs pacing review'))
  assert.deepEqual(JSON.parse(await readFile(new URL('../social/content/youtube-shorts-br.json', import.meta.url), 'utf8')), manifest)
  assert.equal((await analytics.analyticsSource()).state, 'not_connected')
  assert.equal((await seo.searchSource(filters)).state, 'not_connected')
  await mkdir(resolve(directory, 'media'), { recursive: true }); process.env.OWNER_MEDIA_ROOT = resolve(directory, 'media')
  assert.equal(await social.mediaFile(id, 'video'), null)
  process.env.OWNER_PASSWORD_HASH = `${salt}:${scryptSync('rotated-test-password', salt, 64).toString('hex')}`
  assert.equal(await auth.validSession(token), false)
  delete process.env.OWNER_PASSWORD_HASH; delete process.env.OWNER_DATA_DIR; delete process.env.OWNER_LOCAL_ENABLED; delete process.env.OWNER_MEDIA_ROOT
  assert.equal(store.persistenceMode(), 'not_connected')
  assert.equal(await auth.validSession(token), false)
})
test('read-only Google adapter rejects failed authorization, verifies channel and preserves history on failure', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'playliva-owner-provider-test-'))
  process.env.OWNER_LOCAL_ENABLED = '1'; process.env.OWNER_DATA_DIR = directory
  process.env.OWNER_YOUTUBE_CLIENT_ID = 'fixture-client'; process.env.OWNER_YOUTUBE_CLIENT_SECRET = 'fixture-client-value'; process.env.OWNER_YOUTUBE_REFRESH_TOKEN = 'fixture-refresh-value'
  process.env.OWNER_SEARCH_CLIENT_ID = 'fixture-client'; process.env.OWNER_SEARCH_CLIENT_SECRET = 'fixture-client-value'; process.env.OWNER_SEARCH_REFRESH_TOKEN = 'fixture-refresh-value'
  const actualFetch = globalThis.fetch, requests = []
  try {
    globalThis.fetch = async () => new Response('{}', { status: 401 })
    assert.equal((await seo.searchSource(filters)).state, 'not_connected') // Reporting requires durable storage; dashboard reads never call Google.
    await assert.rejects(youtube.syncYouTube(), /authorization/)
    assert.equal((await store.readOwnerState()).activity.length, 0)
    globalThis.fetch = async (url, init) => {
      requests.push({ url: String(url), method: init?.method || 'GET' })
      if (String(url).includes('oauth2')) return Response.json({ access_token: 'fixture-access-value' })
      if (String(url).includes('/channels?')) return Response.json({ items: [{ id: 'UC66mms712dnc7_2O6R_jqyg', snippet: { title: 'PlayLiva' } }] })
      if (String(url).includes('/videos?')) return Response.json({ items: [{ id: 'l1x4jFmamyw', snippet: { channelId: 'UC66mms712dnc7_2O6R_jqyg' }, status: { privacyStatus: 'private' }, statistics: { viewCount: '4', likeCount: '1' } }] })
      throw new Error('Unexpected request')
    }
    await youtube.syncYouTube()
    const state = await store.readOwnerState(), current = Object.values(state.creatives)[0]
    assert.equal(current.youtube.state, 'private'); assert.equal(current.youtube.views, 4); assert.equal(current.youtube.comments, null)
    assert.ok(current.youtube.checkedAt)
    assert.ok(requests.every(row => row.method === 'GET' || row.url === 'https://oauth2.googleapis.com/token'))
    assert.ok(requests.every(row => !row.url.includes('/upload/')))
    assert.ok(!JSON.stringify(state).includes('fixture-access-value'))
    globalThis.fetch = async url => String(url).includes('oauth2') ? Response.json({ access_token: 'fixture-access-value' }) : Response.json({ items: [{ id: 'wrong-channel', snippet: { title: 'Unrelated' } }] })
    await assert.rejects(youtube.syncYouTube(), /not PlayLiva/)
    assert.equal((await store.readOwnerState()).activity.length, 1)
  } finally {
    globalThis.fetch = actualFetch
    for (const key of ['OWNER_LOCAL_ENABLED', 'OWNER_DATA_DIR', 'OWNER_YOUTUBE_CLIENT_ID', 'OWNER_YOUTUBE_CLIENT_SECRET', 'OWNER_YOUTUBE_REFRESH_TOKEN', 'OWNER_SEARCH_CLIENT_ID', 'OWNER_SEARCH_CLIENT_SECRET', 'OWNER_SEARCH_REFRESH_TOKEN']) delete process.env[key]
  }
})
