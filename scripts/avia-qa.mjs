// Read-only SEO checks plus isolated localhost API security/idempotency checks.
// Never creates production wagers, affiliate clicks or indexing requests.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
const base = process.env.AVIA_QA_URL ?? 'http://127.0.0.1:3133'
const canonical = 'https://www.playliva.com', slug = 'avia-de-janeiro'
const get = path => fetch(base + path, { redirect: 'manual' })
const parse = html => new JSDOM(html).window.document
const sitemap = await (await get('/sitemap.xml')).text(), rows = []
for (const locale of ['pt-br', 'en', 'es-mx']) {
  const path = `/${locale}/play/${slug}`, url = canonical + path
  const started = performance.now(), response = await get(path), html = await response.text()
  const ms = Math.round(performance.now() - started), doc = parse(html)
  const meta = key => doc.querySelector(`meta[name="${key}"],meta[property="${key}"]`)?.content
  assert.equal(response.status, 200)
  assert.doesNotMatch(response.headers.get('x-robots-tag') ?? '', /noindex|nofollow/)
  assert.equal(doc.querySelector('link[rel=canonical]')?.href, url)
  assert.equal(doc.querySelectorAll('h1').length, 1)
  assert.equal(doc.querySelector('h1').textContent, 'Liva Skyline')
  assert.doesNotMatch(meta('robots') ?? '', /noindex|nofollow/)
  assert.ok(meta('description')?.length > 70)
  assert.equal(meta('og:url'), url)
  for (const key of ['og:title', 'og:description', 'og:image', 'twitter:image']) assert.ok(meta(key))
  for (const lang of ['pt-br', 'en', 'es-mx', 'x-default']) assert.equal(doc.querySelector(`link[hreflang="${lang}"]`)?.href, `${canonical}/${lang === 'x-default' ? 'pt-br' : lang}/play/${slug}`)
  assert.equal(sitemap.split(`<loc>${url}</loc>`).length - 1, 1)
  const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(n => JSON.parse(n.textContent))
  const game = schemas.find(s => s['@type'] === 'VideoGame')
  assert.equal(game?.url, url); assert.equal(game?.isAccessibleForFree, true)
  assert.equal(game.aggregateRating, undefined)
  const crumbs = schemas.find(s => s['@type'] === 'BreadcrumbList')
  assert.equal(crumbs?.itemListElement.at(-1)?.name, 'Liva Skyline')
  assert.equal(crumbs.itemListElement[0].item, `${canonical}/${locale}/play`)
  // Shared breadcrumbs omit the optional URL on the current-page item.
  assert.ok(crumbs.itemListElement.every(row => !row.item || row.item.startsWith(`${canonical}/${locale}`)))
  assert.ok(doc.querySelector('[data-original-article]')?.textContent.length > 1000)
  for (const source of [`/${locale}/play`, `/${locale}/games`, `/${locale}/crash`]) {
    assert.ok(parse(await (await get(source)).text()).querySelector(`a[href="${path}"]`), `${source}: inbound link`)
  }
  const image = await get(new URL(meta('og:image')).pathname)
  assert.equal(image.status, 200)
  rows.push({ path, status: 200, canonical: url, title: doc.title, htmlBytes: Buffer.byteLength(html), localResponseMs: ms, imageBytes: (await image.arrayBuffer()).byteLength, seo: 'pass' })
}
let api = 'not run: public audit only'
if (['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
  const post = (body, cookie = '', origin = base) => fetch(base + '/api/originals/avia', { method: 'POST', headers: { 'Content-Type': 'application/json', origin, cookie }, body })
  assert.equal((await post('{}', '', 'https://example.invalid')).status, 403)
  assert.equal((await post('{')).status, 400)
  assert.equal((await post('{"type":"cashout"}')).status, 400)
  assert.equal((await post(JSON.stringify({ type: 'cashout', roundId: 'invalid' }), 'playliva_avia_guest=invalid')).status, 409)
  const response = await post('{"type":"state"}'), value = await response.json()
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/)
  assert.match(response.headers.get('x-robots-tag'), /noindex/)
  const cookieHeader = response.headers.get('set-cookie')
  assert.match(cookieHeader, /HttpOnly/i); assert.match(cookieHeader, /SameSite=strict/i)
  const cookie = cookieHeader.split(';')[0]
  assert.equal(value.view.point, undefined); assert.equal(value.view.crashAt, undefined)
  const body = JSON.stringify({ type: 'bet', roundId: value.view.id, stake: 100, auto: 150 })
  const replies = await Promise.all(Array.from({ length: 8 }, async () => (await post(body, cookie)).json()))
  assert.ok(replies.every(r => r.view.id === value.view.id && r.view.sequence === 1 && r.view.receipts.length === 1))
  const restored = await (await post('{"type":"state"}', cookie)).json()
  assert.equal(restored.view.id, value.view.id); assert.equal(restored.view.sequence, 1)
  api = 'pass: cross-origin, malformed JSON, expired cookie, hidden outcome, private cookie, concurrent bet, reload'
}
await mkdir('.local/avia-qa', { recursive: true })
await writeFile('.local/avia-qa/seo-api.json', JSON.stringify({ base, checkedAt: new Date().toISOString(), rows, api }, null, 2))
console.log(JSON.stringify({ rows, api }, null, 2))
