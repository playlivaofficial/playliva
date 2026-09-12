import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Group, AnimationMixer, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import presentationModule from '../lib/originals/crash/presentation.ts'
import engineModule from '../lib/originals/crash/engine.ts'
const { CHARACTER_SCALE, KICK_SPEED, CASTAWAY_START, KICKER_START } = presentationModule

async function untexturedModel(name) {
  // Keep the actual rig, mesh and animation bytes; omit only image decoding for
  // this CPU pose test. Browser QA separately validates the textured models.
  const bytes = await readFile(new URL(`../public/originals/crash/runtime/${name}.glb`, import.meta.url))
  const length = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.subarray(20, 20 + length))
  json.images = []; json.textures = []; json.materials = [{}]
  json.extensionsUsed = []; json.extensionsRequired = []
  const raw = Buffer.from(JSON.stringify(json)), padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32)
  raw.copy(padded)
  const header = Buffer.from(bytes.subarray(0, 20)), binary = bytes.subarray(20 + length)
  header.writeUInt32LE(20 + padded.length + binary.length, 8)
  header.writeUInt32LE(padded.length, 12)
  const file = Buffer.concat([header, padded, binary])
  return new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset, file.byteOffset + file.length), '')
}

test('approved kick reaches the castaway at the shared impact marker without retargeting', async () => {
  const [male, female] = await Promise.all([untexturedModel('castaway'), untexturedModel('island-kicker')])
  const stage = (gltf, position, clip, time) => {
    const group = new Group()
    group.position.set(...position); group.scale.setScalar(CHARACTER_SCALE)
    gltf.scene.rotation.y = Math.PI / 2; group.add(gltf.scene)
    const mixer = new AnimationMixer(gltf.scene)
    mixer.clipAction(gltf.animations.find(a => a.name === clip)).play()
    mixer.setTime(time); group.updateMatrixWorld(true)
    return gltf.scene
  }
  const castaway = stage(male, CASTAWAY_START, 'react', 0)
  const kicker = stage(female, KICKER_START, 'kick', engineModule.IMPACT_MS / 1000 * KICK_SPEED)
  const foot = kicker.getObjectByName('LeftToeBase').getWorldPosition(new Vector3())
  const hip = castaway.getObjectByName('Hips').getWorldPosition(new Vector3())
  assert.ok(foot.distanceTo(hip) < .4, `Kick misses body: ${foot.distanceTo(hip).toFixed(3)} world units`)
  assert.ok(foot.y > .8 && foot.y < 1.6, 'Contact stays near the torso, not the head')
})
