import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFile } from 'node:fs/promises'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import betssonModule from '../lib/affiliates/betsson.ts'
import countryModule from '../components/country-context.tsx'
import dataModule from '../lib/data.ts'
import catalogModule from '../lib/catalog/index.ts'

const cssHooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) {
    return { format: 'module', shortCircuit: true, source: 'const s = new Proxy({}, { get: (_, k) => String(k) }); export default s;' }
  }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const bannerModule = unwrap(await import('../components/affiliates/betsson-sponsored-banner.tsx'))
const homeModule = unwrap(await import('../components/home/home-page-client.tsx'))
const playViewModule = unwrap(await import('../components/play-view.tsx'))
const categoryModule = unwrap(await import('../components/category-page-view.tsx'))
const offersModule = unwrap(await import('../components/offers-view.tsx'))
const gamesLikeModule = unwrap(await import('../components/games-like-view.tsx'))
const comparisonModule = unwrap(await import('../components/comparison-view.tsx'))
const gameDetailModule = unwrap(await import('../components/game-detail-view.tsx'))
const referenceModule = unwrap(await import('../components/catalog/reference-views.tsx'))
const crashHubModule = unwrap(await import('../components/crash-games-hub-view.tsx'))
const bestListModule = unwrap(await import('../components/best-list-view.tsx'))
const gamesHeroModule = unwrap(await import('../components/games-page-hero.tsx'))
const operatorsHeroModule = unwrap(await import('../components/operators-page-hero.tsx'))
cssHooks.deregister()

const { getBetssonSponsoredBanner, resolveBetssonBannerLayout } = betssonModule
const ORIGINALS_GAME_SLUGS = ['crash', 'capybara-gold', 'blackjack', 'roulette', 'mines']
const { CountryProvider } = countryModule
const locales = [['pt-BR','pt-br'],['en','en'],['es-MX','es-mx'],['es-CO','es-co'],['es-PE','es-pe']]
const FOLLOWING = 4

function wrap(locale, path, child) {
  return React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: path },
      React.createElement(CountryProvider, { initialLocale: locale, visitorCountryCode: 'MX', commercial: commercialFixture('MX') }, child)))
}

function render(locale, path, child) {
  return new JSDOM(renderToStaticMarkup(wrap(locale, path, child))).window.document
}

function assertCompactHeroPlacement(doc, surface) {
  const title = doc.querySelector('h1')
  const banner = doc.querySelector(`[data-sponsored-banner="${surface}"]`)
  assert.ok(title, `${surface}: page title`)
  assert.ok(banner, `${surface}: sponsored banner`)
  assert.equal(banner.getAttribute('data-banner-layout'), 'compact-header', surface)
  assert.equal(doc.querySelectorAll('[data-banner-layout="full-support"]').length, 0, surface)
  assert.ok(title.compareDocumentPosition(banner) & FOLLOWING, `${surface}: title before sponsor`)
  assert.ok(
    banner.closest('[data-sponsor-slot], [data-page-hero-sponsor], [data-hero-sponsor], [data-hub-sponsor], [data-detail-sponsor], [data-offers-sponsored]'),
    `${surface}: sponsor sits in a header slot`,
  )
  assert.ok(banner.querySelector('a[href^="/go?"]'))
  assert.ok(banner.querySelector('[data-commercial-disclosure]'))
  assert.ok(banner.textContent.includes('18+'))
  assert.doesNotMatch(banner.innerHTML, /https?:\/\/betsson/i)
}

test('legacy banner layouts resolve to compact-header or full-support', () => {
  assert.equal(resolveBetssonBannerLayout('compact-header'), 'compact-header')
  assert.equal(resolveBetssonBannerLayout('compact'), 'compact-header')
  assert.equal(resolveBetssonBannerLayout('hub'), 'compact-header')
  assert.equal(resolveBetssonBannerLayout(), 'compact-header')
  assert.equal(resolveBetssonBannerLayout('full-support'), 'full-support')
  assert.equal(resolveBetssonBannerLayout('full'), 'full-support')
})

test('standalone banners default to compact-header without hardcoded outbound URLs', () => {
  const markup = render('en', '/en', React.createElement(bannerModule.BetssonSponsoredBanner, { surface: 'homepage' }))
  const root = markup.querySelector('[data-sponsored-banner="homepage"]')
  assert.equal(root.getAttribute('data-banner-layout'), 'compact-header')
  assert.ok(root.querySelector('a[href^="/go?"]'))
  assert.doesNotMatch(root.innerHTML, /https?:\/\/betsson/i)
  const full = render('en', '/en', React.createElement(bannerModule.BetssonSponsoredBanner, {
    surface: 'homepage',
    layout: 'full-support',
  }))
  assert.equal(full.querySelector('[data-sponsored-banner="homepage"]').getAttribute('data-banner-layout'), 'full-support')
})

