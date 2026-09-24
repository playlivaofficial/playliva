// Local production-build migration checks; no external navigation.
import { writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import assert from 'node:assert/strict'
const base = 'http://127.0.0.1:3115'
const results = []
for (const locale of ['en', 'pt-br', 'es-mx']) {
  const response = await fetch(`${base}/${locale}/play/embaixadinha?utm_source=qa&utm_campaign=ginga`, { redirect: 'manual' })
  assert.equal(response.status, 301)
  const target = new URL(response.headers.get('location'), base)
  assert.equal(target.pathname, `/${locale}/play/liva-ginga`)
  assert.equal(target.search, '?utm_source=qa&utm_campaign=ginga')
  const page = await fetch(`${base}/${locale}/play/liva-ginga`)
  assert.equal(page.status, 200)
  const dom = new JSDOM(await page.text()), doc = dom.window.document
  const canonical = doc.querySelector('[rel=canonical]').href
  assert.equal(canonical, `https://www.playliva.com/${locale}/play/liva-ginga`)
  assert.ok(doc.title.includes('Liva Ginga'))
  assert.ok(!doc.body.textContent.includes('Embaixadinha'))
  const hreflang = [...doc.querySelectorAll('link[hreflang]')].map(n => n.href)
  assert.ok(hreflang.length >= 3)
  assert.ok(hreflang.every(u => u.endsWith('/play/liva-ginga')))
  assert.ok(![...doc.querySelectorAll('a[href]')].some(a => a.href.includes('/play/embaixadinha')))
  for (const node of doc.querySelectorAll('script[type="application/ld+json"]')) assert.ok(!node.textContent.includes('/play/embaixadinha'))
  const og = doc.querySelector('meta[property="og:title"]')?.content
  const twitter = doc.querySelector('meta[name="twitter:title"]')?.content
  assert.ok(og.includes('Liva Ginga')); assert.ok(twitter.includes('Liva Ginga'))
  results.push({ locale, status: page.status, legacy: 301, canonical, title: doc.title, hreflang, og, twitter })
  dom.window.close()
}
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text()
assert.ok(!sitemap.includes('/play/embaixadinha'))
assert.equal((sitemap.match(/<loc>[^<]*\/play\/liva-ginga<\/loc>/g) || []).length, 3)
await writeFile('social/output/embaixadinha-qa/ginga-seo.json', JSON.stringify(results, null, 2))
console.log('Localized 301/query retention, 200, canonical, hreflang, titles, JSON-LD, links and sitemap: PASS')
