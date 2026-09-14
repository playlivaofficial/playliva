import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { registerHooks } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import country from '../components/country-context.tsx'
import catalog from '../lib/catalog/index.ts'
import integrity from '../lib/catalog/validate.ts'
import editorial from '../lib/catalog/editorial.ts'
import query from '../lib/catalog/query.ts'
import metadata from '../lib/catalog/metadata.ts'
import paths from '../lib/catalog/paths.ts'
import data from '../lib/data.ts'
import sitemapModule from '../app/sitemap.ts'
import seo from '../lib/seo.ts'
import copy from '../lib/catalog/copy.ts'
const { REFERENCE_GAMES, PROVIDERS, catalogSummaries } = catalog
const locales = [['en', 'en'], ['pt-BR', 'pt-br'], ['es-MX', 'es-mx']]
const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = {}' }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const views = unwrap(await import('../components/catalog/reference-views.tsx'))
const { CatalogExplorer } = unwrap(await import('../components/catalog/catalog-explorer.tsx'))
hooks.deregister()
function render(locale, segment, child) {
  return new JSDOM(renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: `/${segment}` },
      React.createElement(country.CountryProvider, { initialLocale: locale }, child)))))
}

test('M11: 31 sourced reference games are internally consistent and remain separate from commercial data', () => {
  assert.equal(REFERENCE_GAMES.length, 31); assert.equal(PROVIDERS.length, 5)
  assert.deepEqual(integrity.validateCatalog(), [])
  assert.equal(data.GAMES.length, 11)
  for (const game of REFERENCE_GAMES) {
    assert.equal(data.getGame(game.slug), undefined)
    assert.equal(game.availability.status, 'unverified')
    assert.notEqual(game.artwork.status, 'fallback')
    assert.equal(game.artwork.rightsStatus, 'approved')
    if (game.artwork.status === 'fallback') throw new Error('expected sourced artwork')
    assert.equal(game.artwork.assetPath, `/catalog/covers/${game.slug}.webp`)
    assert.ok(game.sources.every(source => source.startsWith('https://')))
  }
})

for (const [label, mutate, expected] of [
  ['duplicate IDs', games => { games[1].id = games[0].id }, /Duplicate game IDs/],
  ['duplicate slugs', games => { games[1].slug = games[0].slug }, /Duplicate game slugs/],
  ['invalid provider', games => { games[0].providerId = 'invented' }, /invalid provider/],
  ['invalid category', games => { games[0].category = 'sports' }, /invalid category/],
  ['missing artwork', games => { delete games[0].artwork }, /invalid artwork/],
  ['unapproved image', games => { games[0].artwork.sourceUrl = 'https://unlicensed.invalid/art.png' }, /invalid artwork/],
  ['missing locale', games => { delete games[0].content['pt-BR'] }, /missing pt-BR/],
  ['broken related link', games => { games[0].relatedSlugs[0] = 'missing' }, /invalid related reference/],
  ['broken editorial targets', games => { games.splice(games.findIndex(g => g.slug === 'sugar-rush'), 1) }, /broken (comparison|Games Like)/],
  ['invented availability', games => { games[0].availability.status = 'verified' }, /unauthorized availability/],
]) test(`M11: integrity rejects ${label}`, () => {
  const games = structuredClone(REFERENCE_GAMES); mutate(games)
  assert.match(integrity.validateCatalog(games).join('\n'), expected)
})

