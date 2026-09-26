// Read-only HTTP audit. Never submits URLs to an indexing service.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
const priorOnly = process.argv.includes('--production-existing')
const base = priorOnly ? 'https://www.playliva.com' : (process.env.THREE_GAME_QA_URL ?? 'http://127.0.0.1:3120')
const canonicalBase = 'https://www.playliva.com'
const newGames = ['skuptu-levanta', 'samba-drop', 'carnaval-gold']
const priorGames = ['liva-ginga', 'golaco', 'liva-raio', 'liva-21-brasil']
const segments = ['pt-br', 'en', 'es-mx'], report = [], failures = []
const get = path => fetch(`${base}${path}`, { redirect: 'manual' })
const sitemapResponse = await get('/sitemap.xml'), robotsResponse = await get('/robots.txt')
assert.equal(sitemapResponse.status, 200); assert.equal(robotsResponse.status, 200)
const sitemap = new JSDOM(await sitemapResponse.text(), { contentType: 'text/xml' }).window.document
const robots = await robotsResponse.text()
assert.ok(robots.includes(`${canonicalBase}/sitemap.xml`))
assert.doesNotMatch(robots, /^Disallow:\s*\/(?:play|pt-br|en|es-mx)?\/?\s*$/im)
for (const segment of segments) for (const slug of priorOnly ? priorGames : [...newGames, ...priorGames]) {
  const path = `/${segment}/play/${slug}`, url = canonicalBase + path
  try {
    const response = await get(path)
    assert.equal(response.status, 200, `${path}: canonical must return 200 directly`)
    assert.doesNotMatch(response.headers.get('x-robots-tag') ?? '', /noindex|nofollow/i)
    const doc = new JSDOM(await response.text()).window.document
    const meta = key => doc.querySelector(`meta[name="${key}"],meta[property="${key}"]`)?.getAttribute('content')
    assert.equal(doc.querySelector('link[rel="canonical"]')?.href, url)
    assert.equal(doc.querySelectorAll('h1').length, 1)
    assert.ok(doc.title.length > 15); assert.ok(meta('description')?.length > 70)
    assert.match(meta('robots') ?? '', /index/); assert.doesNotMatch(meta('robots') ?? '', /noindex|nofollow/)
    for (const lang of [...segments, 'x-default']) assert.equal(doc.querySelector(`link[hreflang="${lang}"]`)?.href, `${canonicalBase}/${lang === 'x-default' ? 'pt-br' : lang}/play/${slug}`)
    for (const key of ['og:title', 'og:description', 'og:image', 'twitter:title', 'twitter:description', 'twitter:image']) assert.ok(meta(key), `${path}: missing ${key}`)
    assert.equal(meta('og:url'), url); assert.equal(meta('twitter:card'), 'summary_large_image')
    const entries = [...sitemap.querySelectorAll('url')].filter(e => e.querySelector('loc')?.textContent === url)
    assert.equal(entries.length, 1, `${url}: exactly one sitemap entry`)
    const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent))
    assert.ok(schemas.some(s => s['@type'] === 'BreadcrumbList'))
    const article = doc.querySelector('[data-original-article]')?.textContent ?? ''
    assert.ok(article.length > 600, `${path}: useful visible copy and rules`)
    const image = new URL(meta('og:image'))
    const imageResponse = await get(image.pathname + image.search)
    assert.equal(imageResponse.status, 200, `${path}: working share image`)
    if (newGames.includes(slug)) {
      const game = schemas.find(s => s['@type'] === 'VideoGame')
      assert.equal(game?.url, url); assert.equal(game?.isAccessibleForFree, true)
      assert.equal(game?.name, doc.querySelector('h1').textContent)
      assert.ok(doc.querySelectorAll('[data-original-article] p').length >= 3)
      if (segment !== 'en') assert.doesNotMatch(article, /\b(?:Samba Meter|Wild|Scatter|How to play|Free spins|Credits per round)\b/i)
      for (const source of [`/${segment}/play`, `/${segment}/games`, `/${segment}/${slug === 'samba-drop' ? 'instant-games' : slug === 'skuptu-levanta' ? 'crash' : 'slots'}`]) {
        const sourceDoc = new JSDOM(await (await get(source)).text()).window.document
        assert.ok(sourceDoc.querySelector(`a[href="${path}"]`), `${source}: discoverable ${slug}`)
      }
    }
    report.push({ url, status: response.status, canonical: url, title: doc.title, h1: doc.querySelector('h1').textContent, description: meta('description'), robots: meta('robots'), hreflang: [...segments, 'x-default'], sitemap: true, image: image.href, schemas: schemas.map(s => s['@type']), articleCharacters: article.length })
    console.log(`PASS ${url}`)
  } catch (error) { failures.push({ url, error: error.message }); console.error(`FAIL ${url}: ${error.message}`) }
}
await mkdir('social/output/three-game', { recursive: true })
await writeFile(`social/output/three-game/${priorOnly ? 'production-existing' : 'local-all'}-seo.json`, JSON.stringify({ checkedAt: new Date().toISOString(), base, report, failures }, null, 2))
assert.deepEqual(failures, [])
