import * as THREE from 'three'
import { LEVANTA_MAT_SEAM_TOP, LEVANTA_SOLE_Y } from './levanta-contact'

const forward = new THREE.Vector3(0, 0, 1)
const rotation = (bone: THREE.Object3D, world: THREE.Quaternion) => {
  bone.quaternion.copy(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world))
  bone.updateMatrixWorld(true)
}
function aim(bone: THREE.Object3D, child: THREE.Object3D, target: THREE.Vector3) {
  const origin = bone.getWorldPosition(new THREE.Vector3())
  const from = child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize()
  const to = target.clone().sub(origin).normalize()
  rotation(bone, new THREE.Quaternion().setFromUnitVectors(from, to).multiply(bone.getWorldQuaternion(new THREE.Quaternion())))
}
/** Two-bone solve retains bone lengths; the pole specifies the anatomical bend plane. */
function solve(root: THREE.Object3D, middle: THREE.Object3D, tip: THREE.Object3D, target: THREE.Vector3, pole: THREE.Vector3) {
  const origin = root.getWorldPosition(new THREE.Vector3())
  const joint = middle.getWorldPosition(new THREE.Vector3())
  const l1 = origin.distanceTo(joint), l2 = joint.distanceTo(tip.getWorldPosition(new THREE.Vector3()))
  const direction = target.clone().sub(origin)
  const distance = THREE.MathUtils.clamp(direction.length(), Math.abs(l1 - l2) + .0001, l1 + l2 - .0001)
  direction.normalize()
  const along = (l1 * l1 - l2 * l2 + distance * distance) / (2 * distance)
  const bend = pole.clone().addScaledVector(direction, -pole.dot(direction)).normalize()
  joint.copy(origin).addScaledVector(direction, along).addScaledVector(bend, Math.sqrt(Math.max(0, l1 * l1 - along * along)))
  aim(root, middle, joint)
  aim(middle, tip, target)
}

/** Retarget the supplied athlete, without replacing its geometry, textures or skeleton.
 * The source has wrist joints but no finger joints, so grip curvature is a local
 * deformation of hand-weighted vertices, equivalent to a small grip blend shape.
 */