test('M11: all three locales contain original copy, catalog artwork and meaningful reference content for every new game', () => {
  for (const [locale, segment] of locales) for (const game of REFERENCE_GAMES) {
    const dom = render(locale, segment, React.createElement(views.ReferenceGameView, { game, locale })), doc = dom.window.document
    assert.equal(doc.querySelector('h1').textContent, game.title)
    for (const field of ['summary', 'overview', 'howItWorks']) assert.ok(doc.body.textContent.includes(game.content[locale][field]))
    assert.ok(doc.querySelectorAll('h2').length >= 5)
    assert.ok(doc.querySelector('[data-artwork-status="sourced"]'))
    assert.ok(game.artwork.status !== 'fallback' && doc.querySelector(`img[src="${game.artwork.assetPath}"]`))
    assert.equal(doc.querySelector('a[href*="/where-to-play/"], iframe, [data-game-shell]'), null)
    assert.ok(doc.querySelector('[data-betsson-game-cta] a[href^="/go"]'))
    assert.ok(doc.querySelector('[data-betsson-banner="game"]'))
    assert.doesNotMatch(doc.body.textContent, /Play Fruit Party at Betsson|Play .+ Splash at Betsson|This game may not be available at Betsson/i)
    assert.ok(doc.querySelector(`a[href="/${segment}/providers/${game.providerId}"]`))
    assert.ok(doc.querySelector(`a[href="/${segment}/${game.category}"]`))
    assert.ok(doc.querySelector('[data-catalog-evidence]'))
    assert.doesNotMatch(doc.body.textContent, /\uFFFD|guaranteed profit|ganho garantido|ganancia garantizada/i)
    if (locale !== 'en') for (const field of ['summary', 'overview', 'howItWorks']) assert.notEqual(game.content[locale][field], game.content.en[field])
    dom.window.close()
  }
})

test('M11: lightweight projections have only one locale and omit full editorial/commercial records', () => {
  for (const [locale] of locales) {
    const summaries = catalogSummaries(locale)
    assert.equal(summaries.length, 42)
    for (const game of summaries) {
      for (const key of ['content', 'sources', 'countries', 'affiliateUrl', 'operatorEvidence', 'relatedSlugs']) assert.equal(key in game, false)
      if (game.reference) {
        assert.equal(game.image, `/catalog/covers/${game.slug}.webp`)
      }
      if (game.slug === 'blackjack-live') {
        assert.equal(game.reference, false)
        assert.equal(game.image, '/games/blackjack-live.webp')
      }
    }
    assert.ok(JSON.stringify(summaries).length < 45_000, 'single-language directory payload budget')
  }
})

test('M11: search handles titles, provider aliases, categories, accents, whitespace and combined filters', () => {
  const entries = catalogSummaries('pt-BR')
  assert.equal(query.filterCatalog(entries, ' Aviator ')[0].slug, 'aviator')
  assert.ok(query.filterCatalog(entries, 'Pragmatic').length >= 14)
  assert.ok(query.filterCatalog(entries, 'Roulette').some(g => g.slug === 'immersive-roulette'))
  assert.ok(query.filterCatalog(entries, 'Blackjack').some(g => g.slug === 'infinite-blackjack'))
  assert.equal(query.filterCatalog(entries, 'instantaneos').length, 4)
  assert.equal(query.filterCatalog(entries, 'sugar   rush', 'slots', 'pragmatic-play').length, 2)
  assert.equal(query.filterCatalog(entries, 'sugar', 'live-casino').length, 0)
  assert.equal(query.filterCatalog(entries, 'not-an-actual-game').length, 0)
  assert.ok(query.filterCatalog(entries, '', 'live-casino').some(g => g.slug === 'blackjack-live'))
  assert.ok(!query.filterCatalog(entries, '', 'table-games').some(g => g.slug === 'blackjack-live'))
})

test('M11: directory renders at most twelve cards with labelled filters and accessible pagination', () => {
  for (const [locale, segment] of locales) {
    const dom = render(locale, segment, React.createElement(CatalogExplorer, { entries: catalogSummaries(locale) })), doc = dom.window.document
    assert.equal(doc.querySelectorAll('[data-provider-card]').length, 12)
    assert.equal(doc.querySelectorAll('label').length, 3)
    assert.ok(doc.querySelector('[role="status"]').textContent.includes('42'))
    assert.ok(doc.querySelector('button[disabled]'))
    assert.ok(doc.body.textContent.includes(copy.catalogCopy(locale).next))
    assert.equal(doc.querySelector('a[href^="/go"]'), null)
    dom.window.close()
  }
})

