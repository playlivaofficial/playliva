import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import affiliateModule from '../lib/affiliate.ts'
import betssonModule from '../lib/affiliates/betsson.ts'
import countryModule from '../components/country-context.tsx'
import dataModule from '../lib/data.ts'
import i18nModule from '../lib/i18n.ts'
import playRealModule from '../lib/originals/play-real.ts'
import blackjackDef from '../lib/originals/blackjack/definition.ts'
import capybaraDef from '../lib/originals/capybara/definition.ts'
import crashDef from '../lib/originals/crash/definition.ts'
import minesConfig from '../lib/originals/mines/config.ts'
import rouletteConfig from '../lib/originals/roulette/config.ts'
import consentModule from '../lib/consent.ts'
import providerModule from '../components/originals/demo-session.tsx'
import sessionModule from '../lib/originals/session.ts'
import shellModule from '../components/originals/play-game-shell.tsx'

const cssHooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) {
    return { format: 'module', shortCircuit: true, source: 'const s = new Proxy({}, { get: (_, k) => String(k) }); export default s;' }
  }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const bannerModule = unwrap(await import('../components/affiliates/betsson-home-banner.tsx'))
const homeModule = unwrap(await import('../components/home/home-page-client.tsx'))
cssHooks.deregister()

const { resolveDestination } = affiliateModule
const {
  BETSSON_CREATIVES, BETSSON_OPERATOR_SLUG, GENERIC_BRAND_MODE, GENERIC_OPERATOR_PLACEMENT,
  HOMEPAGE_BANNER_PLACEMENT, getBetssonCampaigns, getBetssonHomepageBanner, getBetssonOperator,
  netreferTrackingKey, resolveGenericBrandDestination, selectHomepageCreative,
} = betssonModule
const { getGenericApprovedOperatorCtas, getOriginalOperatorCtas, getPlayRealOptions } = playRealModule
const { CountryProvider } = countryModule
const { createTranslator } = i18nModule
const partner = dataModule.getOperator(BETSSON_OPERATOR_SLUG)
const locales = [['pt-BR', 'pt-br'], ['en', 'en'], ['es-MX', 'es-mx']]
const forbiddenExactClaims = /Play Liva Mines at Betsson|Jogue Liva Mines na Betsson|Juega Liva Mines en Betsson|This game is available at Betsson|este jogo está disponível na Betsson|este juego está disponible en Betsson|Play Liva Mines na Betsson/i
const portuguesePromo = /Conheça cassino|não aceita apostas nem depósitos|por indicações|esteja disponível lá|Jogar na Betsson|Divulgação de afiliados/

function wrap(locale, path, child) {
  return React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: path },
      React.createElement(CountryProvider, { initialLocale: locale }, child)))
}

test('approved Betsson campaign data stays centralized and matches the operator record', () => {
  const campaigns = getBetssonCampaigns()
  assert.equal(getBetssonOperator(), partner)
  assert.equal(campaigns.brand.destination, partner.affiliateUrl.BR)
  assert.equal(campaigns.crash.destination, partner.categoryAffiliateUrl.crash.BR)
  assert.equal(campaigns.liveCasino.destination, partner.categoryAffiliateUrl['live-casino'].BR)
  assert.equal(campaigns.slots.destination, partner.affiliateUrl.BR)
  assert.equal(campaigns.brand.mode, GENERIC_BRAND_MODE)
  assert.ok(campaigns.brand.placements.includes(HOMEPAGE_BANNER_PLACEMENT))
  assert.ok(campaigns.brand.placements.includes(GENERIC_OPERATOR_PLACEMENT))
  assert.equal(campaigns.brand.geo, 'BR')
  assert.equal(campaigns.brand.trackingKey, netreferTrackingKey(partner.affiliateUrl.BR))
  assert.equal(campaigns.crash.trackingKey, '_DtXajoX9_riSXGwDxSNOy2Nd7ZgqdRLk')
  assert.equal(campaigns.liveCasino.trackingKey, '_DtXajoX9_rgmwo_GmoYHy2Nd7ZgqdRLk')
  assert.equal(campaigns.brand.trackingKey, '_DtXajoX9_riEp6ygYOshWmNd7ZgqdRLk')
  assert.notEqual(campaigns.brand.destination, campaigns.crash.destination)
  assert.notEqual(campaigns.brand.destination, campaigns.liveCasino.destination)
  assert.equal(BETSSON_CREATIVES.logo.assetPath, '/operators/betsson.png')
  assert.equal(BETSSON_CREATIVES.logo.language, 'neutral')
  assert.match(BETSSON_CREATIVES.logo.source, /language-neutral|Media Store/)
  assert.equal(createHash('sha256').update(JSON.stringify([dataModule.OPERATORS, dataModule.offersByCountry])).digest('hex'),
    'e35965d2d9de5afa7fffd6d32aadb14b5648abc5c4555020e0b2efac615819cf')
})

