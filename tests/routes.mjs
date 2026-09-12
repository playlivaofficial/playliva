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
  assert.doesNotMatch(await sitemapResponse.text(), /\/(?:en|pt-br|es-mx)\/sports(?:[\/<"])/, 'served sitemap excludes Sports archive URLs')
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
  }
  for (const path of paths) {
    const response = await fetch(base + path, { redirect: 'manual' })
    if (response.status !== 200) { failures.push(`${path}: HTTP ${response.status}`); continue }
    const dom = new JSDOM(await response.text())
    const doc = dom.window.document
    const canonical = doc.querySelector('link[rel="canonical"]')?.href
    if (canonical !== SITE_URL + path) failures.push(`${path}: canonical ${canonical}`)
    const routePath = path.replace(/^\/(en|pt-br|es-mx)/, '')
    if (routePath !== '/play/crash') {
      for (const script of doc.querySelectorAll('script[src], link[rel="modulepreload"]')) {
        const url = script.getAttribute('src') ?? script.getAttribute('href')
        assert.ok(!gameChunks.some(name => url?.includes(name)), `${path}: game runtime leaks into ordinary page`)
      }
    } else {
      assert.doesNotMatch(doc.querySelector('main')?.textContent ?? '', /JetX|Aviator|SmartSoft|SPRIBE|Robinson Crusoe|\bFriday\b/i)
      assert.ok(doc.querySelector('[data-phase="ready"]'), `${path}: real game shell`)
    }
    const sportsNav = doc.querySelector('header nav[aria-label="Primary"] a[href="https://livasports.com"]')
    assert.ok(sportsNav, `${path}: visible desktop Sports network entry`)
    assert.equal(sportsNav.getAttribute('target'), null, `${path}: same-tab Sports navigation`)
    if (routePath === '') {
      const cards = [...doc.querySelectorAll('#game-types a')]
      assert.equal(cards.length, 4, `${path}: preserve four-card homepage structure`)
      assert.deepEqual(cards.map(card => card.getAttribute('href')), [
        `${path}/crash`, `${path}/slots`, `${path}/live-casino`, 'https://livasports.com',
      ], `${path}: homepage category and network destinations`)
      assert.equal(cards[3].getAttribute('target'), null)
      assert.ok(cards[3].textContent.includes('LivaSports'), `${path}: network destination is explicit`)
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
      const expected = GAMES.filter(g => g.category === category.slug).map(g => g.slug)
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
    if (path.includes('blackjack-live') && doc.querySelector('img[src*="blackjack-live"]')) failures.push(`${path}: mismatched artwork`)
    const metadataText = [...doc.querySelectorAll('meta[name="description"], img[alt]')].map((node) => node.content ?? node.alt).join(' ')
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
    for (const path of [`/${locale}/missing-page`, `/${locale}/games/missing-game`, `/${locale}/operators/missing-operator`,
      `/${locale}/sports/missing-sport`,
      ...['slots', 'blackjack', 'roulette', 'mines', 'plinko', 'test-only'].map(slug => `/${locale}/play/${slug}`)]) {
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
