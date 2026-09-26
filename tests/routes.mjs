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
const { getOperator, CATEGORIES, GAMES, GAME_LISTS } = dataModule
import consentModule from '../lib/consent.ts'
import discoveryModule from '../lib/originals/discovery.ts'
import i18nModule from '../lib/i18n.ts'
import productModule from '../lib/product-discovery.ts'
import catalogModule from '../lib/catalog/index.ts'
import catalogCopyModule from '../lib/catalog/copy.ts'
import catalogQueryModule from '../lib/catalog/query.ts'
import brazilModule from '../lib/compliance/brazil.ts'
import rtpModule from '../lib/rtp.ts'
import promoModule from '../lib/affiliates/betsson-promo-config.ts'
const { originalsDiscoveryCopy, ISLAND_CRASH_POSTER } = discoveryModule
const { ANALYTICS_COOKIE } = consentModule

const trafficSprintPages = {
  '/pt-br/games/aviator': {
    h1: 'Aviator: como funciona o jogo',
    links: ['/pt-br/where-to-play/aviator', '/pt-br/games-like/aviator', '/pt-br/compare/aviator-vs-jetx', '/pt-br/compare/aviator-vs-spaceman', '/pt-br/crash'],
  },
  '/pt-br/where-to-play/aviator': {
    h1: 'Onde jogar Aviator no Brasil',
    links: ['/pt-br/games/aviator', '/pt-br/games-like/aviator', '/pt-br/compare/aviator-vs-jetx', '/pt-br/compare/aviator-vs-spaceman'],
  },
  '/pt-br/games-like/aviator': {
    h1: 'Jogos como Aviator: alternativas e diferenças',
    links: ['/pt-br/games/aviator', '/pt-br/compare/aviator-vs-jetx', '/pt-br/compare/aviator-vs-spaceman', '/pt-br/where-to-play/aviator', '/pt-br/crash'],
  },
  '/pt-br/compare/aviator-vs-jetx': {
    h1: 'Aviator vs JetX',
    links: ['/pt-br/games/aviator', '/pt-br/games/jetx', '/pt-br/games-like/aviator', '/pt-br/where-to-play/aviator', '/pt-br/crash'],
  },
  '/pt-br/compare/aviator-vs-spaceman': {
    h1: 'Aviator vs Spaceman',
    links: ['/pt-br/games/aviator', '/pt-br/games/spaceman', '/pt-br/games-like/aviator', '/pt-br/where-to-play/aviator', '/pt-br/crash'],
  },
  '/pt-br/crash': {
    h1: 'Jogos crash: conheça a categoria e seus formatos',
    links: ['/pt-br/games/aviator', '/pt-br/games/jetx', '/pt-br/games/spaceman', '/pt-br/games-like/aviator', '/pt-br/compare/aviator-vs-jetx', '/pt-br/compare/aviator-vs-spaceman', '/pt-br/best/crash-games', '/pt-br/best/best-crash-games-brazil', '/pt-br/play/crash'],
  },
  '/pt-br/best/crash-games': {
    h1: 'Como avaliar e escolher crash games',
    links: ['/pt-br/crash', '/pt-br/games/aviator', '/pt-br/games/jetx', '/pt-br/games/spaceman', '/pt-br/games-like/aviator', '/pt-br/compare/aviator-vs-jetx', '/pt-br/compare/aviator-vs-spaceman', '/pt-br/best/best-crash-games-brazil', '/pt-br/play/crash'],
  },
  '/pt-br/best/best-crash-games-brazil': {
    h1: 'Seleção editorial de crash games no Brasil',
    links: ['/pt-br/crash', '/pt-br/best/crash-games', '/pt-br/games/aviator', '/pt-br/games/jetx', '/pt-br/games/spaceman', '/pt-br/where-to-play/aviator'],
  },
  '/pt-br/slots': {
    h1: 'Jogos de slots: explore formatos e mecânicas',
    links: ['/pt-br/games/gates-of-olympus', '/pt-br/games/sweet-bonanza', '/pt-br/games/big-bass-bonanza', '/pt-br/games-like/gates-of-olympus', '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza', '/pt-br/providers/pragmatic-play', '/pt-br/best/best-slots-brazil'],
  },
  '/pt-br/games/gates-of-olympus': {
    h1: 'Gates of Olympus: como funciona o jogo',
    links: ['/pt-br/where-to-play/gates-of-olympus', '/pt-br/games-like/gates-of-olympus', '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza', '/pt-br/slots', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/where-to-play/gates-of-olympus': {
    h1: 'Onde jogar Gates of Olympus no Brasil',
    links: ['/pt-br/games/gates-of-olympus', '/pt-br/games-like/gates-of-olympus', '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza', '/pt-br/slots', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/games-like/gates-of-olympus': {
    h1: 'Jogos como Gates of Olympus: alternativas e diferenças',
    links: ['/pt-br/games/gates-of-olympus', '/pt-br/games/sweet-bonanza', '/pt-br/games/big-bass-bonanza', '/pt-br/where-to-play/gates-of-olympus', '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza', '/pt-br/slots', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza': {
    h1: 'Gates of Olympus vs Sweet Bonanza',
    links: ['/pt-br/games/gates-of-olympus', '/pt-br/games/sweet-bonanza', '/pt-br/where-to-play/gates-of-olympus', '/pt-br/where-to-play/sweet-bonanza', '/pt-br/games-like/gates-of-olympus', '/pt-br/slots', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/games/sweet-bonanza': {
    h1: 'Sweet Bonanza: como funciona o jogo',
    links: ['/pt-br/where-to-play/sweet-bonanza', '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza', '/pt-br/slots', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/where-to-play/sweet-bonanza': {
    h1: 'Onde jogar Sweet Bonanza no Brasil',
    links: ['/pt-br/games/sweet-bonanza', '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza', '/pt-br/slots', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/games/big-bass-bonanza': {
    h1: 'Big Bass Bonanza: como funciona o jogo',
    links: ['/pt-br/where-to-play/big-bass-bonanza', '/pt-br/slots', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/providers/pragmatic-play': {
    h1: 'Jogos da Pragmatic Play: catálogo e mecânicas',
    links: ['/pt-br/slots', '/pt-br/games/gates-of-olympus', '/pt-br/games/sweet-bonanza', '/pt-br/games/big-bass-bonanza', '/pt-br/games/sugar-rush'],
  },
  '/pt-br/best/best-slots-brazil': {
    h1: 'Seleção editorial de slots no Brasil',
    links: ['/pt-br/slots', '/pt-br/games/gates-of-olympus', '/pt-br/games/sweet-bonanza', '/pt-br/games/big-bass-bonanza', '/pt-br/where-to-play/gates-of-olympus', '/pt-br/where-to-play/sweet-bonanza', '/pt-br/where-to-play/big-bass-bonanza', '/pt-br/compare/gates-of-olympus-vs-sweet-bonanza', '/pt-br/providers/pragmatic-play'],
  },
  '/pt-br/live-casino': {
    h1: 'Jogos de cassino ao vivo: roleta, blackjack e game shows',
    links: ['/pt-br/games/crazy-time', '/pt-br/where-to-play/crazy-time', '/pt-br/games/lightning-roulette', '/pt-br/where-to-play/lightning-roulette', '/pt-br/games/blackjack-live', '/pt-br/games/dream-catcher', '/pt-br/games/monopoly-live', '/pt-br/compare/crazy-time-vs-lightning-roulette', '/pt-br/providers/evolution'],
  },
  '/pt-br/games/crazy-time': {
    h1: 'Crazy Time: como funciona o jogo ao vivo',
    links: ['/pt-br/where-to-play/crazy-time', '/pt-br/games-like/crazy-time', '/pt-br/compare/crazy-time-vs-lightning-roulette', '/pt-br/live-casino', '/pt-br/providers/evolution'],
  },
  '/pt-br/where-to-play/crazy-time': {
    h1: 'Onde jogar Crazy Time no Brasil',
    links: ['/pt-br/games/crazy-time', '/pt-br/games-like/crazy-time', '/pt-br/compare/crazy-time-vs-lightning-roulette', '/pt-br/live-casino', '/pt-br/providers/evolution'],
  },
  '/pt-br/games-like/crazy-time': {
    h1: 'Jogos como Crazy Time: alternativas e diferenças',
    links: ['/pt-br/games/crazy-time', '/pt-br/games/lightning-roulette', '/pt-br/games/dream-catcher', '/pt-br/games/monopoly-live', '/pt-br/live-casino', '/pt-br/providers/evolution'],
  },
  '/pt-br/compare/crazy-time-vs-lightning-roulette': {
    h1: 'Crazy Time vs Lightning Roulette',
    links: ['/pt-br/games/crazy-time', '/pt-br/games/lightning-roulette', '/pt-br/games-like/crazy-time', '/pt-br/live-casino', '/pt-br/providers/evolution'],
  },
  '/pt-br/games/lightning-roulette': {
    h1: 'Lightning Roulette: como funciona a roleta ao vivo',
    links: ['/pt-br/where-to-play/lightning-roulette', '/pt-br/compare/crazy-time-vs-lightning-roulette', '/pt-br/live-casino', '/pt-br/providers/evolution'],
  },
  '/pt-br/where-to-play/lightning-roulette': {
    h1: 'Onde jogar Lightning Roulette no Brasil',
    links: ['/pt-br/games/lightning-roulette', '/pt-br/compare/crazy-time-vs-lightning-roulette', '/pt-br/live-casino', '/pt-br/providers/evolution'],
  },
  '/pt-br/games/blackjack-live': {
    h1: 'Blackjack Live: como funciona o blackjack ao vivo',
    links: ['/pt-br/where-to-play/blackjack-live', '/pt-br/live-casino', '/pt-br/providers/evolution', '/pt-br/table-games', '/pt-br/play/blackjack'],
  },
  '/pt-br/where-to-play/blackjack-live': {
    h1: 'Onde jogar Blackjack Live no Brasil',
    links: ['/pt-br/games/blackjack-live', '/pt-br/live-casino', '/pt-br/providers/evolution', '/pt-br/table-games', '/pt-br/play/blackjack'],
  },
  '/pt-br/games/dream-catcher': {
    h1: 'Dream Catcher',
    links: ['/pt-br/live-casino', '/pt-br/games/crazy-time', '/pt-br/games-like/crazy-time', '/pt-br/compare/crazy-time-vs-lightning-roulette', '/pt-br/providers/evolution'],
  },
  '/pt-br/games/monopoly-live': {
    h1: 'MONOPOLY Live',
    links: ['/pt-br/live-casino', '/pt-br/games/crazy-time', '/pt-br/games-like/crazy-time', '/pt-br/compare/crazy-time-vs-lightning-roulette', '/pt-br/providers/evolution'],
  },
  '/pt-br/providers/evolution': {
    h1: 'Jogos da Evolution: cassino ao vivo e game shows',
    links: ['/pt-br/live-casino', '/pt-br/games/crazy-time', '/pt-br/games/lightning-roulette', '/pt-br/games/blackjack-live', '/pt-br/games/dream-catcher', '/pt-br/games/monopoly-live', '/pt-br/games-like/crazy-time', '/pt-br/compare/crazy-time-vs-lightning-roulette'],
  },
}

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
const titlesByLocale = new Map()
let ptPublicCount = 0
let ptOgImageCount = 0
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
  for (const game of GAMES) paths.add(`/${locale}/where-to-play/${game.slug}`)
  for (const list of GAME_LISTS) paths.add(`/${locale}/best/${list.slug}`)
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
    for (const [game, category] of [['blackjack-live', 'table-games'], ['blackjack-live', 'live-casino'], ['lightning-roulette', 'live-casino']]) {
      const query = new URLSearchParams({ operator: partner.slug, country: 'BR', game, category })
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
    for (const placement of ['homepage_banner', 'originals_generic_operator', 'play_hub_banner', 'game_detail_play_real']) {
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
    const commercialBaseline = segment === 'pt-br'
    // Dynamic Original fallbacks stay non-heading while the streamed shell
    // owns the route's single semantic H1.
    assert.equal(doc.querySelectorAll('h1').length, 1, `${path}: one semantic page heading`)
    assert.ok(doc.querySelector('meta[name="description"]')?.content.trim().length > 10, `${path}: meaningful description`)
    const trafficPage = trafficSprintPages[path]
    if (trafficPage) {
      assert.equal(doc.querySelector('h1')?.textContent.trim(), trafficPage.h1, `${path}: intent-specific H1`)
      assert.ok(doc.querySelector('meta[property="og:image"]'), `${path}: relevant social image`)
      const trafficRobots = [...doc.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')].map((meta) => meta.content)
      assert.ok(trafficRobots.length && trafficRobots.every((value) => !value.includes('noindex') && value.includes('follow')), `${path}: index, follow`)
      for (const href of trafficPage.links) {
        assert.ok(doc.querySelector(`main a[href="${href}"]`), `${path}: internal link ${href}`)
      }
    }
    if (publicPaths.includes(path)) {
      const key = `${segment}:${doc.title}`
      if (titlesByLocale.has(key)) failures.push(`${path}: duplicate title with ${titlesByLocale.get(key)}`)
      titlesByLocale.set(key, path)
      if (segment === 'pt-br') {
        ptPublicCount += 1
        if (doc.querySelector('meta[property="og:image"]')) ptOgImageCount += 1
      }
    }
    for (const link of doc.querySelectorAll('a[href^="/go?"]')) {
      const ad = link.closest('[data-betting-ad]')
      assert.ok(ad, `${path}: every operator action belongs to a warned ad`)
      assert.equal(ad.querySelectorAll('[data-brazil-ad-warning]').length, 1, `${path}: one central warning per ad`)
      assert.ok(ad.textContent.includes(brazilModule.BRAZIL_AD_RULES.warnings[0]), `${path}: statutory warning wording`)
      assert.ok(ad.textContent.includes('18+'), `${path}: age warning`)
      assert.equal(ad.getAttribute('data-evidence-state'), 'pending', `${path}: cached ad evidence must be rechecked before display`)
    }
    if (routePath.startsWith('/games/')) {
      const slug = routePath.split('/').pop()
      assert.equal(doc.querySelectorAll('[data-rtp-fact]').length, rtpModule.RTP_EVIDENCE[slug] ? 1 : 0, `${path}: sourced RTP only`)
      assert.ok(doc.querySelector('[data-editorial-byline]'), `${path}: editorial attribution`)
    }
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
        const playBanner = doc.querySelector('[data-betsson-banner="play"]')
        assert.equal(Boolean(playBanner), commercialBaseline, `${path}: crawl-safe play sponsor baseline`)
        if (playBanner) {
          const playLink = playBanner.querySelector('a[href^="/go?"]')
          assert.ok(playLink)
          assert.equal(new URL(playLink.href, base).searchParams.get('placement'), 'play_hub_banner')
          assert.equal(new URL(playLink.href, base).searchParams.get('page'), 'play')
          assert.equal(new URL(playLink.href, base).searchParams.get('game'), null)
        }
        assert.doesNotMatch(doc.querySelector('[data-play-hub] [data-filter]')?.textContent ?? '', /Aviator|Coming soon/i)
      } else {
        assert.ok(doc.querySelector(`[data-originals-section="${routePath === '' ? 'home' : 'category'}"]`))
        if (routePath === '') {
          assert.equal(doc.querySelector('[data-hero-play-free]')?.getAttribute('href'), `/${segment}/play`)
          assert.equal(doc.querySelector('[data-hero-explore]')?.getAttribute('href'), `/${segment}/games`)
          assert.ok(doc.querySelector('#provider-games [data-provider-card]'))
          assert.ok(doc.querySelector('[data-discovery-explainer]'))
          const banner = doc.querySelector('[data-betsson-banner="homepage"]')
          assert.equal(Boolean(banner), commercialBaseline, `${path}: crawl-safe homepage sponsor baseline`)
          if (banner) {
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
          if (segment === 'pt-br') {
            assert.doesNotMatch(banner.textContent, /Sponsored|Explore Betsson|Visit Betsson/)
            assert.match(banner.textContent, /Patrocinado/)
            assert.match(banner.textContent, /Explorar Betsson/)
          }
          assert.ok(banner.getAttribute('data-creative-language') === 'neutral' || banner.getAttribute('data-creative-language') === localeModule.segmentToLocale(segment))
          if (segment !== 'pt-br') assert.notEqual(banner.getAttribute('data-creative-language'), 'pt-BR')
          const bannerGo = await fetch(base + bannerLink.getAttribute('href'), { redirect: 'manual' })
          assert.equal(bannerGo.status, 302)
          // While the central campaign is live the sponsor banner links to its official tracked offer link.
          const promoLive = promoModule.isBetssonPromoLive()
          assert.equal(bannerQuery.get('offer'), promoLive ? promoModule.BETSSON_PROMO_OFFER_ID : null)
          assert.equal(bannerGo.headers.get('location'), promoLive ? promoModule.BETSSON_PROMO.affiliateUrl : partner.affiliateUrl.BR)
          assert.ok(brazilModule.isAuthorizedBrazilDestination(partner, bannerGo.headers.get('location')))
          if (promoLive) assert.ok(banner.textContent.includes(promoModule.BETSSON_PROMO.headline))
          }
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
    }
    if (['', '/play', '/live-casino'].includes(routePath)) {
      const blackjack = doc.querySelectorAll('[data-original-card="blackjack"]')
      assert.equal(blackjack.length, 1, `${path}: one implemented Blackjack card`)
      for (const link of blackjack[0].querySelectorAll('a')) assert.equal(link.getAttribute('href'), `/${segment}/play/blackjack`)
      if (routePath === '/live-casino') {
        assert.ok(doc.querySelector('[data-originals-section="live-casino"]'))
        assert.ok(blackjack[0].compareDocumentPosition(doc.querySelector('main a[href*="/games/"]')) & 4)
      } else assert.deepEqual([...doc.querySelectorAll('[data-original-card]')].map(e => e.getAttribute('data-original-card')), routePath === '/play' ? ['samba-drop', 'skuptu-levanta', 'carnaval-gold', 'island-crash', 'liva-ginga', 'capybara-gold', 'golaco', 'blackjack', 'roulette', 'mines', 'liva-raio', 'liva-21-brasil'] : ['island-crash', 'liva-ginga', 'skuptu-levanta', 'capybara-gold', 'golaco', 'blackjack', 'roulette', 'mines'])
    }
    for (const [slug, surfaces] of [['liva-ginga', ['', '/play', '/crash']], ['golaco', ['', '/play', '/slots']]]) {
      if (!surfaces.includes(routePath)) continue
      const football = doc.querySelectorAll(`[data-original-card="${slug}"]`)
      assert.equal(football.length, 1, `${path}: one ${slug} card`)
      for (const link of football[0].querySelectorAll('a')) assert.equal(link.getAttribute('href'), `/${segment}/play/${slug}`)
      assert.ok(football[0].textContent.includes(copy.newBadge) && football[0].textContent.includes(copy.virtualCredits))
    }
    if (routePath === '/play/liva-ginga' || routePath === '/play/golaco') {
      assert.ok(doc.querySelector(routePath === '/play/golaco' ? '[data-golaco-game]' : '[data-liva-ginga-game]'), `${path}: real game shell`)
      if (routePath === '/play/golaco') {
        assert.equal(doc.querySelectorAll('[data-symbol]').length, 15, `${path}: five reels by three rows`)
        assert.ok(doc.querySelector('[data-slot-spin]'))
      } else assert.ok(doc.querySelector('[data-phase="ready"]'))
      assert.equal(doc.querySelectorAll('h1').length, 1, `${path}: one H1`)
      const article = doc.querySelector('[data-original-article]')
      assert.ok(article?.querySelector('ol, ul') && article.textContent.length > 600, `${path}: visible rules and description`)
      const crumbs = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(e => e.textContent).find(t => t.includes('BreadcrumbList'))
      assert.ok(crumbs?.includes(`/${segment}/play"`) && crumbs.includes(routePath === '/play/golaco' ? 'Liva Golaço' : 'Liva Ginga'), `${path}: breadcrumb structured data`)
      assert.ok(doc.querySelector(`link[rel="alternate"][hreflang="x-default"]`), `${path}: hreflang`)
      assert.equal(doc.querySelector('nav.fixed'), null, `${path}: controls unobstructed by mobile nav`)
      assert.doesNotMatch(doc.querySelector('main')?.textContent ?? '', /Nike|Adidas|CBF|FIFA|Neymar|Pel[ée]\b/, `${path}: no protected marks`)
    }
    if (routePath === '/play/blackjack') {
      assert.ok(doc.querySelector('[data-blackjack-game]'), `${path}: real blackjack shell`)
      assert.ok(doc.querySelector('[data-blackjack-deal]'))
      assert.equal(doc.querySelector('nav.fixed'), null)
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
    }
    if (['/play/crash', '/play/liva-ginga', '/play/capybara-gold', '/play/golaco', '/play/blackjack', '/play/roulette', '/play/mines', '/play/liva-raio', '/play/liva-21-brasil'].includes(routePath)) {
      const viewport = doc.querySelector('[data-game-viewport]')
      const controls = doc.querySelector('[data-game-controls]')
      const unit = doc.querySelector('[data-game-unit]')
      const banner = doc.querySelector('[data-betsson-banner="originals"]')
      assert.ok(viewport && controls && unit, `${path}: Originals shell landmarks`)
      assert.ok(viewport.compareDocumentPosition(controls) & 4, `${path}: viewport precedes controls`)
      assert.equal(doc.querySelector('[data-operator-cta="play-real"]'), null, `${path}: no Play Real CTA on Original gameplay`)
      assert.equal(Boolean(banner), commercialBaseline, `${path}: crawl-safe Originals sponsor baseline`)
      if (banner) {
        assert.equal(banner.getAttribute('data-banner-layout'), 'compact-header', path)
        assert.ok(banner.closest('[data-originals-sponsor], [data-sponsor-slot="originals-header"]'), `${path}: banner attached to header`)
        assert.ok(banner.compareDocumentPosition(viewport) & 4, `${path}: header banner precedes viewport`)
        const go = banner.querySelector('a[href^="/go?"]')
        assert.ok(go, `${path}: /go CTA`)
        assert.equal(new URL(go.href, base).searchParams.get('placement'), 'originals_header')
        assert.equal(new URL(go.href, base).searchParams.get('page'), 'play')
        assert.doesNotMatch(banner.innerHTML, /https?:\/\/(?:www\.)?betsson/i)
        assert.ok(banner.querySelector('[data-brazil-ad-warning]'))
        assert.ok(banner.textContent.includes('18+'))
      }
      assert.equal(unit.querySelector('[data-operator-cta], [data-betsson-banner], a[href^="/go"]'), null, `${path}: no commercial inside game unit`)
    }
    if (routePath !== '/play/crash') {
      for (const script of doc.querySelectorAll('script[src], link[rel="modulepreload"]')) {
        const url = script.getAttribute('src') ?? script.getAttribute('href')
        assert.ok(!gameChunks.some(name => url?.includes(name)), `${path}: game runtime leaks into ordinary page`)
      }
    } else {
      assert.doesNotMatch(doc.querySelector('main')?.textContent ?? '', /JetX|Aviator|SmartSoft|SPRIBE|Robinson Crusoe|\bFriday\b/i)
      assert.ok(doc.querySelector('[data-phase="ready"]'), `${path}: real game shell`)
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
    const marketScoped = routePath.startsWith('/where-to-play/') || GAME_LISTS.some((list) => routePath === `/best/${list.slug}`)
    for (const alternateSegment of LOCALE_SEGMENTS) {
      const expected = marketScoped ? alternateSegment === segment && publicPaths.includes(path) : true
      assert.equal(Boolean(doc.querySelector(`link[hreflang="${alternateSegment}"]`)), expected, `${path}: hreflang ${alternateSegment}`)
      if (expected) assert.equal(doc.querySelector(`link[hreflang="${alternateSegment}"]`)?.href, `${SITE_URL}/${alternateSegment}${routePath}`, `${path}: hreflang URL ${alternateSegment}`)
    }
    const expectDefault = !marketScoped || routePath.startsWith('/where-to-play/') && segment === 'pt-br' && publicPaths.includes(path)
    assert.equal(Boolean(doc.querySelector('link[hreflang="x-default"]')), expectDefault, `${path}: x-default presence`)
    if (expectDefault) assert.equal(doc.querySelector('link[hreflang="x-default"]')?.href, `${SITE_URL}/pt-br${routePath}`, `${path}: x-default`)
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
    const schemaTypes = new Map()
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const data = JSON.parse(script.textContent)
      assert.equal(data['@context'], 'https://schema.org', `${path}: schema context`)
      const newOriginal = ['/play/samba-drop', '/play/skuptu-levanta', '/play/carnaval-gold'].includes(routePath)
      assert.ok(['WebSite', 'Organization', 'BreadcrumbList', ...(newOriginal ? ['VideoGame'] : [])].includes(data['@type']), `${path}: schema must have an audited visible use`)
      if (data['@type'] === 'VideoGame') {
        assert.equal(data.name, doc.querySelector('h1')?.textContent, `${path}: game schema names the visible game`)
        assert.equal(data.url, `${SITE_URL}${path}`, `${path}: game schema is canonical`)
        assert.equal(data.description, doc.querySelector('meta[name="description"]')?.content)
        assert.equal(data.image, doc.querySelector('meta[property="og:image"]')?.content)
        assert.equal(data.inLanguage, localeModule.segmentToLocale(segment))
        assert.equal(data.isAccessibleForFree, true)
        assert.equal(data.applicationCategory, 'GameApplication')
      }
      assert.ok(!('aggregateRating' in data) && !('review' in data), `${path}: no invented ratings/reviews`)
      schemaTypes.set(data['@type'], (schemaTypes.get(data['@type']) ?? 0) + 1)
      if (data['@type'] === 'BreadcrumbList') for (const item of data.itemListElement) {
        if (item.item && !item.item.startsWith(`${SITE_URL}/${path.split('/')[1]}`)) failures.push(`${path}: unlocalized breadcrumb ${item.item}`)
      }
    }
    assert.equal(schemaTypes.get('WebSite'), 1, `${path}: one WebSite entity`)
    assert.equal(schemaTypes.get('Organization'), 1, `${path}: one Organization entity`)
    assert.ok((schemaTypes.get('BreadcrumbList') ?? 0) <= 1, `${path}: no duplicate breadcrumbs`)
    assert.ok((schemaTypes.get('VideoGame') ?? 0) <= 1, `${path}: no duplicate game entity`)
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
      assert.equal(doc.querySelector('main iframe, main a[href*="/where-to-play/"]'), null)
      const playReal = doc.querySelector('[data-betsson-game-cta] a[href^="/go"]')
      assert.equal(Boolean(playReal), commercialBaseline, `${path}: crawl-safe early Betsson CTA`)
      if (playReal) {
        assert.equal(new URL(playReal.href, base).searchParams.get('game'), null)
        assert.doesNotMatch(playReal.textContent, /Play .+ at Betsson/i)
      }
      assert.doesNotMatch(doc.body.textContent, /This game may not be available at Betsson/i)
      assert.equal(Boolean(doc.querySelector('[data-betsson-banner="game"]')), commercialBaseline)
      assert.ok(doc.querySelector('main').textContent.includes(c.evidence))
      assert.equal(doc.querySelector('meta[name="description"]').content, game.content[locale].summary)
    }
    if (doc.querySelector('[data-catalog-explorer]')) assert.ok(doc.querySelectorAll('[data-catalog-results] > a').length <= 12)
    if (routePath.startsWith('/games/') && doc.querySelector('[data-provider-detail]')) {
      assert.ok(doc.querySelector('[data-provider-hero-art]'), `${path}: provider artwork remains part of identity`)
      for (const anchor of doc.querySelectorAll('nav a[href^="#"]')) assert.ok(doc.querySelector(anchor.getAttribute('href')), `${path}: guide anchor target`)
      const playReal = doc.querySelector('[data-betsson-game-cta] a[href^="/go"]')
      assert.equal(Boolean(playReal), commercialBaseline, `${path}: crawl-safe early Betsson CTA`)
      assert.equal(Boolean(doc.querySelector('[data-betsson-banner="game"]')), commercialBaseline)
    }
    const bannerByRoute = {
      '': 'homepage',
      '/play': 'play',
      '/games': 'games',
      '/slots': 'slots',
      '/crash': 'crash',
      '/live-casino': 'live-casino',
      '/instant-games': 'instant-games',
      '/table-games': 'table-games',
      '/offers': 'offers',
      '/operators': 'operators',
      '/providers': 'providers',
    }
    if (bannerByRoute[routePath]) {
      assert.equal(Boolean(doc.querySelector(`[data-betsson-banner="${bannerByRoute[routePath]}"]`)), commercialBaseline, `${path}: crawl-safe Betsson banner`)
    }
    if (routePath.startsWith('/providers/') && routePath !== '/providers') {
      assert.equal(Boolean(doc.querySelector('[data-betsson-banner="provider"]')), commercialBaseline, `${path}: provider Betsson banner`)
    }
    if (routePath.startsWith('/games-like/')) {
      assert.equal(Boolean(doc.querySelector('[data-betsson-banner="games-like"]')), commercialBaseline, `${path}: games-like Betsson banner`)
    }
    if (routePath.startsWith('/compare/')) {
      assert.equal(Boolean(doc.querySelector('[data-betsson-banner="comparison"]')), commercialBaseline, `${path}: comparison Betsson banner`)
    }
    if (routePath.startsWith('/best/')) {
      assert.equal(Boolean(doc.querySelector('[data-betsson-banner="best-list"]')), commercialBaseline, `${path}: best-list Betsson banner`)
    }
    if (routePath === '/offers') {
      assert.ok(doc.querySelector('[data-offers-sponsored]'))
      assert.ok(doc.querySelector('[data-offers-verified]'))
      assert.match(doc.querySelector('[data-offers-sponsored]')?.textContent ?? '', /Sponsored Partner|Parceiro patrocinado|Socio patrocinado/)
    }
    assert.equal(doc.querySelectorAll('[data-betsson-banner] h2').length, 0, `${path}: sponsor copy stays out of heading outline`)
    if (['/terms', '/privacy-policy', '/affiliate-disclosure', '/responsible-gaming', '/cookie-policy'].includes(routePath)) {
      assert.equal(doc.querySelector('[data-betsson-banner], [data-betsson-game-cta]'), null, `${path}: no commercial banner`)
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
      assert.equal(doc.querySelector('[data-betsson-banner], [data-betsson-game-cta]'), null, `${path}: no commercial banner`)
    }
    const response = await fetch(`${base}/go?country=MX&operator=${encodeURIComponent('//evil.invalid')}&language=${locale}`, { redirect: 'manual' })
    assert.equal(response.status, 302)
    assert.equal(new URL(response.headers.get('location')).pathname, `/${locale}/operators`)
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
  }
  assert.equal((await fetch(`${base}/dev/operators`)).status, 404)
  console.log(`Crawled ${paths.size} public/legal/demo URLs plus locale 404 and affiliate fallback probes. PT-BR OG coverage: ${ptOgImageCount}/${ptPublicCount}.`)
  if (failures.length) console.error(failures.join('\n'))
  assert.equal(failures.length, 0, `${failures.length} content/SEO failures`)
} finally {
  if (server.exitCode === null) {
    const exited = once(server, 'exit')
    server.kill()
    await exited
  }
}
