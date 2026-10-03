import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { JSDOM } from 'jsdom'
import context from '../lib/commercial-context.ts'
import geo from '../lib/visitor-market.ts'
import input from '../lib/owner/server/event-input.ts'
import attribution from '../lib/attribution.ts'
import metrics from '../lib/owner/metrics.ts'
import social from '../lib/social/manual-links.ts'
import spotlight from '../lib/home/spotlight.ts'
import destinations from '../lib/affiliates/server-destinations.ts'
import campaignReferences from '../lib/affiliates/campaign-references.ts'
import { testDestinations } from './fixtures/affiliate-destinations.mjs'
import { readFile } from 'node:fs/promises'
import clickContext from '../lib/affiliates/click-context.ts'

test('campaign attribution follows the actual redirect context, including generic versus category destinations', () => {
  assert.equal(clickContext.campaignForGoHref('/go?country=BR&operator=betsson-group-affiliates&page=content'), 'betsson-br-brand')
  assert.equal(clickContext.campaignForGoHref('/go?country=BR&operator=betsson-group-affiliates&page=game&game=aviator'), 'betsson-br-crash')
  assert.equal(clickContext.campaignForGoHref('/go?country=BR&operator=betsson-group-affiliates&page=content&offer=of-br-betsson-100-giros'), 'betsson-br-promo')
  assert.equal(clickContext.campaignForGoHref('/go?country=GE&operator=betsson-group-affiliates'), undefined)
  assert.equal(clickContext.campaignForGoHref('https://outside.invalid/'), undefined)
})

test('private destinations resolve only from server configuration, preserve templates and fail closed', () => {
  const saved = process.env.PLAYLIVA_AFFILIATE_DESTINATIONS
  try {
    delete process.env.PLAYLIVA_AFFILIATE_DESTINATIONS
    assert.equal(destinations.serverDestination('playliva-affiliate:betsson-br-brand'), null)
    process.env.PLAYLIVA_AFFILIATE_DESTINATIONS = JSON.stringify(testDestinations)
    for (const key of Object.keys(campaignReferences.PRIVATE_CAMPAIGNS)) {
      assert.equal(destinations.serverDestination('playliva-affiliate:' + key), testDestinations[key])
    }
    const url = new URL(destinations.serverDestination('playliva-affiliate:betsson-br-brand?placement=homepage_banner'))
    assert.equal(url.searchParams.get('fixture'), 'brand')
    assert.equal(url.searchParams.get('placement'), 'homepage_banner')
    for (const value of ['https://attacker.invalid/', 'http://record.betsson.bet.br/', 'https://user:password@record.betsson.bet.br/']) {
      process.env.PLAYLIVA_AFFILIATE_DESTINATIONS = JSON.stringify({ 'betsson-br-brand': value })
      assert.equal(destinations.serverDestination('playliva-affiliate:betsson-br-brand'), null)
    }
    assert.equal(destinations.serverDestination('playliva-affiliate:unknown'), null)
  } finally { if (saved === undefined) delete process.env.PLAYLIVA_AFFILIATE_DESTINATIONS; else process.env.PLAYLIVA_AFFILIATE_DESTINATIONS = saved }
})