export function createDeadliftPose(model: THREE.Object3D, meshes: THREE.SkinnedMesh[]) {
  const bone = (name: string) => model.getObjectByName(name)!
  const hips = bone('Hips')
  const head = bone('Head'), neck = bone('neck')
  const headRotation = new THREE.Quaternion(), neckRotation = new THREE.Quaternion()
  const limbs = ['Left', 'Right'].map((side, index) => ({
    sign: index === 0 ? 1 : -1,
    // Principal palm-width axes measured from the supplied hand vertices.
    palmAngle: index === 0 ? 1.35 : -1.39,
    shoulder: bone(side + 'Arm'), elbow: bone(side + 'ForeArm'), hand: bone(side + 'Hand'),
    hip: bone(side + 'UpLeg'), knee: bone(side + 'Leg'), foot: bone(side + 'Foot'),
    toe: bone(side + 'ToeBase'), toePosition: new THREE.Vector3(), toeRotation: new THREE.Quaternion(), toeScale: new THREE.Vector3(),
    anchor: new THREE.Vector3(), footRotation: new THREE.Quaternion(),
    shoe: [] as { mesh: THREE.SkinnedMesh; indices: number[] }[],
    soleY: 0,
  }))
  const grips: { attribute: THREE.BufferAttribute; indices: number[]; open: THREE.Vector3[]; closed: THREE.Vector3[] }[] = []
  for (const mesh of meshes) {
    const attribute = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const indices: number[] = [], open: THREE.Vector3[] = [], closed: THREE.Vector3[] = []
    const skinIndex = mesh.geometry.getAttribute('skinIndex'), weight = mesh.geometry.getAttribute('skinWeight')
    for (const limb of limbs) {
      const handIndex = mesh.skeleton.bones.indexOf(limb.hand as THREE.Bone)
      const toHand = mesh.skeleton.boneInverses[handIndex].clone().multiply(mesh.bindMatrix)
      const fromHand = toHand.clone().invert()
      for (let i = 0; i < attribute.count; i++) {
        let influence = 0
        for (let k = 0; k < 4; k++) if (skinIndex.getComponent(i, k) === handIndex) influence += weight.getComponent(i, k)
        if (influence < .5) continue
        const original = new THREE.Vector3().fromBufferAttribute(attribute, i)
        const local = original.clone().applyMatrix4(toHand)
        if (local.y <= 8) continue
        // The wrist's X/Z axes are not the palm's width/normal axes. Curl in
        // palm space, then return to the original bind space (including thumbs).
        local.applyAxisAngle(new THREE.Vector3(0, 1, 0), limb.palmAngle)
        const angle = Math.min(3.45, (local.y - 8) / 3.7)
        const thickness = THREE.MathUtils.clamp((local.z - (local.y - 8) * .18) * .5, -.9, .9)
        const foldedWidth = Math.sign(local.x) * (Math.min(Math.abs(local.x), 3.2) + Math.max(0, Math.abs(local.x) - 3.2) * .3)
        local.set(foldedWidth, 8 + Math.sin(angle) * (3.1 - thickness), 3.4 - Math.cos(angle) * (3.1 - thickness))
        local.applyAxisAngle(new THREE.Vector3(0, 1, 0), -limb.palmAngle)
        indices.push(i); open.push(original); closed.push(original.clone().lerp(local.applyMatrix4(fromHand), influence))
      }
    }
    grips.push({ attribute, indices, open, closed })
  }
  let initialized = false, gripAmount = -1
  const point = new THREE.Vector3()
  function grip(amount: number) {
    if (Math.abs(amount - gripAmount) < .001) return
    gripAmount = amount
    for (const g of grips) {
      g.indices.forEach((index, i) => { point.copy(g.open[i]).lerp(g.closed[i], amount); g.attribute.setXYZ(index, point.x, point.y, point.z) })
      g.attribute.needsUpdate = true
    }
    for (const mesh of meshes) mesh.geometry.computeVertexNormals()
  }
  function soleHeight(limb: typeof limbs[number]) {
    let low = Infinity
    for (const { mesh, indices } of limb.shoe) {
      for (const index of indices) {
        mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld)
        low = Math.min(low, point.y)
      }
    }
    return low
  }
  function plantFeet() {
    for (const limb of limbs) {
      // Solve contact AFTER retargeting. Shoe vertices also carry shin weights,
      // so an ankle/toe anchor measured in Ready is not a final-mesh guarantee.
      // Two correction passes converge without translating the torso or bar.
      for (let pass = 0; pass < 3; pass++) {
        solve(limb.hip, limb.knee, limb.foot, limb.anchor, forward)
        rotation(limb.foot, limb.footRotation)
        limb.toe.position.copy(limb.toePosition)
        limb.toe.quaternion.copy(limb.toeRotation)
        limb.toe.scale.copy(limb.toeScale)
        limb.toe.updateMatrixWorld(true)
        limb.soleY = soleHeight(limb)
        const correction = LEVANTA_SOLE_Y - limb.soleY
        if (Math.abs(correction) < .00001 || pass === 2) break
        limb.anchor.y += correction
      }
    }
  }
  return {
    /** Call on the grounded source Ready pose to establish the soles once. */
    initialize() {
      model.updateMatrixWorld(true)
      for (const limb of limbs) {
        limb.toePosition.copy(limb.toe.position); limb.toeRotation.copy(limb.toe.quaternion); limb.toeScale.copy(limb.toe.scale)
        limb.foot.getWorldPosition(limb.anchor)
        const toe = bone((limb.sign === 1 ? 'Left' : 'Right') + 'ToeBase').getWorldPosition(new THREE.Vector3()).sub(limb.anchor)
        const toeAngle = Math.atan2(toe.x, toe.z)
        limb.anchor.x = limb.sign * .165
        limb.anchor.z = .225
        limb.foot.getWorldQuaternion(limb.footRotation)
        limb.footRotation.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), limb.sign * .12 - toeAngle))
        // Cache actual shoe vertices once, including vertices weighted to the
        // shin. Do not use only ankle height or a >60% foot-weight threshold.
        for (const mesh of meshes) {
          const indices = mesh.geometry.getAttribute('skinIndex'), weights = mesh.geometry.getAttribute('skinWeight')
          const shoeIndices: number[] = []
          const ankleY = limb.foot.getWorldPosition(new THREE.Vector3()).y
          for (let i = 0; i < indices.count; i++) {
            let influence = 0
            for (let k = 0; k < 4; k++) {
              const name = mesh.skeleton.bones[indices.getComponent(i, k)].name
              if (name === limb.foot.name || name === limb.toe.name || name === limb.knee.name) influence += weights.getComponent(i, k)
            }
            if (influence <= .5) continue
            mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld)
            if (point.y <= ankleY + .02) shoeIndices.push(i)
          }
          if (shoeIndices.length) limb.shoe.push({ mesh, indices: shoeIndices })
        }
        const sole = soleHeight(limb)
        if (!Number.isFinite(sole)) throw Error('Athlete shoe contact vertices are missing')
        limb.anchor.y += LEVANTA_SOLE_Y - sole
      }
      head.getWorldQuaternion(headRotation); neck.getWorldQuaternion(neckRotation)
      initialized = true
    },
    apply(progress: number, seconds: number, bar: THREE.Object3D) {
      if (!initialized) throw Error('Deadlift anchors must be initialized')
      const p = THREE.MathUtils.smoothstep(progress, 0, 1)
      const strain = (Math.sin(seconds * 17) + Math.sin(seconds * 23) * .35) * .0025 * p
      bar.position.set(0, .305 + .475 * p + strain, .315)
      bar.quaternion.identity()
      // Rotate the neutral source hinge as one unit; do not bend the lumbar chain.
      // Leg drive precedes hip extension: opening the torso too early pushes
      // the knees into the shaft and turns a deadlift into a squat.
      const hinge = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -.15 - 1.05 * p ** 1.8)
      rotation(hips, hinge.multiply(hips.getWorldQuaternion(new THREE.Quaternion())))
      const shoulderLine = limbs[0].shoulder.getWorldPosition(new THREE.Vector3()).sub(limbs[1].shoulder.getWorldPosition(new THREE.Vector3())).normalize()
      rotation(hips, new THREE.Quaternion().setFromUnitVectors(shoulderLine, new THREE.Vector3(1, 0, 0)).multiply(hips.getWorldQuaternion(new THREE.Quaternion())))
      const shoulders = limbs.map(l => l.shoulder.getWorldPosition(new THREE.Vector3()))
      const midpoint = shoulders[0].clone().add(shoulders[1]).multiplyScalar(.5)
      // As the hips extend, bring the body behind the shaft so it clears the thighs.
      const desired = new THREE.Vector3(0, bar.position.y + .554, bar.position.z + .012 - .15 * p)
      const hipWorld = hips.getWorldPosition(new THREE.Vector3()).add(desired.sub(midpoint))
      hips.position.copy(hips.parent!.worldToLocal(hipWorld)); model.updateMatrixWorld(true)
      // Keep the gaze ahead and the neck neutral instead of inheriting the hinge's pitch.
      rotation(neck, neckRotation)
      rotation(head, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), p * (.04 + Math.sin(seconds * 2) * .01)).multiply(headRotation))
      plantFeet()
      for (const limb of limbs) {
        const wrist = new THREE.Vector3(limb.sign * .267, bar.position.y + .085, bar.position.z + .036)
        const shoulder = limb.shoulder.getWorldPosition(new THREE.Vector3())
        const elbow = limb.elbow.getWorldPosition(new THREE.Vector3())
        const length = shoulder.distanceTo(elbow) + elbow.distanceTo(limb.hand.getWorldPosition(new THREE.Vector3()))
        // Accommodate the source's slightly unequal arm lengths at the clavicle,
        // keeping both elbows almost extended and both grips exactly on the bar.
        shoulder.y = wrist.y + Math.sqrt(length * length - (shoulder.x - wrist.x) ** 2 - (shoulder.z - wrist.z) ** 2) - .0004
        limb.shoulder.position.copy(limb.shoulder.parent!.worldToLocal(shoulder)); limb.shoulder.updateMatrixWorld(true)
        solve(limb.shoulder, limb.elbow, limb.hand, wrist, new THREE.Vector3(0, 0, -1))
        // Local +Y runs from wrist to fingertips; both palms face the athlete.
        const handRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), limb.palmAngle))
        // Pronate through the forearm, not by twisting only the wrist skin.
        const axis = wrist.clone().sub(limb.elbow.getWorldPosition(new THREE.Vector3())).normalize()
        const delta = handRotation.clone().multiply(limb.hand.getWorldQuaternion(new THREE.Quaternion()).invert())
        const projected = delta.x * axis.x + delta.y * axis.y + delta.z * axis.z
        const twist = new THREE.Quaternion(axis.x * projected, axis.y * projected, axis.z * projected, delta.w).normalize()
        rotation(limb.elbow, twist.multiply(limb.elbow.getWorldQuaternion(new THREE.Quaternion())))
        rotation(limb.hand, handRotation)
      }
      grip(1)
      model.updateMatrixWorld(true)
    },
    release(seconds: number) {
      // Release on the authoritative failure frame, then uncurl as the bar falls.
      grip(Math.max(0, 1 - seconds / .18))
      model.updateMatrixWorld(true)
      const fatigue = THREE.MathUtils.smoothstep(seconds, .12, .9)
      const breath = Math.sin(Math.max(0, seconds - .9) * 3) * .002 * fatigue
      // Settle after release instead of finishing in the clip's rigid upright
      // pose. Hinge at the hips, soften the knees and allow a small weight shift.
      const hipWorld = hips.getWorldPosition(new THREE.Vector3())
      const torso = bone('Spine').getWorldPosition(new THREE.Vector3()).sub(hipWorld).normalize()
      const tiredDirection = new THREE.Vector3(-.035, .96, .28).normalize()
      const settle = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(torso, tiredDirection), fatigue)
      rotation(hips, settle.multiply(hips.getWorldQuaternion(new THREE.Quaternion())))
      // The source clip steps backward into an upright finish. With feet kept
      // planted, settle the pelvis over this stance instead of retaining that drift.
      hipWorld.lerp(new THREE.Vector3(-.025, .955 + breath, .06), fatigue)
      hips.position.copy(hips.parent!.worldToLocal(hipWorld)); model.updateMatrixWorld(true)
      for (const limb of limbs) {
        const shoulder = limb.shoulder.getWorldPosition(new THREE.Vector3())
        shoulder.y -= (.018 + limb.sign * .003) * fatigue
        limb.shoulder.position.copy(limb.shoulder.parent!.worldToLocal(shoulder.clone())); limb.shoulder.updateMatrixWorld(true)
        const elbow = limb.elbow.getWorldPosition(new THREE.Vector3()), wrist = limb.hand.getWorldPosition(new THREE.Vector3())
        const upperPose = limb.shoulder.quaternion.clone(), forearmPose = limb.elbow.quaternion.clone(), handPose = limb.hand.quaternion.clone()
        const armLength = shoulder.distanceTo(elbow) + elbow.distanceTo(wrist)
        const restingWrist = shoulder.clone().add(new THREE.Vector3(limb.sign * .03, -armLength * .989, -.012))
        const handRotation = limb.hand.getWorldQuaternion(new THREE.Quaternion())
        const fingers = new THREE.Vector3(0, 1, 0).applyQuaternion(handRotation)
        const relaxHand = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(fingers, new THREE.Vector3(0, -1, 0)), fatigue)
        solve(limb.shoulder, limb.elbow, limb.hand, wrist.lerp(restingWrist, fatigue), forward)
        rotation(limb.hand, relaxHand.multiply(handRotation))
        limb.shoulder.quaternion.slerp(upperPose, 1 - fatigue)
        limb.elbow.quaternion.slerp(forearmPose, 1 - fatigue)
        limb.hand.quaternion.slerp(handPose, 1 - fatigue)
        limb.shoulder.updateMatrixWorld(true)
      }
      rotation(head, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), .06 * fatigue).multiply(head.getWorldQuaternion(new THREE.Quaternion())))
      let lower = 0
      for (const limb of limbs) {
        const root = limb.hip.getWorldPosition(new THREE.Vector3()), knee = limb.knee.getWorldPosition(new THREE.Vector3())
        const length = (root.distanceTo(knee) + knee.distanceTo(limb.foot.getWorldPosition(new THREE.Vector3()))) * .997
        const horizontal = (root.x - limb.anchor.x) ** 2 + (root.z - limb.anchor.z) ** 2
        lower = Math.max(lower, root.y - limb.anchor.y - Math.sqrt(Math.max(.001, length * length - horizontal)))
      }
      if (lower > 0) { hips.position.y -= lower / hips.parent!.getWorldScale(new THREE.Vector3()).y; model.updateMatrixWorld(true) }
      plantFeet()
    },
    diagnostics() {
      return limbs.map(limb => ({
        footError: limb.foot.getWorldPosition(new THREE.Vector3()).distanceTo(limb.anchor),
        soleY: limb.soleY,
        soleClearance: limb.soleY - LEVANTA_MAT_SEAM_TOP,
        shoulder: limb.shoulder.getWorldPosition(new THREE.Vector3()).toArray(),
        elbow: limb.elbow.getWorldPosition(new THREE.Vector3()).toArray(),
        wrist: limb.hand.getWorldPosition(new THREE.Vector3()).toArray(),
      }))
    },
  }
}
