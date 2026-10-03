import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import copyModule from '../lib/originals/blackjack/copy.ts'
import definitionModule from '../lib/originals/blackjack/definition.ts'
import referralModule from '../lib/originals/blackjack/play-real.ts'
import dataModule from '../lib/data.ts'
import affiliateModule from '../lib/affiliate.ts'
import seoModule from '../lib/seo.ts'
import sitemapModule from '../app/sitemap.ts'
const source = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const { blackjackCopy } = copyModule, { LIVA_BLACKJACK } = definitionModule
const { getVerifiedBlackjackReferrals } = referralModule

test('Blackjack: localized rules, action labels, safe SEO and its three Original URLs', () => {
  for (const [locale, segment] of [['en', 'en'], ['pt-BR', 'pt-br'], ['es-MX', 'es-mx']]) {
    const copy = blackjackCopy(locale)
    assert.deepEqual(Object.keys(copy), Object.keys(blackjackCopy('en')))
    assert.ok(Object.values(copy).every(v => v.trim().length > 0))
    for (const key of ['deal', 'again', 'hit', 'stand', 'double', 'split', 'bet', 'returned', 'how', 'loading']) if (locale !== 'en') assert.notEqual(copy[key], blackjackCopy('en')[key])
    assert.doesNotMatch(copy.description, /Betsson|Evolution|Pragmatic|Playtech|certified|provably fair/i)
    const metadata = seoModule.pageMetadata({ title: LIVA_BLACKJACK.title[locale], description: copy.description, path: '/play/blackjack', localeSegment: segment })
    assert.ok(metadata.alternates.canonical.endsWith(`/${segment}/play/blackjack`))
    for (const s of ['en', 'pt-br', 'es-mx']) assert.ok(metadata.alternates.languages[s].endsWith(`/${s}/play/blackjack`))
    assert.ok(metadata.alternates.languages['x-default'].endsWith('/en/play/blackjack'))
  }
  assert.equal(sitemapModule.default().filter(e => /\/play\/blackjack$/.test(e.url)).length, 3)
})
test('blackjack: exact verified external listing and GEO approval required; no Original availability claim', () => {
  for (const geo of ['MX','CO','PE']) {
    const locale=`es-${geo}`,snapshot=commercialFixture(geo),partner=snapshot.operators[0]
    const options=getVerifiedBlackjackReferrals(geo,locale,snapshot)
    assert.equal(options.length,1)
    const query=new URL(options[0].href,'https://www.playliva.com').searchParams
    assert.equal(query.get('game'),'blackjack-live')
    assert.equal(query.get('category'),'table-games')
    assert.equal(query.get('language'),locale)
    assert.equal(query.get('country'),geo)
    assert.equal(query.get('placement'),'originals_play_real')
    assert.equal(affiliateModule.resolveDestination({operatorSlug:partner.slug,country:geo,category:'table-games',gameSlug:'blackjack-live'},snapshot)?.url,partner.affiliateUrl[geo])
    for(const other of ['BR','GE','MX','CO','PE'])if(other!==geo)assert.deepEqual(getVerifiedBlackjackReferrals(other,locale,snapshot),[])
    const none=commercialFixture(geo,{verifiedGames:[]})
    assert.deepEqual(getVerifiedBlackjackReferrals(geo,locale,none),[],'category approval cannot substitute exact-game evidence')
    for(const field of ['approved','active']){const blocked=structuredClone(snapshot);blocked.operators[0][field]=false;assert.deepEqual(getVerifiedBlackjackReferrals(geo,locale,blocked),[])}
  }
})

test('Blackjack: discovery stays lightweight and does not register a provider game or unfinished placeholder', async () => {
  assert.ok(dataModule.GAMES.every(g => g.slug !== 'liva-blackjack' && g.id !== LIVA_BLACKJACK.id))
  const feature = await source('components/originals/blackjack-feature.tsx')
  assert.match(feature, /data-original-card="blackjack"/); assert.equal((feature.match(/prefetch=\{false\}/g) ?? []).length, 2)
  assert.doesNotMatch(feature, /import .*engine|import .*blackjack-game|import .*simulation/)
  assert.match(await source('components/play-view.tsx'), /IslandCrashFeature surface="hub"[\s\S]*CapybaraFeature surface="hub"[\s\S]*BlackjackFeature surface="hub"/)
  assert.match(await source('components/originals/island-crash-feature.tsx'), /surface === 'home' && <BlackjackFeature surface="home"/)
  assert.match(await source('components/category-page-view.tsx'), /slug === 'live-casino' && <BlackjackDiscoverySection/)
  assert.match(await source('components/mobile-bottom-nav.tsx'), /activePath === '\/play\/blackjack'\) return null/)
})
test('Blackjack: original vector art, lazy game and no production outcome overrides', async () => {
  const path = new URL('../public/originals/blackjack/table-poster.svg', import.meta.url)
  assert.ok((await stat(path)).size < 10000)
  const art = await readFile(path, 'utf8'); assert.doesNotMatch(art, /https?:\/\/(?!www.w3.org)|<script|<image|Evolution|Pragmatic|Playtech/i)
  assert.match(await source('components/originals/blackjack/blackjack-entry.tsx'), /dynamic\(\(\) => import\('\.\/blackjack-game'\)/)
  assert.doesNotMatch(await source('components/originals/blackjack/blackjack-game.tsx'), /wallet\.(credit|debit)|Math\.random|simulation|URLSearchParams|searchParams/)
  assert.match(await source('components/originals/blackjack/blackjack.module.css'), /prefers-reduced-motion/)
})