test('M11: selected reading lists and comparisons retain localized reasons and working internal references', () => {
  assert.equal(editorial.REFERENCE_READING_LISTS.length, 3)
  assert.equal(editorial.REFERENCE_COMPARISONS.length, 3)
  for (const [locale, segment] of locales) {
    for (const list of editorial.REFERENCE_READING_LISTS) {
      const dom = render(locale, segment, React.createElement(views.ReferenceReadingView, { list, locale }))
      for (const item of list.alternatives) {
        assert.ok(dom.window.document.body.textContent.includes(item.reason[locale]))
        assert.ok(dom.window.document.querySelector(`a[href="/${segment}/games/${item.slug}"]`))
      }
      dom.window.close()
    }
    for (const comparison of editorial.REFERENCE_COMPARISONS) {
      const dom = render(locale, segment, React.createElement(views.ReferenceComparisonView, { comparison, locale }))
      for (const text of [comparison.shared[locale], ...comparison.difference[locale]]) assert.ok(dom.window.document.body.textContent.includes(text))
      assert.ok(dom.window.document.querySelector('[data-betsson-banner="comparison"] a[href^="/go"]'))
      assert.equal(dom.window.document.querySelector('a[href*="/where-to-play/"]'), null)
      dom.window.close()
    }
  }
})

test('M11: provider pages have documented overviews, category links and their own indexed games', () => {
  for (const [locale, segment] of locales) for (const provider of PROVIDERS) {
    const dom = render(locale, segment, React.createElement(views.ProviderView, { providerId: provider.id, locale })), doc = dom.window.document
    assert.ok(doc.body.textContent.includes(provider.overview[locale]))
    const count = REFERENCE_GAMES.filter(game => game.providerId === provider.id).length
    assert.equal(doc.querySelectorAll('[data-reference-card]').length, Math.min(12, count))
    assert.ok(doc.querySelector('[data-betsson-banner="provider"] a[href^="/go"]'))
    assert.equal(doc.querySelector('a[href*="/where-to-play/"]'), null)
    dom.window.close()
  }
})

test('M11: 189 M10 URLs survive; new routes have unique reciprocal localized metadata without availability pages', async () => {
  const oldPaths = JSON.parse(await readFile(new URL('./fixtures/m10-sitemap-paths.json', import.meta.url)))
  const entries = sitemapModule.default(), urls = entries.map(item => item.url)
  assert.equal(oldPaths.length * 3, 189)
  assert.equal(entries.length, 324) // M12 adds two trust pages in three locales; all 318 prior URLs below remain required.
  assert.equal(new Set(urls).size, urls.length)
  assert.equal(paths.REFERENCE_PATHS.length, 43)
  for (const [, segment] of locales) for (const path of oldPaths) assert.ok(urls.includes(`${seo.SITE_URL}/${segment}${path}`))
  for (const path of paths.REFERENCE_PATHS) for (const [, segment] of locales) {
    const entry = entries.find(item => item.url === `${seo.SITE_URL}/${segment}${path}`)
    assert.ok(entry)
    assert.equal(entry.alternates.languages['x-default'], `${seo.SITE_URL}/pt-br${path}`)
    for (const [, other] of locales) assert.equal(entry.alternates.languages[other], `${seo.SITE_URL}/${other}${path}`)
    const [kind, slug] = path.slice(1).split('/')
    if (slug) {
      const meta = metadata.referenceMetadata(kind, slug, segment)
      assert.ok(meta.title && meta.description)
      assert.equal(meta.alternates.canonical, `${seo.SITE_URL}/${segment}${path}`)
    }
  }
  for (const game of REFERENCE_GAMES) assert.ok(urls.every(url => !url.endsWith(`/where-to-play/${game.slug}`)))
})