test('public campaign records contain references, not raw partner identifiers', async () => {
  for (const path of ['lib/data.ts', 'lib/affiliates/betsson-promo-config.ts', 'docs/betsson-br-campaign-funnel.md']) {
    const source = await readFile(new URL('../' + path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /https:\/\/record\.betsson\.bet\.br\/_[A-Za-z0-9_-]+\/1/)
  }
})

test('commercial taxonomy separates all requested surfaces without changing redirect context', () => {
  const cases = [
    ['/pt-br/play/crash', 'originals_engagement_offer', 'original_popup'],
    ['/pt-br/play/samba-drop', 'originals_header', 'original_sponsor'],
    ['/pt-br/games/aviator', 'game_detail_banner', 'real_game'],
    ['/pt-br/where-to-play/aviator', 'discovery_game_offer', 'where_to_play'],
    ['/pt-br/compare/aviator-vs-jetx', 'comparison_banner', 'comparison'],
    ['/pt-br/games-like/aviator', 'games_like_banner', 'games_like'],
    ['/pt-br/crash', 'crash_banner', 'category'],
    ['/pt-br/providers/spribe', 'provider_detail_banner', 'provider'],
    ['/pt-br', 'homepage_banner', 'banner'],
  ]
  for (const [path, placement, taxonomy] of cases) assert.equal(context.commercialContext(path, placement).taxonomy, 'playliva_' + taxonomy)
})

test('trusted visitor market fails closed independent of locale, query or saved selection', () => {
  for (const value of ['GE', 'US', '', 'BR,GE', 'unknown']) assert.equal(geo.visitorMarket(new Headers({ 'x-vercel-ip-country': value })), null)
  assert.equal(geo.visitorMarket(new Headers({ 'x-vercel-ip-country': 'BR' })), 'BR')
  assert.equal(geo.visitorMarket(new Headers({ 'x-vercel-ip-country': 'MX' })), 'MX')
})

test('event intake uses canonical registry/context, verified operator and request GEO; rejects sensitive or stale submissions', () => {
  const row = { id: randomUUID(), event: 'affiliate_click', timestamp: new Date().toISOString(), url: '/pt-br/games/aviator',
    placement: 'game_detail_play_real', operatorSlug: 'betsson-group-affiliates', trafficSource: 'youtube', utmSource: 'youtube', utmContent: 'creative-1',
    provider: 'invented', country: 'BR', language: 'en', destination: 'https://partner.invalid/?secret=hidden', email: 'private@example.org' }
  const br = new Headers({ 'x-vercel-ip-country': 'BR' }), ge = new Headers({ 'x-vercel-ip-country': 'GE' })
  const event = input.eventInput(row, br)
  assert.equal(event.dimensions.provider, 'spribe')
  assert.equal(event.dimensions.locale, 'pt-BR')
  assert.equal(event.dimensions.platform, 'youtube')
  assert.equal(event.dimensions.game, 'aviator')
  assert.equal(event.dimensions.category, 'crash')
  const comparison = input.eventInput({ ...row, url: '/pt-br/compare/aviator-vs-jetx', gameSlug: 'aviator' }, br)
  assert.equal(comparison.dimensions.game, 'aviator', 'specific CTA game is retained on a comparison')
  assert.equal(comparison.dimensions.taxonomy, 'playliva_comparison')
  assert.doesNotMatch(JSON.stringify(event), /secret|private@example|partner.invalid|invented/)
  assert.equal(input.eventInput(row, ge), null)
  for (const patch of [{ url: '/owner/growth' }, { url: '/pt-br/games/aviator?secret=hidden' }, { id: 'invalid' },
    { timestamp: 'invalid' }, { timestamp: new Date(Date.now() - 301000).toISOString() }, { operatorSlug: 'invented' }, { event: 'deposit' }]) {
    assert.equal(input.eventInput({ ...row, ...patch }, br), null)
  }
  assert.equal(input.eventInput({ ...row, event: 'page_view' }, ge).dimensions.geo, 'GE')
})

test('attribution survives internal navigation, accepts a new campaign, expires idle tabs and clears on withdrawal', () => {
  const dom = new JSDOM('', { url: 'https://www.playliva.com/pt-br/play/crash?utm_source=tiktok&utm_campaign=launch&utm_content=creative-1' })
  const saved = ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: dom.window.document })
  try {
    attribution.clearAttribution()
    assert.equal(attribution.captureAttribution().trafficSource, 'tiktok')
    dom.window.history.pushState({}, '', '/pt-br/games/aviator')
    assert.equal(attribution.getAttribution().utm.utm_content, 'creative-1')
    dom.window.history.pushState({}, '', '/pt-br/play/samba-drop?utm_source=instagram&utm_content=creative-2')
    assert.equal(attribution.getAttribution().trafficSource, 'instagram')
    const stored = JSON.parse(dom.window.sessionStorage.getItem(attribution.ATTRIBUTION_STORAGE_KEY))
    stored.touchedAt = Date.now() - attribution.ATTRIBUTION_IDLE_MS - 1
    dom.window.sessionStorage.setItem(attribution.ATTRIBUTION_STORAGE_KEY, JSON.stringify(stored))
    assert.equal(attribution.getAttribution().trafficSource, 'direct', 'an unchanged stale UTM address cannot revive the campaign')
    attribution.clearAttribution()
    assert.equal(dom.window.sessionStorage.getItem(attribution.ATTRIBUTION_STORAGE_KEY), null)
  } finally { dom.window.close(); for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] } }
})

test('all 13 Originals get distinct valid manual social landing links on all three platforms', () => {
  assert.equal(spotlight.SPOTLIGHT_GAMES.length, 13)
  for (const game of spotlight.SPOTLIGHT_GAMES) for (const platform of social.MANUAL_SOCIAL_PLATFORMS) {
    const url = new URL(social.manualSocialLink('https://www.playliva.com/pt-br' + game.playPath, platform, game.slug + '-creative-1'))
    assert.equal(url.pathname, '/pt-br' + game.playPath)
    assert.equal(url.searchParams.get('utm_source'), platform)
    assert.equal(url.searchParams.get('utm_medium'), 'organic_social')
    assert.equal(url.searchParams.get('utm_content'), game.slug + '-creative-1')
  }
  for (const path of ['/owner/growth', '/pt-br/play/missing', '/go', '/pt-br']) assert.throws(() => social.manualSocialLink('https://www.playliva.com' + path, 'youtube', 'creative-1'))
  for (const path of ['/pt-br/games', '/pt-br/games/aviator', '/pt-br/providers/spribe', '/pt-br/crash']) assert.ok(social.manualSocialLink('https://www.playliva.com' + path, 'tiktok', 'creative-1'))
})

test('canonical exposure counts avoid double denominator and isolate popup metrics', () => {
  const filters = { from: '', to: '2099-01-01' }
  const base = { date: '2026-09-28', route: '', game: '', locale: '', operator: '', placement: 'homepage_banner', geo: '', device: '', source: '', utmContent: '' }
  const events = [
    { ...base, event: 'affiliate_impression', count: 10 }, { ...base, event: 'offer_impression', count: 10 },
    { ...base, event: 'affiliate_click', count: 2 },
    { ...base, placement: 'originals_engagement_offer', event: 'affiliate_impression', count: 5 },
    { ...base, placement: 'originals_engagement_offer', event: 'affiliate_click', count: 1 },
  ]
  const result = metrics.aggregateEvents(events, filters)
  assert.equal(result.impressions, 15); assert.equal(result.clicks, 3); assert.equal(result.ctr, .2)
  assert.equal(result.popupImpressions, 5); assert.equal(result.popupClicks, 1)
})
