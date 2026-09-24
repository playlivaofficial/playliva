import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import playerModule from '../components/originals/embaixadinha/meshy-player.ts'
import choreography from '../components/originals/embaixadinha/touch-choreography.ts'
import motion from '../components/originals/embaixadinha/juggle-motion.ts'
import juggleModule from '../lib/originals/embaixadinha/juggle.ts'
const { createMeshyPlayer, BOOT_CLEARANCE } = playerModule
const { TOUCHES } = juggleModule

async function loadGeometry() {
  const b = await readFile(new URL('../public/originals/embaixadinha/runtime/footballer.glb', import.meta.url))
  const end = 20 + b.readUInt32LE(12), j = JSON.parse(b.subarray(20, end))
  // Headless geometry tests use the actual skin/animations, without DOM texture decoding.
  j.materials = [{ pbrMetallicRoughness: {} }]; j.images = []; j.textures = []
  const json = Buffer.from(JSON.stringify(j)), padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32); json.copy(padded)
  const header = Buffer.from(b.subarray(0, 20)); header.writeUInt32LE(20 + padded.length + b.length - end, 8); header.writeUInt32LE(padded.length, 12)
  const bytes = Buffer.concat([header, padded, b.subarray(end)])
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
}

test('Meshy animation boot geometry stays above the court during idle, touches and all stumble phases', async () => {
  const player = createMeshyPlayer(await loadGeometry()), parent = new THREE.Group()
  parent.rotation.y = -.32; parent.add(player.model)
  const cases = [{ elapsed: NaN, failTouch: null }]
  for (const t of TOUCHES) for (const offset of [-100, 0, 100]) cases.push({ elapsed: t.at + offset, failTouch: null })
  for (let ms = 0; ms <= 2400; ms += 40) cases.push({ elapsed: TOUCHES[20].at + ms, failTouch: 20 })
  const point = new THREE.Vector3()
  for (const input of cases) {
    player.update({ ...input, sinceStart: 0, variant: input.failTouch === null ? null : 'sideways' }, 0)
    parent.updateMatrixWorld(true)
    let lowest = Infinity
    player.model.traverse(mesh => {
      if (!mesh.isSkinnedMesh) return
      mesh.skeleton.update()
      // Independently check EVERY vertex, not the adapter's selected boot subset.
      for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld)
        lowest = Math.min(lowest, point.y)
      }
    })
    assert.ok(Math.abs(lowest - BOOT_CLEARANCE) < .0001, `ground contact ${input.elapsed}: ${lowest}`)
  }
  player.dispose()
})

test('Liva Ginga calibrated boot surfaces meet every ball contact, with continuous incoming arcs', async () => {
  const player = createMeshyPlayer(await loadGeometry())
  for (const touch of TOUCHES.slice(1)) {
    player.update({ elapsed: touch.at, sinceStart: 0, failTouch: null, variant: null }, 0)
    const actual = player.contact(choreography.touchProfile(touch.index).side)
    const expected = player.contacts[touch.index]
    assert.ok(Math.hypot(...actual.map((x, i) => x - expected[i])) < .0001)
    const flight = choreography.controlledFlight(touch.at, player.contacts)
    assert.deepEqual(flight.position, expected)
    const before = choreography.controlledFlight(touch.at - .01, player.contacts)
    assert.ok(Math.hypot(...before.position.map((x, i) => x - expected[i])) < .0001)
    assert.ok(before.velocity[1] < 0, 'ball approaches before the upward impulse')
    assert.ok(flight.velocity[1] > 0, 'ball leaves only at the contact')
  }
  player.dispose()
})

test('Liva Ginga failure has immediate outward/downward velocity and no early pose disclosure', async () => {
  const player = createMeshyPlayer(await loadGeometry())
  const snapshot = () => { const out = []; player.model.traverse(n => { if (n.isBone) out.push(...n.quaternion.toArray(), ...n.position.toArray()) }); return out }
  for (const index of [0, 1, 3, 12, 40, 70]) {
    const at = TOUCHES[index].at
    player.update({ elapsed: at - 1, sinceStart: 0, failTouch: null, variant: null }, 0)
    const live = snapshot()
    player.update({ elapsed: at - 1, sinceStart: 0, failTouch: index, variant: 'sideways' }, 0)
    assert.deepEqual(snapshot(), live)
    const state = player.update({ elapsed: at, sinceStart: 0, failTouch: index, variant: 'sideways' }, 0)
    assert.equal(state.phase, 'stumble'); assert.equal(state.sinceCrash, 0)
    const velocity = choreography.badTouchVelocity(index)
    assert.ok(velocity[1] < 0 && Math.abs(velocity[0]) > 2)
    const start = player.contacts[index], escape = motion.simulateEscape(start, velocity, 2.4)
    assert.ok(Math.hypot(...motion.sampleEscape(escape, 0).map((v,i) => v-start[i])) < .000001)
    const next = motion.sampleEscape(escape, 1/60)
    assert.ok(Math.abs(next[0] - start[0]) > .03, 'visible displacement in first frame, no hold')
    assert.ok(next[1] <= start[1] + .002)
  }
  player.dispose()
})

test('Liva Ginga alternates support legs and has bounded soft lift/recovery without changing schedule', () => {
  for (let i=2;i<TOUCHES.length;i++) assert.notEqual(choreography.touchProfile(i).side,choreography.touchProfile(i-1).side)
  assert.equal(choreography.touchEnvelope(-190),0); assert.equal(choreography.touchEnvelope(280),0)
  assert.ok(choreography.touchEnvelope(0)<choreography.touchEnvelope(35), 'boot still rising at impact')
  assert.ok(TOUCHES.every(t=>[420,470,480,520,560,620].includes(t.hang)))
  assert.equal(TOUCHES.at(-1).at,37010)
})
