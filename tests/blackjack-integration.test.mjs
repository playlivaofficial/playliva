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
    assert.ok(metadata.alternates.languages['x-default'].endsWith('/pt-br/play/blackjack'))
  }
  assert.equal(sitemapModule.default().filter(e => /\/play\/blackjack$/.test(e.url)).length, 3)
})
test('Blackjack: exact verified external referral, never an Original availability claim or blanket category approval', () => {
  const partner = dataModule.getOperator('betsson-group-affiliates')
  for (const locale of ['en', 'pt-BR', 'es-MX']) {
    const referrals = getVerifiedBlackjackReferrals('BR', locale)
    assert.equal(referrals.length, 1)
    const url = new URL(referrals[0].href, 'https://example.invalid')
    assert.equal(url.searchParams.get('game'), 'blackjack-live')
    assert.equal(url.searchParams.get('category'), 'table-games')
    assert.equal(url.searchParams.get('language'), locale)
    assert.equal(url.searchParams.get('placement'), 'originals_play_real')
    assert.equal(affiliateModule.resolveDestination({ operatorSlug: partner.slug, country: 'BR', category: 'table-games', gameSlug: 'blackjack-live' }).url, partner.categoryAffiliateUrl['live-casino'].BR)
    for (const geo of ['MX', 'PT', 'unknown']) assert.deepEqual(getVerifiedBlackjackReferrals(geo, locale), [])
  }
  const verified = partner.verifiedGames
  try { partner.verifiedGames = { BR: verified.BR.filter(id => id !== 'g12') }; assert.deepEqual(getVerifiedBlackjackReferrals('BR', 'en'), []) }
  finally { partner.verifiedGames = verified }
  const status = partner.affiliateStatus
  try { for (const value of ['pending', 'paused']) { partner.affiliateStatus = value; assert.deepEqual(getVerifiedBlackjackReferrals('BR', 'en'), []) } }
  finally { partner.affiliateStatus = status }
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
