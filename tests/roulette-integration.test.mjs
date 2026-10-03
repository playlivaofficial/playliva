import { commercialFixture } from './fixtures/promo-commercial.mjs'
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
    assert.ok(meta.alternates.languages['x-default'].endsWith('/en/play/roulette'))
  }
  assert.equal(sitemapModule.default().filter(e => /\/play\//.test(e.url)).length, 42)
})
test('roulette: exact verified external listing and GEO approval required; no Original availability claim', () => {
  for (const geo of ['MX','CO','PE']) {
    const locale=`es-${geo}`,snapshot=commercialFixture(geo),partner=snapshot.operators[0]
    const options=getVerifiedRouletteReferrals(geo,locale,snapshot)
    assert.equal(options.length,1)
    const query=new URL(options[0].href,'https://www.playliva.com').searchParams
    assert.equal(query.get('game'),'lightning-roulette')
    assert.equal(query.get('category'),'live-casino')
    assert.equal(query.get('language'),locale)
    assert.equal(query.get('country'),geo)
    assert.equal(query.get('placement'),'originals_play_real')
    assert.equal(affiliateModule.resolveDestination({operatorSlug:partner.slug,country:geo,category:'live-casino',gameSlug:'lightning-roulette'},snapshot)?.url,partner.affiliateUrl[geo])
    for(const other of ['BR','GE','MX','CO','PE'])if(other!==geo)assert.deepEqual(getVerifiedRouletteReferrals(other,locale,snapshot),[])
    const none=commercialFixture(geo,{verifiedGames:[]})
    assert.deepEqual(getVerifiedRouletteReferrals(geo,locale,none),[],'category approval cannot substitute exact-game evidence')
    for(const field of ['approved','active']){const blocked=structuredClone(snapshot);blocked.operators[0][field]=false;assert.deepEqual(getVerifiedRouletteReferrals(geo,locale,blocked),[])}
  }
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
