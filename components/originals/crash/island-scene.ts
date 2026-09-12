import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { CRASH_ASSETS } from '@/lib/originals/crash/definition'
import { IMPACT_MS, PREPARING_MS, type CrashEngine } from '@/lib/originals/crash/engine'

type Character = { root: THREE.Group; model: THREE.Group; mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction>; current: string }
const smooth = (x: number) => { const t = THREE.MathUtils.clamp(x, 0, 1); return t * t * (3 - 2 * t) }

/** Route-only renderer. The engine owns all timing and money; this is presentation. */
export function mountIslandScene(host: HTMLDivElement, engine: CrashEngine, callbacks: {
  ready: () => void; error: (unsupported?: boolean) => void
}) {
  const abort = new AbortController()
  let disposed = false, frame = 0
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }) }
  catch { callbacks.error(true); return () => { abort.abort() } }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  host.appendChild(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#82dcec')
  scene.fog = new THREE.Fog('#a8e6df', 17, 48)
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 90)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const light = new THREE.DirectionalLight('#fff1d0', 3.1)
  light.position.set(-3, 7, 5)
  scene.add(light, new THREE.HemisphereLight('#d9f7ff', '#c9a16d', 2.2))
  const mat = (color: string, roughness = .85) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
  const sand = mat('#f3d6a0'), green = mat('#37ad63'), darkGreen = mat('#167952'), leafGreen = mat('#66bf45')
  const trunkMat = mat('#ae7d48'), rockMat = mat('#8aac94'), foamMat = new THREE.MeshBasicMaterial({ color: '#b7fff0' })
  const geometry = {
    sphere: new THREE.SphereGeometry(1, 12, 8), trunk: new THREE.CylinderGeometry(.06, .12, 1, 7),
    leaf: new THREE.SphereGeometry(1, 7, 4), rock: new THREE.IcosahedronGeometry(1, 0),
  }
  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = scene) => { const value = new THREE.Mesh(g, m); parent.add(value); return value }
  const ocean = mesh(new THREE.PlaneGeometry(160, 160), mat('#32c9c4', .35))
  ocean.rotation.x = -Math.PI / 2; ocean.position.y = -.42
  const beach = mesh(new THREE.CylinderGeometry(7, 7.6, .6, 48), sand)
  beach.position.set(0, -.4, 0); beach.scale.z = .72
  const shoreline = mesh(new THREE.CylinderGeometry(7.65, 7.65, .015, 48), foamMat)
  shoreline.position.set(0, -.39, 0); shoreline.scale.z = .73
  const grove = new THREE.Group(); scene.add(grove)
  const leafGeometry = new THREE.BufferGeometry()
  const leafPositions: number[] = [], leafIndices: number[] = []
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, width = Math.sin(Math.PI * u) * (i % 2 ? .23 : .31)
    const y = Math.sin(u * Math.PI) * .22 - u * u * .62
    leafPositions.push(u * 1.8, y, -width, u * 1.8, y + .04, 0, u * 1.8, y, width)
    if (i < 16) for (let j = 0; j < 2; j++) { const k = i * 3 + j; leafIndices.push(k, k + 3, k + 1, k + 1, k + 3, k + 4) }
  }
  leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leafPositions, 3))
  leafGeometry.setIndex(leafIndices); leafGeometry.computeVertexNormals()
  leafGreen.side = THREE.DoubleSide; green.side = THREE.DoubleSide
  const trunkGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(.1, 1.4, 0), new THREE.Vector3(.4, 2.8, 0),
  ]), 6, .075, 7, false)
  for (let i = 0; i < 10; i++) {
    const hill = mesh(geometry.sphere, i % 2 ? green : darkGreen, grove)
    hill.position.set(-11 + i * 2.5, -.3, -6 - (i % 3))
    hill.scale.set(2.5, 1.7 + (i % 3) * .5, 1.7)
  }
  function palm(x: number, z: number, scale: number) {
    const group = new THREE.Group(); group.position.set(x, -.15, z); group.scale.setScalar(scale); grove.add(group)
    mesh(trunkGeometry, trunkMat, group)
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3
      const leaf = mesh(leafGeometry, i % 2 ? green : leafGreen, group)
      leaf.position.set(.4, 2.8, 0)
      leaf.rotation.y = angle
    }
    return group
  }
  const palms = [palm(-3.8, -1.5, 1.25), palm(4.2, -2, 1.35), palm(-6, -5, 1), palm(1.8, -5.5, .9), palm(6.7, -4.5, .85)]
  for (let i = 0; i < 7; i++) {
    const wave = mesh(new THREE.TorusGeometry(8.3 + i * .8, .016, 3, 64, Math.PI * .7), foamMat)
    wave.rotation.x = -Math.PI / 2; wave.rotation.z = .2
    wave.position.set(-1.5, -.38, -1); wave.scale.z = .6
  }
  for (let i = 0; i < 8; i++) {
    const rock = mesh(geometry.rock, i % 2 ? rockMat : green, grove)
    rock.position.set(-5 + i * 1.5, .1, -2.8 - i % 2)
    rock.scale.set(.5 + i % 3 * .12, .4, .45)
  }
  const cloudMat = new THREE.MeshBasicMaterial({ color: '#f2fff8' })
  for (let i = 0; i < 5; i++) {
    const cloud = mesh(geometry.sphere, cloudMat)
    cloud.position.set(-15 + i * 8, 7 + i % 2, -20)
    cloud.scale.set(3.3, .5, 1)
  }
  // Distant, unnamed scenic islanders; never represented as live players.
  for (const x of [-3, 3.6, 5]) {
    const npc = new THREE.Group(); npc.position.set(x, 0, -3); scene.add(npc)
    const body = mesh(geometry.sphere, trunkMat, npc); body.scale.set(.12, .28, .1); body.position.y = .35
    const head = mesh(geometry.sphere, sand, npc); head.scale.setScalar(.13); head.position.y = .76
  }
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#6d6742', transparent: true, opacity: .19, depthWrite: false })
  const shadows = [0, 1].map(() => { const shadow = mesh(new THREE.CircleGeometry(.48, 24), shadowMat); shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.085; return shadow })
  const particles = new THREE.Group(); scene.add(particles)
  const particleItems = Array.from({ length: 22 }, (_, i) => {
    const particle = mesh(geometry.rock, i % 3 ? leafGreen : sand, particles)
    particle.scale.set(.075, .04, .045)
    return particle
  })
  particles.visible = false
  const ring = mesh(new THREE.TorusGeometry(.4, .035, 6, 32), new THREE.MeshBasicMaterial({ color: '#fff6c4', transparent: true, opacity: .75 }))
  ring.visible = false
  let castaway: Character | undefined, kicker: Character | undefined
  const loadedRoots: THREE.Object3D[] = []
  function character(gltf: GLTF): Character {
    const root = new THREE.Group(), model = gltf.scene
    root.add(model); root.scale.setScalar(1.45); scene.add(root)
    const mixer = new THREE.AnimationMixer(model)
    const actions = Object.fromEntries(gltf.animations.map(clip => [clip.name, mixer.clipAction(clip)]))
    model.rotation.y = Math.PI / 2
    model.traverse(object => { if (object instanceof THREE.SkinnedMesh) object.frustumCulled = false })
    const value = { root, model, mixer, actions, current: 'idle' }
    actions.idle.play(); mixer.update(.2) // pose before the first visible frame
    return value
  }
  function play(value: Character, name: string) {
    if (name === value.current) return
    const previous = value.actions[value.current], next = value.actions[name]
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(name === 'kick' ? 2.1 : 1)
    next.setLoop(['kick', 'react', 'crash'].includes(name) ? THREE.LoopOnce : THREE.LoopRepeat, Infinity)
    next.clampWhenFinished = true
    next.play().crossFadeFrom(previous, reduced.matches ? .08 : .22, false)
    value.current = name
  }
  const loader = new GLTFLoader()
  async function load(url: string) {
    const response = await fetch(url, { signal: abort.signal })
    if (!response.ok) throw new Error('Character request failed')
    const data = await loader.parseAsync(await response.arrayBuffer(), '')
    loadedRoots.push(data.scene)
    if (disposed) disposeObject(data.scene)
    return data
  }
  void Promise.all([load(CRASH_ASSETS.castaway), load(CRASH_ASSETS.kicker)]).then(([male, female]) => {
    if (disposed) return
    castaway = character(male); kicker = character(female)
    castaway.root.position.set(.35, -.1, .15); kicker.root.position.set(-1.05, -.1, .05)
    callbacks.ready()
  }).catch(() => { if (!disposed) callbacks.error() })
  let aspect = 1
  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    aspect = width / height
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize()
  const loseContext = (event: Event) => { event.preventDefault(); callbacks.error(true) }
  renderer.domElement.addEventListener('webglcontextlost', loseContext)
  let previousTime = performance.now(), drift = 0
  const target = new THREE.Vector3(), origin = new THREE.Vector3()
  function render(time: number) {
    if (disposed) return
    frame = requestAnimationFrame(render)
    if (document.hidden) { previousTime = time; return }
    const dt = Math.min((time - previousTime) / 1000, .05); previousTime = time
    const state = engine.getSnapshot()
    const flightAge = Math.max(0, (time - state.flightAt) / 1000)
    const flying = state.phase === 'flying' || state.phase === 'cashed_out'
    const crashed = state.phase === 'crashed' || state.phase === 'settled' && !state.result?.won
    const resultAge = Math.max(0, (time - state.finishedAt) / 1000)
    const kickAge = time - state.startedAt - PREPARING_MS
    const impact = state.phase === 'kick' && kickAge >= IMPACT_MS
    if (castaway && kicker) {
      play(kicker, state.phase === 'kick' ? 'kick' : 'idle')
      play(castaway, crashed ? 'crash' : flying ? 'flying' : impact ? 'react' : 'idle')
      castaway.mixer.update(dt); kicker.mixer.update(dt)
      const lift = flying ? smooth(flightAge / .75) : impact ? smooth((kickAge - IMPACT_MS) / 550) * .45 : 0
      const bounce = reduced.matches ? 0 : Math.sin(time / 260) * .07
      target.set(flying ? .9 : crashed ? 1.0 : .35, flying ? .75 + lift * .22 + bounce : crashed ? -.1 : -.1 + lift, .15)
      castaway.root.position.lerp(target, 1 - Math.exp(-dt * (crashed ? 9 : 5)))
      const tilt = flying ? -.7 : 0
      castaway.model.rotation.z = THREE.MathUtils.damp(castaway.model.rotation.z, tilt, 5, dt)
      kicker.root.position.x = THREE.MathUtils.damp(kicker.root.position.x, flying || crashed ? -3.8 : -1.05, 2.5, dt)
      shadows[0].position.x = castaway.root.position.x; shadows[1].position.x = kicker.root.position.x
      shadows[0].scale.setScalar(flying ? .65 : 1)
      if (flying && !reduced.matches) drift += dt * Math.min(1.5 + state.multiplier / 180, 7)
      grove.position.x = flying && !reduced.matches ? -Math.sin(drift * .2) * 1.6 : THREE.MathUtils.damp(grove.position.x, 0, 2, dt)
      palms.forEach((p, i) => { p.rotation.z = reduced.matches ? 0 : Math.sin(time / 1600 + i) * .015 })
      const burst = crashed && resultAge < 1.2 ? resultAge : impact ? (kickAge - IMPACT_MS) / 1000 : -1
      particles.visible = burst >= 0 && burst < 1.2 && !reduced.matches
      if (particles.visible) {
        origin.copy(castaway.root.position); origin.y += .7
        particleItems.forEach((p, i) => {
          const a = i * 2.399
          p.position.copy(origin).add(new THREE.Vector3(Math.cos(a) * burst * 2, Math.sin(a) * burst * 1.4 + .5 - burst * burst, Math.sin(a * 2) * burst))
          p.rotation.set(burst * 3 + i, burst * 4, i)
          p.scale.setScalar(Math.max(.005, .08 * (1 - burst / 1.2)))
        })
      }
      ring.visible = crashed
      if (crashed) { ring.position.copy(castaway.root.position).add(new THREE.Vector3(0, 1.9, .1)); ring.rotation.set(1.3, 0, reduced.matches ? 0 : time / 600) }
    }
    const distance = aspect < 1 ? 8.8 : 8.1
    const shake = crashed && resultAge < .35 && !reduced.matches ? Math.sin(time / 23) * .045 * (1 - resultAge / .35) : 0
    camera.position.set(2.6 + shake, 3.15, distance)
    camera.lookAt(.1, 1.8, 0)
    renderer.render(scene, camera)
  }
  frame = requestAnimationFrame(render)
  function disposeObject(root: THREE.Object3D) {
    const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
      }
    })
    for (const material of materials) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
      material.dispose()
    }
    for (const texture of textures) {
      texture.dispose()
      if (typeof ImageBitmap !== 'undefined' && texture.source.data instanceof ImageBitmap) texture.source.data.close()
    }
  }
  return () => {
    disposed = true; abort.abort(); cancelAnimationFrame(frame); observer.disconnect()
    renderer.domElement.removeEventListener('webglcontextlost', loseContext)
    castaway?.mixer.stopAllAction(); kicker?.mixer.stopAllAction()
    disposeObject(scene)
    for (const root of loadedRoots) if (!root.parent) disposeObject(root)
    renderer.dispose(); renderer.domElement.remove()
  }
}
