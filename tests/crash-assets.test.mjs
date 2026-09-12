import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { gzipSync } from 'node:zlib'
import { parseGlb } from '../scripts/crash-assets.mjs'

const sourceRoot = new URL('../assets-source/originals/crash/characters/', import.meta.url)
const runtimeRoot = new URL('../public/originals/crash/runtime/', import.meta.url)
const readSource = path => readFile(new URL(path, sourceRoot))
const readRuntime = path => readFile(new URL(path, runtimeRoot))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const manifest = JSON.parse(await readRuntime('manifest.json'))

test('all eight original GLBs are unchanged; runtime below 4.5 MB raw / 3 MB encoded', async () => {
  assert.equal(manifest.sources.length, 8)
  let total = 0
  for (const source of manifest.sources) {
    const bytes = await readSource(source.path)
    assert.equal(bytes.length, source.bytes)
    assert.equal(hash(bytes), source.sha256)
    total += bytes.length
  }
  assert.equal(total, 135344240)
  assert.equal(total, manifest.sourceBytes)
  assert.ok(manifest.runtimeBytes < 4_500_000)
  let encoded = 0
  for (const model of manifest.runtime) encoded += gzipSync(await readRuntime(model.path)).length
  assert.ok(encoded < 3_000_000)
  await assert.rejects(access(new URL('../public/originals/crash/characters/', import.meta.url)), { code: 'ENOENT' })
})

for (const model of manifest.runtime) test(`${model.path}: one rig, compatible clips, bounded textures and no external payloads`, async () => {
  const bytes = await readRuntime(model.path)
  assert.equal(bytes.length, model.bytes)
  assert.equal(hash(bytes), model.sha256)
  const runtime = parseGlb(bytes), g = runtime.json
  assert.equal(g.meshes.length, 1)
  assert.equal(g.skins.length, 1)
  assert.equal(g.skins[0].joints.length, 28)
  assert.equal(g.images.length, 2)
  assert.equal(g.buffers.length, 1)
  assert.equal(g.buffers[0].uri, undefined)
  assert.deepEqual(g.animations.map(a => a.name), model.clips.map(c => c.name))
  const directory = model.path.replace('.glb', '')
  for (const [index, clip] of model.clips.entries()) {
    const original = parseGlb(await readSource(`${directory}/${clip.source}`))
    assert.deepEqual(g.nodes, original.json.nodes)
    const a = g.animations[index], b = original.json.animations[0]
    assert.deepEqual(a.channels, b.channels)
    // Raw keyframes and interpolation are preserved, not re-exported/retargeted.
    for (let i = 0; i < a.samplers.length; i++) {
      assert.equal(a.samplers[i].interpolation, b.samplers[i].interpolation)
      for (const field of ['input', 'output']) {
        const ra = g.accessors[a.samplers[i][field]]
        const oa = original.json.accessors[b.samplers[i][field]]
        assert.deepEqual({ ...ra, bufferView: 0 }, { ...oa, bufferView: 0 })
        assert.deepEqual(runtime.view(ra.bufferView), original.view(oa.bufferView))
      }
    }
  }
  for (const image of g.images) {
    assert.equal(image.uri, undefined)
    assert.equal(image.mimeType, 'image/webp')
    const metadata = await sharp(runtime.view(image.bufferView)).metadata()
    assert.ok(metadata.width <= 1024 && metadata.height <= 1024)
  }
  assert.deepEqual(g.extensionsRequired, ['EXT_texture_webp', 'KHR_mesh_quantization'])
  assert.ok(g.textures.every(t => t.extensions.EXT_texture_webp.source < 2))
})

for (const model of manifest.runtime) test(`${model.path}: topology is exact and packed skin/normal precision is bounded`, async () => {
  const runtime = parseGlb(await readRuntime(model.path))
  const original = parseGlb(await readSource(`${model.path.replace('.glb', '')}/${model.clips[0].source}`))
  const actual = runtime.json.meshes[0].primitives[0], source = original.json.meshes[0].primitives[0]
  for (const semantic of ['indices', ...Object.keys(source.attributes)]) {
    const ra = runtime.json.accessors[semantic === 'indices' ? actual.indices : actual.attributes[semantic]]
    const oa = original.json.accessors[semantic === 'indices' ? source.indices : source.attributes[semantic]]
    assert.equal(ra.count, oa.count); assert.equal(ra.type, oa.type)
    if (!['NORMAL', 'TANGENT', 'WEIGHTS_0'].includes(semantic)) {
      assert.deepEqual({ ...ra, bufferView: 0 }, { ...oa, bufferView: 0 })
      assert.deepEqual(runtime.view(ra.bufferView), original.view(oa.bufferView))
      continue
    }
    const unsigned = semantic === 'WEIGHTS_0', scale = unsigned ? 65535 : 32767
    assert.equal(ra.componentType, unsigned ? 5123 : 5122); assert.equal(ra.normalized, true)
    const rv = runtime.json.bufferViews[ra.bufferView], ov = original.json.bufferViews[oa.bufferView]
    assert.equal(rv.byteOffset % 4, 0); assert.equal(rv.byteStride % 4, 0)
    const packed = runtime.view(ra.bufferView), raw = original.view(oa.bufferView)
    const components = ra.type === 'VEC3' ? 3 : 4
    for (let row = 0; row < ra.count; row++) for (let col = 0; col < components; col++) {
      const expected = raw.readFloatLE((oa.byteOffset ?? 0) + row * (ov.byteStride ?? components * 4) + col * 4)
      const offset = (ra.byteOffset ?? 0) + row * rv.byteStride + col * 2
      const decoded = (unsigned ? packed.readUInt16LE(offset) : packed.readInt16LE(offset)) / scale
      assert.ok(Math.abs(decoded - expected) <= .5001 / scale)
    }
  }
})
