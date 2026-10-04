import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import featuredModule from '../lib/originals/featured.ts'
import spotlightModule from '../lib/home/spotlight.ts'
import countryModule from '../components/country-context.tsx'
import productModule from '../lib/product-discovery.ts'

const cssHooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) return { format: 'module', shortCircuit: true, source: 'const s = new Proxy({}, { get: (_, k) => String(k) }); export default s;' }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const { SpotlightCarousel } = unwrap(await import('../components/home/spotlight-carousel.tsx'))
const { PlayView } = unwrap(await import('../components/play-view.tsx'))
const { OriginalsDiscoverySection } = unwrap(await import('../components/originals/island-crash-feature.tsx'))
cssHooks.deregister()
const { ORIGINALS_FEATURED_CONFIG, orderFeaturedOriginals, featuredGeo } = featuredModule
const { SPOTLIGHT_GAMES, featuredSpotlightGames } = spotlightModule
const { CountryProvider } = countryModule
const { productCopy } = productModule
const expectedIds = ['island-crash', 'liva-embaixadinha', 'liva-capybara-gold', 'samba-drop', 'skuptu-levanta', 'liva-golaco', 'carnaval-gold', 'liva-blackjack', 'liva-roulette', 'liva-mines', 'liva-raio', 'liva-21-brasil', 'avia-de-janeiro', 'rio-drift']

function wrap(child, { geo = 'MX', locale = `es-${geo}`, preview = null } = {}) {
  return React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: `/${locale.toLowerCase()}/play` },
      React.createElement(CountryProvider, { initialLocale: locale, visitorCountryCode: geo, previewCountryCode: preview }, child)))
}
const render = (child, settings) => new JSDOM(renderToStaticMarkup(wrap(child, settings))).window.document

test('central GEO orders cover the stable registry once and protect both flagship anchors', () => {
  const stable = SPOTLIGHT_GAMES.map(game => ({ ...game }))
  for (const geo of ['MX', 'CO', 'PE', 'ROW']) {
    const ids = ORIGINALS_FEATURED_CONFIG[geo]
    assert.deepEqual(ids, expectedIds, geo)
    assert.equal(new Set(ids).size, SPOTLIGHT_GAMES.length)
    assert.deepEqual([...ids].sort(), SPOTLIGHT_GAMES.map(game => game.id).sort())
    const games = featuredSpotlightGames(geo)
    assert.deepEqual(games.map(game => game.id), ids)
    assert.equal(games[0].title.en, 'Island Crash')
    assert.equal(games[1].title.en, 'Liva Ginga')
    assert.equal(games.at(-1).id, 'rio-drift')
    assert.equal(games.find(game => game.id === 'rio-drift').enabled, false, 'featured priority does not change social eligibility')
  }
  assert.deepEqual(SPOTLIGHT_GAMES, stable, 'sorting never mutates the shared social/discovery registry')
  for (const geo of [undefined, null, 'BR', 'GE', 'ES']) {
    assert.equal(featuredGeo(geo), 'ROW')
    assert.deepEqual(featuredSpotlightGames(geo).map(game => game.id), expectedIds)
  }
  const subset = [{ id: 'rio-drift' }, { id: 'future-a' }, { id: 'liva-embaixadinha' }, { id: 'island-crash' }, { id: 'future-b' }]
  assert.deepEqual(orderFeaturedOriginals(subset, 'CO').map(game => game.id), ['island-crash', 'liva-embaixadinha', 'rio-drift', 'future-a', 'future-b'])
  assert.equal(subset[0].id, 'rio-drift')
})

test('hero, Originals hub and relevant shelves use the same GEO priority without commercial promotion', () => {
  for (const geo of ['MX', 'CO', 'PE']) {
    const settings = { geo }
    const carousel = render(React.createElement(SpotlightCarousel), settings)
    assert.equal(carousel.querySelector('[data-featured-geo]').getAttribute('data-featured-geo'), geo)
    assert.deepEqual([...carousel.querySelectorAll('[data-spotlight-game]')].map(link => link.dataset.spotlightGame), expectedIds)
    assert.equal(carousel.querySelector('[data-spotlight-game]').getAttribute('href'), `/es-${geo.toLowerCase()}/play/crash`)
    const hub = render(React.createElement(PlayView), settings)
    assert.deepEqual([...hub.querySelectorAll('[data-featured-original]')].map(row => row.dataset.featuredOriginal), expectedIds)
    assert.equal(hub.querySelectorAll('[data-original-card]').length, 14)
    assert.equal(hub.querySelector('a[href^="/go?"]'), null)
    assert.equal(hub.querySelector('[data-sponsored-banner]'), null)
    for (const surface of ['home', 'category']) {
      const shelf = render(React.createElement(OriginalsDiscoverySection, { surface }), settings)
      const links = [...shelf.querySelectorAll('[data-original-card]')].map(card => card.querySelector('a').getAttribute('href'))
      assert.deepEqual(links.slice(0, 2), [`/es-${geo.toLowerCase()}/play/crash`, `/es-${geo.toLowerCase()}/play/liva-ginga`])
      const slugs = links.map(href => href.split('/').at(-1))
      const expected = featuredSpotlightGames(geo).filter(game => slugs.includes(game.slug)).map(game => game.slug)
      assert.deepEqual(slugs, expected)
      if (surface === 'category') assert.equal(slugs.at(-1), 'rio-drift', 'Turbo remains below the crash flagships')
    }
  }
})

test('authorized owner preview chooses featured GEO independently from the current language', () => {
  for (const preview of ['MX', 'CO', 'PE']) {
    const doc = render(React.createElement(SpotlightCarousel), { geo: 'BR', locale: 'en', preview })
    assert.equal(doc.querySelector('[data-featured-geo]').getAttribute('data-featured-geo'), preview)
    assert.ok([...doc.querySelectorAll('[data-spotlight-game]')].every(link => link.getAttribute('href').startsWith('/en/play/')))
    assert.equal(doc.querySelector('a[href^="/go?"]'), null)
  }
  const reset = render(React.createElement(SpotlightCarousel), { geo: 'BR', locale: 'es-PE' })
  assert.equal(reset.querySelector('[data-featured-geo]').getAttribute('data-featured-geo'), 'ROW')
  assert.ok(reset.querySelector('[data-spotlight-game]').getAttribute('href').startsWith('/es-pe/play/'))
})

test('hub filters retain flagships first and count the simple Turbo title as crash', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.playliva.com/es-co/play', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node', 'MouseEvent']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  try {
    await act(() => root.render(wrap(React.createElement(PlayView), { geo: 'CO' })))
    const copy = productCopy('es-CO')
    for (const [label, count] of [[copy.crash, 5], [copy.slots, 3], [copy.cards, 4], [copy.instant, 2], [copy.all, 14]]) {
      const button = [...document.querySelectorAll('[role="group"] button')].find(node => node.textContent === label)
      await act(() => button.click())
      const visible = [...document.querySelectorAll('[data-featured-original]')].filter(node => !node.hidden)
      assert.equal(visible.length, count)
      assert.equal(document.querySelector('[role="status"]').textContent, copy.resultCount.replace('{count}', String(count)))
      if (label === copy.crash || label === copy.all) {
        assert.deepEqual(visible.slice(0, 2).map(row => row.dataset.featuredOriginal), expectedIds.slice(0, 2))
        assert.equal(visible.at(-1).dataset.featuredOriginal, 'rio-drift')
      }
    }
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
