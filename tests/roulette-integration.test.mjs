import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import copyModule from '../lib/originals/roulette/copy.ts'
import configModule from '../lib/originals/roulette/config.ts'
import betsModule from '../lib/originals/roulette/bets.ts'
import referralModule from '../lib/originals/roulette/play-real.ts'
import dataModule from '../lib/data.ts'
import affiliateModule from '../lib/affiliate.ts'
import seoModule from '../lib/seo.ts'
import sitemapModule from '../app/sitemap.ts'
const source = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const { rouletteCopy, rouletteBetLabel } = copyModule, { LIVA_ROULETTE } = configModule
const { getVerifiedRouletteReferrals } = referralModule

test('Roulette integration: full localized copy/bet labels, safe metadata and forty-two Original URLs', () => {
  for (const [locale, segment] of [['en','en'],['pt-BR','pt-br'],['es-MX','es-mx']]) {
    const copy = rouletteCopy(locale)
    assert.deepEqual(Object.keys(copy), Object.keys(rouletteCopy('en')))
    assert.ok(Object.values(copy).every(v => v.trim().length > 0))
    for (const key of ['spin','chip','undo','clear','repeat','how','loading','inside','outside','red','odd']) if (locale !== 'en') assert.notEqual(copy[key], rouletteCopy('en')[key])
    for (const b of betsModule.ROULETTE_BETS) assert.ok(rouletteBetLabel(b, locale).length > 0)
    assert.doesNotMatch(copy.description, /Betsson|Evolution|certified|provably fair|live dealer/i)
    const meta = seoModule.pageMetadata({ title: LIVA_ROULETTE.title[locale], description: copy.description, path: '/play/roulette', localeSegment: segment })
    assert.ok(meta.alternates.canonical.endsWith(`/${segment}/play/roulette`))
    for (const s of ['en','pt-br','es-mx']) assert.ok(meta.alternates.languages[s].endsWith(`/${s}/play/roulette`))
    assert.ok(meta.alternates.languages['x-default'].endsWith('/pt-br/play/roulette'))
  }
  assert.equal(sitemapModule.default().filter(e => /\/play\//.test(e.url)).length, 42)
})
test('Roulette integration: exact external game/GEO approval is required; no Original availability claim', () => {
  const partner = dataModule.getOperator('betsson-group-affiliates')
  for (const locale of ['en','pt-BR','es-MX']) {
    const options = getVerifiedRouletteReferrals('BR', locale)
    assert.equal(options.length, 1)
    const url = new URL(options[0].href, 'https://example.invalid')
    assert.equal(url.searchParams.get('game'), 'lightning-roulette')
    assert.equal(url.searchParams.get('category'), 'live-casino')
    assert.equal(url.searchParams.get('language'), locale)
    assert.equal(url.searchParams.get('placement'), 'originals_play_real')
    assert.equal(affiliateModule.resolveDestination({ operatorSlug: partner.slug, country: 'BR', category: 'live-casino', gameSlug: 'lightning-roulette' }).url, partner.categoryAffiliateUrl['live-casino'].BR)
    for (const geo of ['MX','PT','unknown']) assert.deepEqual(getVerifiedRouletteReferrals(geo, locale), [])
  }
  const verified = partner.verifiedGames
  try { partner.verifiedGames = { BR: verified.BR.filter(id => id !== 'g7') }; assert.deepEqual(getVerifiedRouletteReferrals('BR', 'en'), []) }
  finally { partner.verifiedGames = verified }
  const status = partner.affiliateStatus
  try { for (const value of ['pending','paused']) { partner.affiliateStatus = value; assert.deepEqual(getVerifiedRouletteReferrals('BR', 'en'), []) } }
  finally { partner.affiliateStatus = status }
})
test('Roulette integration: lightweight Original discovery stays outside provider records and simulation', async () => {
  assert.ok(dataModule.GAMES.every(g => g.slug !== 'roulette' && g.id !== LIVA_ROULETTE.id))
  const feature = await source('components/originals/roulette-feature.tsx')
  assert.match(feature, /data-original-card="roulette"/)
  assert.equal((feature.match(/prefetch=\{false\}/g) ?? []).length, 2)
  assert.doesNotMatch(feature, /import .*engine|import .*roulette-game|import .*simulation/)
  assert.match(await source('components/play-view.tsx'), /RouletteFeature surface="hub"/)
  assert.match(await source('components/originals/island-crash-feature.tsx'), /surface === 'home' && <RouletteFeature surface="home"/)
  assert.match(await source('components/category-page-view.tsx'), /slug === 'table-games' && <RouletteDiscoverySection/)
  assert.match(await source('components/category-page-view.tsx'), /slug === 'live-casino' && <RouletteDiscoverySection liveContext/)
  assert.match(await source('components/mobile-bottom-nav.tsx'), /activePath === '\/play\/roulette'\) return null/)
})
test('Roulette integration: owned vector art, lazy renderer, no hidden outcome/debug or heavy engine import', async () => {
  const path = new URL('../public/originals/roulette/orbit-poster.svg', import.meta.url)
  assert.ok((await stat(path)).size < 16000)
  assert.doesNotMatch(await readFile(path, 'utf8'), /https?:\/\/(?!www.w3.org)|<script|<image|Evolution|Pragmatic|Playtech/i)
  assert.match(await source('components/originals/roulette/roulette-entry.tsx'), /dynamic\(\(\) => import\('\.\/roulette-game'\)/)
  assert.doesNotMatch(await source('components/originals/roulette/roulette-game.tsx'), /wallet\.(credit|debit)|Math\.random|simulation|URLSearchParams|searchParams|three/)
  assert.doesNotMatch(await source('components/originals/roulette/roulette-wheel.tsx'), /samplePocket|settleRoulette|wallet|onComplete|Math\.random|three/)
  assert.match(await source('components/originals/roulette/roulette.module.css'), /prefers-reduced-motion/)
})
