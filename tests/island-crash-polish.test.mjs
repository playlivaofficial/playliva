import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Vector3, Box3 } from 'three'
import { untexturedModel, stageRig } from '../scripts/crash-rig.mjs'
import presentationModule from '../lib/originals/crash/presentation.ts'
import timingModule from '../lib/originals/crash/timing.ts'

const { CHARACTER_SCALE, CASTAWAY_START, KICKER_START, flightPosition } = presentationModule
const { CONTACT_CLIP_SECONDS, IMPACT_MS, KICK_SPEED, PREPARING_MS } = timingModule

/** Shared staging probe: where does the skinned foot actually land on the body? */
async function contactProbe(deltaGameSeconds = 0) {
  const male = stageRig(await untexturedModel('castaway'), CASTAWAY_START, CHARACTER_SCALE, 'idle')
  const female = stageRig(await untexturedModel('island-kicker'), KICKER_START, CHARACTER_SCALE, 'kick')
  male.at(0.2)
  const body = male.scene.getObjectByProperty('type', 'SkinnedMesh')
  body.skeleton.update()
  const box = new Box3().setFromObject(male.scene)
  const hips = male.scene.getObjectByName('Hips').getWorldPosition(new Vector3())
  const head = male.scene.getObjectByName('Head').getWorldPosition(new Vector3())
  const vertices = []
  for (let i = 0; i < body.geometry.attributes.position.count; i++) {
    vertices.push(body.getVertexPosition(i, new Vector3()).applyMatrix4(body.matrixWorld))
  }
  const bones = []
  male.scene.traverse(o => { if (o.isBone) bones.push({ name: o.name, at: o.getWorldPosition(new Vector3()) }) })

  const footMesh = female.scene.getObjectByProperty('type', 'SkinnedMesh')
  const joints = footMesh.skeleton.bones.flatMap((b, i) => ['LeftFoot', 'LeftToeBase'].includes(b.name) ? [i] : [])
  const footIndices = []
  for (let i = 0; i < footMesh.geometry.attributes.position.count; i++) {
    let weight = 0
    for (let j = 0; j < 4; j++) {
      if (joints.includes(footMesh.geometry.attributes.skinIndex.getComponent(i, j))) weight += footMesh.geometry.attributes.skinWeight.getComponent(i, j)
    }
    if (weight > 0.8) footIndices.push(i)
  }
  female.at(CONTACT_CLIP_SECONDS + deltaGameSeconds * KICK_SPEED)
  footMesh.skeleton.update()
  // After contact the castaway is already launching; compare in his frame.
  const moved = flightPosition(Math.max(0, deltaGameSeconds)), origin = flightPosition(0)
  const shift = new Vector3(moved.x - origin.x, moved.y - origin.y, 0)
  const footPoints = footIndices.map(i => footMesh.getVertexPosition(i, new Vector3()).applyMatrix4(footMesh.matrixWorld).sub(shift))
  let gap = Infinity, touched = null
  for (const foot of footPoints) for (const vertex of vertices) {
    const distance = foot.distanceTo(vertex)
    if (distance < gap) { gap = distance; touched = vertex }
  }
  let nearestBone = { distance: Infinity, name: '' }
  for (const bone of bones) {
    const distance = bone.at.distanceTo(touched)
    if (distance < nearestBone.distance) nearestBone = { distance, name: bone.name }
  }
  const footCentre = new Box3().setFromPoints(footPoints).getCenter(new Vector3())
  return {
    gap,
    heightFraction: (touched.y - box.min.y) / (box.max.y - box.min.y),
    nearestBone: nearestBone.name,
    behindHips: touched.x < hips.x,
    footToHead: footCentre.distanceTo(head),
    hipToHead: hips.distanceTo(head),
  }
}

test('the kick lands on the castaway\'s rear, not his head or upper back', async (t) => {
  const contact = await contactProbe(0)
  t.diagnostic(`contact: gap=${contact.gap.toFixed(4)} height=${(contact.heightFraction * 100).toFixed(1)}% bone=${contact.nearestBone} footToHead=${contact.footToHead.toFixed(3)}`)
  assert.ok(contact.gap < 0.02, `foot surface must touch the body: ${contact.gap.toFixed(4)}`)
  assert.ok(contact.behindHips, 'contact is on the rear side of the hips')
  // Hips sit at ~54% of the standing silhouette; shoulders/head start around 65%.
  assert.ok(contact.heightFraction > 0.46 && contact.heightFraction < 0.62,
    `contact must read as the butt, got ${(contact.heightFraction * 100).toFixed(1)}% body height`)
  assert.equal(contact.nearestBone, 'Hips', 'nearest skeleton joint to the contact point is the hip, not an arm, spine or head bone')
  assert.ok(contact.footToHead > contact.hipToHead * 0.9,
    `foot stays a full hip-to-head span away from the head: ${contact.footToHead.toFixed(3)}`)
})

test('the foot approaches cleanly and separates instead of sliding down the back', async () => {
  const before = await contactProbe(-0.016)
  const after = await contactProbe(0.016)
  assert.ok(before.gap > 0.05, `foot is clear of the back one frame before contact: ${before.gap.toFixed(4)}`)
  assert.ok(after.gap > 0.1, `launch separates the bodies immediately: ${after.gap.toFixed(4)}`)
})

