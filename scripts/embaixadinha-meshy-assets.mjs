// Preserve supplied GLBs verbatim; share one mesh/texture set in the runtime pack.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('../', import.meta.url)
const source = 'assets-source/originals/embaixadinha/meshy/'
const runtime = 'public/originals/embaixadinha/runtime/'
const hash = b => createHash('sha256').update(b).digest('hex')
async function load(file) {
  const bytes = await readFile(new URL(source + file, root))
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2) throw Error('Invalid GLB')
  const end = 20 + bytes.readUInt32LE(12)
  return { bytes, json: JSON.parse(bytes.subarray(20, end)), bin: bytes.subarray(end + 8) }
}
const baseFile = 'Meshy_AI_Character_output.glb'
const base = await load(baseFile), j = base.json
const parts = [base.bin]; let length = base.bin.length
j.animations = []
const sources = [{ file: baseFile, bytes: base.bytes.length, sha256: hash(base.bytes) }]
for (const [name, suffix] of [['Idle', 'Idle_9'], ['Kick', 'Kick_a_Soccer_Ball'], ['Stumble', 'Stumble_Walk']]) {
  const file = `Meshy_AI_Animation_${suffix}_withSkin.glb`, clip = await load(file)
  sources.push({ file, bytes: clip.bytes.length, sha256: hash(clip.bytes) })
  const accessors = new Map(), views = new Map()
  function copyAccessor(index) {
    if (accessors.has(index)) return accessors.get(index)
    const a = structuredClone(clip.json.accessors[index]), v = a.bufferView
    if (a.sparse) throw Error('Unexpected sparse animation accessor')
    if (!views.has(v)) {
      const view = clip.json.bufferViews[v], bytes = clip.bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)
      const padded = Buffer.alloc(Math.ceil(bytes.length / 4) * 4); bytes.copy(padded)
      views.set(v, j.bufferViews.length)
      j.bufferViews.push({ ...view, buffer: 0, byteOffset: length }); parts.push(padded); length += padded.length
    }
    a.bufferView = views.get(v); accessors.set(index, j.accessors.length); j.accessors.push(a)
    return accessors.get(index)
  }
  const animation = structuredClone(clip.json.animations[0]); animation.name = name
  for (const sampler of animation.samplers) { sampler.input = copyAccessor(sampler.input); sampler.output = copyAccessor(sampler.output) }
  for (const channel of animation.channels) {
    const bone = clip.json.nodes[channel.target.node].name
    const index = j.nodes.findIndex(n => n.name === bone)
    if (index < 0) throw Error(`Missing matching bone ${bone}`)
    channel.target.node = index
  }
  j.animations.push(animation)
}
j.buffers = [{ byteLength: length }]
const json = Buffer.from(JSON.stringify(j)), padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 32); json.copy(padded)
const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + padded.length + length, 8); header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16)
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(length); binHeader.writeUInt32LE(0x004e4942, 4)
const bytes = Buffer.concat([header, padded, binHeader, ...parts])
await writeFile(new URL(runtime + 'footballer.glb', root), bytes)
await writeFile(new URL(runtime + 'footballer-manifest.json', root), JSON.stringify({ sources, runtime: { file: 'footballer.glb', bytes: bytes.length, sha256: hash(bytes), clips: ['Idle', 'Kick', 'Stumble'] } }, null, 2) + '\n')
console.log(`Footballer: ${bytes.length} bytes; SHA256 ${hash(bytes)}`)
