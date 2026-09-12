import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import sharp from 'sharp'

// Explicit inputs and output root: source GLBs are always read-only.
const root = fileURLToPath(new URL('../', import.meta.url))
const sourceRoot = `${root}assets-source/originals/crash/characters/`
const outputRoot = `${root}public/originals/crash/runtime/`
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
export function parseGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67)
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  const length = bytes.readUInt32LE(12)
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a)
  const json = JSON.parse(bytes.subarray(20, 20 + length).toString())
  assert.equal(bytes.readUInt32LE(24 + length), 0x004e4942)
  const binary = bytes.subarray(28 + length)
  const view = (index) => {
    const v = json.bufferViews[index]
    assert.equal(v.buffer, 0)
    const end = (v.byteOffset ?? 0) + v.byteLength
    assert.ok(end <= binary.length)
    return binary.subarray(v.byteOffset ?? 0, end)
  }
  return { json, view, bytes }
}

const groups = [
  { directory: 'castaway', base: 'castaway-flyer-base', clips: {
    idle: 'castaway-idle-nervous', react: 'castaway-kick-react',
    flying: 'castaway-flying-panic', crash: 'castaway-crash-dazed',
  } },
  { directory: 'island-kicker', base: 'island-kicker-female-base', clips: {
    idle: 'island-kicker-female-idle', kick: 'island-kicker-female-kick',
  } },
]

function encodeGlb(json, chunks) {
  const binary = Buffer.concat(chunks)
  json.buffers = [{ byteLength: binary.length }]
  const raw = Buffer.from(JSON.stringify(json))
  const paddedJson = Buffer.alloc(Math.ceil(raw.length / 4) * 4, 32)
  raw.copy(paddedJson)
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(28 + paddedJson.length + binary.length, 8)
  header.writeUInt32LE(paddedJson.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16)
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(binary.length, 0)
  binHeader.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, paddedJson, binHeader, binary])
}

