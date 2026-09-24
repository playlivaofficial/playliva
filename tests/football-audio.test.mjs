import test from 'node:test'
import assert from 'node:assert/strict'
import synthModule from '../lib/originals/synth.ts'
import juggleAudioModule from '../lib/originals/embaixadinha/audio.ts'
import golacoAudioModule from '../lib/originals/golaco/audio.ts'

const { createSynth } = synthModule
const { createJuggleAudio } = juggleAudioModule
const { createGolacoAudio } = golacoAudioModule

function fakeParam(value) {
  return { value, setValueAtTime(v) { this.value = v; return this }, exponentialRampToValueAtTime(v) { this.value = v; return this },
    linearRampToValueAtTime(v) { this.value = v; return this }, cancelScheduledValues() { return this } }
}
/** Deterministic Web Audio stand-in: counts contexts, voices started/stopped and live schedulers. */
function fakeAudio() {
  const contexts = []
  let starts = 0, live = 0
  const node = (extra = {}) => ({ connect() {}, disconnect() {}, ...extra })
  const makeContext = () => {
    const context = {
      currentTime: 10, sampleRate: 8000, state: 'running', closed: false, stopped: 0, destination: node(),
      createGain: () => node({ gain: fakeParam(1) }),
      createOscillator: () => node({ type: 'sine', frequency: fakeParam(440), detune: { value: 0 }, start() { starts++ }, stop() { context.stopped++ }, onended: null }),
      createBufferSource: () => node({ buffer: null, loop: false, start() { starts++ }, stop() { context.stopped++ }, onended: null }),
      createBuffer: (_c, frames) => ({ getChannelData: () => new Float32Array(frames) }),
      createBiquadFilter: () => node({ type: 'lowpass', frequency: fakeParam(1000), Q: { value: 1 } }),
      createDynamicsCompressor: () => node({ threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 1 }, attack: { value: 0 }, release: { value: 0 } }),
      resume() { context.state = 'running'; return Promise.resolve() },
      suspend() { context.state = 'suspended'; return Promise.resolve() },
      close() { context.closed = true; return Promise.resolve() },
    }
    contexts.push(context)
    return context
  }
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    AudioContext: function () { return makeContext() },
    setInterval() { live++; return live }, clearInterval() { live = Math.max(0, live - 1) }, setTimeout(fn) { fn(); return 0 },
  } })
  return { contexts, get starts() { return starts }, get live() { return live },
    restore() { if (saved) Object.defineProperty(globalThis, 'window', saved); else delete globalThis.window } }
}

test('synth kit: lazy single context, one scheduler, silence and dispose tear everything down', () => {
  const stub = fakeAudio()
  try {
    const s = createSynth()
    assert.equal(stub.contexts.length, 0)
    s.unlock(); s.unlock()
    assert.equal(stub.contexts.length, 1)
    s.startLoop(0.1, (_i, at) => s.tone(at, { frequency: 200, decay: 0.1, gain: 0.1, bus: s.music }))
    s.startLoop(0.1, () => {})
    assert.equal(stub.live, 1, 'a second startLoop never stacks a scheduler')
    s.tone(s.ready(), { frequency: 440, decay: 0.2, gain: 0.2 })
    s.silence()
    assert.equal(stub.live, 0); assert.ok(stub.contexts[0].stopped > 0)
    s.dispose()
    assert.equal(stub.contexts[0].closed, true)
    assert.equal(s.ctx, null)
  } finally { stub.restore() }
})

test('synth kit: disabled or hidden produces no voices and parks the clock', () => {
  const stub = fakeAudio()
  try {
    const s = createSynth()
    s.unlock(); s.setEnabled(false)
    assert.equal(stub.contexts[0].state, 'suspended')
    assert.equal(s.ready(), null)
    s.startLoop(0.1, () => {}); assert.equal(stub.live, 0)
    s.setEnabled(true); assert.equal(stub.contexts[0].state, 'running')
    s.setVisible(false); assert.equal(stub.contexts[0].state, 'suspended'); assert.equal(s.ready(), null)
    s.setVisible(true); assert.equal(stub.contexts[0].state, 'running'); assert.notEqual(s.ready(), null)
    s.dispose()
  } finally { stub.restore() }
})

test('Embaixadinha audio: groove starts on the flick once, crash stops it, mute silences every cue', () => {
  const stub = fakeAudio()
  try {
    const audio = createJuggleAudio()
    assert.equal(stub.contexts.length, 0, 'no AudioContext before a gesture')
    audio.unlock(); audio.roundStart()
    audio.touch('flick', 0, 0); audio.touch('flick', 0, 0)
    assert.equal(stub.live, 1, 'one groove scheduler')
    for (let i = 1; i < 30; i++) audio.touch(i % 2 ? 'right-foot' : 'left-thigh', i > 20 ? 2 : i > 10 ? 1 : 0, i)
    assert.equal(stub.live, 1)
    audio.crash('heel')
    assert.equal(stub.live, 0, 'crash stops the groove in the same call')
    audio.roundStart(); audio.touch('flick', 0, 0); audio.cashout(600); audio.roundEnd()
    assert.equal(stub.live, 0, 'cashout round ends the groove')
    audio.touch('flick', 0, 0); assert.equal(stub.live, 1)
    audio.setEnabled(false); assert.equal(stub.live, 0)
    const before = stub.starts
    audio.roundStart(); audio.touch('flick', 0, 0); audio.touch('right-foot', 2, 4); audio.crash('overhit'); audio.bounce(1); audio.cashout(900)
    assert.equal(stub.starts, before, 'Sound OFF: nothing plays'); assert.equal(stub.live, 0)
    audio.setEnabled(true); audio.touch('left-foot', 0, 5); assert.equal(stub.live, 1, 'Sound ON mid-round: groove resumes on the next contact')
    audio.touch('right-foot', 0, 6); assert.equal(stub.live, 1, 'resuming never stacks music')
    audio.dispose()
    assert.equal(stub.live, 0); assert.equal(stub.contexts.length, 1); assert.equal(stub.contexts[0].closed, true)
  } finally { stub.restore() }
})

test('Golaço audio: bonus band never stacks, stops on summary and mute, resumes on unmute when still wanted', () => {
  const stub = fakeAudio()
  try {
    const audio = createGolacoAudio()
    assert.equal(stub.contexts.length, 0)
    audio.unlock()
    for (let i = 0; i < 5; i++) { audio.spinStart(false); audio.reelStop(i, { trophies: 1, trophiesSoFar: i + 1, goals: 0, wild: i > 0, last: i === 4 }) }
    audio.anticipation(performance.now() + 900); audio.win('mega'); audio.bonusTrigger(5)
    audio.bonusMusic(true); audio.bonusMusic(true)
    assert.equal(stub.live, 1, 'one band scheduler')
    audio.streakUp(3); audio.retrigger()
    audio.setEnabled(false); assert.equal(stub.live, 0)
    const before = stub.starts
    audio.spinStart(true); audio.win('big'); audio.streakUp(5); audio.retrigger(); audio.bonusEnd(true)
    assert.equal(stub.starts, before, 'Sound OFF: nothing plays')
    audio.bonusMusic(true); audio.setEnabled(true); assert.equal(stub.live, 1, 'unmuting mid-bonus resumes the band once')
    audio.bonusEnd(true); assert.equal(stub.live, 0, 'summary ends the band')
    audio.setEnabled(false); audio.setEnabled(true); assert.equal(stub.live, 0, 'no band after the bonus has ended')
    audio.dispose(); assert.equal(stub.contexts[0].closed, true); assert.equal(stub.contexts.length, 1)
  } finally { stub.restore() }
})
