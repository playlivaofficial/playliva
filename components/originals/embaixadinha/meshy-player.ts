import * as THREE from 'three'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { TOUCHES, touchIndexAt } from '@/lib/originals/embaixadinha/juggle'
import { type MotionInput, type Vec3 } from './juggle-motion'
import { CONTACT_CLEARANCE, smooth, touchEnvelope, touchProfile } from './touch-choreography'

export const BOOT_CLEARANCE = .003
const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1)
type Side = 'Left' | 'Right'

/** Authored low keepie-uppies on the supplied rig, with source upper-body layers.
 * Exact engine time is the only clock. IK and contact calibration are presentation only. */
export function createMeshyPlayer(gltf: GLTF) {
  const model = gltf.scene
  const bones = (name: string) => {
    const bone = model.getObjectByName(name) as THREE.Bone
    if (!bone) throw new Error(`Missing Meshy joint ${name}`)
    return bone
  }
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(model, true)
  model.scale.setScalar(1.7 / (bounds.max.y - bounds.min.y))
  model.updateMatrixWorld(true)
  const hips = bones('Hips'), rootRest = hips.position.clone()
  const feet = Object.fromEntries((['Left', 'Right'] as Side[]).map(side => [side, {
    upper: bones(side + 'UpLeg'), knee: bones(side + 'Leg'), foot: bones(side + 'Foot'), toe: bones(side + 'ToeBase'),
    flat: bones(side + 'Foot').getWorldQuaternion(new THREE.Quaternion()),
    target: bones(side + 'Foot').getWorldPosition(new THREE.Vector3()),
  }])) as Record<Side, { upper: THREE.Bone; knee: THREE.Bone; foot: THREE.Bone; toe: THREE.Bone; flat: THREE.Quaternion; target: THREE.Vector3 }>
  const layers: { time: number; weight: number; tracks: { bone: THREE.Bone; property: string; sample: (time: number) => ArrayLike<number> }[] }[] = []
  function action(name: string, upperOnly = false) {
    const source = gltf.animations.find(c => c.name === name)
    if (!source) throw new Error(`Missing ${name} source`)
    const clip = source.clone()
    if (upperOnly) clip.tracks = clip.tracks.filter(t => /^(Spine|neck|Head|Left(Arm|ForeArm|Shoulder|Hand)|Right(Arm|ForeArm|Shoulder|Hand))/.test(t.name) && t.name.endsWith('.quaternion'))
    const a = { time: 0, weight: 1, tracks: clip.tracks.map(track => {
      const split = track.name.lastIndexOf('.'), bone = bones(track.name.slice(0, split))
      const interpolant = (track as THREE.KeyframeTrack & { createInterpolant(): THREE.Interpolant }).createInterpolant()
      return { bone, property: track.name.slice(split + 1), sample: (time: number) => interpolant.evaluate(time) }
    }), getClip: () => clip, setEffectiveWeight(weight: number) { this.weight = weight } }
    layers.push(a)
    return a
  }
  const idle = action('Idle'), balance = action('Kick', true), stumble = action('Stumble', true)
  const samples: { mesh: THREE.SkinnedMesh; indices: number[]; side: Side[] }[] = []
  const textures = new Set<THREE.Texture>()
  model.traverse(object => {
    const mesh = object as THREE.SkinnedMesh
    if (!mesh.isSkinnedMesh) return
    mesh.frustumCulled = false
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const mat = material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0; mat.metalness = 0; mat.roughness = .8
      for (const value of Object.values(mat)) if (value instanceof THREE.Texture) textures.add(value)
    }
    const p = mesh.geometry.getAttribute('position'), indices: number[] = [], side: Side[] = []
    for (let i = 0; i < p.count; i++) if (p.getY(i) < .16) { indices.push(i); side.push(p.getX(i) > 0 ? 'Left' : 'Right') }
    if (!indices.length) throw new Error('No boot geometry')
    samples.push({ mesh, indices, side })
  })
  const vertex = new THREE.Vector3(), parentQ = new THREE.Quaternion(), q = new THREE.Quaternion()
  const stagePoint = (p: THREE.Vector3) => model.parent ? model.parent.worldToLocal(p) : p
  const worldPoint = (p: THREE.Vector3) => model.parent ? model.parent.localToWorld(p) : p
  function worldRotation(bone: THREE.Bone, rotation: THREE.Quaternion) {
    bone.parent!.getWorldQuaternion(parentQ).invert()
    bone.quaternion.copy(parentQ).multiply(rotation)
    bone.updateMatrixWorld(true)
  }
  function aim(bone: THREE.Bone, child: THREE.Bone, target: THREE.Vector3) {
    const origin = bone.getWorldPosition(new THREE.Vector3())
    const from = child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(), to = target.clone().sub(origin).normalize()
    const rotation = q.setFromUnitVectors(from, to).multiply(bone.getWorldQuaternion(new THREE.Quaternion())).clone()
    worldRotation(bone, rotation)
  }
  function leg(side: Side, target: THREE.Vector3, toeUp: number) {
    const f = feet[side], hip = f.upper.getWorldPosition(new THREE.Vector3()), knee = f.knee.getWorldPosition(new THREE.Vector3()), ankle = f.foot.getWorldPosition(new THREE.Vector3())
    const l1 = hip.distanceTo(knee), l2 = knee.distanceTo(ankle), end = worldPoint(target.clone())
    const direction = end.clone().sub(hip), distance = Math.min(direction.length(), l1 + l2 - .001)
    direction.normalize(); end.copy(hip).addScaledVector(direction, distance)
    const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance)
    const bend = worldPoint(new THREE.Vector3(0, 0, 1)).sub(worldPoint(new THREE.Vector3())).normalize()
    bend.addScaledVector(direction, -bend.dot(direction)).normalize()
    const joint = hip.clone().addScaledVector(direction, along).addScaledVector(bend, Math.sqrt(Math.max(0, l1 * l1 - along * along)))
    aim(f.upper, f.knee, joint); aim(f.knee, f.foot, end)
    const stageRotation = model.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion()
    worldRotation(f.foot, stageRotation.multiply(new THREE.Quaternion().setFromAxisAngle(X, -toeUp)).multiply(f.flat))
  }
  function ground() {
    model.updateMatrixWorld(true)
    let low = Infinity
    for (const { mesh, indices } of samples) {
      mesh.skeleton.update()
      for (const index of indices) {
        mesh.getVertexPosition(index, vertex).applyMatrix4(mesh.matrixWorld)
        low = Math.min(low, vertex.y)
      }
    }
    model.position.y += BOOT_CLEARANCE - low
    model.updateMatrixWorld(true)
  }
  let lastElapsed = NaN, lastFailure: number | null = null, resetFrom: Map<THREE.Bone, THREE.Quaternion> | null = null, resetAt = 0
  const resetPosition = new THREE.Vector3()
  function pose(input: MotionInput, seconds: number, allowReset: boolean) {
    const elapsed = input.elapsed
    const failure = input.failTouch !== null && elapsed >= TOUCHES[input.failTouch].at ? input.failTouch : null
    const since = failure === null ? -1 : (elapsed - TOUCHES[failure].at) / 1000
    // No phase shift at contact: source body sway is sampled from round time.
    const bodyTime = Number.isFinite(elapsed) ? Math.max(0, elapsed) / 1000 : seconds
    idle.time = (bodyTime * .42) % idle.getClip().duration
    balance.time = .72; stumble.time = Math.min(stumble.getClip().duration - .001, .55 + Math.max(0, since) * .75)
    idle.setEffectiveWeight(1)
    balance.setEffectiveWeight(failure === null && Number.isFinite(elapsed) ? .12 : 0)
    // Fast onset, small amplitude, upper body only; no generic walk/root motion.
    stumble.setEffectiveWeight(since >= 0 ? .65 * (1 - Math.exp(-since / .07)) : 0)
    // Write sampled source transforms on EVERY frame, even a repeated frozen
    // timestamp. Mixer binding caches otherwise retain procedural offsets.
    for (const [index, layer] of layers.entries()) for (const track of layer.tracks) {
      const value = track.sample(layer.time)
      if (track.property === 'quaternion') {
        const rotation = new THREE.Quaternion().fromArray(value)
        if (index === 0) track.bone.quaternion.copy(rotation)
        else track.bone.quaternion.slerp(rotation, layer.weight)
      } else if (index === 0 && track.property === 'position') track.bone.position.fromArray(value)
      else if (index === 0 && track.property === 'scale') track.bone.scale.fromArray(value)
    }
    model.position.set(0, 0, 0)
    hips.position.copy(rootRest); hips.position.y -= 2.5 // cm in the source armature
    const lifts: Record<Side, number> = { Left: 0, Right: 0 }, forwards = { Left: 0, Right: 0 }, pitches = { Left: 0, Right: 0 }
    const time = failure === null ? elapsed : TOUCHES[failure].at
    const k = Number.isFinite(time) ? touchIndexAt(time) : -2
    for (let i = Math.max(0, k - 1); i <= Math.min(TOUCHES.length - 1, k + 1); i++) {
      const profile = touchProfile(i), weight = touchEnvelope(time - TOUCHES[i].at)
      lifts[profile.side] += profile.lift * weight
      forwards[profile.side] += profile.forward * weight
      pitches[profile.side] += profile.toeUp * weight
    }
    const balanceShift = (lifts.Right - lifts.Left) * .18
    hips.position.x += balanceShift * 100
    const spine = bones('Spine02')
    spine.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Z, -balanceShift * .65))
    if (since >= 0) {
      const side = touchProfile(failure!).side, other = side === 'Left' ? 'Right' : 'Left'
      // Abort the successful follow-through immediately. Lower the missed boot,
      // then take one small recovery step, with the other foot planted throughout.
      const lower = smooth(since / .42)
      lifts[side] *= 1 - lower; pitches[side] *= 1 - lower
      forwards[side] *= 1 - lower
      const step = since < .3 ? 0 : Math.sin(Math.PI * smooth((since - .3) / .65))
      lifts[side] += .08 * step; forwards[side] += .10 * smooth((since - .3) / .65)
      lifts[other] = 0; forwards[other] = 0; pitches[other] = 0
      hips.position.x += (side === 'Left' ? -1 : 1) * 3 * (1 - Math.exp(-since / .1)) * (1 - smooth((since - .6) / .65))
      spine.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X, .16 * (1 - Math.exp(-since / .09)) * (1 - smooth((since - .65) / .65))))
    }
    model.updateMatrixWorld(true)
    if (Number.isFinite(elapsed)) {
      // Watch the low ball rather than keeping the source idle's camera-facing gaze.
      const head = bones('Head'), rotation = head.getWorldQuaternion(new THREE.Quaternion())
      const stageRotation = model.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion()
      const axis = X.clone().applyQuaternion(stageRotation)
      worldRotation(head, new THREE.Quaternion().setFromAxisAngle(axis, since >= 0 ? .22 : .34).multiply(rotation))
    }
    for (const side of ['Left', 'Right'] as Side[]) {
      const target = feet[side].target.clone(); target.y += lifts[side]; target.z += forwards[side]
      leg(side, target, pitches[side])
    }
    ground()
    if (allowReset && !Number.isFinite(elapsed) && resetFrom) {
      const w = 1 - smooth((seconds - resetAt) / .5)
      resetFrom.forEach((rotation, bone) => bone.quaternion.slerp(rotation, w))
      model.position.lerp(resetPosition, w); ground()
      if (w === 0) resetFrom = null
    }
    return { phase: failure === null ? 'control' : 'stumble', sinceCrash: since }
  }
  function contact(side: Side): Vec3 {
    const f = feet[side], centre = stagePoint(f.foot.getWorldPosition(new THREE.Vector3())).lerp(stagePoint(f.toe.getWorldPosition(new THREE.Vector3())), .86)
    let high = -Infinity, nearest = Infinity
    const chosen = centre.clone()
    for (const { mesh, indices, side: sides } of samples) {
      mesh.skeleton.update()
      for (let n = 0; n < indices.length; n++) {
        if (sides[n] !== side) continue
        if (mesh.geometry.attributes.position.getY(indices[n]) > .09) continue // instep, not ankle collar
        mesh.getVertexPosition(indices[n], vertex).applyMatrix4(mesh.matrixWorld); stagePoint(vertex)
        const d = Math.hypot(vertex.x - centre.x, vertex.z - centre.z)
        if (d < .045 && vertex.y > high) { high = vertex.y; chosen.copy(vertex) }
        if (!Number.isFinite(high) && d < nearest) { nearest = d; chosen.copy(vertex) }
      }
    }
    return [chosen.x, chosen.y + CONTACT_CLEARANCE, chosen.z]
  }
  const contacts: Vec3[] = TOUCHES.map(t => { pose({ elapsed: t.at, sinceStart: 0, failTouch: null, variant: null }, 0, false); return contact(touchProfile(t.index).side) })
  // The idle ball sits at the first scoop point; its bottom is on the court.
  const rest: Vec3 = [contacts[0][0], .11 + BOOT_CLEARANCE, contacts[0][2] + .11]
  contacts[0] = rest
  function update(input: MotionInput, seconds: number) {
    if (!Number.isFinite(input.elapsed) && Number.isFinite(lastElapsed) && lastFailure !== null) {
      resetFrom = new Map(); model.traverse(n => { if ((n as THREE.Bone).isBone) resetFrom!.set(n as THREE.Bone, n.quaternion.clone()) }); resetAt = seconds; resetPosition.copy(model.position)
    }
    const state = pose(input, seconds, true)
    lastElapsed = input.elapsed; lastFailure = input.failTouch
    return state
  }
  pose({ elapsed: NaN, sinceStart: 0, failTouch: null, variant: null }, 0, false)
  return { model, contacts, rest, contact, update, dispose() { textures.forEach(t => t.dispose()) } }
}
