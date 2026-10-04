import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readdir } from 'node:fs/promises'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import spotlightModule from '../lib/home/spotlight.ts'
import countryModule from '../components/country-context.tsx'
import productModule from '../lib/product-discovery.ts'
import promoModule from '../lib/affiliates/betsson-promo.ts'
import sessionModule from '../lib/originals/session.ts'
import providerModule from '../components/originals/demo-session.tsx'
import minesConfig from '../lib/originals/mines/config.ts'

const cssHooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) {
    return { format: 'module', shortCircuit: true, source: 'const s = new Proxy({}, { get: (_, k) => String(k) }); export default s;' }
  }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const carouselModule = unwrap(await import('../components/home/spotlight-carousel.tsx'))
const heroModule = unwrap(await import('../components/home/hero.tsx'))
const shellModule = unwrap(await import('../components/originals/play-game-shell.tsx'))
cssHooks.deregister()

const { SPOTLIGHT_GAMES, featuredSpotlightGames, spotlightIndicator } = spotlightModule
const { CountryProvider } = countryModule
const { productCopy } = productModule
const locales = [['pt-BR', 'pt-br'], ['en', 'en'], ['es-MX', 'es-mx']]

function wrap(locale, path, child) {
  return React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: path },
      React.createElement(CountryProvider, { initialLocale: locale, visitorCountryCode: 'MX', commercial: commercialFixture('MX') }, child)))
}
const render = (locale, path, child) => new JSDOM(renderToStaticMarkup(wrap(locale, path, child))).window.document

test('spotlight catalog is data-driven: every playable Original, stable IDs, live poster paths, no engine imports', async () => {
  const routes = (await readdir(new URL('../app/[locale]/play', import.meta.url), { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name !== 'embaixadinha').map(entry => entry.name).sort()
  assert.deepEqual(SPOTLIGHT_GAMES.map(game => game.slug).slice().sort(), routes, 'one slide per playable route')
  assert.equal(new Set(SPOTLIGHT_GAMES.map(game => game.id)).size, routes.length)
  for (const game of SPOTLIGHT_GAMES) {
    assert.equal(game.playPath, `/play/${game.slug}`)
    assert.match(game.poster, /^\/originals\//)
    for (const [locale] of locales) {
      assert.ok(game.title[locale].length > 3)
      assert.ok(game.posterAlt[locale].length > 10)
      assert.ok(game.category[locale].length > 2)
    }
  }
  assert.equal(spotlightIndicator(1, SPOTLIGHT_GAMES.length), `01 / ${String(SPOTLIGHT_GAMES.length).padStart(2, '0')}`)
  assert.equal(spotlightIndicator(3, 12), '03 / 12')
  assert.equal(spotlightIndicator(10, 10), '10 / 10')
})

test('hero spotlight renders N slides with direct, locale-preserving game links and a live 01 / N indicator', () => {
  const total = SPOTLIGHT_GAMES.length
  for (const [locale, segment] of locales) {
    const doc = render(locale, `/${segment}`, React.createElement(heroModule.Hero))
    const carousel = doc.querySelector('[data-spotlight-carousel]')
    assert.ok(carousel)
    assert.equal(carousel.getAttribute('data-spotlight-total'), String(total))
    assert.equal(carousel.getAttribute('data-spotlight-index'), '1')
    assert.equal(carousel.getAttribute('aria-roledescription'), 'carousel')
    assert.equal(carousel.getAttribute('aria-label'), productCopy(locale).spotlightLabel)
    const slides = [...doc.querySelectorAll('[data-spotlight-slide]')]
    assert.equal(slides.length, total, 'dynamic count, never hardcoded')
    assert.equal(doc.querySelector('[data-spotlight-indicator]').textContent, `01 / ${String(total).padStart(2, '0')}`)
    assert.equal(doc.body.textContent.includes('01 / 05') && total !== 5, false)
    slides.forEach((slide, position) => {
      const game = featuredSpotlightGames('MX')[position]
      assert.equal(slide.getAttribute('data-spotlight-slide'), game.slug)
      const link = slide.querySelector('a[data-spotlight-game]')
      assert.equal(link.getAttribute('href'), `/${segment}/play/${game.slug}`, 'exact game, current locale, no generic Games page')
      assert.equal(link.getAttribute('data-spotlight-game'), game.id)
      assert.ok(link.textContent.includes(game.title[locale]))
      assert.ok(link.textContent.includes(productCopy(locale).play))
      assert.ok(link.textContent.includes(spotlightIndicator(position + 1, total)))
      assert.equal(link.querySelector('img').getAttribute('alt'), game.posterAlt[locale])
    })
    assert.ok(doc.querySelector('[data-spotlight-prev]'))
    assert.ok(doc.querySelector('[data-spotlight-next]'))
    assert.equal(doc.querySelectorAll('h1').length, 1)
    assert.equal(doc.querySelector('[data-hero-play-free]').getAttribute('href'), `/${segment}/play`)
    assert.equal(doc.querySelector('[data-hero-explore]').getAttribute('href'), `/${segment}/games`)
    assert.equal(doc.querySelector('[data-spotlight-carousel] a[href^="/go"]'), null)
    assert.ok([...doc.querySelectorAll('[data-spotlight-carousel] a')].every(a => a.getAttribute('href').startsWith('/')), 'internal links only')
  }
})

test('spotlight carousel adapts to a different catalog length and preserves inbound UTMs on game links', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.playliva.com/pt-br?utm_source=tiktok&utm_campaign=spot.1&other=x', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node', 'MouseEvent', 'KeyboardEvent']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  try {
    const games = featuredSpotlightGames('MX', SPOTLIGHT_GAMES.slice(0, 3))
    await act(() => root.render(wrap('pt-BR', '/pt-br', React.createElement(carouselModule.SpotlightCarousel, { games }))))
    const carousel = document.querySelector('[data-spotlight-carousel]')
    assert.equal(carousel.getAttribute('data-spotlight-total'), '3')
    assert.equal(document.querySelectorAll('[data-spotlight-slide]').length, 3)
    assert.equal(document.querySelector('[data-spotlight-indicator]').textContent, '01 / 03')
    for (const link of document.querySelectorAll('a[data-spotlight-game]')) {
      const url = new URL(link.getAttribute('href'), 'https://www.playliva.com')
      assert.match(url.pathname, /^\/pt-br\/play\//)
      assert.equal(url.searchParams.get('utm_source'), 'tiktok')
      assert.equal(url.searchParams.get('utm_campaign'), 'spot.1')
      assert.equal(url.searchParams.get('other'), null, 'only campaign parameters are forwarded')
    }
    // Keyboard navigation moves the live index and wraps.
    const track = carousel.querySelector('div[tabindex="0"]')
    Object.defineProperty(track, 'clientWidth', { value: 390, configurable: true })
    track.scrollTo = ({ left }) => { track.scrollLeft = left }
    await act(() => { carousel.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })) })
    assert.equal(document.querySelector('[data-spotlight-indicator]').textContent, '02 / 03')
    assert.equal(carousel.getAttribute('data-spotlight-index'), '2')
    assert.equal(document.querySelector('[data-spotlight-slide][aria-current="true"]').getAttribute('data-spotlight-slide'), games[1].slug)
    await act(() => { document.querySelector('[data-spotlight-next]').click() })
    await act(() => { document.querySelector('[data-spotlight-next]').click() })
    assert.equal(document.querySelector('[data-spotlight-indicator]').textContent, '01 / 03', 'wraps after the last item')
    await act(() => { document.querySelector('[data-spotlight-prev]').click() })
    assert.equal(document.querySelector('[data-spotlight-indicator]').textContent, '03 / 03', 'wraps back to the last item')
    // A mouse drag beyond the threshold must not navigate; a plain click keeps its default.
    let navigated = 0
    const link = document.querySelector('a[data-spotlight-game]')
    link.addEventListener('click', event => { if (!event.defaultPrevented) navigated += 1; event.preventDefault() })
    const pointer = (type, x) => {
      // JSDOM has no PointerEvent; a MouseEvent with pointer fields exercises the same React handlers.
      const event = new window.MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x })
      Object.defineProperty(event, 'pointerId', { value: 1 })
      Object.defineProperty(event, 'pointerType', { value: 'mouse' })
      track.dispatchEvent(event)
    }
    await act(() => { pointer('pointerdown', 100); pointer('pointermove', 60); pointer('pointerup', 60) })
    await act(() => { link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })) })
    assert.equal(navigated, 0, 'drag suppresses the click')
    await act(() => new Promise(resolve => setTimeout(resolve, 5)))
    await act(() => { pointer('pointerdown', 100); pointer('pointermove', 103); pointer('pointerup', 103) })
    await act(() => { link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })) })
    assert.equal(navigated, 1, 'a tap within the threshold navigates')
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

