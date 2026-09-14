import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import affiliateModule from '../lib/affiliate.ts'
import betssonModule from '../lib/affiliates/betsson.ts'
import countryModule from '../components/country-context.tsx'
import dataModule from '../lib/data.ts'
import i18nModule from '../lib/i18n.ts'
import catalogModule from '../lib/catalog/index.ts'
import legalModule from '../components/legal/legal-page.tsx'

const cssHooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) {
    return { format: 'module', shortCircuit: true, source: 'const s = new Proxy({}, { get: (_, k) => String(k) }); export default s;' }
  }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const bannerModule = unwrap(await import('../components/affiliates/betsson-sponsored-banner.tsx'))
const homeBannerModule = unwrap(await import('../components/affiliates/betsson-home-banner.tsx'))
const playCtaModule = unwrap(await import('../components/affiliates/provider-play-real-cta.tsx'))
const playViewModule = unwrap(await import('../components/play-view.tsx'))
const categoryModule = unwrap(await import('../components/category-page-view.tsx'))
const offersModule = unwrap(await import('../components/offers-view.tsx'))
const gamesLikeModule = unwrap(await import('../components/games-like-view.tsx'))
const comparisonModule = unwrap(await import('../components/comparison-view.tsx'))
const gameDetailModule = unwrap(await import('../components/game-detail-view.tsx'))
const referenceModule = unwrap(await import('../components/catalog/reference-views.tsx'))
const crashHubModule = unwrap(await import('../components/crash-games-hub-view.tsx'))
const bestListModule = unwrap(await import('../components/best-list-view.tsx'))
const homeModule = unwrap(await import('../components/home/home-page-client.tsx'))
cssHooks.deregister()

const { resolveDestination } = affiliateModule
const {
  BETSSON_BANNER_SURFACES, GAME_DETAIL_CTA_PLACEMENT, GENERIC_BRAND_MODE, HOMEPAGE_BANNER_PLACEMENT,
  getBetssonCampaigns, getBetssonGamePlayCta, getBetssonHomepageBanner,
  getBetssonSponsoredBanner, resolveGenericBrandDestination,
} = betssonModule
const { CountryProvider } = countryModule
const { createTranslator } = i18nModule
const partner = dataModule.getOperator('betsson-group-affiliates')
const locales = [['pt-BR', 'pt-br'], ['en', 'en'], ['es-MX', 'es-mx']]
const portuguesePromo = /Conheça cassino|não aceita apostas nem depósitos|por indicações|Jogar na Betsson|Divulgação de afiliados/
const exactClaim = /Play Big Bass Splash at Betsson|Play Fruit Party at Betsson|This game may not be available at Betsson|este jogo está disponível na Betsson/i

function wrap(locale, path, child) {
  return React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: path },
      React.createElement(CountryProvider, { initialLocale: locale }, child)))
}

function render(locale, path, child) {
  return new JSDOM(renderToStaticMarkup(wrap(locale, path, child))).window.document
}

test('sitewide banner surfaces resolve the generic brand destination and preserve tracking', () => {
  const campaigns = getBetssonCampaigns()
  for (const [surface, config] of Object.entries(BETSSON_BANNER_SURFACES)) {
    assert.ok(campaigns.brand.placements.includes(config.placement), surface)
    for (const [locale] of locales) {
      const banner = getBetssonSponsoredBanner('BR', locale, surface)
      assert.ok(banner, `${surface} ${locale}`)
      assert.equal(banner.mode, GENERIC_BRAND_MODE)
      assert.equal(banner.surface, config.surface)
      const query = new URL(banner.href, 'https://www.playliva.com').searchParams
      assert.equal(query.get('operator'), partner.slug)
      assert.equal(query.get('country'), 'BR')
      assert.equal(query.get('language'), locale)
      assert.equal(query.get('page'), config.pageType)
      assert.equal(query.get('placement'), config.placement)
      assert.equal(query.get('category'), null)
      assert.equal(query.get('game'), null)
      for (const analyticsAllowed of [undefined, false, true]) {
        assert.equal(resolveGenericBrandDestination({
          operatorSlug: partner.slug, country: 'BR', language: locale, pageType: config.pageType,
          placement: config.placement, analyticsAllowed,
        })?.url, partner.affiliateUrl.BR)
      }
      assert.equal(getBetssonSponsoredBanner('MX', locale, surface), null)
      assert.equal(getBetssonSponsoredBanner('PT', locale, surface), null)
    }
  }
  const home = getBetssonHomepageBanner('BR', 'en')
  const sitewide = getBetssonSponsoredBanner('BR', 'en', 'homepage')
  assert.equal(home.href, sitewide.href)
  assert.equal(home.href.includes(`placement=${HOMEPAGE_BANNER_PLACEMENT}`), true)
})

