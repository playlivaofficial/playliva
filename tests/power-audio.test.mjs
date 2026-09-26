import test from 'node:test'
import assert from 'node:assert/strict'
import audioModule from '../lib/originals/power-audio.ts'
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


for(const kind of ['raio','brasil21'])test(kind+': lazy audio, every cue, single scheduler, mute/visibility/resume/dispose',()=>{
 const stub=fakeAudio();try{const a=audioModule.createPowerAudio(kind);assert.equal(stub.contexts.length,0);a.setEnabled(true);a.unlock();a.unlock();a.active(true);a.active(true);assert.equal(stub.contexts.length,1);assert.equal(stub.live,1);
 for(const cue of ['chip','remove','start','charge','feature','tick','land','deal','flip','hit','stand','double','win','power','loss','push','bust']){const before=stub.starts;a.cue(cue);assert.ok(stub.starts>before,cue)}
 a.setEnabled(false);assert.equal(stub.live,0);const before=stub.starts;a.cue('power');a.active(true);assert.equal(stub.starts,before);a.setEnabled(true);assert.equal(stub.live,1);a.setVisible(false);assert.equal(stub.live,0);a.setVisible(true);assert.equal(stub.live,1);for(let i=0;i<50;i++){a.active(false);assert.equal(stub.live,0);a.active(true);assert.equal(stub.live,1)}a.active(false);a.setEnabled(false);a.setEnabled(true);assert.equal(stub.live,0);a.dispose();assert.equal(stub.live,0);assert.equal(stub.contexts[0].closed,true);assert.equal(stub.contexts.length,1);
 }finally{stub.restore()}
})
