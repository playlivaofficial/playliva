import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import productModule from '../lib/product-discovery.ts'
import dataModule from '../lib/data.ts'
import countryModule from '../components/country-context.tsx'
import blackjackModule from '../lib/originals/blackjack/definition.ts'
const { productCopy, discoveryCategory, DISCOVERY_ORDER } = productModule
const cssHooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = {}' }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const { Hero } = unwrap(await import('../components/home/hero.tsx'))
const { PlayView } = unwrap(await import('../components/play-view.tsx'))
const { GamesExplorer } = unwrap(await import('../components/games-explorer.tsx'))
cssHooks.deregister()
const locales = [['en', 'en'], ['pt-BR', 'pt-br'], ['es-MX', 'es-mx']]
const wrap = (locale, path, child) => React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
  React.createElement(PathnameContext.Provider, { value: path },
    React.createElement(countryModule.CountryProvider, { initialLocale: locale, visitorCountryCode: 'BR' }, child)))

test('redesign: complete localized interface copy, neutral discovery and no new commercial claims', () => {
  for (const [locale] of locales) {
    const copy = productCopy(locale)
    assert.deepEqual(Object.keys(copy), Object.keys(productCopy('en')))
    assert.ok(Object.values(copy).every(value => value.trim().length > 0))
    assert.doesNotMatch(JSON.stringify(copy), /Betsson|bonus offer|guaranteed win|easy money|ganho garantido|dinheiro fácil/i)
    if (locale !== 'en') for (const key of ['heroLead', 'heroAccent', 'heroDescription', 'play', 'explore', 'hubSub', 'trustTitle', 'noLiveDealer']) assert.notEqual(copy[key], productCopy('en')[key])
  }
})
test('redesign: Blackjack display taxonomy changes without changing protected game or referral classifications', () => {
  const game = dataModule.getGame('blackjack-live'), original = blackjackModule.LIVA_BLACKJACK
  assert.equal(discoveryCategory(game), 'live-casino')
  assert.equal(game.category, 'table-games')
  assert.equal(original.category, 'table-games')
  assert.equal(game.affiliateCategory, 'live-casino')
  assert.deepEqual(DISCOVERY_ORDER.slice(0, 4), ['slots', 'crash', 'live-casino', 'instant-games'])
  for (const other of dataModule.GAMES.filter(g => g.slug !== game.slug)) assert.equal(discoveryCategory(other), other.category)
})
test('redesign: hero has two clear localized internal actions and one existing Original spotlight', () => {
  for (const [locale, segment] of locales) {
    const dom = new JSDOM(renderToStaticMarkup(wrap(locale, `/${segment}`, React.createElement(Hero))))
    const doc = dom.window.document
    assert.equal(doc.querySelectorAll('h1').length, 1)
    assert.equal(doc.querySelector('[data-hero-play-free]').getAttribute('href'), `/${segment}/play`)
    assert.equal(doc.querySelector('[data-hero-explore]').getAttribute('href'), `/${segment}/games`)
    assert.equal(doc.querySelector('a[href$="/play/crash"]').getAttribute('href'), `/${segment}/play/crash`)
    const httpsLinks = [...doc.querySelectorAll('a[href^="https:"]')]
    assert.ok(httpsLinks.every(link =>
      link.closest('[data-hero-sponsor]') && /^https:\/\/www\.gov\.br\//.test(link.getAttribute('href'))))
    assert.doesNotMatch(doc.body.innerHTML, /https?:\/\/(?:www\.)?betsson/i)
    const goLinks = [...doc.querySelectorAll('a[href^="/go"]')]
    assert.equal(goLinks.length, 0, 'Deprecated Brazil promotion remains suppressed')
    assert.ok(goLinks.every(link => link.closest('[data-hero-sponsor]')))
    assert.equal(doc.querySelector('[data-hero-sponsor] [data-betsson-banner="homepage"]'), null)
    dom.window.close()
  }
})
test('redesign: all fourteen implemented Originals remain localized, distinct and truthful in the lobby', () => {
  for (const [locale, segment] of locales) {
    const dom = new JSDOM(renderToStaticMarkup(wrap(locale, `/${segment}/play`, React.createElement(PlayView))))
    const doc = dom.window.document
    assert.deepEqual([...doc.querySelectorAll('[data-original-card]')].map(e => e.dataset.originalCard), ['rio-drift', 'avia-de-janeiro', 'samba-drop', 'skuptu-levanta', 'carnaval-gold', 'island-crash', 'liva-ginga', 'capybara-gold', 'golaco', 'blackjack', 'roulette', 'mines', 'liva-raio', 'liva-21-brasil'])
    for (const slug of ['crash', 'liva-ginga', 'capybara-gold', 'golaco', 'blackjack', 'roulette', 'mines', 'liva-raio', 'liva-21-brasil']) assert.ok(doc.querySelector(`a[data-play-free][href="/${segment}/play/${slug}"]`))
    assert.ok(doc.querySelector('[data-original-card="blackjack"]').textContent.includes(productCopy(locale).noLiveDealer))
    assert.equal(doc.querySelector('[data-provider-card]'), null)
    assert.equal(doc.querySelector('[data-original-card] a[href^="/go"]'), null)
    assert.equal(doc.querySelector('[data-betsson-banner="play"] a[href^="/go"]'), null)
    assert.equal(doc.querySelector('[role="group"] button[aria-pressed="true"]').textContent, productCopy(locale).all)
    dom.window.close()
  }
})

async function mounted(Component, run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.invalid/pt-br/play', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  const click = async label => {
    const node = [...document.querySelectorAll('button')].find(b => b.textContent === label)
    assert.ok(node, label)
    await act(() => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true })))
  }
  try {
    await act(() => root.render(wrap('pt-BR', '/pt-br/play', React.createElement(Component))))
    await run(click)
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
}
test('redesign: lobby filters expose the right games, announce counts, and restore all Originals', async () => {
  await mounted(PlayView, async click => {
    const visible = () => [...document.querySelectorAll('[data-filter] > div:not([hidden]) [data-original-card]')].map(e => e.dataset.originalCard)
    await click('Cartas e roleta')
    assert.deepEqual(visible(), ['blackjack', 'roulette', 'liva-raio', 'liva-21-brasil'])
    assert.ok(document.querySelector('[role="status"]').textContent.includes('4'))
    await click('Jogos instantâneos'); assert.deepEqual(visible(), ['samba-drop', 'mines'])
    await click(productCopy('pt-BR').crash); assert.deepEqual(visible(), ['avia-de-janeiro', 'skuptu-levanta', 'island-crash', 'liva-ginga'])
    await click(productCopy('pt-BR').slots); assert.deepEqual(visible(), ['carnaval-gold', 'capybara-gold', 'golaco'])
    await click('Arcade'); assert.deepEqual(visible(), ['rio-drift'])
    await click('Todos os Originals'); assert.equal(visible().length, 14)
  })
})
test('redesign: provider explorer places Blackjack Live with live catalog entries, never with free-play Originals', async () => {
  await mounted(GamesExplorer, async click => {
    await click('Cassino ao Vivo')
    const slugs = [...document.querySelectorAll('[data-provider-card]')].map(e => e.dataset.providerCard)
    assert.deepEqual(slugs.sort(), ['blackjack-live', 'crazy-time', 'lightning-roulette'])
    assert.equal(document.querySelector('[data-original-card], a[href*="/play/"]'), null)
  })
})