export async function optimize() {
  const manifest = { sourceBytes: 0, runtimeBytes: 0, sources: [], runtime: [] }
  await mkdir(outputRoot, { recursive: true })
  for (const group of groups) {
    const inputs = new Map()
    for (const name of [group.base, ...Object.values(group.clips)]) {
      const path = `${group.directory}/${name}.glb`
      const bytes = await readFile(sourceRoot + path)
      inputs.set(name, parseGlb(bytes))
      manifest.sources.push({ path, bytes: bytes.length, sha256: hash(bytes) })
      manifest.sourceBytes += bytes.length
    }
    const base = inputs.get(group.clips.idle)
    assert.equal(inputs.get(group.base).json.skins, undefined, 'Static base must remain separate')
    const geometrySignature = (input) => JSON.stringify(input.json.meshes.map(mesh => mesh.primitives.map(p => ({
      attributes: Object.fromEntries(Object.entries(p.attributes).map(([key, i]) => [key, {
        accessor: input.json.accessors[i], bytes: hash(input.view(input.json.accessors[i].bufferView)),
      }])), indices: hash(input.view(input.json.accessors[p.indices].bufferView)),
    }))))
    // Fail before transplanting if ANY hierarchy, rest transform, weights, geometry,
    // material or inverse bind differs. Matching bone names alone is not enough.
    for (const name of Object.values(group.clips)) {
      const input = inputs.get(name)
      assert.deepEqual(input.json.nodes, base.json.nodes, `${name}: rest/hierarchy mismatch`)
      assert.deepEqual(input.json.materials, base.json.materials)
      assert.equal(geometrySignature(input), geometrySignature(base), `${name}: mesh mismatch`)
      assert.deepEqual(input.json.skins, base.json.skins)
      for (const skin of input.json.skins) {
        assert.deepEqual(input.view(input.json.accessors[skin.inverseBindMatrices].bufferView),
          base.view(base.json.accessors[skin.inverseBindMatrices].bufferView))
      }
      input.json.images.forEach((image, i) => assert.deepEqual(input.view(image.bufferView), base.view(base.json.images[i].bufferView)))
    }
    const json = structuredClone(base.json)
    json.asset = { version: '2.0', generator: 'PlayLiva crash-assets.mjs / sharp 0.35.4' }
    json.accessors = []; json.bufferViews = []; json.animations = []
    const chunks = []
    let offset = 0
    const append = (bytes, original = {}) => {
      const index = json.bufferViews.length
      json.bufferViews.push({ ...original, buffer: 0, byteOffset: offset, byteLength: bytes.length })
      const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4)
      bytes.copy(padded); chunks.push(padded); offset += padded.length
      return index
    }
    const accessors = new Map(), views = new Map()
    const copyAccessor = (input, index) => {
      assert.ok(!input.json.accessors[index].sparse, 'Sparse accessors need an explicit conversion')
      let map = accessors.get(input)
      if (!map) { map = new Map(); accessors.set(input, map) }
      if (map.has(index)) return map.get(index)
      const a = structuredClone(input.json.accessors[index])
      let viewMap = views.get(input)
      if (!viewMap) { viewMap = new Map(); views.set(input, viewMap) }
      if (!viewMap.has(a.bufferView)) viewMap.set(a.bufferView, append(input.view(a.bufferView), input.json.bufferViews[a.bufferView]))
      a.bufferView = viewMap.get(a.bufferView)
      const result = json.accessors.push(a) - 1
      map.set(index, result)
      return result
    }
    json.meshes.forEach(mesh => mesh.primitives.forEach(p => {
      assert.ok(!p.targets, 'Morph targets need explicit preservation')
      p.indices = copyAccessor(base, p.indices)
      p.attributes = Object.fromEntries(Object.entries(p.attributes).map(([key, index]) => [key, copyAccessor(base, index)]))
    }))
    json.skins.forEach(s => { s.inverseBindMatrices = copyAccessor(base, s.inverseBindMatrices) })
    const clips = []
    for (const [name, filename] of Object.entries(group.clips)) {
      const input = inputs.get(filename)
      assert.equal(input.json.animations.length, 2)
      const animation = structuredClone(input.json.animations[0])
      const duration = Math.max(...animation.samplers.map(s => input.json.accessors[s.input].max[0]))
      assert.ok(duration > 1)
      const artifactDuration = Math.max(...input.json.animations[1].samplers.map(s => input.json.accessors[s.input].max[0]))
      assert.ok(artifactDuration < 0.1, 'Do not discard a substantive second clip')
      animation.name = name
      animation.samplers.forEach(s => {
        s.input = copyAccessor(input, s.input); s.output = copyAccessor(input, s.output)
      })
      json.animations.push(animation)
      clips.push({ name, seconds: duration, source: `${filename}.glb` })
    }
    const textures = []
    for (let i = 0; i < json.images.length; i++) {
      const original = base.view(base.json.images[i].bufferView)
      const metadata = await sharp(original).metadata()
      // Color keeps 2K detail. Packed roughness/metallic data uses lossless WebP
      // after 1K resizing; no lossy channel changes to the packed material map.
      const size = i === 0 ? 2048 : 1024
      const pipeline = sharp(original).resize(size, size, { fit: 'inside', withoutEnlargement: true })
      const optimized = await pipeline.webp(i === 0 ? { quality: 85, effort: 6 } : { lossless: true, effort: 6 }).toBuffer()
      json.images[i] = { bufferView: append(optimized), mimeType: 'image/webp' }
      textures.push({ sourceWidth: metadata.width, sourceHeight: metadata.height, width: size, height: size, bytes: optimized.length })
    }
    json.textures = json.textures.map(texture => {
      const { source, ...rest } = texture
      return { ...rest, extensions: { EXT_texture_webp: { source } } }
    })
    json.extensionsUsed = ['EXT_texture_webp']
    json.extensionsRequired = ['EXT_texture_webp']
    const bytes = encodeGlb(json, chunks)
    const path = `${group.directory}.glb`
    await writeFile(outputRoot + path, bytes)
    manifest.runtime.push({ path, bytes: bytes.length, sha256: hash(bytes), vertices: base.json.accessors[base.json.meshes[0].primitives[0].attributes.POSITION].count, joints: base.json.skins[0].joints.length, clips, textures })
    manifest.runtimeBytes += bytes.length
  }
  await writeFile(outputRoot + 'manifest.json', JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify(manifest, null, 2))
  return manifest
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await optimize()