test('engagement popup uses configured copy while compact header omits detailed terms', async () => {
  const fixture=commercialFixture('MX')
  for (const [locale, segment] of locales) {
    const expected = fixture.campaigns[0].copy[locale]
    const model = promoModule.getBetssonPromo('MX', locale, 'originals_engagement_offer', { pageSlug: 'mines', snapshot:fixture })
    assert.deepEqual(model.engagementCopy, expected)
    assert.equal(model.headline,expected.headline)
    const dom = new JSDOM('<div id="root"></div>', { url: `https://www.playliva.com/${segment}/play/mines`, virtualConsole: new VirtualConsole() })
    const saved = new Map()
    for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node', 'KeyboardEvent']) {
      saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
      Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
    }
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    const root = createRoot(document.getElementById('root'))
    const store = sessionModule.createDemoSessionStore(() => window.localStorage, () => 1)
    const game = minesConfig.LIVA_MINES
    const mount = roundActive => act(() => root.render(wrap(locale, `/${segment}/play/mines`,
      React.createElement(providerModule.DemoSessionProvider, { store },
        React.createElement(shellModule.PlayGameShell, { game, roundActive, controls: React.createElement('button', {}, 'Start') },
          React.createElement('div', {}, 'viewport'))))))
    try {
      await mount(false)
      for (let cycle = 1; cycle <= 3; cycle += 1) { await mount(true); await mount(false) }
      await act(() => new Promise(resolve => setTimeout(resolve, fixture.campaigns[0].cadence.delayMs + 80)))
      const dialog = document.querySelector('[data-engagement-offer] [role="dialog"]')
      assert.ok(dialog, locale)
      assert.equal(dialog.querySelector('h2').textContent, expected.headline)
      assert.equal(dialog.querySelector('[data-promo-condition]').textContent, expected.condition)
      assert.equal(dialog.querySelector('a[data-promo-cta]').textContent, expected.cta)
      assert.match(dialog.querySelector('a[data-promo-cta]').getAttribute('href'), /^\/go\?.*offer=test-offer-mx/)
      assert.ok(dialog.querySelector('[data-commercial-disclosure]'))
      assert.equal(dialog.getAttribute('aria-describedby'), dialog.querySelector('[data-promo-condition]').id)
      const header = document.querySelector('[data-sponsored-banner="originals"]')
      assert.ok(header.textContent.includes(expected.headline))
      assert.equal(header.textContent.includes(expected.condition), false, `${locale}: detailed terms only inside popup`)
    } finally {
      await act(() => root.unmount())
      dom.window.close()
      for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
      delete globalThis.IS_REACT_ACT_ENVIRONMENT
    }
  }
})
