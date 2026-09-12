import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM, VirtualConsole } from 'jsdom'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import countryModule from '../components/country-context.tsx'
import providerModule from '../components/originals/demo-session.tsx'
import shellModule from '../components/originals/play-game-shell.tsx'
import sessionModule from '../lib/originals/session.ts'
import analyticsModule from '../lib/originals/analytics.ts'
import consentModule from '../lib/consent.ts'
const { CountryProvider, useCountry } = countryModule
const { DemoSessionProvider } = providerModule
const { PlayGameShell } = shellModule
const { createDemoSessionStore } = sessionModule
const { trackFreePlay } = analyticsModule
const { saveConsent } = consentModule

// This harness is never registered as a route or a public game.
const game = { id: 'test-only', slug: 'test-only', category: 'crash',
  title: { en: 'Shell test', 'pt-BR': 'Teste', 'es-MX': 'Prueba' } }
const context = { originalId: game.id, originalSlug: game.slug, category: game.category, country: 'BR', locale: 'en' }
function MarketControl() {
  const { setCountryCode } = useCountry()
  return React.createElement('button', { onClick: () => setCountryCode('MX') }, 'Test MX')
}

test('test-only shell: wallet/settings/reset, consent-aware events, truthful Play Real, and market change', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://site.example.invalid/en/play/test-only?private=excluded', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  const priorObserver = globalThis.IntersectionObserver
  const observers = []
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe() {}
    disconnect() {}
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  const store = createDemoSessionStore(() => window.localStorage, () => 1234)
  const button = text => [...document.querySelectorAll('button')].find(b => b.textContent === text)
  const click = async node => {
    assert.ok(node)
    await act(() => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })))
  }
  const render = async (roundActive = false) => act(() => root.render(
    React.createElement(AppRouterContext.Provider, { value: { push() {} } },
      React.createElement(PathnameContext.Provider, { value: '/en/play/test-only' },
        React.createElement(CountryProvider, { initialLocale: 'en' },
          React.createElement(DemoSessionProvider, { store },
            React.createElement(PlayGameShell, { game, roundActive, controls: React.createElement('button', {}, 'Test control') },
              React.createElement('div', {}, 'Test viewport only')),
            React.createElement(MarketControl)))))))
  try {
    saveConsent({ necessary: true, analytics: false, marketing: false })
    await render()
    assert.ok(document.body.textContent.includes('10,000.00 Liva Credits'))
    assert.ok(document.body.textContent.includes('FREE PLAY'))
    assert.ok(document.body.textContent.includes('DEMO'))
    assert.ok(document.body.textContent.includes('Virtual credits have no monetary value'))
    assert.ok(document.body.textContent.includes('does not mean this PlayLiva Original is available there'))
    assert.equal(document.querySelector('input[type="number"]'), null)
    assert.equal(button('Haptics'), undefined)
    assert.equal(button('Fullscreen'), undefined)
    await click(button('Sound'))
    assert.equal(store.getSnapshot().session.settings.sound, true)
    await act(() => store.debit(2000))
    await click(button('Reset Balance'))
    await click(button('Cancel'))
    assert.equal(store.getSnapshot().session.balance, 998000)
    await click(button('Reset Balance'))
    await click(button('Reset'))
    assert.equal(store.getSnapshot().session.balance, 1000000)
    await render(true)
    assert.equal(button('Reset Balance').disabled, true)
    await render(false)

    const link = document.querySelector('a[href^="/go?"]')
    assert.ok(link)
    const href = link.getAttribute('href')
    assert.equal(new URL(href, location.href).searchParams.has('game'), false)
    link.addEventListener('click', event => event.preventDefault())
    observers.forEach(observer => observer.callback([{ isIntersecting: true }]))
    await click(link)
    const events = ['free_play_open', 'demo_round_start', 'demo_round_complete', 'demo_balance_reset', 'play_real_view', 'play_real_click']
    for (const event of events) trackFreePlay(event, context)
    assert.equal(window.dataLayer, undefined, 'rejected analytics blocks every Originals event')
    assert.equal(link.getAttribute('href'), href, 'functional affiliate link survives rejection')

    saveConsent({ necessary: true, analytics: true, marketing: false })
    for (const event of events) trackFreePlay(event, { ...context, privateData: 'must-not-be-sent' })
    assert.deepEqual(window.dataLayer.map(item => item.event), events)
    assert.ok(window.dataLayer.every(item => !item.url.includes('?') && !('privateData' in item) && !('balance' in item)))
    await click(link)
    assert.equal(window.dataLayer.at(-1).event, 'play_real_click')
    const count = window.dataLayer.length
    saveConsent({ necessary: true, analytics: false, marketing: false })
    for (const event of events) trackFreePlay(event, context)
    await click(link)
    assert.equal(window.dataLayer.length, count, 'revocation blocks subsequent events')
    assert.equal(link.getAttribute('href'), href)
    await click(button('Test MX'))
    assert.equal(document.querySelector('a[href^="/go?"]'), null)
    assert.ok(document.body.textContent.includes('No approved operators'))
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
    globalThis.IntersectionObserver = priorObserver
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
