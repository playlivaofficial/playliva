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
import engineModule from '../lib/originals/mines/engine.ts'
const hooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) {
    return { format: 'module', shortCircuit: true, source: 'const s = new Proxy({}, { get: (_, k) => String(k) }); export default s;' }
  }
  return next(url, context)
} })
const gameModule = await import('../components/originals/mines/mines-game.tsx')
const MinesGame = gameModule.MinesGame ?? gameModule.default?.MinesGame
async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.invalid/pt-br/play/mines', virtualConsole: new VirtualConsole() })
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
function harness() {
  let at = 0, serial = 0
  const wallet = sessionModule.createDemoSessionStore(() => window.localStorage)
  const now = () => at, engine = engineModule.createMinesEngine(wallet, { now, id: () => `mines-ui-${++serial}`, random: { uint32: () => 0 } })
  const advance = ms => act(() => { at += ms; engine.tick() })
  return { wallet, engine, advance, now }
}
const click = selector => act(() => { const node = typeof selector === 'string' ? document.querySelector(selector) : selector; assert.ok(node); node.click() })
const button = name => document.querySelector(`[data-mines-${name}]`)
function tree(h, locale = 'pt-BR') {
  return React.createElement(React.StrictMode, {}, React.createElement(AppRouterContext.Provider, { value: { push() {}, replace() {} } },
    React.createElement(PathnameContext.Provider, { value: `/${locale.toLowerCase()}/play/mines` },
      React.createElement(countryModule.CountryProvider, { initialLocale: locale }, React.createElement(providerModule.DemoSessionProvider, { store: h.wallet },
        React.createElement(MinesGame, { suppliedEngine: h.engine }))))))
}

test('Mines mounted: 25 hidden tiles, immediate safe trail, single debit and live cashout, no unapproved link', async () => withDom(async root => {
  const h = harness(); await act(() => root.render(tree(h)))
  assert.equal(document.querySelector('[data-mines-game]').dataset.ready,'true')
  assert.equal(document.querySelectorAll('[data-tile]').length,25)
  assert.equal(h.wallet.getSnapshot().session.settings.sound,false)
  await act(() => { button('start').click(); button('start').click() })
  assert.equal(h.wallet.getSnapshot().session.transactions.length,1)
  assert.equal(document.querySelectorAll('[data-mine]').length,0)
  assert.equal(button('cash').disabled,true)
  assert.equal(button('count').disabled,true)
  await click('[data-tile="3"]'); await click('[data-tile="9"]'); await click('[data-tile="3"]')
  assert.deepEqual(h.engine.getSnapshot().safe,[3,9])
  assert.equal(document.querySelector('[data-treasure-trail]').dataset.safeCount,'2')
  assert.equal(document.querySelectorAll('[data-safe]').length,2)
  assert.match(button('cash').textContent,/12,59/)
  await act(() => { button('cash').click(); button('cash')?.click() })
  assert.deepEqual(h.wallet.getSnapshot().session.transactions.map(t=>[t.kind,t.amount]),[['debit',1000],['credit',1259]])
  assert.match(button('hud').textContent,/Tesouro garantido/)
  assert.equal(document.querySelectorAll('[data-tile]:not(:disabled)').length,0)
  await h.advance(599); assert.equal(button('start').disabled,true)
  await h.advance(1); assert.equal(button('start').disabled,false)
  const banner = document.querySelector('[data-betsson-banner="originals"]')
  assert.ok(banner)
  assert.ok(banner.closest('[data-originals-sponsor]'))
  assert.ok(banner.querySelector('a[href^="/go?"]'))
  assert.match(banner.querySelector('a[href^="/go?"]').getAttribute('href'), /placement=originals_header/)
  assert.equal(document.querySelector('[data-operator-cta="play-real"]'), null)
  assert.equal(document.querySelector('a[href*="betsson."]'), null)
  const viewport = document.querySelector('[data-game-viewport]')
  const controls = document.querySelector('[data-game-controls]')
  const unit = document.querySelector('[data-game-unit]')
  assert.equal(Boolean(banner.compareDocumentPosition(viewport) & 4), true)
  assert.equal(Boolean(viewport.compareDocumentPosition(controls) & 4), true)
  assert.equal(unit.querySelector('[data-operator-cta], [data-betsson-banner], a[href^="/go"]'), null)
}))
test('Mines mounted: mine hit is immediate, no trail on mines and no credit, repeat and reload keep debit spent', async () => withDom(async root => {
  const h=harness(); await act(()=>root.render(tree(h,'es-MX')))
  await click(button('start')); await click('[data-tile="0"]')
  assert.match(button('hud').textContent,/Encontraste una mina/)
  assert.equal(document.querySelectorAll('[data-mine]').length,3)
  assert.equal(document.querySelectorAll('[data-safe]').length,0)
  assert.equal(h.wallet.getSnapshot().session.transactions.length,1)
  await h.advance(600); await click(button('start')); await click('[data-tile="3"]')
  await act(()=>root.render(null)); await h.advance(10000)
  assert.equal(h.wallet.getSnapshot().session.balance,998000)
  assert.equal(h.wallet.getSnapshot().session.transactions.length,2)
  const next=engineModule.createMinesEngine(h.wallet)
  assert.equal(next.getSnapshot().phase,'ready')
  assert.equal(next.getSnapshot().safe.length,0)
}))
test('Mines mounted: mine/stake selectors, all-safe automatic secure, and insufficient funds', async () => withDom(async root => {
  const h=harness(); await act(()=>root.render(tree(h,'en')))
  for(const [name,value] of [['count','10'],['stake','5000']]) {
    const select=button(name); await act(()=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}))})
  }
  await click(button('start')); assert.equal(h.engine.getSnapshot().mineCount,10); assert.equal(h.engine.getSnapshot().stake,5000)
  for(let i=10;i<25;i++) await click('[data-tile="'+i+'"]')
  assert.equal(h.engine.getSnapshot().phase,'cashed_out')
  assert.equal(document.querySelector('[data-treasure-trail]').dataset.safeCount,'15')
  assert.match(button('hud').textContent,/3,170,697.20×/)
  assert.match(button('hud').textContent,/158,534,860.00/)
  await h.advance(600)
  await act(()=>h.wallet.debit(h.wallet.getSnapshot().session.balance-50))
  await click(button('start'))
  assert.match(document.querySelector('[role="alert"]').textContent,/Not enough/)
  assert.equal(h.engine.getSnapshot().phase,'ready')
}))
test.after(()=>hooks.deregister())
