import test from 'node:test'
import assert from 'node:assert/strict'
import React, { act, useSyncExternalStore } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import actionModule from '../components/originals/crash/crash-action.tsx'
import engineModule from '../lib/originals/crash/engine.ts'
import sessionModule from '../lib/originals/session.ts'
import timingModule from '../lib/originals/crash/timing.ts'
const { CrashAction } = actionModule
const { createCrashEngine, PREPARING_MS, KICK_MS, timeToMultiplier } = engineModule
const { fallDurationMs, IMPACT_BEAT_MS } = timingModule
const noop = () => {}

test('production action displays live decimal returns and localized locked states; unloaded Start stays disabled', () => {
  const engine = createCrashEngine(sessionModule.createDemoSessionStore(() => null))
  const base = engine.getSnapshot()
  const html = (round, locale = 'en', loaded = true) => renderToStaticMarkup(React.createElement(CrashAction,
    { round, locale, loaded, onStart: noop, onCashOut: noop }))
  for (const [stake, multiplier, display] of [[1000, 115, '11.50'], [10000, 101, '101.00'], [25000, 234, '585.00']]) {
    assert.match(html({ ...base, phase: 'flying', wager: 'active', stake, multiplier }), new RegExp(`<strong>${display.replace('.', '\\.')}<`))
  }
  assert.match(html({ ...base, phase: 'flying', wager: 'active', stake: 1000, multiplier: 115 }, 'pt-BR'), /RETIRAR.*11,50/)
  assert.match(html({ ...base, phase: 'flying', wager: 'active', stake: 1000, multiplier: 115 }, 'es-MX'), /RETIRAR.*11\.50/)
  for (const phase of ['flying', 'falling', 'impact']) {
    const locked = html({ ...base, phase, wager: 'cashed_out', multiplier: 9999, result: { payout: 1150 } })
    assert.match(locked, /disabled=""/); assert.match(locked, /CASHED OUT.*11\.50/)
  }
  assert.match(html(base, 'en', false), /disabled=""/)
  assert.doesNotMatch(html(base), /disabled/)
})

test('mounted production control cashes out once, keeps amount locked while live round updates, and cannot restart until impact +220ms', async () => {
  const dom = new JSDOM('<div id="root"></div>'), saved = new Map()
  for (const key of ['window', 'document', 'navigator']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  let now = 0, starts = 0, cashouts = 0
  const wallet = sessionModule.createDemoSessionStore(() => null)
  const engine = createCrashEngine(wallet, { now: () => now, id: () => 'ui-round', random: { uint32: () => Math.ceil((1 - 97 / 1000) * 0x1_0000_0000) } })
  function Harness() {
    const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
    return React.createElement(React.Fragment, {}, React.createElement('output', {}, round.multiplier),
      React.createElement(CrashAction, { round, locale: 'en', loaded: true,
        onStart: () => { starts++; engine.start(1000) }, onCashOut: () => { cashouts++; engine.cashOut() } }))
  }
  const click = () => act(() => document.querySelector('button').click())
  const tick = at => act(() => { now = at; engine.tick() })
  try {
    await act(() => root.render(React.createElement(Harness)))
    await click()
    const contact = PREPARING_MS + KICK_MS
    await tick(contact + timeToMultiplier(115) + .001)
    assert.equal(document.querySelector('strong').textContent, '11.50')
    await click()
    assert.equal(wallet.getSnapshot().session.balance, 1_000_150)
    await tick(contact + timeToMultiplier(500) + .001)
    assert.equal(document.querySelector('output').textContent, '500')
    assert.equal(document.querySelector('strong').textContent, '11.50')
    assert.equal(document.querySelector('button').disabled, true)
    await click(); await click(); assert.equal(cashouts, 1); assert.equal(starts, 1)
    const crashAt = contact + timeToMultiplier(1000)
    await tick(crashAt)
    assert.equal(document.querySelector('output').textContent, '1000')
    assert.equal(document.querySelector('strong').textContent, '11.50')
    const end = crashAt + fallDurationMs(timeToMultiplier(1000)) + IMPACT_BEAT_MS
    await tick(end - .001); assert.equal(document.querySelector('button').disabled, true)
    await tick(end); assert.equal(document.querySelector('button').textContent, 'PLAY AGAIN')
    assert.equal(document.querySelector('button').disabled, false)
    assert.equal(wallet.getSnapshot().session.transactions.length, 2)
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
