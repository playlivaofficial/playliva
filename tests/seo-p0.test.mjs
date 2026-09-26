import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sitemapModule from '../app/sitemap.ts'
import dataModule from '../lib/data.ts'
import marketModule from '../lib/seo-market.ts'
import contentModule from '../lib/content.ts'
import i18nModule from '../lib/i18n.ts'
import seoModule from '../lib/seo.ts'

const { default: sitemap } = sitemapModule
const { getGame, getGameList } = dataModule
const {
  seoMarketForLocaleSegment,
  isGameListIndexableForLocale,
  isWhereToPlayIndexable,
} = marketModule
const { getCrashHubContent, getGameListContent } = contentModule
const { createTranslator } = i18nModule
const { pageMetadata } = seoModule

test('locale routes seed a crawl-safe market without equating language and GEO', () => {
  assert.equal(seoMarketForLocaleSegment('pt-br'), 'BR')
  assert.equal(seoMarketForLocaleSegment('es-mx'), 'MX')
  assert.equal(seoMarketForLocaleSegment('en'), null)
})

test('market lists and Where-to-Play indexability are derived from verified data', () => {
  const brazil = getGameList('best-crash-games-brazil')
  const mexico = getGameList('best-crash-games-mexico')
  assert.equal(isGameListIndexableForLocale(brazil, 'pt-br'), true)
  assert.equal(isGameListIndexableForLocale(brazil, 'en'), false)
  assert.equal(isGameListIndexableForLocale(mexico, 'pt-br'), false)
  assert.equal(isGameListIndexableForLocale(mexico, 'es-mx'), true)

  assert.equal(isWhereToPlayIndexable(getGame('aviator'), 'pt-br'), true)
  assert.equal(isWhereToPlayIndexable(getGame('aviator'), 'en'), false)
  assert.equal(isWhereToPlayIndexable(getGame('aviator'), 'es-mx'), false)
  assert.equal(isWhereToPlayIndexable(getGame('mines'), 'pt-br'), false)
  assert.equal(isWhereToPlayIndexable(getGame('plinko'), 'pt-br'), false)
})

test('sitemap excludes empty and wrong-market SEO routes', () => {
  const paths = sitemap().map((entry) => new URL(entry.url).pathname)
  assert.equal(paths.length, 304) // + Liva Ginga and Liva Golaço in three locales
  assert.ok(paths.includes('/pt-br/where-to-play/aviator'))
  assert.ok(!paths.includes('/en/where-to-play/aviator'))
  assert.ok(!paths.some((path) => path.includes('/where-to-play/mines')))
  assert.ok(!paths.some((path) => path.includes('/where-to-play/plinko')))
  assert.ok(paths.includes('/pt-br/best/best-crash-games-brazil'))
  assert.ok(paths.includes('/es-mx/best/best-crash-games-mexico'))
  assert.ok(!paths.includes('/pt-br/best/best-crash-games-mexico'))
  assert.ok(!paths.includes('/es-mx/best/best-crash-games-brazil'))
})

test('Crash guide and Brazil selection have distinct, supportable intent', () => {
  const guide = getCrashHubContent('pt-BR')
  const selection = getGameListContent(getGameList('best-crash-games-brazil'), 'pt-BR')
  assert.match(guide.h1, /^Como avaliar e escolher crash games/i)
  assert.match(selection.title, /^Seleção editorial/i)
  assert.notEqual(guide.h1, selection.title)
  assert.doesNotMatch(selection.intro, /mais jogad|popularidade/i)
  assert.match(selection.editorialContent, /critérios editoriais fixos/i)
})

test('PT-BR shared generators avoid audited copy leakage', () => {
  const t = createTranslator('pt-BR')
  assert.equal(t('seo.comparisonTitle', { a: 'Aviator', b: 'JetX' }), 'Aviator vs JetX — Comparação de jogos')
  assert.doesNotMatch(t('category.popularTitle', { category: 'jogos instantâneos', market: 'Brasil' }), /Jogos de jogos/i)
  assert.doesNotMatch(t('category.popularTitle', { category: 'jogos de mesa', market: 'Brasil' }), /Jogos de jogos/i)
})

test('priority pages receive approved social artwork', () => {
  assert.deepEqual(pageMetadata({ path: '/play/crash', localeSegment: 'pt-br' }).openGraph.images, ['/originals/crash/island-crash-poster.webp'])
  assert.deepEqual(pageMetadata({ path: '/offers', localeSegment: 'pt-br' }).openGraph.images, ['/operators/betsson.png'])
  assert.deepEqual(pageMetadata({ path: '/crash', localeSegment: 'pt-br' }).openGraph.images, ['/games/aviator.png'])
})

test('Original fallbacks and sponsor copy do not add headings', async () => {
  for (const path of [
    '../components/originals/blackjack/blackjack-entry.tsx',
    '../components/originals/capybara/capybara-entry.tsx',
    '../components/originals/mines/mines-entry.tsx',
    '../components/originals/roulette/roulette-entry.tsx',
  ]) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /<h1\b/)
  }
  const sponsor = await readFile(new URL('../components/affiliates/betsson-sponsored-banner.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(sponsor, /<h2\b/)
  assert.match(sponsor, /promoPayload/)
  assert.match(sponsor, /affiliate_click/)
})