test('commercial surfaces keep page identity first and a compact header sponsor', () => {
  const aviator = dataModule.getGame('aviator')
  const comparison = dataModule.COMPARISONS[0]
  const list = dataModule.GAME_LISTS[0]
  const providerId = catalogModule.PROVIDERS[0].id
  const cases = [
    ['homepage', () => React.createElement(homeModule.HomePageClient)],
    ['play', () => React.createElement(playViewModule.PlayView)],
    ['games', () => React.createElement(gamesHeroModule.GamesPageHero)],
    ['slots', () => React.createElement(categoryModule.CategoryPageView, { slug: 'slots' })],
    ['crash', () => React.createElement(categoryModule.CategoryPageView, { slug: 'crash' })],
    ['live-casino', () => React.createElement(categoryModule.CategoryPageView, { slug: 'live-casino' })],
    ['instant-games', () => React.createElement(categoryModule.CategoryPageView, { slug: 'instant-games' })],
    ['table-games', () => React.createElement(categoryModule.CategoryPageView, { slug: 'table-games' })],
    ['offers', () => React.createElement(offersModule.OffersView)],
    ['operators', () => React.createElement(operatorsHeroModule.OperatorsPageHero)],
    ['best-list', () => React.createElement(crashHubModule.CrashGamesHubView)],
    ['providers', () => React.createElement(referenceModule.ProviderIndexView, { locale: 'en' })],
    ['games-like', () => React.createElement(gamesLikeModule.GamesLikeView, { game: aviator })],
    ['comparison', () => React.createElement(comparisonModule.ComparisonView, { comparison })],
    ['game', () => React.createElement(gameDetailModule.GameDetailView, { game: aviator })],
    ['provider', () => React.createElement(referenceModule.ProviderView, { providerId, locale: 'en' })],
    ['best-list-editorial', () => React.createElement(bestListModule.BestListView, { list }), 'best-list'],
  ]
  for (const [locale, segment] of locales) {
    for (const [name, factory, surface = name] of cases) {
      const doc = render(locale, `/${segment}`, factory())
      assertCompactHeroPlacement(doc, surface)
      if (locale === 'en') {
        assert.match(doc.querySelector(`[data-sponsored-banner="${surface}"]`).textContent, /Sponsored/)
        assert.doesNotMatch(doc.querySelector(`[data-sponsored-banner="${surface}"]`).textContent, /Patrocinado|Conheça cassino/)
      }
      if (locale === 'pt-BR') {
        assert.match(doc.querySelector(`[data-sponsored-banner="${surface}"]`).textContent, /Patrocinado/)
        assert.doesNotMatch(doc.querySelector(`[data-sponsored-banner="${surface}"]`).textContent, /Sponsored|Explore Betsson|Visit Betsson/)
      }
      if (locale === 'es-MX') {
        assert.match(doc.querySelector(`[data-sponsored-banner="${surface}"]`).textContent, /Patrocinado/)
        assert.doesNotMatch(doc.querySelector(`[data-sponsored-banner="${surface}"]`).textContent, /Sponsored|Explore Betsson|Visit Betsson|Conheça cassino/)
      }
      if (name === 'homepage') {
        assert.ok(doc.querySelector('[data-hero-sponsor] [data-sponsored-banner="homepage"]'))
      }
      if (name === 'play') {
        assert.ok(doc.querySelector('[data-hub-sponsor] [data-sponsored-banner="play"]'))
        assert.ok(doc.querySelector('header [data-sponsored-banner="play"]'))
      }
    }
  }
})

test('Originals header banner resolves only for its approved runtime market', () => {
  for(const geo of ['MX','CO','PE']) {
    const snapshot=commercialFixture(geo)
    const banner=getBetssonSponsoredBanner(geo,`es-${geo}`,'originals',snapshot)
    assert.ok(banner)
    assert.equal(banner.surface,'originals')
    assert.match(banner.href,/^\/go\?/)
    assert.equal(new URL(banner.href,'https://www.playliva.com').searchParams.get('placement'),'originals_header')
    for(const other of ['BR','GE','MX','CO','PE'])if(other!==geo)assert.equal(getBetssonSponsoredBanner(other,`es-${geo}`,'originals',snapshot),null)
  }
})

test('Originals header compact sponsor sits above the viewport on all five routes', async () => {
  const shell = await readFile(new URL('../components/originals/play-game-shell.tsx', import.meta.url), 'utf8')
  assert.ok(shell.includes('BetssonSponsoredBanner'))
  assert.match(shell, /surface="originals"/)
  assert.match(shell, /layout="compact-header"/)
  assert.match(shell, /data-sponsor-slot="originals-header"/)
  assert.equal(shell.includes('PlayRealCTA'), false)
  assert.doesNotMatch(shell, /https?:\/\/(?:www\.)?betsson/i)
  const header = shell.indexOf('data-sponsor-slot="originals-header"')
  const unit = shell.indexOf('data-game-unit')
  const viewport = shell.indexOf('data-game-viewport')
  const controls = shell.indexOf('data-game-controls')
  assert.ok(header > 0 && unit > header && viewport > unit && controls > viewport)
  const between = shell.slice(viewport, controls)
  assert.doesNotMatch(between, /BetssonSponsoredBanner|PlayRealCTA|data-betting-ad|data-sponsored-banner/)

  const gameFiles = {
    crash: '../components/originals/crash/crash-game.tsx',
    'capybara-gold': '../components/originals/capybara/capybara-game.tsx',
    blackjack: '../components/originals/blackjack/blackjack-game.tsx',
    roulette: '../components/originals/roulette/roulette-game.tsx',
    mines: '../components/originals/mines/mines-game.tsx',
  }
  for (const slug of ORIGINALS_GAME_SLUGS) {
    const page = await readFile(new URL(`../app/[locale]/play/${slug}/page.tsx`, import.meta.url), 'utf8')
    assert.equal(page.includes('BetssonSponsoredBanner'), false, slug)
    assert.equal(page.includes('PlayRealCTA'), false, slug)
    const game = await readFile(new URL(gameFiles[slug], import.meta.url), 'utf8')
    assert.match(game, /PlayGameShell/)
    assert.equal(game.includes('BetssonSponsoredBanner'), false, slug)
    assert.equal(game.includes('PlayRealCTA'), false, slug)
  }
})
