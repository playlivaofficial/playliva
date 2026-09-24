import { Vector3 } from 'three'
import { untexturedModel, stageRig } from './crash-rig.mjs'
import presentation from '../lib/originals/crash/presentation.ts'
const { CASTAWAY_START, KICKER_START, CHARACTER_SCALE } = presentation
const male = stageRig(await untexturedModel('castaway'), CASTAWAY_START, CHARACTER_SCALE, 'idle')
const female = stageRig(await untexturedModel('island-kicker'), KICKER_START, CHARACTER_SCALE, 'kick')
male.at(.2)
const hip = male.scene.getObjectByName('Hips').getWorldPosition(new Vector3())
const body = male.scene.getObjectByProperty('type', 'SkinnedMesh')
body.skeleton.update()
const vertices = Array.from({ length: body.geometry.attributes.position.count }, (_, i) => body.getVertexPosition(i, new Vector3()).applyMatrix4(body.matrixWorld))
const footMesh = female.scene.getObjectByProperty('type', 'SkinnedMesh')
const footJoints = footMesh.skeleton.bones.flatMap((b,i)=>['LeftFoot','LeftToeBase'].includes(b.name)?[i]:[])
const footIndices = Array.from({length:footMesh.geometry.attributes.position.count},(_,i)=>i).filter(i=> {
  let weight=0
  for(let j=0;j<4;j++) if(footJoints.includes(footMesh.geometry.attributes.skinIndex.getComponent(i,j))) weight+=footMesh.geometry.attributes.skinWeight.getComponent(i,j)
  return weight>.8
})
const torso = vertices.filter(v=>v.y>.8 && v.y<2)
for (let frame = 100; frame <= 130; frame++) {
  const seconds = frame / 60
  female.at(seconds)
  const toe = female.scene.getObjectByName('LeftToeBase').getWorldPosition(new Vector3())
  footMesh.skeleton.update()
  let closest=Infinity
  for(const i of footIndices){const foot=footMesh.getVertexPosition(i,new Vector3()).applyMatrix4(footMesh.matrixWorld); for(const v of torso){if(Math.abs(v.x-foot.x)<.2&&Math.abs(v.y-foot.y)<.2&&Math.abs(v.z-foot.z)<.2) closest=Math.min(closest,v.distanceTo(foot))}}
  console.log(JSON.stringify({ frame, seconds, msAt3_5: seconds / 3.5 * 1000, footSurfaceGap:closest, distance: toe.distanceTo(hip), surfaceDistance: Math.min(...vertices.map(v=>v.distanceTo(toe))) }))
}
