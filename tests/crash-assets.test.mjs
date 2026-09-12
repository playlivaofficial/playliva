import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { parseGlb } from '../scripts/crash-assets.mjs'

const root = new URL('../public/originals/crash/', import.meta.url)
const read = path => readFile(new URL(path, root))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const manifest = JSON.parse(await read('runtime/manifest.json'))

test('all eight original GLBs are unchanged and runtime stays below 8 MB', async () => {
  assert.equal(manifest.sources.length, 8)
  let total = 0
  for (const source of manifest.sources) {
    const bytes = await read(`characters/${source.path}`)
    assert.equal(bytes.length, source.bytes)
    assert.equal(hash(bytes), source.sha256)
    total += bytes.length
  }
  assert.equal(total, 135344240)
  assert.equal(total, manifest.sourceBytes)
  assert.ok(manifest.runtimeBytes < 8_000_000)
})

for (const model of manifest.runtime) test(`${model.path}: one rig, compatible clips, bounded textures and no external payloads`, async () => {
  const bytes = await read(`runtime/${model.path}`)
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
    const original = parseGlb(await read(`characters/${directory}/${clip.source}`))
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
    assert.ok(metadata.width <= 2048 && metadata.height <= 2048)
  }
  assert.deepEqual(g.extensionsRequired, ['EXT_texture_webp'])
  assert.ok(g.textures.every(t => t.extensions.EXT_texture_webp.source < 2))
})