test('public product templates expose one Betsson banner with localized copy', () => {
  const cases = [
    ['homepage', () => React.createElement(homeBannerModule.BetssonHomeBanner)],
    ['play', () => React.createElement(playViewModule.PlayView)],
    ['slots', () => React.createElement(categoryModule.CategoryPageView, { slug: 'slots' })],
    ['crash', () => React.createElement(categoryModule.CategoryPageView, { slug: 'crash' })],
    ['live-casino', () => React.createElement(categoryModule.CategoryPageView, { slug: 'live-casino' })],
    ['instant-games', () => React.createElement(categoryModule.CategoryPageView, { slug: 'instant-games' })],
    ['offers', () => React.createElement(offersModule.OffersView)],
    ['best-list', () => React.createElement(crashHubModule.CrashGamesHubView)],
    ['providers', () => React.createElement(referenceModule.ProviderIndexView, { locale: 'en' })],
  ]
  for (const [locale, segment] of locales) {
    const t = createTranslator(locale)
    for (const [surface, factory] of cases) {
      const doc = render(locale, `/${segment}`, factory())
      const root = doc.querySelector(`[data-betsson-banner="${surface}"]`)
      assert.ok(root, `${surface} ${locale}`)
      assert.equal(root.getAttribute('data-banner-layout'), 'compact-header', surface)
      assert.equal(doc.querySelectorAll(`[data-betsson-banner="${surface}"]`).length, 1, surface)
      assert.ok(root.querySelector('a[href^="/go?"]'))
      assert.ok(root.textContent.includes(t('affiliate.sponsored')))
      if (surface === 'offers') {
        assert.ok(root.textContent.includes(t('affiliate.visitNamed', { name: 'Betsson' })))
        assert.ok(doc.querySelector('[data-offers-sponsored]'))
        assert.ok(doc.querySelector('[data-offers-verified]'))
        assert.ok(doc.querySelector('[data-offers-sponsored]').textContent.includes(t('affiliate.sponsoredPartner')))
        assert.ok(doc.querySelector('[data-offers-verified]').textContent.includes(t('affiliate.verifiedOffers')))
      } else {
        assert.ok(root.textContent.includes(t('affiliate.exploreNamed', { name: 'Betsson' })))
      }
      assert.doesNotMatch(root.textContent, exactClaim)
      if (locale === 'en') {
        assert.match(root.textContent, /Sponsored/)
        assert.doesNotMatch(root.textContent, portuguesePromo)
        assert.doesNotMatch(root.textContent, /Patrocinado/)
      }
      if (locale === 'pt-BR') {
        assert.match(root.textContent, /Patrocinado/)
        assert.doesNotMatch(root.textContent, /Sponsored|Visit Betsson|Explore Betsson/)
      }
      if (locale === 'es-MX') {
        assert.match(root.textContent, /Patrocinado/)
        assert.doesNotMatch(root.textContent, portuguesePromo)
        assert.doesNotMatch(root.textContent, /Sponsored|Visit Betsson|Explore Betsson/)
      }
    }
    const gamesBanner = render(locale, `/${segment}/games`,
      React.createElement(bannerModule.BetssonSponsoredBanner, { surface: 'games' }))
    assert.ok(gamesBanner.querySelector('[data-betsson-banner="games"]'))
    const operatorsBanner = render(locale, `/${segment}/operators`,
      React.createElement(bannerModule.BetssonSponsoredBanner, { surface: 'operators' }))
    assert.ok(operatorsBanner.querySelector('[data-betsson-banner="operators"]'))
  }
})

