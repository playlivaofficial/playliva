import { readFile } from 'node:fs/promises'
import { Group, AnimationMixer } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Actual runtime mesh/rig/animation; only image decoding is omitted for CPU QA.
export async function untexturedModel(name) {
  const bytes = await readFile(new URL(`../public/originals/crash/runtime/${name}.glb`, import.meta.url))
  const length = bytes.readUInt32LE(12)
  const json = JSON.parse(bytes.subarray(20, 20 + length))
  json.images = []; json.textures = []; json.materials = [{}]
  json.extensionsUsed = (json.extensionsUsed ?? []).filter(name => name !== 'EXT_texture_webp')
  json.extensionsRequired = (json.extensionsRequired ?? []).filter(name => name !== 'EXT_texture_webp')
  const raw = Buffer.from(JSON.stringify(json)), padded = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32)
  raw.copy(padded)
  const header = Buffer.from(bytes.subarray(0, 20)), binary = bytes.subarray(20 + length)
  header.writeUInt32LE(20 + padded.length + binary.length, 8); header.writeUInt32LE(padded.length, 12)
  const file = Buffer.concat([header, padded, binary])
  return new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset, file.byteOffset + file.length), '')
}
export function stageRig(gltf, position, scale, clip) {
  const group = new Group()
  group.position.set(...position); group.scale.setScalar(scale)
  gltf.scene.rotation.y = Math.PI / 2; group.add(gltf.scene)
  const mixer = new AnimationMixer(gltf.scene)
  mixer.clipAction(gltf.animations.find(a => a.name === clip)).play()
  return { group, scene: gltf.scene, at(time) { mixer.setTime(time); group.updateMatrixWorld(true) } }
}
