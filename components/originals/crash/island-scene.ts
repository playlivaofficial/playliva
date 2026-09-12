import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { CRASH_ASSETS } from '@/lib/originals/crash/definition'
import { IMPACT_MS, PREPARING_MS, type CrashEngine } from '@/lib/originals/crash/engine'
import { CHARACTER_SCALE, KICK_SPEED, CASTAWAY_START, KICKER_START } from '@/lib/originals/crash/presentation'

type Character = { root: THREE.Group; model: THREE.Group; mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction>; current: string }
const smooth = (x: number) => { const t = THREE.MathUtils.clamp(x, 0, 1); return t * t * (3 - 2 * t) }
// Measured skinned-mesh lower bounds of the supplied dazed clip, in model units.
// Presentation-only grounding: no source keyframes or skeleton transforms change.
const dazedGround = [[0, .2314], [.3, .2575], [.6, .302], [1, .2244], [1.5, .2172], [2, .1669], [2.8, .2818], [3.0334, .3148]]
function groundAt(time: number) {
  const index = dazedGround.findIndex(point => point[0] >= time)
  if (index <= 0) return dazedGround[index === 0 ? 0 : dazedGround.length - 1][1]
  const [a, b] = [dazedGround[index - 1], dazedGround[index]]
  return THREE.MathUtils.lerp(a[1], b[1], (time - a[0]) / (b[0] - a[0]))
}

