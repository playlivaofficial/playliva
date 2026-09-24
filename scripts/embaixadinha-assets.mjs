// Derives the Liva Embaixadinha football hero from PlayLiva's own Island Crash
// castaway rig (no third-party character asset). Offline/dev only:
//   node scripts/embaixadinha-assets.mjs
// Input : public/originals/crash/runtime/castaway.glb (PlayLiva-owned, see docs/m5-island-crash.md)
// Output: public/originals/embaixadinha/runtime/craque.glb + manifest.json
//
// What changes, and nothing else:
// - The long spiky hair becomes a short buzz cut: every hair vertex is projected
//   radially onto a smooth skull ellipsoid, with the ellipsoid's own normal.
// - A `_KIT` vertex attribute marks buzz-cut hair (R channel) so the runtime
//   shader paints it; the kit itself is painted from bind-pose position.
// - Animation clips and unused tangents are dropped (juggling is procedural).
// Skin weights, joints, UVs, face/beard texture and triangles are unchanged.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const SOURCE = new URL('../public/originals/crash/runtime/castaway.glb', import.meta.url)
const OUT_DIR = new URL('../public/originals/embaixadinha/runtime/', import.meta.url)

/** Skull used for the buzz cut, bind-pose metres (character is 1.70 tall, faces +Z). */
const SKULL = Object.freeze({ center: [0.002, 1.458, 0.01], radii: [0.112, 0.152, 0.133] })
const HAIR_LIFT = 0.004 // a few millimetres of short hair above the scalp

const glb = await readFile(SOURCE)
const jsonLength = glb.readUInt32LE(12)
const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString())
const bin = glb.subarray(20 + jsonLength + 8)
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }
const TYPED = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5122: Int16Array, 5121: Uint8Array }

function view(index) {
  const accessor = gltf.accessors[index], bv = gltf.bufferViews[accessor.bufferView]
  const n = COMPONENTS[accessor.type], T = TYPED[accessor.componentType]
  const stride = (bv.byteStride ?? n * T.BYTES_PER_ELEMENT) / T.BYTES_PER_ELEMENT
  // Copy so edits never alias the source buffer.
  const raw = new T(bin.buffer.slice(bin.byteOffset + bv.byteOffset + (accessor.byteOffset ?? 0),
    bin.byteOffset + bv.byteOffset + (accessor.byteOffset ?? 0) + Math.min(bv.byteLength - (accessor.byteOffset ?? 0), accessor.count * stride * T.BYTES_PER_ELEMENT)))
  return { accessor, raw, stride, n, get: (k, c) => raw[k * stride + c], set: (k, c, v) => { raw[k * stride + c] = v } }
}

const primitive = gltf.meshes[0].primitives[0]
const position = view(primitive.attributes.POSITION), normal = view(primitive.attributes.NORMAL)
const uv = view(primitive.attributes.TEXCOORD_0), joints = view(primitive.attributes.JOINTS_0), weights = view(primitive.attributes.WEIGHTS_0)
const jointNames = gltf.skins[0].joints.map(index => gltf.nodes[index].name)
const HEAD = new Set(['Head', 'head_end', 'headfront'])

const colorImage = gltf.images[gltf.textures[gltf.materials[0].pbrMetallicRoughness.baseColorTexture.index].extensions.EXT_texture_webp.source]
const colorView = gltf.bufferViews[colorImage.bufferView]
const texture = await sharp(bin.subarray(colorView.byteOffset, colorView.byteOffset + colorView.byteLength)).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
function luminance(u, v) {
  const x = Math.min(texture.info.width - 1, Math.max(0, Math.floor(u * texture.info.width)))
  const y = Math.min(texture.info.height - 1, Math.max(0, Math.floor(v * texture.info.height)))
  const o = (y * texture.info.width + x) * 4, d = texture.data
  return (0.3 * d[o] + 0.59 * d[o + 1] + 0.11 * d[o + 2]) / 255
}

/** Hair zone: back of the head from the nape, sides from the temples, front above the brows. */
function inHairZone(y, z) {
  if (z > 0.08) return y > 1.53
  if (z < -0.02) return y > 1.36
  return y > 1.5
}
const [cx, cy, cz] = SKULL.center, [rx, ry, rz] = SKULL.radii
const ellipsoid = (x, y, z) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2
/** The castaway's ears stick out of the skull at the sides; they stay skin. */
const isEar = (x, y, z) => Math.abs(x) > 0.095 && Math.abs(x) < 0.15 && y > 1.395 && y < 1.478 && z > -0.035 && z < 0.07
/** Every head vertex in the hair zone that is dark OR sticks out of the skull becomes buzz cut. */
function isHairVertex({ headWeight, lum, x, y, z }) {
  if (headWeight < 0.5 || isEar(x, y, z)) return false
  if (inHairZone(y, z)) return lum < 0.32 || ellipsoid(x, y, z) > 1
  const outside = ellipsoid(x, y, z)
  // Fringe over the forehead (above the brows, off the face surface).
  if (z > 0.08) return y > 1.49 && lum < 0.45 && outside > 1.04
  // Temple tufts and nape flaps hang below the zone and float off the head.
  return y > 1.3 && lum < 0.45 && outside > 1.06
}

