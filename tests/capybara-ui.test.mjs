import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import engineModule from '../lib/originals/capybara/engine.ts'
import sessionModule from '../lib/originals/session.ts'
const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = Object.fromEntries(["cabinet","result","spin","cell","game"].map(k=>[k,k]))' }
  return next(url, context)
} })
const cabinetModule = await import('../components/originals/capybara/capybara-cabinet.tsx')
const { CapybaraCabinet, winTier } = cabinetModule.default ?? cabinetModule
test('Capybara: celebration thresholds never inflate tiny wins', () => {
  assert.equal(winTier(4, 100), 'small'); assert.equal(winTier(199, 100), 'small')
  assert.equal(winTier(200, 100), 'medium'); assert.equal(winTier(1000, 100), 'big')
  assert.equal(winTier(2500, 100), 'super'); assert.equal(winTier(5000, 100), 'mega')
})
test('Capybara: mounted cabinet shows only settled outcomes, accurate highlights and localized bonus controls', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.invalid/en/play/capybara-gold' })
  const saved = new Map()
  for (const key of ['window', 'document', 'navigator', 'requestAnimationFrame', 'cancelAnimationFrame']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  window.matchMedia = () => ({ matches: true })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  const base = engineModule.createSlotEngine(sessionModule.createDemoSessionStore(() => null)).getSnapshot()
  let continued = 0
  const render = async (round, locale = 'pt-BR', loaded = true) => act(() => root.render(React.createElement(CapybaraCabinet,
    { round, locale, loaded, loadError: false, onAsset() {}, onAssetError() {}, onRetry() {}, onContinue: () => { continued++ } })))
  try {
    await render(base)
    assert.equal(document.querySelectorAll('[data-symbol]').length, 20)
    assert.equal(document.querySelectorAll('[data-winning]').length, 0)
    await render({ ...base, phase: 'spinning' })
    assert.ok(document.body.textContent.includes('Girando…')); assert.equal(document.querySelector('[aria-busy]').getAttribute('aria-busy'), 'true')
    const evaluation = { payout: 201, multiplier: 3, winningCells: [0, 4, 8], scatters: 0 }
    await render({ ...base, phase: 'result', result: { id: 'visible-win', evaluation } })
    assert.equal(document.querySelectorAll('[data-winning]').length, 3)
    assert.ok(document.body.textContent.includes('2,01')); assert.ok(document.body.textContent.includes('Ganho · ×3'))
    await render({ ...base, phase: 'spinning', result: { id: 'visible-win', evaluation } })
    assert.equal(document.querySelectorAll('[data-winning]').length, 0); assert.ok(!document.body.textContent.includes('2,01'))
    await render({ ...base, phase: 'bonus-intro', bonusRemaining: 8 }, 'es-MX')
    assert.ok(document.body.textContent.includes('8 Giros gratis')); assert.ok(document.body.textContent.includes('Multiplicador del bono'))
    const button = [...document.querySelectorAll('button')].find(b => b.textContent === 'Iniciar giros gratis')
    await act(() => button.click()); assert.equal(continued, 1)
    await render({ ...base, phase: 'spinning', free: true, bonusRemaining: 5, bonusMultiplier: 4 }, 'es-MX')
    assert.ok(document.body.textContent.includes('×4'))
    await render(base, 'en', false); assert.ok(document.body.textContent.includes('Preparing your river'))
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
test.after(() => hooks.deregister())