/** Route-only renderer. The engine owns all timing and money; this is presentation. */
export function mountIslandScene(host: HTMLDivElement, engine: CrashEngine, callbacks: {
  ready: () => void; error: (unsupported?: boolean) => void
}) {
  const abort = new AbortController()
  const mountedAt = performance.now()
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
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 90)
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
  const sun = mesh(new THREE.CircleGeometry(1.35, 32), new THREE.MeshBasicMaterial({ color: '#fff0a4', fog: false }))
  sun.position.set(-7.5, 7.8, -22)
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
  const palms = [
    palm(-4.3, -1.9, 1.22), palm(4.7, -2.2, 1.28), palm(-7.2, -5.2, 1),
    palm(1.5, -5.7, .92), palm(7.8, -4.8, .9), palm(12.5, -3.7, 1.08),
    palm(16.8, -5.5, .82), palm(-13.5, -4.2, .9),
  ]
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
  const scenicPositions = new Map(grove.children.map(child => [child, child.position.x]))
  const cloudMat = new THREE.MeshBasicMaterial({ color: '#f2fff8' })
  for (let i = 0; i < 5; i++) {
    const cloud = mesh(geometry.sphere, cloudMat)
    cloud.position.set(-15 + i * 8, 7 + i % 2, -20)
    cloud.scale.set(3.3, .5, 1)
  }
  // Distant, unnamed scenic islanders; never represented as live players.
  const shirtMats = [mat('#ed765f'), mat('#4e8dde'), mat('#f0bd45')]
  for (const [index, x] of [-3, 3.7, 5.1].entries()) {
    const npc = new THREE.Group(); npc.position.set(x, 0, -3); scene.add(npc)
    const body = mesh(geometry.sphere, shirtMats[index], npc); body.scale.set(.15, .28, .11); body.position.y = .38
    const head = mesh(geometry.sphere, sand, npc); head.scale.setScalar(.13); head.position.y = .76
    for (const side of [-1, 1]) {
      const leg = mesh(geometry.trunk, trunkMat, npc); leg.scale.set(.55, .32, .55); leg.position.set(side * .07, .11, 0)
      const arm = mesh(geometry.trunk, trunkMat, npc); arm.scale.set(.45, .26, .45); arm.position.set(side * .18, .43, 0); arm.rotation.z = side * -.45
    }
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
  const wind = new THREE.Group(); scene.add(wind)
  for (let i = 0; i < 7; i++) {
    const line = mesh(new THREE.CylinderGeometry(.012, .012, .6 + (i % 2) * .5, 3), foamMat, wind)
    line.rotation.z = Math.PI / 2; line.position.set(-1 - i % 2 * .7, .2 + i * .25, -.25)
  }
  wind.visible = false
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#fff6c4', transparent: true, opacity: .75, depthWrite: false })
  const ring = mesh(new THREE.RingGeometry(.35, .58, 32), ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.visible = false
  const daze = new THREE.Group(); scene.add(daze); daze.visible = false
  const dazeMaterial = new THREE.MeshBasicMaterial({ color: '#fff1a0', fog: false, depthTest: false })
  const dazeItems = Array.from({ length: 3 }, () => {
    const item = mesh(new THREE.OctahedronGeometry(.11, 0), dazeMaterial, daze)
    item.renderOrder = 3
    return item
  })
  let castaway: Character | undefined, kicker: Character | undefined
  const loadedRoots: THREE.Object3D[] = []
  function character(gltf: GLTF): Character {
    const root = new THREE.Group(), model = gltf.scene
    root.add(model); root.scale.setScalar(CHARACTER_SCALE); scene.add(root)
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
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(name === 'kick' ? KICK_SPEED : 1)
    next.setLoop(['kick', 'react', 'crash'].includes(name) ? THREE.LoopOnce : THREE.LoopRepeat, Infinity)
    next.clampWhenFinished = true
    const fade = reduced.matches ? .06 : name === 'react' ? .11 : .18
    next.play().crossFadeFrom(previous, fade, false)
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
    castaway.root.position.set(...CASTAWAY_START); kicker.root.position.set(...KICKER_START)
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
  let previousTime = performance.now(), drift = 0, measured = false
  const frameTimes: number[] = []
  const target = new THREE.Vector3(), origin = new THREE.Vector3()
  function render(time: number) {
    if (disposed) return
    frame = requestAnimationFrame(render)
    if (document.hidden) { previousTime = time; return }
    const frameMs = time - previousTime
    const dt = Math.min(frameMs / 1000, .05); previousTime = time
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
      const impactProgress = impact ? smooth((kickAge - IMPACT_MS) / 430) : 0
      const flightRise = flying ? smooth(flightAge / .5) : 0
      const flightWeave = flying && !reduced.matches
        ? Math.sin(flightAge * 3.2) * .055 + Math.sin(flightAge * 1.15 + .8) * .035 : 0
      const flightBob = flying && !reduced.matches
        ? Math.sin(flightAge * 4.4) * .07 + Math.sin(flightAge * 1.7) * .045 : 0
      target.set(
        flying ? 2.5 + flightRise * .14 + flightWeave : crashed ? 1.8 : .35 + impactProgress * .78,
        flying ? .04 + flightRise * .08 + flightBob
          : crashed ? -.1 - groundAt(castaway.actions.crash.time) * CHARACTER_SCALE
            : -.1 + Math.sin(impactProgress * Math.PI / 2) * .55,
        flying ? .15 + Math.sin(flightAge * 2.1) * .035 : .15,
      )
      castaway.root.position.lerp(target, 1 - Math.exp(-dt * (crashed ? 9 : 5)))
      const tilt = flying ? -.62 + (reduced.matches ? 0 : Math.sin(flightAge * 2.5) * .07) : 0
      castaway.model.rotation.z = THREE.MathUtils.damp(castaway.model.rotation.z, tilt, 5, dt)
      kicker.root.position.x = THREE.MathUtils.damp(kicker.root.position.x, flying || crashed ? -3.8 : KICKER_START[0], 2.5, dt)
      shadows[0].position.x = castaway.root.position.x; shadows[1].position.x = kicker.root.position.x
      shadows[0].scale.setScalar(flying ? .65 : 1)
      if (flying && !reduced.matches) drift += dt * Math.min(1.7 + Math.log2(Math.max(1, state.multiplier / 100)) * .85, 5.8)
      if (state.phase === 'ready') drift = 0
      for (const [object, x] of scenicPositions) {
        if (flying && !reduced.matches) {
          const speed = object.position.z < -5 ? .24 : .72
          object.position.x = ((x - drift * speed + 20) % 40 + 40) % 40 - 20
        } else if (state.phase === 'ready' || state.phase === 'preparing') object.position.x = THREE.MathUtils.damp(object.position.x, x, 3, dt)
      }
      wind.visible = flying && !reduced.matches
      if (wind.visible) {
        wind.position.copy(castaway.root.position).add(new THREE.Vector3(0, .5, 0))
        wind.scale.x = 1 + Math.min(state.multiplier / 500, 1.4)
      }
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
      ring.visible = crashed && resultAge < 1
      if (ring.visible) {
        ring.position.set(castaway.root.position.x, -.075, castaway.root.position.z)
        ring.scale.setScalar(1 + resultAge * 1.7)
        ringMaterial.opacity = .7 * (1 - resultAge)
      }
      daze.visible = crashed
      if (daze.visible) {
        daze.position.copy(castaway.root.position).add(new THREE.Vector3(-.62, .95, .1))
        daze.rotation.y = reduced.matches ? 0 : time / 950
        dazeItems.forEach((item, i) => {
          const angle = i * Math.PI * 2 / dazeItems.length
          item.position.set(Math.cos(angle) * .32, Math.sin(angle * 2 + time / 500) * .06, Math.sin(angle) * .18)
          item.rotation.set(time / 700 + i, time / 850 + i, 0)
        })
      }
    }
    const wideFrame = smooth((aspect - 1.1) / 1.35)
    const distance = THREE.MathUtils.lerp(8.05, 6.75, wideFrame)
    const focusX = flying || crashed ? .4 : .05
    const shake = crashed && resultAge < .35 && !reduced.matches ? Math.sin(time / 23) * .045 * (1 - resultAge / .35) : 0
    camera.position.set(2.45 + focusX * .35 + shake, 3.05, distance)
    camera.lookAt(focusX, 1.68, 0)
    renderer.render(scene, camera)
    // Local DOM diagnostics for reproducible browser QA. Never sent as analytics,
    // never used for game outcomes, and no identifiers or browsing history stored.
    if (castaway && kicker && !measured) {
      measured = true
      host.dataset.readyMs = String(Math.round(performance.now() - mountedAt))
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const own = resources.filter(resource => new URL(resource.name).origin === location.origin)
      host.dataset.transferBytes = String(own.reduce((sum, resource) => sum + resource.transferSize, navigation?.transferSize ?? 0))
      host.dataset.jsBytes = String(own.filter(resource => new URL(resource.name).pathname.endsWith('.js')).reduce((sum, resource) => sum + resource.encodedBodySize, 0))
      host.dataset.characterBytes = String(own.filter(resource => resource.name.includes('/originals/crash/runtime/')).reduce((sum, resource) => sum + resource.encodedBodySize, 0))
    }
    if (measured && frameTimes.length < 180 && frameMs > 0) {
      frameTimes.push(frameMs)
      if (frameTimes.length === 180) host.dataset.frameP95Ms = String(Math.round(frameTimes.slice().sort((a, b) => a - b)[170] * 10) / 10)
    }
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
