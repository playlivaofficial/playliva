import {readFile,writeFile,mkdir} from 'node:fs/promises'
import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
const bytes=await readFile('public/originals/levanta/athlete.glb'),end=20+bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,end)),bin=bytes.subarray(end+8)
// Geometry-only developer analysis: avoid browser texture APIs in Node.
j.materials=[{pbrMetallicRoughness:{baseColorFactor:[1,1,1,1]}}];delete j.images;delete j.textures;delete j.samplers
j.buffers=[{uri:`data:application/octet-stream;base64,${bin.toString('base64')}`,byteLength:bin.length}]
globalThis.ProgressEvent??=class{constructor(type,event){Object.assign(this,{type},event)}}
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(j),''),model=gltf.scene
const bounds=new THREE.Box3().setFromObject(model,true),scale=1.8/(bounds.max.y-bounds.min.y);model.scale.setScalar(scale)
const mixer=new THREE.AnimationMixer(model),report={scale,clips:[]}
report.hands=[];model.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;for(const side of ['Left','Right']){const index=mesh.skeleton.bones.findIndex(b=>b.name===side+'Hand'),p=mesh.geometry.attributes.position,si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight,points=[];for(let i=0;i<p.count;i++){let weight=0;for(let k=0;k<4;k++)if(si.getComponent(i,k)===index)weight+=sw.getComponent(i,k);if(weight>.8){const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.bindMatrix).applyMatrix4(mesh.skeleton.boneInverses[index]);points.push(v)}}const b=new THREE.Box3().setFromPoints(points);report.hands.push({side,count:points.length,min:b.min.toArray(),max:b.max.toArray()})}})
for(const clip of gltf.animations){mixer.stopAllAction();const action=mixer.clipAction(clip);action.play();const frames=[]
 for(let time=0;time<=clip.duration;time+=.25){mixer.setTime(time);model.updateMatrixWorld(true);const frame={time:+time.toFixed(2)};for(const name of ['Hips','Spine','Spine01','Spine02','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand','LeftFoot','RightFoot','LeftToeBase','RightToeBase'])frame[name]=model.getObjectByName(name).getWorldPosition(new THREE.Vector3()).toArray().map(n=>+n.toFixed(4));frames.push(frame)}
 report.clips.push({name:clip.name,duration:clip.duration,frames})
}
await mkdir('social/output/three-game',{recursive:true});await writeFile('social/output/three-game/levanta-motion.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
