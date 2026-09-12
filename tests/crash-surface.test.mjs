import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { untexturedModel, stageRig } from '../scripts/crash-rig.mjs'
import presentationModule from '../lib/originals/crash/presentation.ts'
import timingModule from '../lib/originals/crash/timing.ts'
const { CHARACTER_SCALE, CASTAWAY_START, KICKER_START, flightPosition } = presentationModule
const { CONTACT_CLIP_SECONDS, IMPACT_MS, KICK_SPEED } = timingModule

test('actual skinned foot reaches body surface at launch marker, then separates', async (t) => {
  assert.ok(Math.abs(IMPACT_MS / 1000 * KICK_SPEED - CONTACT_CLIP_SECONDS) < 1e-12)
  const male = stageRig(await untexturedModel('castaway'), CASTAWAY_START, CHARACTER_SCALE, 'idle')
  const female = stageRig(await untexturedModel('island-kicker'), KICKER_START, CHARACTER_SCALE, 'kick')
  male.at(.2)
  const body = male.scene.getObjectByProperty('type', 'SkinnedMesh')
  body.skeleton.update()
  const torso = Array.from({ length: body.geometry.attributes.position.count }, (_, i) =>
    body.getVertexPosition(i, new Vector3()).applyMatrix4(body.matrixWorld)).filter(v=>v.y>.8 && v.y<2)
  const footMesh = female.scene.getObjectByProperty('type', 'SkinnedMesh')
  const joints = footMesh.skeleton.bones.flatMap((b,i)=>['LeftFoot','LeftToeBase'].includes(b.name)?[i]:[])
  const indices = Array.from({length:footMesh.geometry.attributes.position.count},(_,i)=>i).filter(i=> {
    let weight=0
    for(let j=0;j<4;j++) if(joints.includes(footMesh.geometry.attributes.skinIndex.getComponent(i,j))) weight+=footMesh.geometry.attributes.skinWeight.getComponent(i,j)
    return weight>.8
  })
  const gap = (delta) => {
    female.at(CONTACT_CLIP_SECONDS + delta * KICK_SPEED)
    footMesh.skeleton.update()
    const displacement = flightPosition(delta), start = flightPosition(0)
    const shift = new Vector3(displacement.x-start.x,displacement.y-start.y,0)
    let nearest=Infinity
    for(const i of indices) {
      const foot=footMesh.getVertexPosition(i,new Vector3()).applyMatrix4(footMesh.matrixWorld).sub(shift)
      for(const vertex of torso) nearest=Math.min(nearest,foot.distanceTo(vertex))
    }
    return nearest
  }
  const before = gap(-.016), contact = gap(0)
  assert.ok(before > .06, 'foot is not embedded before contact')
  assert.ok(contact < .02, 'foot surface within 2cm at shared contact frame')
  const after = gap(.016)
  assert.ok(after > .1, `first post-contact frame separates, not interpenetrates: ${after}`)
  t.diagnostic(`Skinned foot/body vertex clearance (world units): -16ms=${before.toFixed(4)}, contact=${contact.toFixed(4)}, +16ms=${after.toFixed(4)}; source=${CONTACT_CLIP_SECONDS}s, accelerated kick=${IMPACT_MS}ms`)
})
