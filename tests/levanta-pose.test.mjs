import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const require = createRequire(import.meta.url)
const { buildSync } = createRequire(require.resolve('tsx'))('esbuild')
const source = await readFile(new URL('../components/originals/three-games/levanta-pose.ts', import.meta.url), 'utf8')
const { outputFiles } = buildSync({ stdin: { contents: source, loader: 'ts', resolveDir: fileURLToPath(new URL('../components/originals/three-games/', import.meta.url)) }, bundle: true, write: false, format: 'esm', external: ['three'] })
const code = outputFiles[0].text
const { createDeadliftPose } = await import('data:text/javascript;base64,' + Buffer.from(code.replace('"three"', JSON.stringify(import.meta.resolve('three')))).toString('base64'))

async function athlete() {
  const bytes = await readFile(new URL('../public/originals/levanta/athlete.glb', import.meta.url))
  const end = 20 + bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, end)), bin = bytes.subarray(end + 8)
  // Geometry and exact shipped animation only; Node does not need browser textures.
  json.materials = [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }]
  delete json.images; delete json.textures; delete json.samplers
  json.buffers = [{ uri: `data:application/octet-stream;base64,${bin.toString('base64')}`, byteLength: bin.length }]
  globalThis.ProgressEvent ??= class { constructor(type, values) { Object.assign(this, { type }, values) } }
  const gltf = await new GLTFLoader().parseAsync(JSON.stringify(json), '')
  const model = gltf.scene, meshes = []
  const bounds = new THREE.Box3().setFromObject(model, true)
  model.scale.setScalar(1.8 / (bounds.max.y - bounds.min.y))
  model.traverse(m => { if (m.isSkinnedMesh) meshes.push(m) })
  const mixer = new THREE.AnimationMixer(model)
  mixer.clipAction(gltf.animations.find(c => c.name === 'Ready')).play(); mixer.setTime(0)
  model.updateMatrixWorld(true)
  let floor = Infinity
  const point = new THREE.Vector3()
  for (const mesh of meshes) {
    mesh.skeleton.update()
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld); floor = Math.min(floor, point.y)
    }
  }
  model.position.y = .0234 - floor; model.updateMatrixWorld(true)
  const pose = createDeadliftPose(model, meshes); pose.initialize()
  const rest = []
  model.traverse(o => rest.push({ o, position: o.position.clone(), quaternion: o.quaternion.clone() }))
  const failureTracks = gltf.animations.find(c => c.name === 'Fail').tracks.map(track => {
    const split = track.name.lastIndexOf('.')
    return { object: model.getObjectByName(track.name.slice(0, split)), property: track.name.slice(split + 1), interpolant: track.createInterpolant() }
  })
  return {
    model, meshes, pose,
    reset() { for (const r of rest) { r.o.position.copy(r.position); r.o.quaternion.copy(r.quaternion) } model.updateMatrixWorld(true) },
    snapshot() { return new Map(rest.map(({ o }) => [o, { position: o.position.clone(), quaternion: o.quaternion.clone() }])) },
    failure(seconds, prior) {
      const blend = THREE.MathUtils.smoothstep(seconds, 0, .65)
      for (const t of failureTracks) {
        t.object[t.property].fromArray(t.interpolant.evaluate(Math.min(2.03, 1.1 + seconds * .65)))
        if (t.property === 'position') t.object.position.lerp(prior.get(t.object).position, 1 - blend)
        if (t.property === 'quaternion') t.object.quaternion.slerp(prior.get(t.object).quaternion, 1 - blend)
      }
      model.updateMatrixWorld(true)
      pose.release(seconds)
    },
  }
}

test('Skuptu retarget: planted soles, straight arms, symmetric grips and clear vertical bar throughout the pull', async () => {
  const { meshes, pose, reset, model } = await athlete()
  const bar = new THREE.Object3D(), point = new THREE.Vector3()
  for (let frame = 0; frame <= 100; frame++) {
    reset(); pose.apply(frame / 100, frame / 10, bar)
    assert.equal(bar.position.x, 0); assert.equal(bar.position.z, .315)
    const metrics = pose.diagnostics()
    for (const [i, metric] of metrics.entries()) {
      assert.ok(metric.footError < .00001, `foot drift at frame ${frame}`)
      const shoulder = new THREE.Vector3().fromArray(metric.shoulder), elbow = new THREE.Vector3().fromArray(metric.elbow), wrist = new THREE.Vector3().fromArray(metric.wrist)
      assert.ok(elbow.clone().sub(shoulder).angleTo(wrist.clone().sub(elbow)) < .10, `bent elbow at frame ${frame}`)
      assert.ok(wrist.distanceTo(new THREE.Vector3(i === 0 ? .267 : -.267, bar.position.y + .085, .351)) < .00001)
      const hand = model.getObjectByName(i === 0 ? 'LeftHand' : 'RightHand')
      const gripCenter = hand.localToWorld(new THREE.Vector3(0, 8, 3.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), i === 0 ? -1.35 : 1.39))
      assert.ok(Math.hypot(gripCenter.y - bar.position.y, gripCenter.z - bar.position.z) < .001)
    }
    let floor = Infinity, front = -Infinity
    const soles = [Infinity, Infinity]
    for (const mesh of meshes) {
      mesh.skeleton.update()
      const indices = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight
      for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
        mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld); floor = Math.min(floor, point.y)
        const side = point.x > 0 ? 0 : 1
        soles[side] = Math.min(soles[side], point.y)
        let leg = 0
        for (let k = 0; k < 4; k++) if (/Leg|Hips/.test(mesh.skeleton.bones[indices.getComponent(i, k)].name)) leg += weights.getComponent(i, k)
        if (leg > .5 && Math.abs(point.y - bar.position.y) < .023) front = Math.max(front, point.z)
      }
    }
    assert.ok(floor >= .02, `mat penetration at frame ${frame}: ${floor}`)
    for (const sole of soles) assert.ok(Math.abs(sole - .0234) < .00002, `outsole must contact mat without floating at frame ${frame}: ${sole}`)
    assert.ok(bar.position.z - .021 - front > .012, `shaft intersects legs at frame ${frame}`)
  }
})

