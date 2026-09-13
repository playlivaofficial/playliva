// Production HTTP/content regression crawl. Starts only a local server and
// never follows affiliate redirects. Run after pnpm build.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readdir, readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import sitemapModule from '../app/sitemap.ts'
const sitemap = sitemapModule.default
import sportsModule from '../lib/sports-data.ts'
const { SPORTS, LEAGUES, MATCHES, getLeagueById } = sportsModule
import localeModule from '../lib/locale.ts'
const { LOCALE_SEGMENTS } = localeModule
import seoModule from '../lib/seo.ts'
const { SITE_URL } = seoModule
import dataModule from '../lib/data.ts'
const { getOperator, CATEGORIES, GAMES } = dataModule
import consentModule from '../lib/consent.ts'
import discoveryModule from '../lib/originals/discovery.ts'
import i18nModule from '../lib/i18n.ts'
import productModule from '../lib/product-discovery.ts'
import catalogModule from '../lib/catalog/index.ts'
import catalogCopyModule from '../lib/catalog/copy.ts'
import catalogQueryModule from '../lib/catalog/query.ts'
const { originalsDiscoveryCopy, ISLAND_CRASH_POSTER } = discoveryModule
const { ANALYTICS_COOKIE } = consentModule

const listener = createServer()
listener.listen(0, '127.0.0.1')
await once(listener, 'listening')
const port = listener.address().port
await new Promise((resolve) => listener.close(resolve))
const base = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] })
let output = ''
server.stdout.on('data', (chunk) => { output += chunk })
server.stderr.on('data', (chunk) => { output += chunk })
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const failures = []
const publicPaths = sitemap().map((entry) => new URL(entry.url).pathname)
const paths = new Set(publicPaths)
const linkedPaths = new Set()
const chunkRoot = new URL('../.next/static/chunks/', import.meta.url)
const gameChunks = []
for (const name of await readdir(chunkRoot)) {
  if (!name.endsWith('.js')) continue
  const source = await readFile(new URL(name, chunkRoot), 'utf8')
  if (source.includes('WebGLRenderer') || source.includes('mountIslandScene')) gameChunks.push(name)
}
assert.ok(gameChunks.length >= 1, 'Crash renderer must exist in the production output')
for (const locale of LOCALE_SEGMENTS) {
  paths.add(`/${locale}/sports`)
  for (const sport of SPORTS) paths.add(`/${locale}/sports/${sport.slug}`)
  for (const league of LEAGUES) paths.add(`/${locale}/sports/${league.sport}/${league.slug}`)
  for (const match of MATCHES) paths.add(`/${locale}/sports/${match.sport}/${getLeagueById(match.leagueId).slug}/${match.slug}`)
  for (const legal of ['terms', 'cookie-policy', 'privacy-policy']) paths.add(`/${locale}/${legal}`)
}
try {
  let ready = false
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(`${base}/robots.txt`)).ok) { ready = true; break } } catch { /* starting */ }
    if (server.exitCode !== null) throw new Error(`Local server exited: ${output}`)
    await pause(250)
  }
  assert.ok(ready, 'local production server starts')
  assert.ok(publicPaths.every(path => !/^\/(en|pt-br|es-mx)\/sports(?:\/|$)/.test(path)), 'Sports archive URLs excluded from sitemap')
  const sitemapResponse = await fetch(`${base}/sitemap.xml`)
  assert.equal(sitemapResponse.status, 200)
  const sitemapText = await sitemapResponse.text()
  assert.doesNotMatch(sitemapText, /\/(?:en|pt-br|es-mx)\/sports(?:[\/<"])/, 'served sitemap excludes Sports archive URLs')
  for (const segment of LOCALE_SEGMENTS) assert.ok(sitemapText.includes(`${SITE_URL}/${segment}/play</loc>`))
  const poster = await fetch(base + ISLAND_CRASH_POSTER)
  assert.equal(poster.status, 200)
  assert.ok((await poster.arrayBuffer()).byteLength < 100_000)
  const manifest = JSON.parse(await readFile(new URL('../public/originals/crash/runtime/manifest.json', import.meta.url)))
  for (const source of manifest.sources) {
    assert.equal((await fetch(`${base}/originals/crash/characters/${source.path}`)).status, 404, source.path)
  }
  const partner = getOperator('betsson-group-affiliates')
  for (const consent of [undefined, 'denied', 'granted']) {
    for (const category of ['table-games', 'live-casino']) {
      const query = new URLSearchParams({ operator: partner.slug, country: 'BR', game: 'blackjack-live', category })
      const response = await fetch(`${base}/go?${query}`, {
        redirect: 'manual', headers: consent ? { cookie: `${ANALYTICS_COOKIE}=${consent}` } : {},
      })
      assert.equal(response.status, 302)
      assert.equal(response.headers.get('location'), partner.categoryAffiliateUrl['live-casino'].BR)
    }
    for (const category of [undefined, 'crash', 'live-casino', 'slots']) {
      const query = new URLSearchParams({ operator: partner.slug, country: 'BR' })
      if (category) query.set('category', category)
      const response = await fetch(`${base}/go?${query}`, {
        redirect: 'manual', headers: consent ? { cookie: `${ANALYTICS_COOKIE}=${consent}` } : {},
      })
      assert.equal(response.status, 302)
      assert.equal(response.headers.get('location'), partner.categoryAffiliateUrl?.[category]?.BR ?? partner.affiliateUrl.BR)
    }
    for (const placement of ['homepage_banner', 'originals_generic_operator']) {
      const query = new URLSearchParams({ operator: partner.slug, country: 'BR', placement })
      const response = await fetch(`${base}/go?${query}`, {
        redirect: 'manual', headers: consent ? { cookie: `${ANALYTICS_COOKIE}=${consent}` } : {},
      })
      assert.equal(response.status, 302)
      assert.equal(response.headers.get('location'), partner.affiliateUrl.BR)
    }
  }
  for (const path of paths) {
    const response = await fetch(base + path, { redirect: 'manual' })
    if (response.status !== 200) { failures.push(`${path}: HTTP ${response.status}`); continue }
    const dom = new JSDOM(await response.text())
    const doc = dom.window.document
    const canonical = doc.querySelector('link[rel="canonical"]')?.href
    if (canonical !== SITE_URL + path) failures.push(`${path}: canonical ${canonical}`)
    const routePath = path.replace(/^\/(en|pt-br|es-mx)/, '')
    const segment = path.split('/')[1]
    const copy = originalsDiscoveryCopy(localeModule.segmentToLocale(segment))
    const navCopy = i18nModule.createTranslator(localeModule.segmentToLocale(segment))
    assert.equal(doc.querySelector('header nav a[href="/' + segment + '/play"]')?.textContent, navCopy('nav.play'))
    if (['', '/play', '/crash'].includes(routePath)) {
      const cards = doc.querySelectorAll('[data-original-card="island-crash"]')
      assert.equal(cards.length, 1, `${path}: exactly one available Original`)
      assert.ok(cards[0].textContent.includes(copy.freePlay))
      assert.ok(cards[0].textContent.includes(copy.virtualCredits))
      assert.ok(cards[0].querySelector('img')?.getAttribute('src')?.includes('island-crash-poster'))
      for (const link of cards[0].querySelectorAll('a')) assert.equal(link.getAttribute('href'), `/${segment}/play/crash`)
      assert.equal(cards[0].querySelector('[data-play-free]')?.textContent.trim(), copy.playFree)
      assert.equal(doc.querySelector('main a[href*="/play/slots"], main a[href*="/play/plinko"]'), null)
      if (routePath === '/play') {
        assert.equal(doc.title, copy.seoTitle)
        assert.equal(doc.querySelector('meta[name="description"]')?.content, copy.seoDescription)
        assert.ok(doc.querySelector('[data-play-hub]')?.textContent.includes(copy.disclaimer))
        assert.doesNotMatch(doc.querySelector('[data-play-hub]')?.textContent ?? '', /Betsson|Aviator|Coming soon/i)
      } else {
        assert.ok(doc.querySelector(`[data-originals-section="${routePath === '' ? 'home' : 'category'}"]`))
        if (routePath === '') {
          assert.equal(doc.querySelector('[data-hero-play-free]')?.getAttribute('href'), `/${segment}/play`)
          assert.equal(doc.querySelector('[data-hero-explore]')?.getAttribute('href'), `/${segment}/games`)
          assert.ok(doc.querySelector('#provider-games [data-provider-card]'))
          assert.ok(doc.querySelector('[data-discovery-explainer]'))
          const banner = doc.querySelector('[data-betsson-banner="homepage"]')
          assert.ok(banner, `${path}: homepage Betsson banner`)
          const bannerLink = banner.querySelector('a[href^="/go?"]')
          const bannerQuery = new URL(bannerLink.href, base).searchParams
          assert.equal(bannerQuery.get('operator'), partner.slug)
          assert.equal(bannerQuery.get('placement'), 'homepage_banner')
          assert.equal(bannerQuery.get('page'), 'home')
          assert.equal(bannerQuery.get('country'), 'BR')
          assert.equal(bannerQuery.get('language'), localeModule.segmentToLocale(segment))
          assert.equal(bannerQuery.get('category'), null)
          assert.equal(bannerQuery.get('game'), null)
          assert.doesNotMatch(banner.textContent, /bônus|bonus|100%|free spin|gire grátis|Play Liva/i)
          if (segment === 'en') {
            assert.doesNotMatch(banner.textContent, /Conheça cassino|Patrocinado|Explorar Betsson|não aceita apostas nem depósitos/)
            assert.match(banner.textContent, /Sponsored/)
            assert.match(banner.textContent, /Explore Betsson/)
          }
          if (segment === 'es-mx') {
            assert.doesNotMatch(banner.textContent, /Conheça cassino|Sponsored|Explore Betsson|não aceita apostas nem depósitos/)
            assert.match(banner.textContent, /Patrocinado/)
            assert.match(banner.textContent, /Explorar Betsson/)
          }
          if (segment === 'pt-br') {
            assert.doesNotMatch(banner.textContent, /Sponsored|Explore Betsson|Visit Betsson/)
            assert.match(banner.textContent, /Patrocinado/)
            assert.match(banner.textContent, /Explorar Betsson/)
          }
          assert.ok(banner.getAttribute('data-creative-language') === 'neutral' || banner.getAttribute('data-creative-language') === localeModule.segmentToLocale(segment))
          if (segment !== 'pt-br') assert.notEqual(banner.getAttribute('data-creative-language'), 'pt-BR')
          const bannerGo = await fetch(base + bannerLink.getAttribute('href'), { redirect: 'manual' })
          assert.equal(bannerGo.status, 302)
          assert.equal(bannerGo.headers.get('location'), partner.affiliateUrl.BR)
        }
        else assert.ok(cards[0].compareDocumentPosition(doc.querySelector('main a[href*="/games/"]')) & 4, 'Original precedes provider grid')
      }
    }
    if (['', '/play', '/slots'].includes(routePath)) {
      const capybara = doc.querySelectorAll('[data-original-card="capybara-gold"]')
      assert.equal(capybara.length, 1, `${path}: one implemented Capybara card`)
      for (const link of capybara[0].querySelectorAll('a')) assert.equal(link.getAttribute('href'), `/${segment}/play/capybara-gold`)
      if (routePath === '/slots') {
        assert.ok(doc.querySelector('[data-originals-section="slots"]'))
        assert.ok(capybara[0].compareDocumentPosition(doc.querySelector('main a[href*="/games/"]')) & 4)
      }
    }
    if (routePath === '/play/capybara-gold') {
      assert.ok(doc.querySelector('[data-capybara-game]'), `${path}: real slot shell`)
      assert.equal(doc.querySelectorAll('[data-symbol]').length, 20, `${path}: five reels by four rows`)
      assert.ok(doc.querySelector('[data-slot-spin]'))
      assert.equal(doc.querySelector('nav.fixed'), null, `${path}: controls unobstructed by mobile nav`)
      const real = doc.querySelector('a[href^="/go?"]')
      assert.equal(new URL(real.href, base).searchParams.get('category'), 'slots')
      assert.equal(new URL(real.href, base).searchParams.get('language'), localeModule.segmentToLocale(segment))
      assert.ok(doc.querySelector('[data-operator-cta="play-real"]').compareDocumentPosition(doc.querySelector('[data-game-controls]')) & 4)
    }
    if (['', '/play', '/live-casino'].includes(routePath)) {
      const blackjack = doc.querySelectorAll('[data-original-card="blackjack"]')
      assert.equal(blackjack.length, 1, `${path}: one implemented Blackjack card`)
      for (const link of blackjack[0].querySelectorAll('a')) assert.equal(link.getAttribute('href'), `/${segment}/play/blackjack`)
      if (routePath === '/live-casino') {
        assert.ok(doc.querySelector('[data-originals-section="live-casino"]'))
        assert.ok(blackjack[0].compareDocumentPosition(doc.querySelector('main a[href*="/games/"]')) & 4)
      } else assert.deepEqual([...doc.querySelectorAll('[data-original-card]')].map(e => e.getAttribute('data-original-card')), ['island-crash', 'capybara-gold', 'blackjack', 'roulette', 'mines'])
    }
    if (routePath === '/play/blackjack') {
      assert.ok(doc.querySelector('[data-blackjack-game]'), `${path}: real blackjack shell`)
      assert.ok(doc.querySelector('[data-blackjack-deal]'))
      assert.equal(doc.querySelector('nav.fixed'), null)
      const real = doc.querySelector('a[href^="/go?"]'), target = new URL(real.href, base)
      assert.equal(target.searchParams.get('category'), 'table-games')
      assert.equal(target.searchParams.get('game'), 'blackjack-live')
      assert.equal(target.searchParams.get('language'), localeModule.segmentToLocale(segment))
      assert.equal(real.getAttribute('target'), '_blank'); assert.ok(real.rel.includes('sponsored'))
      assert.ok(doc.querySelector('[data-operator-cta="play-real"]').compareDocumentPosition(doc.querySelector('[data-game-controls]')) & 4)
      const outbound = await fetch(base + target.pathname + target.search, { redirect: 'manual' })
      assert.equal(outbound.status, 302); assert.equal(outbound.headers.get('location'), partner.categoryAffiliateUrl['live-casino'].BR)
    }
    if (['', '/play', '/table-games', '/live-casino'].includes(routePath)) {
      const roulette = doc.querySelectorAll('[data-original-card="roulette"]')
      assert.equal(roulette.length, 1, `${path}: one implemented Roulette card`)
      for (const link of roulette[0].querySelectorAll('a')) assert.equal(link.getAttribute('href'), `/${segment}/play/roulette`)
      if (routePath === '/live-casino') assert.ok(doc.querySelector('[data-originals-roulette="live-context"]'))
      if (routePath === '/table-games') assert.ok(roulette[0].compareDocumentPosition(doc.querySelector('main a[href*="/games/"]')) & 4)
    }
    if (routePath === '/play/roulette') {
      assert.ok(doc.querySelector('[data-roulette-game]'), `${path}: real roulette shell`)
      assert.ok(doc.querySelector('[data-roulette-spin]'))
      assert.equal(doc.querySelectorAll('[data-pocket]').length, 37)
      assert.equal(doc.querySelector('nav.fixed'), null)
      const real = doc.querySelector('a[href^="/go?"]'), target = new URL(real.href, base)
      assert.equal(target.searchParams.get('category'), 'live-casino')
      assert.equal(target.searchParams.get('game'), 'lightning-roulette')
      assert.equal(target.searchParams.get('language'), localeModule.segmentToLocale(segment))
      assert.equal(real.getAttribute('target'), '_blank'); assert.ok(real.rel.includes('sponsored'))
      assert.ok(doc.querySelector('[data-operator-cta="play-real"]').compareDocumentPosition(doc.querySelector('[data-game-controls]')) & 4)
      const outbound = await fetch(base + target.pathname + target.search, { redirect: 'manual' })
      assert.equal(outbound.status, 302); assert.equal(outbound.headers.get('location'), partner.categoryAffiliateUrl['live-casino'].BR)
    }
    if (['', '/play', '/instant-games'].includes(routePath)) {
      const mines = doc.querySelectorAll('[data-original-card="mines"]')
      assert.equal(mines.length, 1, `${path}: one implemented Mines card`)
      for (const link of mines[0].querySelectorAll('a')) assert.equal(link.getAttribute('href'), `/${segment}/play/mines`)
      if (routePath === '/instant-games') {
        assert.ok(doc.querySelector('[data-originals-mines]'))
        assert.ok(mines[0].compareDocumentPosition(doc.querySelector('main a[href*="/games/"]')) & 4)
      }
    }
    if (routePath === '/play/mines') {
      assert.ok(doc.querySelector('[data-mines-game]'))
      assert.equal(doc.querySelectorAll('[data-tile]').length, 25)
      assert.ok(doc.querySelector('[data-mines-start]'))
      assert.equal(doc.querySelectorAll('[data-mine]').length, 0)
      assert.equal(doc.querySelector('nav.fixed'), null)
      const cta = doc.querySelector('[data-operator-cta="play-real"]')
      assert.ok(cta, `${path}: generic Betsson CTA`)
      const real = cta.querySelector('a[href^="/go?"]'), target = new URL(real.href, base)
      assert.equal(target.searchParams.get('operator'), partner.slug)
      assert.equal(target.searchParams.get('category'), null)
      assert.equal(target.searchParams.get('game'), null)
      assert.equal(target.searchParams.get('placement'), 'originals_generic_operator')
      assert.equal(target.searchParams.get('language'), localeModule.segmentToLocale(segment))
      assert.equal(doc.querySelector('[data-operator-cta-mode]')?.getAttribute('data-operator-cta-mode'), 'generic-brand')
      assert.doesNotMatch(doc.body.textContent, /Play Liva Mines at Betsson|Jogue Liva Mines na Betsson|This game is available at Betsson/i)
      if (segment === 'en') {
        assert.doesNotMatch(doc.querySelector('[data-operator-cta="play-real"]')?.textContent ?? '', /Conheça cassino|Visitar Betsson|Patrocinado|não aceita apostas nem depósitos|Divulgação de afiliados/)
      }
      if (segment === 'es-mx') {
        assert.doesNotMatch(doc.querySelector('[data-operator-cta="play-real"]')?.textContent ?? '', /Conheça cassino|Visit Betsson|Sponsored|não aceita apostas nem depósitos|Divulgação de afiliados/)
      }
      const outbound = await fetch(base + target.pathname + target.search, { redirect: 'manual' })
      assert.equal(outbound.status, 302)
      assert.equal(outbound.headers.get('location'), partner.affiliateUrl.BR)
    }
    if (routePath !== '/play/crash') {
      for (const script of doc.querySelectorAll('script[src], link[rel="modulepreload"]')) {
        const url = script.getAttribute('src') ?? script.getAttribute('href')
        assert.ok(!gameChunks.some(name => url?.includes(name)), `${path}: game runtime leaks into ordinary page`)
      }
    } else {
      assert.doesNotMatch(doc.querySelector('main')?.textContent ?? '', /JetX|Aviator|SmartSoft|SPRIBE|Robinson Crusoe|\bFriday\b/i)
      assert.ok(doc.querySelector('[data-phase="ready"]'), `${path}: real game shell`)
      const real = doc.querySelector('main a[href^="/go?"]'), target = new URL(real.href, base)
      assert.equal(target.searchParams.get('category'), 'crash')
      assert.equal(target.searchParams.get('game'), null)
      assert.equal(target.searchParams.get('language'), localeModule.segmentToLocale(segment))
      assert.ok(doc.querySelector('[data-operator-cta="play-real"]').compareDocumentPosition(doc.querySelector('[data-game-controls]')) & 4)
      const outbound = await fetch(base + target.pathname + target.search, { redirect: 'manual' })
      assert.equal(outbound.status, 302)
      assert.equal(outbound.headers.get('location'), partner.categoryAffiliateUrl.crash.BR)
    }
    const sportsNav = doc.querySelector('header nav a[href="https://livasports.com"]')
    assert.ok(sportsNav, `${path}: visible desktop Sports network entry`)
    assert.equal(sportsNav.getAttribute('target'), null, `${path}: same-tab Sports navigation`)
    if (routePath === '') {
      const cards = [...doc.querySelectorAll('#game-types a')]
      assert.equal(cards.length, 4, `${path}: preserve four-card homepage structure`)
      assert.deepEqual(cards.map(card => card.getAttribute('href')), [
        `${path}/slots`, `${path}/crash`, `${path}/live-casino`, `${path}/instant-games`,
      ], `${path}: homepage category and network destinations`)
      assert.equal(cards[3].getAttribute('target'), null)
    }
    for (const segment of LOCALE_SEGMENTS) {
      assert.equal(doc.querySelector(`link[hreflang="${segment}"]`)?.href, `${SITE_URL}/${segment}${routePath}`, `${path}: hreflang ${segment}`)
    }
    assert.equal(doc.querySelector('link[hreflang="x-default"]')?.href, `${SITE_URL}/pt-br${routePath}`, `${path}: x-default`)
    for (const link of doc.querySelectorAll('a[href]')) {
      const url = new URL(link.getAttribute('href'), base + path)
      if (url.origin === base && !url.pathname.startsWith('/go')) linkedPaths.add(url.pathname)
      if ((!routePath.startsWith('/sports') || link.closest('header, footer')) && /\/(?:en|pt-br|es-mx)\/sports(?:\/|$)/.test(url.pathname)) {
        failures.push(`${path}: Sports link in normal discovery/navigation`)
      }
    }
    if (routePath.startsWith('/sports')) {
      assert.ok(doc.body.textContent.includes('LivaSports'), `${path}: archive notice`)
      assert.equal(doc.querySelector('a[href^="/go"], a[href="#"]'), null, `${path}: archive outbound action`)
      const bettingLabels = ['Bet', 'Apostar']
      assert.ok([...doc.querySelectorAll('button')].every(b => !bettingLabels.includes(b.textContent.trim())), `${path}: mock betting CTA`)
    }
    const category = CATEGORIES.find(c => routePath === `/${c.slug}`)
    if (category) {
      const gameLinks = [...doc.querySelectorAll('main a[href*="/games/"]')].map(link => new URL(link.href, base).pathname.split('/').pop())
      const expected = GAMES.filter(g => productModule.discoveryCategory(g) === category.slug || category.slug === 'table-games' && g.category === 'table-games').map(g => g.slug)
      // Preserve every legacy category member; append the bounded M11 reference
      // page only. Remaining entries are exercised through pagination tests.
      expected.push(...catalogModule.REFERENCE_GAMES.filter(g => g.category === category.slug)
        .sort((a, b) => a.title.localeCompare(b.title, localeModule.segmentToLocale(segment)))
        .slice(0, catalogQueryModule.CATALOG_PAGE_SIZE).map(g => g.slug))
      assert.deepEqual([...new Set(gameLinks)].sort(), expected.sort(), `${path}: category membership`)
    }
    const robots = [...doc.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')].map((meta) => meta.content)
    if (routePath.startsWith('/sports')) {
      assert.ok(robots.length && robots.every(value => value.includes('noindex')), `${path}: archive robots ${robots}`)
    }
    if (publicPaths.includes(path) ? robots.some((v) => v.includes('noindex')) : !robots.some((v) => v.includes('noindex'))) failures.push(`${path}: robots ${robots}`)
    if ((doc.title.match(/PlayLiva/gi) ?? []).length !== 1) failures.push(`${path}: title ${doc.title}`)
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const data = JSON.parse(script.textContent)
      if (data['@type'] === 'BreadcrumbList') for (const item of data.itemListElement) {
        if (item.item && !item.item.startsWith(`${SITE_URL}/${path.split('/')[1]}`)) failures.push(`${path}: unlocalized breadcrumb ${item.item}`)
      }
    }
    if (doc.querySelector('script[src*="googletagmanager"], script[src*="insights/script"]')) failures.push(`${path}: analytics script before consent`)
    if (path.includes('blackjack-live') && doc.querySelector('img[src*="blackjack-live.jpg"]')) failures.push(`${path}: mismatched Speed Blackjack artwork`)
    const metadataText = [...doc.querySelectorAll('meta[name="description"], img[alt]')].map((node) => node.content ?? node.alt).join(' ')
    if (doc.querySelector('[data-reference-detail]')) {
      const game = catalogModule.getReferenceGame(routePath.split('/').pop())
      const locale = localeModule.segmentToLocale(segment), c = catalogCopyModule.catalogCopy(locale)
      const art = game.artwork
      assert.equal(doc.querySelector('h1').textContent, game.title)
      for (const field of ['summary', 'overview', 'howItWorks']) assert.ok(doc.querySelector('main').textContent.includes(game.content[locale][field]), `${path}: ${field}`)
      assert.ok(art.status !== 'fallback')
      assert.ok(doc.querySelector('[data-artwork-status="sourced"]'))
      assert.ok(art.status !== 'fallback' && doc.querySelector(`main img[src="${art.assetPath}"]`))
      assert.equal(doc.querySelector('main iframe, main a[href^="/go"], main a[href*="/where-to-play/"]'), null)
      assert.ok(doc.querySelector('main').textContent.includes(c.evidence))
      assert.equal(doc.querySelector('meta[name="description"]').content, game.content[locale].summary)
    }
    if (doc.querySelector('[data-catalog-explorer]')) assert.ok(doc.querySelectorAll('[data-catalog-results] > a').length <= 12)
    if (routePath.startsWith('/games/') && doc.querySelector('[data-provider-detail]')) {
      assert.ok(doc.querySelector('[data-provider-hero-art]'), `${path}: provider artwork remains part of identity`)
      for (const anchor of doc.querySelectorAll('nav a[href^="#"]')) assert.ok(doc.querySelector(anchor.getAttribute('href')), `${path}: guide anchor target`)
    }
    assert.doesNotMatch(doc.querySelector('footer')?.textContent ?? '', /\uFFFD/, `${path}: footer encoding`)
    doc.querySelectorAll('script,style').forEach((node) => node.remove())
    const text = `${doc.title} ${metadataText} ${doc.body.textContent}`
    const placeholders = text.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g)
    if (placeholders) failures.push(`${path}: unresolved ${[...new Set(placeholders)].join(', ')}`)
    dom.window.close()
  }
  for (const path of linkedPaths) {
    if (paths.has(path)) continue
    const response = await fetch(base + path, { redirect: 'manual' })
    assert.ok(response.status >= 200 && response.status < 400, `${path}: broken internal link ${response.status}`)
  }
  for (const locale of LOCALE_SEGMENTS) {
    // M11 references never create inferred availability pages or automatic
    // Games Like pages; unknown providers also remain genuine 404s.
    for (const game of catalogModule.REFERENCE_GAMES) {
      assert.equal((await fetch(`${base}/${locale}/where-to-play/${game.slug}`)).status, 404)
    }
    for (const suffix of ['/providers/missing-provider', '/games-like/fruit-party', '/compare/fruit-party-vs-sugar-rush']) {
      assert.equal((await fetch(`${base}/${locale}${suffix}`)).status, 404)
    }
    for (const path of [`/${locale}/missing-page`, `/${locale}/games/missing-game`, `/${locale}/operators/missing-operator`,
      `/${locale}/sports/missing-sport`,
      ...['slots', 'plinko', 'test-only'].map(slug => `/${locale}/play/${slug}`)]) {
      const response = await fetch(base + path)
      assert.equal(response.status, 404, path)
      const doc = new JSDOM(await response.text()).window.document
      const robots = [...doc.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')].map((meta) => meta.content)
      assert.ok(robots.length && robots.every((value) => value.includes('noindex')), `${path}: ${robots}`)
      assert.equal(doc.querySelector('link[rel="canonical"]'), null, path)
    }
    const response = await fetch(`${base}/go?country=MX&operator=${encodeURIComponent('//evil.invalid')}&language=${locale}`, { redirect: 'manual' })
    assert.equal(response.status, 302)
    assert.equal(new URL(response.headers.get('location')).pathname, `/${locale}/operators`)
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  }
  assert.equal((await fetch(`${base}/dev/operators`)).status, 404)
  console.log(`Crawled ${paths.size} public/legal/demo URLs plus locale 404 and affiliate fallback probes.`)
  if (failures.length) console.error(failures.join('\n'))
  assert.equal(failures.length, 0, `${failures.length} content/SEO failures`)
} finally {
  if (server.exitCode === null) {
    const exited = once(server, 'exit')
    server.kill()
    await exited
  }
}