test('kick contact, launch and impact audio all resolve to one shared deadline', () => {
  // The renderer seeks the clip with kickAge * KICK_SPEED and the engine starts
  // the flight at PREPARING_MS + KICK_MS; both must hit the same source frame.
  assert.ok(Math.abs(IMPACT_MS / 1000 * KICK_SPEED - CONTACT_CLIP_SECONDS) < 1e-12)
  assert.equal(timingModule.KICK_MS, IMPACT_MS)
  assert.ok(PREPARING_MS > 0)
})

test('the flying sky has no white speed-line streaks left', async () => {
  const scene = await readFile(new URL('../components/originals/crash/island-scene.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(scene, /\bwind\b/, 'the wind/speed-line group is gone')
  assert.doesNotMatch(scene, /CylinderGeometry\(\.012/, 'no thin white streak cylinders remain')
})

/* ------------------------------------------------------------------ */
/* Audio lifecycle                                                      */
/* ------------------------------------------------------------------ */

function fakeParam(value) {
  return {
    value,
    setValueAtTime(v) { this.value = v; return this },
    exponentialRampToValueAtTime(v) { this.value = v; return this },
    linearRampToValueAtTime(v) { this.value = v; return this },
    cancelScheduledValues() { return this },
  }
}

/** Minimal deterministic Web Audio stand-in that records every scheduled start. */
function fakeAudio() {
  const starts = []
  let intervals = 0, cleared = 0
  const node = (extra = {}) => ({ connect() {}, disconnect() {}, ...extra })
  const context = {
    currentTime: 10,
    sampleRate: 48000,
    state: 'running',
    destination: node(),
    createGain: () => node({ gain: fakeParam(1) }),
    createOscillator: () => node({
      type: 'sine', frequency: fakeParam(440),
      start(at) { starts.push({ kind: 'osc', at }) }, stop() {}, onended: null,
    }),
    createBufferSource: () => node({
      buffer: null,
      start(at) { starts.push({ kind: 'noise', at }) }, stop() {}, onended: null,
    }),
    createBuffer: (_c, frames) => ({ getChannelData: () => new Float32Array(frames) }),
    createBiquadFilter: () => node({ type: 'lowpass', frequency: fakeParam(1000), Q: { value: 1 } }),
    createDynamicsCompressor: () => node({
      threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 1 },
      attack: { value: 0 }, release: { value: 0 },
    }),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
  }
  const saved = new Map()
  const win = {
    AudioContext: function () { return context },
    setInterval() { intervals += 1; return intervals },
    clearInterval() { cleared += 1 },
  }
  for (const [key, value] of [['window', win]]) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value })
  }
  return {
    context, starts,
    get intervals() { return intervals },
    get cleared() { return cleared },
    restore() {
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]
      }
    },
  }
}

test('audio schedules the kick on the engine deadline and never stacks music', async () => {
  const stub = fakeAudio()
  try {
    const { createCrashAudio } = await import('../lib/originals/crash/audio.ts')
    const audio = createCrashAudio()
    audio.unlock()
    const contactAt = performance.now() + 500
    audio.scheduleLaunch(contactAt)
    const expected = stub.context.currentTime + (contactAt - performance.now()) / 1000
    const impacts = stub.starts.filter(s => Math.abs(s.at - expected) < 0.02)
    assert.ok(impacts.length >= 3, `kick + slap + whoosh all start on the contact deadline, got ${impacts.length}`)
    assert.ok(stub.starts.every(s => s.at >= stub.context.currentTime - 1e-9), 'nothing is scheduled in the past')
    assert.equal(stub.intervals, 1, 'one music scheduler')

    // A second round must reuse the same scheduler rather than layering another.
    audio.scheduleLaunch(performance.now() + 400)
    assert.equal(stub.intervals, 1, 'music scheduler is not stacked across rounds')

    audio.endRound()
    assert.equal(stub.cleared, 1, 'music scheduler is torn down when the round ends')
    audio.scheduleLaunch(performance.now() + 400)
    assert.equal(stub.intervals, 2, 'a later round restarts exactly one scheduler')
    audio.dispose()
  } finally { stub.restore() }
})

test('the Sound toggle silences music and every new cue', async () => {
  const stub = fakeAudio()
  try {
    const { createCrashAudio } = await import('../lib/originals/crash/audio.ts')
    const audio = createCrashAudio()
    audio.unlock()
    audio.setEnabled(false)
    const before = stub.starts.length
    audio.scheduleLaunch(performance.now() + 300)
    audio.scheduleLanding(performance.now() + 900)
    assert.equal(stub.starts.length, before, 'no cue is scheduled while Sound is off')
    audio.setEnabled(true)
    audio.scheduleLaunch(performance.now() + 300)
    assert.ok(stub.starts.length > before, 'cues resume once Sound is switched back on')
    audio.dispose()
  } finally { stub.restore() }
})

test('the landing cue is scheduled on the engine impact deadline', async () => {
  const stub = fakeAudio()
  try {
    const { createCrashAudio } = await import('../lib/originals/crash/audio.ts')
    const audio = createCrashAudio()
    audio.unlock()
    const impactAt = performance.now() + 1200
    audio.scheduleLanding(impactAt)
    const expected = stub.context.currentTime + (impactAt - performance.now()) / 1000
    assert.ok(stub.starts.some(s => Math.abs(s.at - expected) < 0.02), 'thud starts exactly on the impact deadline')
    // The comedic coconut tail sits just after the impact, never before it.
    assert.ok(stub.starts.every(s => s.at >= expected - 0.02), 'no landing cue fires before the impact')
    audio.dispose()
  } finally { stub.restore() }
})
