import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import engineModule from '../lib/originals/capybara/engine.ts'
import sessionModule from '../lib/originals/session.ts'

const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = {}' }
  return next(url, context)
} })
const audioModule = await import('../lib/originals/capybara/audio.ts')
const { createSlotAudio } = audioModule.default ?? audioModule
const soundModule = await import('../components/originals/capybara/slot-sound.ts')
const { useSlotSound } = soundModule.default ?? soundModule
const { createSlotEngine, BONUS_RESULT_MS, BONUS_WIN_MS } = engineModule

function fakeParam(value) {
  return { value, first: undefined, setValueAtTime(v) { this.value = v; this.first ??= v; return this }, exponentialRampToValueAtTime(v) { this.value = v; return this },
    linearRampToValueAtTime(v) { this.value = v; return this }, cancelScheduledValues() { return this } }
}
/** Deterministic Web Audio stand-in recording every context, start and stop. */
function fakeAudio() {
  const starts = [], contexts = []
  let intervals = 0, cleared = 0, live = 0
  const node = (extra = {}) => ({ connect() {}, disconnect() {}, ...extra })
  const makeContext = () => {
    const context = {
      currentTime: 10, sampleRate: 8000, state: 'running', closed: false, suspended: 0, destination: node(), stopped: 0,
      createGain: () => node({ gain: fakeParam(1) }),
      createOscillator: () => node({ type: 'sine', frequency: fakeParam(440), detune: { value: 0 },
        start(at) { starts.push({ kind: 'osc', at, frequency: this.frequency.first }) }, stop() { context.stopped++ }, onended: null }),
      createBufferSource: () => node({ buffer: null, loop: false, start(at) { starts.push({ kind: 'noise', at }) }, stop() { context.stopped++ }, onended: null }),
      createBuffer: (_c, frames) => ({ getChannelData: () => new Float32Array(frames) }),
      createBiquadFilter: () => node({ type: 'lowpass', frequency: fakeParam(1000), Q: { value: 1 } }),
      createDynamicsCompressor: () => node({ threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 1 }, attack: { value: 0 }, release: { value: 0 } }),
      resume() { context.state = 'running'; return Promise.resolve() },
      suspend() { context.state = 'suspended'; context.suspended++; return Promise.resolve() },
      close() { context.closed = true; return Promise.resolve() },
    }
    contexts.push(context)
    return context
  }
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const win = { AudioContext: function () { return makeContext() },
    setInterval() { intervals++; live++; return intervals }, clearInterval() { cleared++; live = Math.max(0, live - 1) },
    setTimeout(fn) { fn(); return 0 } }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: win })
  return { starts, contexts, get intervals() { return intervals }, get cleared() { return cleared }, get liveSchedulers() { return live },
    restore() { if (saved) Object.defineProperty(globalThis, 'window', saved); else delete globalThis.window } }
}

test('Capybara audio: no AudioContext until a gesture, then exactly one per mounted game', () => {
  const stub = fakeAudio()
  try {
    const audio = createSlotAudio()
    assert.equal(stub.contexts.length, 0, 'constructing the game creates no AudioContext')
    audio.unlock()
    for (let i = 0; i < 20; i++) { audio.spinStart(false); audio.reelStop(i % 5, { suns: 0, sunsSoFar: 0, wild: false, last: i % 5 === 4 }); audio.win('small') }
    assert.equal(stub.contexts.length, 1, 'cues reuse the one context')
    audio.dispose()
    assert.equal(stub.contexts[0].closed, true, 'unmount closes the context')
  } finally { stub.restore() }
})

test('Capybara audio: Sound OFF silences every cue and the bonus music; ON restores them', () => {
  const stub = fakeAudio()
  try {
    const audio = createSlotAudio()
    audio.unlock(); audio.bonusMusic(true)
    assert.equal(stub.liveSchedulers, 1)
    audio.setEnabled(false)
    assert.equal(stub.liveSchedulers, 0, 'music scheduler stops with Sound OFF')
    assert.ok(stub.contexts[0].stopped > 0, 'already scheduled voices are stopped')
    assert.equal(stub.contexts[0].state, 'suspended', 'a muted game parks its audio clock')
    const before = stub.starts.length
    audio.spinStart(false); audio.reelStop(0, { suns: 1, sunsSoFar: 1, wild: true, last: false }); audio.anticipation(performance.now() + 900)
    audio.win('mega'); audio.bonusTrigger(5); audio.multiplierUp(3); audio.retrigger(); audio.bonusEnd(true); audio.bonusMusic(true)
    assert.equal(stub.starts.length, before, 'nothing is scheduled while Sound is off')
    assert.equal(stub.liveSchedulers, 0, 'music cannot restart while Sound is off')
    audio.setEnabled(true)
    assert.equal(stub.contexts[0].state, 'running')
    assert.equal(stub.liveSchedulers, 1, 'bonus music resumes when Sound returns mid-bonus')
    audio.spinStart(true)
    assert.ok(stub.starts.length > before)
    audio.dispose()
    assert.equal(stub.liveSchedulers, 0)
  } finally { stub.restore() }
})

test('Capybara audio: bonus music never stacks and fades out on bonus end', () => {
  const stub = fakeAudio()
  try {
    const audio = createSlotAudio()
    audio.unlock()
    for (let i = 0; i < 5; i++) audio.bonusMusic(true)
    assert.equal(stub.intervals, 1, 'one scheduler however often the bonus state re-renders')
    audio.bonusEnd(false)
    assert.equal(stub.liveSchedulers, 0, 'bonus end stops the music scheduler')
    audio.bonusMusic(false); audio.bonusMusic(true)
    assert.equal(stub.intervals, 2); assert.equal(stub.liveSchedulers, 1, 'a repeated bonus restarts exactly one scheduler')
    audio.dispose()
  } finally { stub.restore() }
})