const count = position.accessor.count
const kit = new Uint8Array(count * 4)
let hairVertices = 0
for (let k = 0; k < count; k++) {
  let headWeight = 0
  for (let c = 0; c < 4; c++) if (HEAD.has(jointNames[joints.get(k, c)])) headWeight += weights.get(k, c) / 65535
  const x = position.get(k, 0), y = position.get(k, 1), z = position.get(k, 2)
  if (!isHairVertex({ headWeight, lum: luminance(uv.get(k, 0), uv.get(k, 1)), x, y, z })) continue
  const dx = x - cx, dy = y - cy, dz = z - cz
  const s = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2 + (dz / rz) ** 2)
  const px = dx * s, py = dy * s, pz = dz * s
  // Ellipsoid surface normal (gradient), then lift the shell by HAIR_LIFT.
  let nx = px / (rx * rx), ny = py / (ry * ry), nz = pz / (rz * rz)
  const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl
  position.set(k, 0, cx + px + nx * HAIR_LIFT); position.set(k, 1, cy + py + ny * HAIR_LIFT); position.set(k, 2, cz + pz + nz * HAIR_LIFT)
  normal.set(k, 0, Math.round(nx * 32767)); normal.set(k, 1, Math.round(ny * 32767)); normal.set(k, 2, Math.round(nz * 32767))
  kit[k * 4] = 255
  kit[k * 4 + 1] = Math.round(255 * Math.min(1, Math.max(0, (cy + py - 1.4) / 0.12)))
  hairVertices++
}

// Rebuild a compact GLB: mesh + skin + material only.
const chunks = [], bufferViews = [], accessors = []
let offset = 0
function pushView(bytes, target, byteStride) {
  const pad = (4 - (offset % 4)) % 4
  if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad }
  bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, ...(target ? { target } : {}), ...(byteStride ? { byteStride } : {}) })
  chunks.push(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)); offset += bytes.byteLength
  return bufferViews.length - 1
}
function copyAccessor(index, edited) {
  const source = edited ?? view(index), bv = gltf.bufferViews[source.accessor.bufferView]
  const viewIndex = pushView(source.raw, bv.target, bv.byteStride)
  // Copied data starts at offset 0 of its own view.
  const rest = { ...source.accessor }
  delete rest.byteOffset
  accessors.push({ ...rest, bufferView: viewIndex })
  return accessors.length - 1
}
// Recompute POSITION bounds after the haircut.
let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
for (let k = 0; k < count; k++) for (let c = 0; c < 3; c++) { const v = position.get(k, c); min[c] = Math.min(min[c], v); max[c] = Math.max(max[c], v) }
position.accessor = { ...position.accessor, min, max }
const attributes = {
  POSITION: copyAccessor(primitive.attributes.POSITION, position),
  NORMAL: copyAccessor(primitive.attributes.NORMAL, normal),
  TEXCOORD_0: copyAccessor(primitive.attributes.TEXCOORD_0),
  JOINTS_0: copyAccessor(primitive.attributes.JOINTS_0),
  WEIGHTS_0: copyAccessor(primitive.attributes.WEIGHTS_0),
}
attributes._KIT = accessors.push({ bufferView: pushView(kit, 34962), componentType: 5121, normalized: true, count, type: 'VEC4' }) - 1
const indices = copyAccessor(primitive.indices)
const inverseBind = copyAccessor(gltf.skins[0].inverseBindMatrices)
const images = gltf.images.map(image => {
  const bv = gltf.bufferViews[image.bufferView]
  return { mimeType: image.mimeType, bufferView: pushView(bin.subarray(bv.byteOffset, bv.byteOffset + bv.byteLength)) }
})
const out = {
  asset: { version: '2.0', generator: 'PlayLiva embaixadinha-assets.mjs' },
  extensionsUsed: gltf.extensionsUsed, extensionsRequired: gltf.extensionsRequired,
  scene: 0, scenes: gltf.scenes, nodes: gltf.nodes.map(node => node.mesh !== undefined ? { ...node, name: 'craque' } : node),
  meshes: [{ name: 'craque', primitives: [{ attributes, indices, material: 0, mode: primitive.mode }] }],
  skins: [{ ...gltf.skins[0], inverseBindMatrices: inverseBind }],
  materials: [{ ...gltf.materials[0], name: 'Craque' }], textures: gltf.textures, samplers: gltf.samplers, images,
  accessors, bufferViews, buffers: [{ byteLength: offset }],
}
const binary = Buffer.concat(chunks)
let json = Buffer.from(JSON.stringify(out))
json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)])
const body = Buffer.concat([binary, Buffer.alloc((4 - (binary.length % 4)) % 4)])
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + body.length, 8)
const chunk = (type, data) => { const h = Buffer.alloc(8); h.writeUInt32LE(data.length, 0); h.writeUInt32LE(type, 4); return Buffer.concat([h, data]) }
const result = Buffer.concat([header, chunk(0x4e4f534a, json), chunk(0x004e4942, body)])
await mkdir(OUT_DIR, { recursive: true })
await writeFile(new URL('craque.glb', OUT_DIR), result)
const sha256 = createHash('sha256').update(result).digest('hex')
const manifest = {
  source: { path: 'public/originals/crash/runtime/castaway.glb', sha256: createHash('sha256').update(glb).digest('hex'), bytes: glb.length },
  runtime: { path: 'craque.glb', bytes: result.length, sha256, vertices: count, hairVertices, joints: jointNames.length, clips: 0 },
  skull: SKULL,
}
await writeFile(new URL('manifest.json', OUT_DIR), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify(manifest.runtime))