test('homepage keeps a single centralized Betsson banner', () => {
  const doc = render('en', '/en', React.createElement(homeModule.HomePageClient))
  assert.equal(doc.querySelectorAll('[data-betsson-banner="homepage"]').length, 1)
  assert.equal(doc.querySelectorAll('[data-betsson-banner]').length, 1)
})

test('games-like, comparison, provider and best-list templates show one high banner', () => {
  const aviator = dataModule.getGame('aviator')
  const comparison = dataModule.COMPARISONS[0]
  const list = dataModule.GAME_LISTS[0]
  const providerId = catalogModule.PROVIDERS[0].id
  const doc = render('en', '/en/games-like/aviator', React.createElement(gamesLikeModule.GamesLikeView, { game: aviator }))
  assert.ok(doc.querySelector('[data-betsson-banner="games-like"]'))
  assert.equal(doc.querySelectorAll('[data-betsson-banner]').length, 1)
  const compare = render('en', '/en/compare/x', React.createElement(comparisonModule.ComparisonView, { comparison }))
  assert.ok(compare.querySelector('[data-betsson-banner="comparison"]'))
  const provider = render('en', '/en/providers/x', React.createElement(referenceModule.ProviderView, { providerId, locale: 'en' }))
  assert.ok(provider.querySelector('[data-betsson-banner="provider"]'))
  const best = render('en', '/en/best/x', React.createElement(bestListModule.BestListView, { list }))
  assert.ok(best.querySelector('[data-betsson-banner="best-list"]'))
})

test('all 42 real provider games expose an early Betsson CTA for eligible BR GEO', () => {
  const legacy = dataModule.GAMES
  const reference = catalogModule.REFERENCE_GAMES
  assert.equal(legacy.length + reference.length, 42)
  for (const [locale] of locales) {
    const t = createTranslator(locale)
    for (const game of legacy) {
      const cta = getBetssonGamePlayCta('BR', locale, {
        gameSlug: game.slug, category: game.affiliateCategory ?? game.category,
      })
      assert.ok(cta, game.slug)
      const query = new URL(cta.href, 'https://www.playliva.com').searchParams
      assert.equal(query.get('operator'), partner.slug)
      assert.equal(query.get('country'), 'BR')
      assert.equal(query.get('language'), locale)
      assert.equal(query.get('placement'), GAME_DETAIL_CTA_PLACEMENT)
      if (partner.verifiedGames.BR.includes(game.id)) {
        assert.equal(cta.mode, 'verified-game')
        assert.equal(query.get('game'), game.slug)
      } else {
        assert.notEqual(cta.mode, 'verified-game')
        assert.equal(query.get('game'), null)
      }
      assert.equal(getBetssonGamePlayCta('MX', locale, { gameSlug: game.slug, category: game.category }), null)
      const markup = render(locale, `/${locale === 'pt-BR' ? 'pt-br' : locale === 'es-MX' ? 'es-mx' : 'en'}/games/${game.slug}`,
        React.createElement(gameDetailModule.GameDetailView, { game }))
      const node = markup.querySelector('[data-betsson-game-cta]')
      assert.ok(node, game.slug)
      assert.equal(node.textContent.replace(/\s+/g, ' ').includes(t('affiliate.playRealBetsson')), true)
      assert.doesNotMatch(node.textContent, new RegExp(`Play ${game.title} at Betsson`, 'i'))
      assert.doesNotMatch(markup.body.textContent, exactClaim)
      assert.ok(markup.querySelector('[data-betsson-banner="game"]'))
    }
    for (const game of reference) {
      const cta = getBetssonGamePlayCta('BR', locale, { gameSlug: game.slug, category: game.category })
      assert.ok(cta, game.slug)
      const query = new URL(cta.href, 'https://www.playliva.com').searchParams
      assert.equal(query.get('game'), null)
      assert.notEqual(cta.mode, 'verified-game')
      if (['slots', 'crash', 'live-casino'].includes(game.category)) assert.equal(cta.mode, 'verified-category')
      if (game.category === 'instant-games') {
        assert.equal(cta.mode, GENERIC_BRAND_MODE)
        assert.equal(query.get('category'), null)
      }
      const markup = render(locale, `/${locale === 'pt-BR' ? 'pt-br' : locale === 'es-MX' ? 'es-mx' : 'en'}/games/${game.slug}`,
        React.createElement(referenceModule.ReferenceGameView, { game, locale }))
      const node = markup.querySelector('[data-betsson-game-cta]')
      assert.ok(node, game.slug)
      assert.ok(node.textContent.includes(t('affiliate.playRealBetsson')))
      assert.doesNotMatch(node.textContent, new RegExp(`Play ${game.title} at Betsson`, 'i'))
      assert.ok(markup.querySelector('[data-betsson-banner="game"]'))
      if (locale === 'en') assert.doesNotMatch(node.textContent, portuguesePromo)
    }
  }
})