test('Skuptu grip correction releases back to the supplied hand geometry', async () => {
  const { meshes, pose } = await athlete()
  const original = meshes.map(m => m.geometry.attributes.position.array.slice())
  pose.apply(.8, 8, new THREE.Object3D())
  assert.notDeepEqual(meshes[0].geometry.attributes.position.array, original[0])
  pose.release(.18)
  for (const [i, mesh] of meshes.entries()) assert.deepEqual(mesh.geometry.attributes.position.array, original[i])
  for (const metric of pose.diagnostics()) assert.ok(metric.footError < .00001)
})

test('Skuptu keeps the whole shoe above the mat through early, mid-lift and lockout failures', async () => {
  const rig = await athlete(), point = new THREE.Vector3(), bar = new THREE.Object3D()
  for (const progress of [0, .5, 1]) {
    rig.reset(); rig.pose.apply(progress, progress * 10, bar)
    const prior = rig.snapshot()
    const joints = ['Hips', 'Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm', 'LeftHand', 'RightHand']
      .map(name => ({ bone: rig.model.getObjectByName(name), point: rig.model.getObjectByName(name).getWorldPosition(new THREE.Vector3()) }))
    const toes = ['LeftToeBase', 'RightToeBase'].map(name => rig.model.getObjectByName(name).getWorldPosition(new THREE.Vector3()))
    for (let frame = 0; frame <= 49; frame++) {
      const seconds = frame * .05
      rig.failure(seconds, prior)
      if (frame === 0) for (const joint of joints) assert.ok(joint.bone.getWorldPosition(new THREE.Vector3()).distanceTo(joint.point) < .0001, `${joint.bone.name} popped on release`)
      for (const [i, name] of ['LeftToeBase', 'RightToeBase'].entries()) {
        const toe = rig.model.getObjectByName(name).getWorldPosition(new THREE.Vector3())
        assert.ok(Math.hypot(toe.x - toes[i].x, toe.z - toes[i].z) < .00001, `${name} slid at ${seconds}s`)
        assert.ok(Math.abs(toe.y - toes[i].y) < .004, `${name} contact correction too large at ${seconds}s`)
      }
      for (const limb of rig.pose.diagnostics()) assert.ok(limb.footError < .00001)
      let minimum = Infinity
      const soles = [Infinity, Infinity]
      for (const mesh of rig.meshes) {
        mesh.skeleton.update()
        for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
          mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld)
          minimum = Math.min(minimum, point.y)
          const side = point.x > 0 ? 0 : 1
          soles[side] = Math.min(soles[side], point.y)
        }
      }
      assert.ok(minimum > .0214, `shoe/platform clipping from ${progress} at ${seconds}s: ${minimum}`)
      for (const sole of soles) assert.ok(Math.abs(sole - .0234) < .00002, `recovery outsole contact from ${progress} at ${seconds}s: ${sole}`)
      if (seconds >= 1) {
        const hips = rig.model.getObjectByName('Hips').getWorldPosition(new THREE.Vector3())
        const chest = rig.model.getObjectByName('Spine').getWorldPosition(new THREE.Vector3())
        assert.ok(chest.z - hips.z > .065, `recovery should retain a forward fatigue hinge at ${seconds}s`)
        for (const limb of rig.pose.diagnostics()) {
          assert.ok(limb.wrist[1] < limb.shoulder[1] - .4, `recovery hand raised at ${seconds}s`)
          assert.ok(limb.elbow[1] < limb.shoulder[1] && limb.elbow[1] > limb.wrist[1], `folded recovery arm at ${seconds}s`)
          assert.ok(limb.wrist[0] * limb.shoulder[0] > 0, `recovery arm crosses the body at ${seconds}s`)
        }
      }
    }
  }
})