test('homepage banner destination is the brand campaign and preserves required tracking without analytics', () => {
  for (const [locale, segment] of locales) {
    const banner = getBetssonHomepageBanner('BR', locale)
    const creative = selectHomepageCreative(locale)
    assert.equal(banner.mode, GENERIC_BRAND_MODE)
    assert.equal(banner.creative.id, creative.id)
    assert.ok(creative.language === locale || creative.language === 'neutral', locale)
    if (locale !== 'pt-BR') assert.notEqual(creative.language, 'pt-BR')
    assert.equal(banner.creative.alt[locale], 'Betsson')
    const query = new URL(banner.href, 'https://www.playliva.com').searchParams
    assert.equal(query.get('operator'), partner.slug)
    assert.equal(query.get('country'), 'BR')
    assert.equal(query.get('language'), locale)
    assert.equal(query.get('page'), 'home')
    assert.equal(query.get('placement'), HOMEPAGE_BANNER_PLACEMENT)
    assert.equal(query.get('category'), null)
    assert.equal(query.get('game'), null)
    for (const analyticsAllowed of [undefined, false, true]) {
      assert.equal(resolveGenericBrandDestination({
        operatorSlug: partner.slug, country: 'BR', language: locale, pageType: 'home',
        placement: HOMEPAGE_BANNER_PLACEMENT, analyticsAllowed,
      })?.url, partner.affiliateUrl.BR)
    }
    const markup = renderToStaticMarkup(wrap(locale, `/${segment}`, React.createElement(bannerModule.BetssonHomeBanner)))
    const doc = new JSDOM(markup).window.document
    const root = doc.querySelector('[data-betsson-banner="homepage"]')
    const t = createTranslator(locale)
    assert.ok(root)
    assert.equal(root.getAttribute('data-creative-language'), creative.language)
    assert.equal(root.querySelector('a[href^="/go?"]').getAttribute('href'), banner.href)
    assert.ok(root.textContent.includes(t('affiliate.exploreNamed', { name: 'Betsson' })))
    assert.ok(root.textContent.includes(t('affiliate.sponsored')))
    assert.ok(root.textContent.includes(t('affiliate.homeBannerBody')))
    assert.doesNotMatch(root.textContent, forbiddenExactClaims)
    assert.doesNotMatch(root.textContent, /bônus|bonus 100|free spins|gire grátis/i)
    if (locale === 'pt-BR') {
      assert.doesNotMatch(root.textContent, /Visit Betsson|Play at Betsson|Explore Betsson|Sponsored/)
      assert.match(root.textContent, /Explorar Betsson/)
    }
    if (locale === 'en') {
      assert.doesNotMatch(root.textContent, portuguesePromo)
      assert.doesNotMatch(root.textContent, /Patrocinado|Explorar Betsson|Visitar Betsson|Conheça/)
      assert.match(root.textContent, /Sponsored/)
      assert.match(root.textContent, /Explore Betsson/)
    }
    if (locale === 'es-MX') {
      assert.doesNotMatch(root.textContent, portuguesePromo)
      assert.doesNotMatch(root.textContent, /Visit Betsson|Play at Betsson|Explore Betsson|Sponsored|Conheça cassino/)
      assert.match(root.textContent, /Patrocinado/)
      assert.match(root.textContent, /Explorar Betsson/)
    }
  }
  assert.equal(getBetssonHomepageBanner('MX', 'es-MX'), null)
  assert.equal(getBetssonHomepageBanner('MX', 'pt-BR'), null)
  assert.equal(getBetssonHomepageBanner('PT', 'pt-BR'), null)
  assert.equal(getBetssonHomepageBanner('BR', 'en')?.href.includes('language=en'), true)
  assert.equal(getBetssonHomepageBanner('BR', 'es-MX')?.href.includes('language=es-MX'), true)
})

