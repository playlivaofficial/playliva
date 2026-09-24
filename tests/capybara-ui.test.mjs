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
    assert.ok(document.querySelector('[data-sun-rule]').textContent.includes('3 · 4 · 5 ☀ = 8 · 12 · 20'), 'base rule explains the 4/5-Sun awards')
    // Reels land one by one: only unlanded reels keep a spinning strip; two landed Suns glow and later reels anticipate.
    const sunGrid = base.grid.map(reel => [...reel]); sunGrid[0][1] = 'scatter'; sunGrid[1][3] = 'scatter'
    await render({ ...base, phase: 'spinning', grid: sunGrid, stopped: 2, anticipation: true, spinAt: 5 })
    assert.equal(document.querySelectorAll('[data-landing]').length, 2)
    assert.equal(document.querySelectorAll('[data-anticipation]').length, 1 + 3, 'cabinet + three remaining reels')
    assert.equal(document.querySelectorAll('[data-scatter]').length, 2); assert.equal(document.querySelectorAll('[data-winning]').length, 0)
    await render({ ...base, phase: 'bonus-intro', bonusRemaining: 12, bonusAwarded: 12, seriesId: 's1' }, 'en')
    const intro = document.querySelector('[data-bonus-intro]')
    assert.ok(intro.textContent.includes('Jungle Gold Bonus')); assert.ok(intro.textContent.includes('12 Free Spins'))
    await render({ ...base, phase: 'bonus-intro', bonusRemaining: 8, bonusAwarded: 8, seriesId: 's1' }, 'es-MX')
    assert.ok(document.body.textContent.includes('8 Giros gratis')); assert.ok(document.body.textContent.includes('Multiplicador Oro'))
    const button = [...document.querySelectorAll('button')].find(b => b.textContent === 'Iniciar giros gratis')
    await act(() => button.click()); assert.equal(continued, 1)
    await render({ ...base, phase: 'spinning', free: true, bonusRemaining: 7, bonusAwarded: 8, bonusMultiplier: 1, seriesId: 's1', spinAt: 9, stopped: 0 }, 'en')
    assert.equal(document.querySelector('[data-free-spins-counter]').textContent, '7 / 8')
    assert.equal(document.querySelector('[data-gold-multiplier]').textContent, '×1')
    assert.equal(document.querySelector('[data-multiplier-up]'), null); assert.equal(document.querySelector('[data-retrigger]'), null)
    assert.equal(document.querySelector('[data-bonus-intro]'), null, 'free spins never hide the reels behind an overlay')
    await render({ ...base, phase: 'spinning', free: true, bonusRemaining: 7, bonusAwarded: 9, retriggered: 1, bonusMultiplier: 3, seriesId: 's1', spinAt: 9, stopped: 3 }, 'en')
    assert.equal(document.querySelector('[data-free-spins-counter]').textContent, '7 / 9')
    assert.equal(document.querySelector('[data-multiplier-up]').textContent, '×3!')
    assert.equal(document.querySelector('[data-retrigger]').textContent, '+1 Free Spin')
    await render({ ...base, phase: 'spinning', free: true, bonusRemaining: 5, bonusAwarded: 8, bonusMultiplier: 5, seriesId: 's1' }, 'es-MX')
    assert.ok(document.body.textContent.includes('×5')); assert.ok(document.querySelector('[data-gold-multiplier][data-max]'))
    await render({ ...base, phase: 'bonus-summary', free: true, bonusRemaining: 0, bonusAwarded: 9, bonusMultiplier: 5, bonusTotal: 123456, seriesId: 's1' }, 'en')
    const summary = document.querySelector('[data-bonus-summary]')
    assert.ok(summary.textContent.includes('Bonus complete')); assert.ok(summary.textContent.includes('1,234.56'))
    assert.ok(summary.textContent.includes('Free spins played: 9')); assert.ok(summary.textContent.includes('×5'))
    await render(base, 'en', false); assert.ok(document.body.textContent.includes('Preparing your river'))
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
test.after(() => hooks.deregister())
