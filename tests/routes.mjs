// Production HTTP/content regression crawl. Starts only a local server and
// never follows affiliate redirects. Run after pnpm build.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import assert from 'node:assert/strict'
import { once } from 'node:events'
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
const { getOperator } = dataModule
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
for (const locale of LOCALE_SEGMENTS) {
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
  const partner = getOperator('betsson-group-affiliates')
  for (const consent of [undefined, 'denied', 'granted']) {
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
    const robots = [...doc.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')].map((meta) => meta.content)
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
  for (const locale of LOCALE_SEGMENTS) {
    for (const path of [`/${locale}/missing-page`, `/${locale}/games/missing-game`, `/${locale}/operators/missing-operator`]) {
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