test('generic operator CTA does not claim exact game availability and does not reuse another listing', () => {
  assert.deepEqual(getPlayRealOptions('BR', 'instant-games', 'pt-BR'), [])
  assert.equal(resolveDestination({ operatorSlug: partner.slug, country: 'BR', category: 'instant-games' }), null)
  const generic = getGenericApprovedOperatorCtas('BR', 'pt-BR')
  assert.equal(generic[0].mode, GENERIC_BRAND_MODE)
  const query = new URL(generic[0].href, 'https://www.playliva.com').searchParams
  assert.equal(query.get('category'), null)
  assert.equal(query.get('game'), null)
  assert.equal(query.get('placement'), GENERIC_OPERATOR_PLACEMENT)
  for (const analyticsAllowed of [undefined, false, true]) {
    assert.equal(resolveGenericBrandDestination({
      operatorSlug: partner.slug, country: 'BR', pageType: 'play',
      placement: GENERIC_OPERATOR_PLACEMENT, analyticsAllowed,
    })?.url, partner.affiliateUrl.BR)
  }
  const originals = [
    [crashDef.ISLAND_CRASH, 'verified-category', 'crash', null],
    [capybaraDef.CAPYBARA_GOLD, 'verified-category', 'slots', null],
    [blackjackDef.LIVA_BLACKJACK, 'verified-game', 'table-games', 'blackjack-live'],
    [rouletteConfig.LIVA_ROULETTE, 'verified-game', 'live-casino', 'lightning-roulette'],
    [minesConfig.LIVA_MINES, GENERIC_BRAND_MODE, null, null],
  ]
  for (const [game, mode, category, gameSlug] of originals) {
    const options = getOriginalOperatorCtas(game, 'BR', 'pt-BR')
    assert.equal(options[0].mode, mode, game.id)
    const params = new URL(options[0].href, 'https://www.playliva.com').searchParams
    assert.equal(params.get('category'), category)
    assert.equal(params.get('game'), gameSlug)
    assert.equal(getOriginalOperatorCtas(game, 'MX', 'es-MX').length, 0)
  }
  assert.notEqual(getOriginalOperatorCtas(minesConfig.LIVA_MINES, 'BR', 'en')[0].href,
    getOriginalOperatorCtas(crashDef.ISLAND_CRASH, 'BR', 'en')[0].href)
})