test('Capybara audio: hidden tabs suspend the clock and skip cues; reel stops vary per reel; big wins are richer than small', () => {
  const stub = fakeAudio()
  try {
    const audio = createSlotAudio()
    audio.unlock()
    const firstFrequency = reel => { const from = stub.starts.length; audio.reelStop(reel, { suns: 0, sunsSoFar: 0, wild: false, last: false }); return stub.starts[from].frequency }
    const pitches = [0, 1, 2, 3, 4].map(firstFrequency)
    assert.equal(new Set(pitches.map(p => Math.round(p))).size, 5, 'each reel lands with its own pitch')
    const count = run => { const from = stub.starts.length; run(); return stub.starts.length - from }
    const small = count(() => audio.win('small')), medium = count(() => audio.win('medium')), mega = count(() => audio.win('mega'))
    assert.ok(small < medium && medium < mega, `small ${small} < medium ${medium} < mega ${mega}`)
    const plain = count(() => audio.reelStop(2, { suns: 0, sunsSoFar: 0, wild: false, last: false }))
    assert.ok(count(() => audio.reelStop(2, { suns: 1, sunsSoFar: 1, wild: false, last: false })) > plain, 'a landing Sun adds its own chime')
    const until = performance.now() + 1200
    const riser = count(() => audio.anticipation(until))
    assert.ok(riser >= 3); assert.ok(stub.starts.every(s => s.at >= 10 - 1e-9), 'nothing scheduled in the past')
    audio.setVisible(false)
    assert.equal(stub.contexts[0].suspended, 1)
    assert.equal(count(() => { audio.spinStart(false); audio.win('big') }), 0, 'no cues while hidden')
    audio.setVisible(true)
    assert.ok(count(() => audio.spinStart(false)) > 0)
    audio.dispose()
  } finally { stub.restore() }
})

test('Capybara audio: a full engine-driven bonus plays each cue exactly once, even across repeated renders', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://example.invalid/en/play/capybara-gold' })
  const saved = new Map()
  for (const key of ['window', 'document', 'navigator']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const calls = []
  const audio = new Proxy({}, { get: (_t, name) => (...args) => { calls.push([name, ...args]) } })
  const loss = () => ['coconut', 'emerald', 'flower', 'toucan', 'pearl'].map(s => Array(4).fill(s))
  let freeSpin = 0
  const draw = (_r, free) => {
    const grid = loss()
    if (!free) { grid[0][0] = 'scatter'; grid[1][2] = 'scatter'; grid[3][1] = 'scatter'; return grid }
    freeSpin++
    for (let i = 0; i < 3; i++) grid[i][0] = 'leaf'
    if (freeSpin <= 2) grid[1][1] = 'wild'
    if (freeSpin === 3) grid[4][2] = 'scatter'
    return grid
  }
  let at = 0
  const engine = createSlotEngine(sessionModule.createDemoSessionStore(() => null), { now: () => at, id: () => 'sound-series', draw })
  function Probe() {
    const round = React.useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot)
    const [, rerender] = React.useState(0)
    useSlotSound(round, audio, false)
    React.useEffect(() => { rerender(n => n + 1) }, [round]) // an extra render per snapshot must not replay cues
    return null
  }
  const root = createRoot(document.getElementById('root'))
  const step = async ms => { at += ms; await act(() => engine.tick()) }
  const settle = async () => { while (engine.getSnapshot().phase === 'spinning') await step(Math.max(1, engine.getSnapshot().revealAt - at)) }
  try {
    await act(() => root.render(React.createElement(Probe)))
    await act(() => { engine.spin(100) })
    await settle()
    await act(() => { engine.continueBonus() })
    while (engine.getSnapshot().phase !== 'bonus-summary') {
      await settle()
      if (engine.getSnapshot().phase === 'result') await step(engine.getSnapshot().result.evaluation.payout ? BONUS_WIN_MS : BONUS_RESULT_MS)
    }
    await act(() => root.render(React.createElement(Probe)))
    const names = calls.map(c => c[0]), countOf = name => names.filter(n => n === name).length
    assert.equal(countOf('spinStart'), 1 + 9, 'paid spin + 8 free spins + 1 retrigger spin')
    assert.equal(countOf('reelStop'), 10 * 5, 'every reel of every spin lands exactly once')
    assert.equal(calls.filter(c => c[0] === 'reelStop' && c[2].last).length, 10)
    assert.equal(countOf('anticipation'), 1, 'two Suns on reels 1–2 start anticipation once')
    assert.equal(countOf('bonusTrigger'), 1); assert.deepEqual(calls.find(c => c[0] === 'bonusTrigger').slice(1), [3])
    assert.deepEqual(calls.filter(c => c[0] === 'multiplierUp').map(c => c[1]), [2, 3])
    assert.equal(countOf('retrigger'), 1)
    assert.equal(countOf('bonusEnd'), 1)
    assert.equal(countOf('win'), 8, 'each winning free spin before the last plays one win cue; the last folds into the finale')
    const sunChimes = calls.filter(c => c[0] === 'reelStop' && c[2].suns > 0).slice(0, 3).map(c => c[2].sunsSoFar)
    assert.deepEqual(sunChimes, [1, 2, 3], 'Sun chimes climb in landing order')
  } finally {
    await act(() => root.unmount()); dom.window.close()
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
test.after(() => hooks.deregister())
