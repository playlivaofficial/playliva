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
import engineModule from '../lib/originals/blackjack/engine.ts'
const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = Object.fromEntries(["table","game","card","hand","cards","result","controls"].map(k=>[k,k]))' }
  return next(url, context)
} })
const gameModule = await import('../components/originals/blackjack/blackjack-game.tsx')
const tableModule = await import('../components/originals/blackjack/blackjack-table.tsx')
const BlackjackGame = gameModule.BlackjackGame ?? gameModule.default?.BlackjackGame
const BlackjackTable = tableModule.BlackjackTable ?? tableModule.default?.BlackjackTable

async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.invalid/pt-br/play/blackjack', virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  try { await run(root) } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
}
function harness(ranks) {
  let at = 0, cursor = 0
  const wallet = sessionModule.createDemoSessionStore(() => window.localStorage)
  const engine = engineModule.createBlackjackEngine(wallet, { now: () => at, id: () => 'ui-blackjack',
    shoe: { beginRound() {}, draw() { const rank = ranks.split(' ')[cursor]; assert.ok(rank); return Object.freeze({ id: `card-${cursor++}`, rank, suit: 'spades' }) } } })
  const advance = async () => act(() => { at += 1000; engine.tick() })
  const until = async phase => { for (let i = 0; i < 30 && engine.getSnapshot().phase !== phase; i++) await advance(); assert.equal(engine.getSnapshot().phase, phase) }
  return { wallet, engine, advance, until }
}
const click = node => act(() => { assert.ok(node); node.click() })
const action = name => document.querySelector(`[data-blackjack-action="${name}"]`)
function tree(h) {
  return React.createElement(React.StrictMode, {}, React.createElement(AppRouterContext.Provider, { value: { push() {}, replace() {} } },
    React.createElement(PathnameContext.Provider, { value: '/pt-br/play/blackjack' },
      React.createElement(countryModule.CountryProvider, { initialLocale: 'pt-BR' },
        React.createElement(providerModule.DemoSessionProvider, { store: h.wallet }, React.createElement(BlackjackGame, { suppliedEngine: h.engine }))))))
}

test('Blackjack mounted game: Strict Mode, hidden hole, immediate busy controls, legal Double and exact one-time accounting', async () => withDom(async root => {
  const h = harness('5 9 6 8 K')
  await act(() => root.render(tree(h)))
  assert.equal(document.querySelector('[data-blackjack-game]').getAttribute('data-ready'), 'true')
  assert.ok(document.body.textContent.includes('Distribuir'))
  await click(document.querySelector('[data-blackjack-deal]'))
  assert.ok([...document.querySelectorAll('[data-blackjack-action]')].every(b => b.disabled))
  assert.equal(document.querySelectorAll('[data-card]').length, 0, 'idle card backs do not flash during the initial deal')
  await h.advance()
  assert.equal(document.querySelectorAll('[data-card]').length, 1, 'first player card appears before any dealer card')
  await h.until('player_turn')
  assert.equal(document.querySelector('[data-dealer-total]').textContent, '9 + ?')
  assert.equal(document.querySelectorAll('[data-card="hidden"]').length, 1)
  assert.equal(document.querySelectorAll('[data-card="8-spades"]').length, 0)
  assert.equal(action('double').disabled, false); assert.equal(action('split').disabled, true)
  await act(() => { action('double').click(); action('double').click() })
  await h.until('result')
  assert.deepEqual(h.wallet.getSnapshot().session.transactions.map(t => [t.kind, t.amount]), [['debit', 1000], ['debit', 1000], ['credit', 4000]])
  assert.ok(document.querySelector('[role="status"]').textContent.includes('40,00'))
  await h.until('ready'); assert.ok(document.querySelector('[data-blackjack-deal]').textContent.includes('Nova mão'))
  assert.equal(document.querySelector('a[href^="/go?"]'), null)
  assert.equal(document.querySelector('[data-operator-cta="play-real"]'), null)
  assert.equal(document.querySelector('[data-betsson-banner]'), null)
}))
test('Blackjack mounted game: split active hand, per-hand stakes, previous states and independent results', async () => withDom(async root => {
  const h = harness('8 10 8 7 3 2 K')
  await act(() => root.render(tree(h))); await click(document.querySelector('[data-blackjack-deal]')); await h.until('player_turn')
  await click(action('split')); await h.advance()
  assert.equal(document.querySelectorAll('[data-hand]').length, 2)
  assert.equal(document.querySelector('[data-active]').getAttribute('data-hand'), '0')
  await click(action('double')); await h.advance()
  assert.equal(document.querySelector('[data-active]').getAttribute('data-hand'), '1')
  assert.ok(document.querySelector('[data-hand="0"]').textContent.includes('20,00'))
  await click(action('stand')); await h.until('result')
  assert.equal(document.querySelectorAll('[data-outcome="win"]').length, 1)
  assert.equal(document.querySelectorAll('[data-outcome="loss"]').length, 1)
  assert.ok(document.querySelector('[data-hand="0"]').textContent.includes('40,00'))
  assert.ok(document.querySelector('[data-hand="1"]').textContent.includes('0,00'))
}))
test('Blackjack mounted game: unmount mid-hand abandons without refund or residue', async () => withDom(async root => {
  const h = harness('8 10 8 7')
  await act(() => root.render(tree(h))); await click(document.querySelector('[data-blackjack-deal]')); await h.until('player_turn')
  await act(() => root.render(null)); await h.advance()
  assert.equal(h.wallet.getSnapshot().session.balance, 999000)
  assert.equal(h.wallet.getSnapshot().session.transactions.length, 1)
  assert.equal(h.engine.getSnapshot().phase, 'ready')
  assert.equal(h.wallet.reset().ok, true)
}))
test('Blackjack table: three hand totals and per-hand returns remain explicit in every locale', async () => withDom(async root => {
  const h = harness('8 10 8 7 8 8 3 2 K 9')
  h.engine.deal(1000); await h.until('player_turn')
  h.engine.act('split', h.engine.getSnapshot().revision); await h.advance()
  h.engine.act('split', h.engine.getSnapshot().revision); await h.advance()
  for (let i = 0; i < 3; i++) { h.engine.act('stand', h.engine.getSnapshot().revision); await h.advance() }
  await h.until('result')
  for (const locale of ['en', 'pt-BR', 'es-MX']) {
    await act(() => root.render(React.createElement(BlackjackTable, { round: h.engine.getSnapshot(), locale })))
    assert.equal(document.querySelectorAll('[data-hand-total]').length, 3)
    assert.equal(document.querySelectorAll('[data-outcome]').length, 3)
    assert.equal(document.querySelectorAll('[data-card="hidden"]').length, 0)
    assert.ok(!document.body.textContent.includes('undefined'))
  }
}))
test.after(() => hooks.deregister())
