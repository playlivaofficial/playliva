import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
const source = 'assets-source/originals/levanta', out = 'public/originals/levanta'
await mkdir(source, { recursive: true }); await mkdir(out, { recursive: true })
const names = ['01a0df47_e50a_73a2_aa', '01a0df4b_6fc2_769c_9d', '01a0df4d_8e5c_7098_ac']
const hash = b => createHash('sha256').update(b).digest('hex')
const models = []
for (const name of names) {
  const file = `Meshy_AI_Brazilian_Gym_Athlete_${name}.glb`
  const bytes = await readFile(`${source}/${file}`), end = 20 + bytes.readUInt32LE(12)
  models.push({ file, bytes, json: JSON.parse(bytes.subarray(20, end)), bin: bytes.subarray(end + 8) })
}
const base = models[0], j = structuredClone(base.json), chunks = [], reports = []
let length = 0
function append(bytes) { const start = length, padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4); bytes.copy(padded); chunks.push(padded); length += padded.length; return start }
// Retain mesh topology, skin weights and source animation keys. Repack texture at 1024px JPEG quality 90.
for (let i = 0; i < j.bufferViews.length; i++) {
  const view = j.bufferViews[i], image = j.images?.find(im => im.bufferView === i)
  let bytes = base.bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
  if (image) { bytes = await sharp(bytes).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer(); image.mimeType = 'image/jpeg' }
  view.byteOffset = append(bytes); view.byteLength = bytes.length
}
j.animations = []
for (const [index, model] of models.entries()) {
  const accessors = new Map(), views = new Map(), clip = structuredClone(model.json.animations.reduce((a, b) => {
    const duration = c => Math.max(...c.samplers.map(s => model.json.accessors[s.input].max?.[0] ?? 0))
    return duration(a) > duration(b) ? a : b
  }))
  const duration = Math.max(...clip.samplers.map(s => model.json.accessors[s.input].max[0]))
  function accessor(i) {
    if (accessors.has(i)) return accessors.get(i)
    const a = structuredClone(model.json.accessors[i]), v = a.bufferView
    if (a.sparse) throw Error('Sparse animation accessor')
    if (!views.has(v)) {
      const view = model.json.bufferViews[v], bytes = model.bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
      views.set(v, j.bufferViews.length); j.bufferViews.push({ ...view, byteOffset: append(bytes), buffer: 0 })
    }
    a.bufferView = views.get(v); accessors.set(i, j.accessors.length); j.accessors.push(a); return accessors.get(i)
  }
  for (const sampler of clip.samplers) { sampler.input = accessor(sampler.input); sampler.output = accessor(sampler.output) }
  for (const channel of clip.channels) {
    const name = model.json.nodes[channel.target.node].name, target = j.nodes.findIndex(n => n.name === name)
    if (target < 0) throw Error(`Missing joint ${name}`)
    channel.target.node = target
  }
  clip.name = ['Ready', 'Lift', 'Fail'][index]; j.animations.push(clip)
  reports.push({ source: model.file, sha256: hash(model.bytes), bytes: model.bytes.length, clip: clip.name, duration, channels: clip.channels.length })
}
j.buffers = [{ byteLength: length }]
const json = Buffer.from(JSON.stringify(j)), padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32); json.copy(padded)
const header = Buffer.alloc(20), binHeader = Buffer.alloc(8)
header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + padded.length + length, 8); header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16)
binHeader.writeUInt32LE(length); binHeader.writeUInt32LE(0x004e4942, 4)
const packed = Buffer.concat([header, padded, binHeader, ...chunks])
await writeFile(`${out}/athlete.glb`, packed)
await writeFile(`${out}/manifest.json`, JSON.stringify({ sources: reports, runtime: { bytes: packed.length, sha256: hash(packed) } }, null, 2) + '\n')
console.log(JSON.stringify({ sources: reports, runtimeBytes: packed.length }, null, 2))
