import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import countryModule from '../components/country-context.tsx'
import providerModule from '../components/originals/demo-session.tsx'
import sessionModule from '../lib/originals/session.ts'
import engineModule from '../lib/originals/roulette/engine.ts'
import presentationModule from '../lib/originals/roulette/presentation.ts'
const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = Object.fromEntries(["game","stage","wheel","controls","reveal","stack"].map(k=>[k,k]))' }
  return next(url, context)
} })
const gameModule = await import('../components/originals/roulette/roulette-game.tsx')
const RouletteGame = gameModule.RouletteGame ?? gameModule.default?.RouletteGame
async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.invalid/pt-br/play/roulette', virtualConsole: new VirtualConsole() })
  const saved = new Map(), frames = new Map(); let sequence = 0
  const overrides = { window: dom.window, self: dom.window, document: dom.window.document, location: dom.window.location, navigator: dom.window.navigator,
    Event: dom.window.Event, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node,
    requestAnimationFrame: fn => { frames.set(++sequence, fn); return sequence }, cancelAnimationFrame: id => frames.delete(id) }
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
  for (const [key, value] of Object.entries(overrides)) { saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, value }) }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root')), draw = () => { const current = [...frames.values()]; frames.clear(); current.forEach(fn => fn()) }
  try { await run(root, draw) } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
}
function harness(number = 23) {
  let at = 0, serial = 0
  const wallet = sessionModule.createDemoSessionStore(() => window.localStorage)
  const now = () => at, engine = engineModule.createRouletteEngine(wallet, { now, id: () => `roulette-ui-${++serial}`, random: { uint32: () => number } })
  const advance = ms => act(() => { at += ms; engine.tick() })
  return { wallet, engine, advance, now }
}
const click = selector => act(() => { const node = typeof selector === 'string' ? document.querySelector(selector) : selector; assert.ok(node); node.click() })
const button = name => document.querySelector(`[data-roulette-${name}]`)
function tree(h, locale = 'pt-BR') {
  return React.createElement(React.StrictMode, {}, React.createElement(AppRouterContext.Provider, { value: { push() {}, replace() {} } },
    React.createElement(PathnameContext.Provider, { value: '/pt-br/play/roulette' },
      React.createElement(countryModule.CountryProvider, { initialLocale: locale }, React.createElement(providerModule.DemoSessionProvider, { store: h.wallet },
        React.createElement(RouletteGame, { suppliedEngine: h.engine, presentationNow: h.now }))))))
}
test('Roulette mounted: chosen chip, stacking, Undo/Clear, debit once, freeze, exact ball and single return', async () => withDom(async (root, draw) => {
  const h = harness()
  await act(() => root.render(tree(h)))
  assert.equal(document.querySelector('[data-roulette-game]').getAttribute('data-ready'), 'true')
  assert.equal(button('spin').disabled, true)
  assert.equal(h.wallet.getSnapshot().session.settings.sound, false)
  for (const p of document.querySelectorAll('[data-pocket] path')) assert.doesNotMatch(p.getAttribute('d'), /\.\d{5}/, 'SVG coordinates are hydration-safe across trig implementations')
  await click('[data-bet="straight:23"]'); await click('[data-bet="straight:23"]')
  assert.equal(button('stake').textContent, '20,00'); assert.equal(h.wallet.getSnapshot().session.transactions.length, 0)
  assert.match(document.querySelector('[data-bet="straight:23"]').getAttribute('aria-label'), /20,00/)
  await click(button('undo')); assert.equal(button('stake').textContent, '10,00')
  await click(button('clear')); assert.equal(button('stake').textContent, '0,00')
  const chip = document.querySelector('[data-roulette-chip]')
  await act(() => { chip.value = '500'; chip.dispatchEvent(new Event('change', { bubbles: true })) })
  await click('[data-bet="straight:23"]'); await click('[data-bet="red:red"]'); await click('[data-bet="black:black"]')
  await act(() => { button('spin').click(); button('spin').click() })
  assert.equal(h.engine.getSnapshot().phase, 'closing')
  assert.ok([...document.querySelectorAll('[data-bet]')].every(b => b.disabled))
  assert.equal(document.querySelector('[data-result-number]'), null, 'no future outcome in result UI')
  assert.equal(document.querySelector('[data-roulette-wheel]').getAttribute('aria-label'), 'Roda de roleta europeia')
  assert.equal(h.wallet.getSnapshot().session.transactions.length, 1)
  await h.advance(3960); draw()
  assert.equal(document.querySelector('[data-result-number]').textContent, '23')
  const rotor = document.querySelector('[data-wheel-rotor]'), ball = document.querySelector('[data-roulette-ball]')
  const wheelAngle = Number(rotor.getAttribute('transform').match(/rotate\(([-\d.]+)/)[1])
  const ballAngle = Math.atan2(Number(ball.getAttribute('cx')) - 200, 200 - Number(ball.getAttribute('cy'))) * 180 / Math.PI
  assert.equal(presentationModule.pocketUnderBall(wheelAngle, ballAngle), 23)
  assert.equal(document.querySelectorAll('[data-pocket][data-winning]').length, 1)
  assert.equal(document.querySelector('[data-pocket][data-winning]').getAttribute('data-pocket'), '23')
  await h.advance(120); await h.advance(100)
  assert.deepEqual(h.wallet.getSnapshot().session.transactions.map(t => [t.kind,t.amount]), [['debit',1500],['credit',19000]])
  assert.match(document.querySelector('[data-roulette-reveal]').textContent, /190,00/)
  await h.advance(1000); assert.equal(button('repeat').disabled, false)
  await click(button('repeat')); assert.equal(button('stake').textContent, '15,00')
  assert.equal(h.wallet.getSnapshot().session.transactions.length, 2)
  assert.equal(document.querySelector('a[href^="/go?"]'), null)
  assert.equal(document.querySelector('[data-operator-cta="play-real"]'), null)
  assert.equal(document.querySelector('[data-betsson-banner]'), null)
}))
test('Roulette mounted: precise paged Split/Corner/first-four selection and insufficient reservations', async () => withDom(async root => {
  const h = harness(0)
  await act(() => root.render(tree(h)))
  await click('[data-mode="inside"]')
  await click('[data-bet="split:0-1"]')
  const select = document.querySelector('[data-roulette-table] select')
  await act(() => { select.value = 'corner'; select.dispatchEvent(new Event('change', { bubbles: true })) })
  await click('[data-bet="corner:1-2-4-5"]')
  await act(() => { select.value = 'first-four'; select.dispatchEvent(new Event('change', { bubbles: true })) })
  await click('[data-bet="first-four:0-1-2-3"]')
  assert.deepEqual(h.engine.getSnapshot().placements.map(b => b.betId), ['split:0-1','corner:1-2-4-5','first-four:0-1-2-3'])
  await click(button('spin')); await h.advance(4080)
  assert.equal(document.querySelector('[data-result-number]').textContent, '0')
  assert.match(document.querySelector('[data-roulette-reveal]').textContent, /Verde · Zero/)
  assert.equal(h.engine.getSnapshot().result.returned, 27000)
  await h.advance(1000); await click(button('clear'))
  await act(() => h.wallet.debit(h.wallet.getSnapshot().session.balance - 500))
  await click('[data-bet="first-four:0-1-2-3"]')
  assert.match(document.querySelector('[role="alert"]').textContent, /insuficientes/)
  assert.equal(button('stake').textContent, '0,00')
}))
test('Roulette mounted: complete loss shows zero return without credit; interrupted unmount never refunds', async () => withDom(async root => {
  const h = harness(0)
  await act(() => root.render(tree(h))); await click('[data-bet="red:red"]'); await click(button('spin')); await h.advance(4080)
  assert.match(document.querySelector('[data-roulette-reveal]').textContent, /Sem prêmio/)
  assert.equal(h.wallet.getSnapshot().session.transactions.length, 1)
  await h.advance(1000); await click(button('repeat')); await click(button('spin'))
  await act(() => root.render(null)); await h.advance(10000)
  assert.equal(h.wallet.getSnapshot().session.balance, 998000)
  assert.equal(h.wallet.getSnapshot().session.transactions.length, 2)
  assert.equal(h.engine.getSnapshot().phase, 'betting'); assert.equal(h.wallet.reset().ok, true)
}))
test.after(() => hooks.deregister())
