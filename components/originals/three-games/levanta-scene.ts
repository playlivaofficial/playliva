import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { LevantaSnapshot } from '@/lib/originals/levanta/engine'
import { addLevantaEnvironment } from './levanta-environment'
import { createDeadliftPose } from './levanta-pose'
import { LEVANTA_SOLE_Y } from './levanta-contact'
/** One rendering clock, passed by the game after its authoritative engine tick. No independent RAF. */
export async function createLevantaScene(host:HTMLDivElement) {
 const scene=new THREE.Scene();scene.background=new THREE.Color('#b9e8df');scene.fog=new THREE.Fog('#b9e8df',12,28)
 const camera=new THREE.PerspectiveCamera(36,1,.05,40);camera.position.set(2.55,1.75,4.9);camera.lookAt(0,.86,0)
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement)
 renderer.domElement.style.cssText='width:100%;height:100%;display:block'
 scene.add(new THREE.HemisphereLight('#fff6d9','#689989',2.35))
 const sun=new THREE.DirectionalLight('#fff0c6',2.6);sun.position.set(-3,7,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.bias=-.0005;sun.shadow.normalBias=.015;sun.shadow.radius=3;scene.add(sun)
 const material=(color:string,metalness=0,roughness=.8)=>new THREE.MeshStandardMaterial({color,metalness,roughness})
 const gold=material('#dcbe53',.5,.3),steel=material('#ccd8dc',.9,.25),plateMat=material('#173d41',.4,.45)
 addLevantaEnvironment(scene)
 const bar=new THREE.Group(),shaft=new THREE.Mesh(new THREE.CylinderGeometry(.021,.021,2.25,20),steel);shaft.rotation.z=Math.PI/2;bar.add(shaft)
 for(const side of [-1,1])for(let i=0;i<3;i++){const plate=new THREE.Mesh(new THREE.CylinderGeometry(.28-i*.015,.28-i*.015,.07,48),i===2?gold:plateMat);plate.rotation.z=Math.PI/2;plate.position.x=side*(.79+i*.078);plate.castShadow=true;bar.add(plate);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.052,.052,.08,20),steel);hub.rotation.z=Math.PI/2;hub.position.x=plate.position.x;bar.add(hub)}
 scene.add(bar)
 let gltf
 try { gltf=await new GLTFLoader().loadAsync('/originals/levanta/athlete.glb') } catch(error){renderer.dispose();renderer.domElement.remove();throw error}
 const model=gltf.scene;model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model,true);model.scale.setScalar(1.8/(bounds.max.y-bounds.min.y));scene.add(model)
 const meshes:THREE.SkinnedMesh[]=[]
 model.traverse(obj=>{const mesh=obj as THREE.SkinnedMesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true}if(mesh.isSkinnedMesh){mesh.frustumCulled=false;meshes.push(mesh)}})
 const tracks=new Map(gltf.animations.map(clip=>[clip.name,{duration:clip.duration,tracks:clip.tracks.map(track=>{const split=track.name.lastIndexOf('.'),object=model.getObjectByName(track.name.slice(0,split));if(!object)throw Error('Missing source joint');return{object,property:track.name.slice(split+1),interpolant:(track as THREE.KeyframeTrack&{createInterpolant():THREE.Interpolant}).createInterpolant()}})}]))
 const point=new THREE.Vector3(),dropOrigin=new THREE.Vector3()
 const pose=createDeadliftPose(model,meshes)
 const saved=new Map<THREE.Object3D,{position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3}>()
 let lastPhase='',lastId:string|null=null,failedAt=0,cashAt=-Infinity,holdProgress=0,disposed=false
 function sample(name:string,time:number,blend=1){const clip=tracks.get(name)!;for(const t of clip.tracks){const value=t.interpolant.evaluate(Math.max(0,Math.min(clip.duration-.001,time))),prior=saved.get(t.object);if(t.property==='quaternion'){t.object.quaternion.fromArray(value);if(prior&&blend<1)t.object.quaternion.slerp(prior.quaternion,1-blend)}else if(t.property==='position'){t.object.position.fromArray(value);if(prior&&blend<1)t.object.position.lerp(prior.position,1-blend)}else if(t.property==='scale')t.object.scale.fromArray(value)}}
 function save(){saved.clear();model.traverse(o=>saved.set(o,{position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()}))}
 function ground(){model.position.y=0;model.updateMatrixWorld(true);let low=Infinity;for(const mesh of meshes){mesh.skeleton.update();for(let i=0;i<mesh.geometry.getAttribute('position').count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);low=Math.min(low,point.y)}}if(Number.isFinite(low)){model.position.y=LEVANTA_SOLE_Y-low;model.updateMatrixWorld(true)}}
 sample('Ready',0);ground();pose.initialize()
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.set(w/h<1?2.1:2.1,w/h<1?1.75:1.55,w/h<1?5.5:4.15);camera.lookAt(0,.85,.05);camera.updateProjectionMatrix()}
 const observer=new ResizeObserver(resize);observer.observe(host);resize()
 return {
  render(s:LevantaSnapshot,at:number){
   if(disposed)return
   if(s.roundId!==lastId){lastId=s.roundId;lastPhase='';cashAt=-Infinity;delete host.dataset.impact}
   const flight=Math.max(0,(at-s.flightAt)/1000)
   if(s.phase==='failed'&&lastPhase!=='failed'){save();dropOrigin.copy(bar.position);failedAt=at;host.dataset.crashFrame=String(at);host.dataset.barDropFrame=String(at)}
   if(s.wager==='cashed_out'&&cashAt===-Infinity){cashAt=at;holdProgress=Math.min(1,flight/10)}
   if(s.phase!=='failed'){
    sample('Ready',0)
    const progress=s.phase==='lifting'?(at-cashAt<500?holdProgress:Math.min(1,flight/10)):0
    pose.apply(progress,flight,bar)
   }else{
    const t=Math.max(0,(at-failedAt)/1000)
    sample('Fail',Math.min(2.03,1.1+t*.65),THREE.MathUtils.smoothstep(t,0,.65))
    pose.release(t)
   }
   if(s.phase==='failed'){const t=(at-failedAt)/1000,groundY=.305;bar.position.copy(dropOrigin);bar.position.y=Math.max(groundY,dropOrigin.y-1.2*t-4.9*t*t);bar.rotation.z*=.8;if(bar.position.y===groundY){const impactTime=(-1.2+Math.sqrt(1.44+19.6*Math.max(0,dropOrigin.y-groundY)))/9.8;const since=t-impactTime;bar.position.y+=Math.abs(Math.sin(since*24))*.027*Math.exp(-since*8);if(!host.dataset.impact)host.dataset.impact=String(at)}}
   for(const mesh of meshes)mesh.skeleton.update()
   renderer.render(scene,camera);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.pose=JSON.stringify(pose.diagnostics());lastPhase=s.phase
  },
  get barHeight(){return bar.position.y},
  dispose(){disposed=true;observer.disconnect();const textures=new Set<THREE.Texture>(),materials=new Set<THREE.Material>(),geometries=new Set<THREE.BufferGeometry>();scene.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh)return;geometries.add(m.geometry);for(const mat of Array.isArray(m.material)?m.material:[m.material]){materials.add(mat);for(const value of Object.values(mat))if(value instanceof THREE.Texture)textures.add(value)}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()},
 }
}
