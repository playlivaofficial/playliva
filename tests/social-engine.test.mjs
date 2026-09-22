import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import content from '../lib/social/content.ts'
import youtube from '../lib/social/youtube.ts'

const path = new URL('../social/content/youtube-shorts-br.json', import.meta.url)
const fixture = JSON.parse(await readFile(path, 'utf8'))
const games = ['crash', 'mines', 'blackjack', 'roulette', 'capybara-gold']

test('manifest defines exactly ten unique premium Shorts per owned Original', () => {
  const manifest = content.validateManifest(fixture)
  assert.equal(manifest.items.length, 50)
  for (const game of games) assert.equal(manifest.items.filter(item => item.gameSlug === game).length, 10)
  for (const field of ['contentId', 'title', 'description', 'voiceLine', 'videoFile', 'thumbnailFile']) {
    assert.equal(new Set(manifest.items.map(item => item[field].toLocaleLowerCase('pt-BR'))).size, 50, `${field} must be unique`)
  }
  assert.ok(manifest.items.every(item => item.reviewStatus === 'needs_review' && item.publishStatus === 'needs_review'))
  assert.ok(manifest.items.every(item => !item.youtubeVideoId && !item.uploadedAt && !item.scheduledAt))
})

test('UTM builder targets exact PlayLiva Original routes with unique content IDs', () => {
  for (const item of content.validateManifest(fixture).items) {
    const url = new URL(content.trackedTargetUrl(item))
    assert.equal(url.origin, 'https://www.playliva.com')
    assert.equal(url.pathname, content.ORIGINAL_ROUTES[item.gameSlug])
    assert.equal(url.searchParams.get('utm_source'), 'youtube')
    assert.equal(url.searchParams.get('utm_medium'), 'organic_social')
    assert.equal(url.searchParams.get('utm_campaign'), 'playliva_originals_shorts')
    assert.equal(url.searchParams.get('utm_content'), item.contentId)
  }
})

test('metadata remains unique, restrained, PT-BR, responsible and free-play only', () => {
  const metadata = content.validateManifest(fixture).items.map(item => content.youtubeMetadata(item))
  assert.equal(new Set(metadata.map(item => item.title)).size, 50)
  assert.equal(new Set(metadata.map(item => item.description)).size, 50)
  for (const item of metadata) {
    assert.ok(item.title.length <= 100)
    assert.match(item.title, /#Shorts$/)
    assert.match(item.description, /Jogue grátis no PlayLiva/)
    assert.match(item.description, /18\+ \| Jogue com responsabilidade/)
    assert.doesNotMatch(item.description, /betsson|affiliate|aposta com dinheiro/i)
    assert.equal(item.madeForKids, false)
  }
})

test('every Short declares PT-BR voice, generated audio and a premium master', () => {
  for (const item of content.validateManifest(fixture).items) {
    assert.deepEqual(item.voice, { engine: 'kokoro-82m-v1.0', voice: 'pf_dora', language: 'pt-BR', speed: 1.02 })
    assert.equal(item.audio.sfxProfile, item.gameSlug)
    assert.equal(item.audio.loudnessLufs, -16)
    assert.equal(item.audio.truePeakDb, -1.5)
    assert.deepEqual(item.encoding, { width: 1080, height: 1920, fps: 30, videoCodec: 'h264', videoProfile: 'high', pixelFormat: 'yuv420p', crf: 17, audioCodec: 'aac', audioBitrateKbps: 192 })
  }
})

test('duplicate prevention rejects repeated IDs and fingerprints', () => {
  for (const field of ['contentId', 'title', 'description', 'voiceLine', 'videoFile', 'thumbnailFile']) {
    const duplicate = structuredClone(fixture)
    duplicate.items[1][field] = duplicate.items[0][field]
    assert.throws(() => content.validateManifest(duplicate), /duplicate value|utmContent must equal|incorrect Original route/)
  }
})

test('route validation blocks off-site and mismatched Original targets', () => {
  const offsite = structuredClone(fixture); offsite.items[0].targetUrl = 'https://example.com/pt-br/play/crash'
  assert.throws(() => content.validateManifest(offsite), /stay on/)
  const mismatch = structuredClone(fixture); mismatch.items[0].targetUrl = 'https://www.playliva.com/pt-br/play/mines'
  assert.throws(() => content.validateManifest(mismatch), /incorrect Original route/)
})

test('upload request uses videos.insert and channel verification permits only PlayLiva', () => {
  const item = content.validateManifest(fixture).items[0]
  const request = youtube.buildUploadRequest(item, 'private')
  assert.match(request.endpoint, /youtube\/v3\/videos\?part=snippet,status&uploadType=resumable/)
  assert.equal(request.resource.status.privacyStatus, 'private')
  assert.equal(request.resource.status.selfDeclaredMadeForKids, false)
  assert.equal(youtube.YOUTUBE_OAUTH_SCOPES, `${youtube.YOUTUBE_UPLOAD_SCOPE} ${youtube.YOUTUBE_READONLY_SCOPE}`)
  assert.deepEqual(youtube.authorizedChannel({ items: [{ id: youtube.PLAYLIVA_YOUTUBE_CHANNEL_ID, snippet: { title: 'PlayLiva' } }] }), { id: youtube.PLAYLIVA_YOUTUBE_CHANNEL_ID, title: 'PlayLiva' })
  assert.throws(() => youtube.authorizedChannel({ items: [{ id: 'other', snippet: { title: 'Other' } }] }), /not PlayLiva/)
})

test('human approval and retry policy guard uploads', () => {
  const item = content.validateManifest(fixture).items[0]
  assert.equal(content.canUpload(item), false)
  assert.equal(content.canUpload({ ...item, reviewStatus: 'approved', publishStatus: 'approved' }), true)
  assert.equal(content.canUpload({ ...item, reviewStatus: 'approved', publishStatus: 'approved', youtubeVideoId: 'abc' }), false)
  for (const status of [408, 429, 500, 503]) assert.equal(youtube.isRetryableStatus(status), true)
  for (const status of [400, 401, 403, 404]) assert.equal(youtube.isRetryableStatus(status), false)
})

test('credential, model and render paths are ignored', async () => {
  const ignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8')
  for (const pattern of ['.youtube-oauth/', 'client_secret*.json', 'social/output/']) assert.ok(ignore.includes(pattern))
})