test('PT-BR, EN and ES-MX render localized Betsson CTAs without English leakage', async () => {
  const { PlayGameShell } = unwrap(shellModule)
  const game = minesConfig.LIVA_MINES
  for (const [locale, segment] of locales) {
    const t = createTranslator(locale)
    assert.ok(t('affiliate.visitNamed', { name: 'Betsson' }))
    assert.ok(t('affiliate.exploreNamed', { name: 'Betsson' }))
    assert.ok(t('affiliate.genericBoundary'))
    if (locale !== 'en') {
      assert.notEqual(t('affiliate.exploreNamed', { name: 'Betsson' }), createTranslator('en')('affiliate.exploreNamed', { name: 'Betsson' }))
      assert.notEqual(t('affiliate.homeBannerBody'), createTranslator('en')('affiliate.homeBannerBody'))
      assert.notEqual(t('affiliate.genericBoundary'), createTranslator('en')('affiliate.genericBoundary'))
    }
    const dom = new JSDOM('<div id="root"></div>', { url: `https://site.example.invalid/${segment}/play/mines`, virtualConsole: new VirtualConsole() })
    const saved = new Map()
    for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node']) {
      saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
      Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const root = createRoot(document.getElementById('root'))
    const store = sessionModule.createDemoSessionStore(() => window.localStorage, () => 1)
    try {
      await act(() => root.render(wrap(locale, `/${segment}/play/mines`,
        React.createElement(providerModule.DemoSessionProvider, { store },
          React.createElement(PlayGameShell, { game, controls: React.createElement('button', { 'data-test-control': '' }, 'Start') },
            React.createElement('div', {}, 'viewport'))))))
      const cta = document.querySelector('[data-operator-cta="play-real"]')
      assert.equal(cta.getAttribute('data-operator-cta-mode'), GENERIC_BRAND_MODE)
      assert.equal(document.querySelector('[data-cta-mode="generic-brand"]').textContent, t('affiliate.visitNamed', { name: 'Betsson' }))
      assert.ok(cta.textContent.includes(t('affiliate.genericBoundary')))
      assert.ok(cta.textContent.includes(t('affiliate.sponsored')))
      assert.doesNotMatch(cta.textContent, forbiddenExactClaims)
      if (locale === 'pt-BR') assert.doesNotMatch(cta.textContent, /Visit Betsson|Play Real|Explore Betsson|Sponsored/)
      if (locale === 'en') {
        assert.doesNotMatch(cta.textContent, portuguesePromo)
        assert.doesNotMatch(cta.textContent, /Patrocinado|Visitar Betsson|Explorar Betsson/)
      }
      if (locale === 'es-MX') {
        assert.doesNotMatch(cta.textContent, /Visit Betsson|Play Real|Explore Betsson|Sponsored/)
        assert.doesNotMatch(cta.textContent, portuguesePromo)
      }
      assert.ok(document.querySelector('[data-game-viewport]').compareDocumentPosition(cta) & 4)
      assert.ok(cta.compareDocumentPosition(document.querySelector('[data-game-controls]')) & 4)
      assert.doesNotMatch(cta.className, /fixed|absolute|inset-0/)
      const href = document.querySelector('a[href^="/go?"]').getAttribute('href')
      consentModule.saveConsent({ necessary: true, analytics: false, marketing: false })
      assert.equal(document.querySelector('a[href^="/go?"]').getAttribute('href'), href)
    } finally {
      await act(() => root.unmount())
      dom.window.close()
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else delete globalThis[key]
      }
      delete globalThis.IS_REACT_ACT_ENVIRONMENT
    }
  }
})

test('homepage client keeps M10 discovery and exposes one Betsson banner /go link', () => {
  for (const [locale, segment] of locales) {
    const t = createTranslator(locale)
    const markup = renderToStaticMarkup(wrap(locale, `/${segment}`, React.createElement(homeModule.HomePageClient)))
    const doc = new JSDOM(markup).window.document
    assert.equal(doc.querySelectorAll('[data-betsson-banner="homepage"]').length, 1)
    assert.equal(doc.querySelector('[data-hero-play-free]').getAttribute('href'), `/${segment}/play`)
    assert.equal(doc.querySelectorAll('#game-types a').length, 4)
    assert.deepEqual([...doc.querySelectorAll('[data-original-card]')].map(node => node.getAttribute('data-original-card')),
      ['island-crash', 'capybara-gold', 'blackjack', 'roulette', 'mines'])
    const banner = doc.querySelector('[data-betsson-banner="homepage"]')
    const bannerLink = banner.querySelector('a[href^="/go?"]')
    assert.ok(bannerLink)
    assert.ok(bannerLink.rel.includes('sponsored'))
    assert.ok(banner.textContent.includes(t('affiliate.exploreNamed', { name: 'Betsson' })))
    assert.ok(banner.textContent.includes(t('affiliate.homeBannerBody')))
    if (locale !== 'pt-BR') assert.doesNotMatch(banner.textContent, portuguesePromo)
  }
})

test('existing /go resolver still rejects instant-games while brand resolution stays intact', async () => {
  const source = await readFile(new URL('../app/go/route.ts', import.meta.url), 'utf8')
  assert.match(source, /analyticsAllowed/)
  assert.match(source, /Partner attribution is functional without analytics/)
  assert.equal(resolveDestination({ operatorSlug: partner.slug, country: 'BR', category: 'instant-games' }), null)
  assert.equal(resolveDestination({ operatorSlug: partner.slug, country: 'BR', gameSlug: 'mines' }), null)
  assert.equal(resolveDestination({ operatorSlug: partner.slug, country: 'BR', analyticsAllowed: false })?.url, partner.affiliateUrl.BR)
})
