import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import content from '../lib/social/content.ts'
import youtube from '../lib/social/youtube.ts'

const path = new URL('../social/content/youtube-shorts-br.json', import.meta.url)
const fixture = JSON.parse(await readFile(path, 'utf8'))

test('social manifest validates the five unique PT-BR Original Shorts', () => {
  const manifest = content.validateManifest(fixture)
  assert.equal(manifest.items.length, 5)
  assert.equal(new Set(manifest.items.map(item => item.contentId)).size, 5)
  assert.deepEqual(manifest.items.map(item => item.gameSlug), ['crash', 'mines', 'blackjack', 'roulette', 'capybara-gold'])
  assert.deepEqual(manifest.items.map(item => item.publishStatus), ['uploaded_private', 'needs_review', 'needs_review', 'needs_review', 'needs_review'])
  assert.ok(manifest.items[0].youtubeVideoId)
  assert.ok(manifest.items[0].uploadedAt)
  assert.ok(manifest.items.slice(1).every(item => !item.youtubeVideoId && !item.uploadedAt))
})

test('UTM builder targets exact PlayLiva Original routes with unique content IDs', () => {
  for (const item of content.validateManifest(fixture).items) {
    const url = new URL(content.trackedTargetUrl(item))
    assert.equal(url.origin, 'https://www.playliva.com')
    assert.equal(url.pathname, content.ORIGINAL_ROUTES[item.gameSlug])
    assert.equal(url.searchParams.get('utm_source'), 'youtube')
    assert.equal(url.searchParams.get('utm_medium'), 'organic_social')
    assert.equal(url.searchParams.get('utm_campaign'), 'playliva_shorts')
    assert.equal(url.searchParams.get('utm_content'), item.contentId)
  }
})

test('metadata remains restrained, PT-BR, responsible and free-play only', () => {
  for (const item of content.validateManifest(fixture).items) {
    const metadata = content.youtubeMetadata(item)
    assert.ok(metadata.title.length <= 100)
    assert.match(metadata.title, /#Shorts$/)
    assert.match(metadata.description, /Jogue grátis no PlayLiva/)
    assert.match(metadata.description, /18\+ \| Jogue com responsabilidade/)
    assert.doesNotMatch(metadata.description, /betsson|affiliate|aposta com dinheiro/i)
    assert.equal(metadata.tags.length, 4)
    assert.equal(metadata.madeForKids, false)
  }
})

test('duplicate prevention rejects repeated IDs and fingerprints', () => {
  const duplicate = structuredClone(fixture)
  duplicate.items.push(structuredClone(duplicate.items[0]))
  assert.throws(() => content.validateManifest(duplicate), /duplicate contentId/)
})

test('route validation blocks off-site and mismatched Original targets', () => {
  const offsite = structuredClone(fixture)
  offsite.items[0].targetUrl = 'https://example.com/pt-br/play/crash'
  assert.throws(() => content.validateManifest(offsite), /incorrect Original route|stay on/)
  const mismatch = structuredClone(fixture)
  mismatch.items[0].targetUrl = 'https://www.playliva.com/pt-br/play/mines'
  assert.throws(() => content.validateManifest(mismatch), /incorrect Original route/)
})

test('upload request uses videos.insert metadata and declares not made for kids', () => {
  const item = content.validateManifest(fixture).items[0]
  const request = youtube.buildUploadRequest(item, 'private')
  assert.match(request.endpoint, /youtube\/v3\/videos\?part=snippet,status&uploadType=resumable/)
  assert.equal(request.resource.status.privacyStatus, 'private')
  assert.equal(request.resource.status.selfDeclaredMadeForKids, false)
  assert.equal(request.resource.snippet.defaultLanguage, 'pt-BR')
  assert.equal(request.resource.snippet.categoryId, '20')
  assert.equal(youtube.YOUTUBE_UPLOAD_SCOPE, 'https://www.googleapis.com/auth/youtube.upload')
  assert.equal(youtube.YOUTUBE_READONLY_SCOPE, 'https://www.googleapis.com/auth/youtube.readonly')
  assert.equal(youtube.YOUTUBE_OAUTH_SCOPES, `${youtube.YOUTUBE_UPLOAD_SCOPE} ${youtube.YOUTUBE_READONLY_SCOPE}`)
})

test('channel verification permits only the existing PlayLiva channel', () => {
  const response = { items: [{ id: youtube.PLAYLIVA_YOUTUBE_CHANNEL_ID, snippet: { title: 'PlayLiva' } }] }
  assert.deepEqual(youtube.authorizedChannel(response), { id: 'UC66mms712dnc7_2O6R_jqyg', title: 'PlayLiva' })
  assert.throws(() => youtube.authorizedChannel({ items: [{ id: 'another-channel', snippet: { title: 'Other' } }] }), /not PlayLiva/)
  assert.throws(() => youtube.authorizedChannel({ items: [] }), /did not return/)
})

test('scheduling requires a future publish time and private privacy state', () => {
  const future = new Date(Date.now() + 86_400_000).toISOString()
  assert.doesNotThrow(() => youtube.validateSchedule('private', future))
  assert.throws(() => youtube.validateSchedule('unlisted', future), /private upload/)
  assert.throws(() => youtube.validateSchedule('private', new Date(Date.now() - 1_000).toISOString()), /future ISO date/)
})

test('review state and retry policy block duplicates and classify failures', () => {
  const item = content.validateManifest(fixture).items[0]
  assert.equal(content.canUpload(item), false)
  assert.equal(content.canUpload({ ...item, publishStatus: 'approved', youtubeVideoId: null, uploadedAt: null }), true)
  assert.equal(content.canUpload({ ...item, publishStatus: 'approved', youtubeVideoId: 'abc' }), false)
  assert.equal(content.nextUploadStatus('private'), 'uploaded_private')
  assert.equal(content.nextUploadStatus('unlisted'), 'uploaded_unlisted')
  assert.equal(content.nextUploadStatus('private', new Date(Date.now() + 10_000).toISOString()), 'scheduled')
  for (const status of [408, 429, 500, 503]) assert.equal(youtube.isRetryableStatus(status), true)
  for (const status of [400, 401, 403, 404]) assert.equal(youtube.isRetryableStatus(status), false)
  assert.equal(youtube.retryDelayMs(2, () => 0), 4_000)
})

test('credential and render paths are ignored', async () => {
  const ignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8')
  for (const pattern of ['.youtube-oauth/', 'client_secret*.json', 'social/output/']) assert.match(ignore, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})