test('verified destination beats generic fallback and generic copy never claims exact availability', () => {
  const verified = getBetssonGamePlayCta('BR', 'en', { gameSlug: 'aviator', category: 'crash' })
  const generic = getBetssonGamePlayCta('BR', 'en', { gameSlug: 'mines', category: 'instant-games' })
  const splash = getBetssonGamePlayCta('BR', 'en', { gameSlug: 'big-bass-splash', category: 'slots' })
  assert.equal(verified.mode, 'verified-game')
  assert.ok(new URL(verified.href, 'https://www.playliva.com').searchParams.get('game') === 'aviator')
  assert.equal(new URL(verified.href, 'https://www.playliva.com').searchParams.get('category'), 'crash')
  assert.equal(resolveDestination({
    operatorSlug: partner.slug, country: 'BR', gameSlug: 'aviator', category: 'crash', pageType: 'game',
  })?.url, partner.categoryAffiliateUrl.crash.BR)
  assert.notEqual(generic.mode, 'verified-game')
  assert.equal(new URL(generic.href, 'https://www.playliva.com').searchParams.get('game'), null)
  assert.equal(new URL(generic.href, 'https://www.playliva.com').searchParams.get('category'), null)
  assert.equal(resolveGenericBrandDestination({
    operatorSlug: partner.slug, country: 'BR', pageType: 'content', placement: GAME_DETAIL_CTA_PLACEMENT,
    analyticsAllowed: false,
  })?.url, partner.affiliateUrl.BR)
  assert.equal(splash.mode, 'verified-category')
  assert.equal(new URL(splash.href, 'https://www.playliva.com').searchParams.get('game'), null)
  assert.equal(new URL(splash.href, 'https://www.playliva.com').searchParams.get('category'), 'slots')
  const cta = render('en', '/en/games/big-bass-splash',
    React.createElement(playCtaModule.ProviderPlayRealCta, { gameSlug: 'big-bass-splash', category: 'slots' }))
  const label = cta.querySelector('[data-betsson-game-cta]')?.textContent ?? ''
  assert.match(label, /PLAY REAL · BETSSON/)
  assert.doesNotMatch(label, /Play Big Bass Splash at Betsson|This game may not be available/)
})

test('legal pages do not render commercial Betsson banners', () => {
  for (const key of ['terms', 'privacy-policy', 'affiliate-disclosure', 'responsible-gaming', 'cookie-policy']) {
    const doc = render('en', `/en/${key}`, React.createElement(unwrap(legalModule).LegalPage, { pageKey: key }))
    assert.equal(doc.querySelector('[data-betsson-banner]'), null, key)
    assert.equal(doc.querySelector('[data-betsson-game-cta]'), null, key)
  }
})
