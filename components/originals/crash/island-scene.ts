import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js'
import { CRASH_ASSETS } from '@/lib/originals/crash/definition'
import { PREPARING_MS, timeToMultiplier, type CrashEngine } from '@/lib/originals/crash/engine'
import { CHARACTER_SCALE, KICK_SPEED, CASTAWAY_START, KICKER_START, flightPosition, fallPosition, crashGroundAt } from '@/lib/originals/crash/presentation'

type Character = { root: THREE.Group; model: THREE.Group; mixer: THREE.AnimationMixer; actions: Record<string, THREE.AnimationAction>; current: string }
const smooth = (x: number) => { const t = THREE.MathUtils.clamp(x, 0, 1); return t * t * (3 - 2 * t) }

/** Route-only renderer. The engine owns all timing and money; this is presentation. */
export function mountIslandScene(host: HTMLDivElement, engine: CrashEngine, callbacks: {
  ready: () => void; error: (unsupported?: boolean) => void
  /** Local visual-QA harness only; production always uses requestAnimationFrame. */
  now?: () => number
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
  // Reuse the lightweight island geometry beneath the distant landing site.
  // The castaway never rewinds across the world to reach the starting beach.
  const landingIsland = new THREE.Group()
  landingIsland.add(beach.clone(), shoreline.clone(), grove.clone())
  landingIsland.visible = false; scene.add(landingIsland)
  const cloudMat = new THREE.MeshBasicMaterial({ color: '#f2fff8' })
  const clouds = Array.from({ length: 12 }, (_, i) => {
    const cloud = mesh(geometry.sphere, cloudMat)
    cloud.position.set(-15 + i * 5, 7 + i % 3 * 3, -12 - i % 3 * 6)
    cloud.scale.set(2.2 + i % 3, .35 + i % 2 * .15, 1)
    return cloud
  })
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
  // No speed lines in the sky: the white streaks read as rain and cheapened the
  // flight. Altitude is carried by the parallax clouds and the camera instead.
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#fff6c4', transparent: true, opacity: .75, depthWrite: false })
  const ring = mesh(new THREE.RingGeometry(.35, .58, 32), ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.visible = false
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
    const fade = name === 'react' || name === 'flying' ? .025 : .08
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
  let previousTime = performance.now(), measured = false
  const frameTimes: number[] = []
  const target = new THREE.Vector3(), origin = new THREE.Vector3()
  function render(frameTime: number) {
    if (disposed) return
    frame = requestAnimationFrame(render)
    if (document.hidden) { previousTime = frameTime; return }
    // Keep the independent interval for logic reliability, but sample it again
    // before rendering contact so no 40ms timer/RAF phase mismatch is visible.
    engine.tick()
    const time = callbacks.now?.() ?? performance.now()
    const frameMs = frameTime - previousTime
    const dt = Math.min(frameMs / 1000, .05); previousTime = frameTime
    const state = engine.getSnapshot()
    const flightAge = Math.max(0, (time - state.flightAt) / 1000)
    const flying = state.phase === 'flying'
    const crashed = state.phase === 'falling' || state.phase === 'impact'
    const resultAge = Math.max(0, (time - state.finishedAt) / 1000)
    const crashFlightAge = timeToMultiplier(state.multiplier) / 1000
    const fall = fallPosition(crashFlightAge, resultAge * 1000, state.multiplier)
    const falling = crashed && fall.phase === 'falling'
    const landed = crashed && fall.phase === 'impact'
    const impactAge = fall.impactAgeMs / 1000
    const kickAge = time - state.startedAt - PREPARING_MS
    const impact = (flying || crashed) && flightAge < .04
    const air = crashed ? fall : flightPosition(flightAge, state.multiplier)
    const kickPlaying = state.phase !== 'ready' && state.phase !== 'preparing' && kickAge >= 0 && kickAge < 1100
    if (castaway && kicker) {
      play(kicker, kickPlaying ? 'kick' : 'idle')
      play(castaway, impact ? 'react' : crashed ? 'crash' : flying ? 'flying' : 'idle')
      castaway.mixer.update(dt); kicker.mixer.update(dt)
      // Seek the kick from the engine clock, not a delayed React phase render.
      // The exact source contact frame is shared with the rig regression test.
      if (kickPlaying) {
        kicker.actions.kick.time = Math.min(kickAge / 1000 * KICK_SPEED, kicker.actions.kick.getClip().duration)
        kicker.mixer.update(0)
      }
      if (state.phase !== 'ready') {
        // Clock-derived blends preserve the precise contact and loss poses,
        // including when QA freezes the very first frame of either transition.
        const poseAge = crashed ? crashFlightAge : flightAge
        const moving = flying || crashed
        const hitBlend = moving ? smooth(poseAge / .025) : 0
        const flyBlend = moving ? smooth((poseAge - .04) / .025) : 0
        const lossBlend = crashed ? smooth(resultAge / .08) : 0
        const weights = { idle: (1 - hitBlend) * (1 - lossBlend),
          react: hitBlend * (1 - flyBlend) * (1 - lossBlend),
          flying: flyBlend * (1 - lossBlend), crash: lossBlend }
        for (const [name, weight] of Object.entries(weights)) {
          const action = castaway.actions[name]
          action.enabled = true
          action.play().stopFading().setEffectiveWeight(weight)
        }
        castaway.actions.idle.time = .2
        castaway.actions.react.time = Math.min(poseAge, castaway.actions.react.getClip().duration)
        castaway.actions.flying.time = Math.max(0, poseAge - .04) % castaway.actions.flying.getClip().duration
        castaway.actions.crash.time = Math.min(resultAge, .95)
        castaway.mixer.update(0)
      }
      target.set(
        flying || crashed ? air.x : CASTAWAY_START[0],
        flying ? air.y : crashed ? air.y - crashGroundAt(castaway.actions.crash.time) * CHARACTER_SCALE * smooth(fall.progress) : CASTAWAY_START[1],
        CASTAWAY_START[2],
      )
      castaway.root.position.copy(target)
      const flightTilt = (seconds: number) => smooth(seconds / .14) * (-.3 + (reduced.matches ? 0 : Math.sin(seconds * 4.5) * .055))
      castaway.root.rotation.z = flying ? flightTilt(flightAge) : falling ? flightTilt(crashFlightAge) * (1 - smooth(resultAge / .2)) : 0
      kicker.root.position.set(...KICKER_START)
      shadows[0].position.x = castaway.root.position.x; shadows[1].position.x = kicker.root.position.x
      shadows[0].visible = !flying && !falling
      const landingX = fallPosition(crashFlightAge, fall.durationMs, state.multiplier).x
      landingIsland.visible = crashed && landingX > 6
      if (landingIsland.visible) landingIsland.position.x = landingX - 1.8
      for (const [object, x] of scenicPositions) {
        object.position.x = x // island stays behind; only the castaway and camera travel
      }
      clouds.forEach((cloud, i) => {
        const depth = i % 3
        const wrap = (n: number, size: number) => ((n % size) + size) % size
        cloud.position.set(
          flying || falling ? air.x + wrap(i * 5 - flightAge * (2 + air.speed) * (1 - depth * .2), 36) - 18 : -15 + i * 5,
          flying || falling ? air.y + wrap(8 + i * 3 - air.y * (1 - depth * .2), 20) - 4 : 7 + depth * 3,
          -12 - depth * 6,
        )
      })
      palms.forEach((p, i) => { p.rotation.z = reduced.matches ? 0 : Math.sin(time / 1600 + i) * .015 })
      const burst = landed ? impactAge : (flying || falling) && flightAge < .25 ? flightAge : -1
      particles.visible = burst >= 0 && burst < 1.2 && !reduced.matches
      if (particles.visible) {
        if (landed) origin.copy(castaway.root.position)
        else origin.set(...CASTAWAY_START)
        origin.y += .7
        particleItems.forEach((p, i) => {
          const a = i * 2.399
          p.position.copy(origin).add(new THREE.Vector3(Math.cos(a) * burst * 2, Math.sin(a) * burst * 1.4 + .5 - burst * burst, Math.sin(a * 2) * burst))
          p.rotation.set(burst * 3 + i, burst * 4, i)
          p.scale.setScalar(Math.max(.005, .08 * (1 - burst / 1.2)))
        })
      }
      ring.visible = landed
      if (ring.visible) {
        ring.position.set(castaway.root.position.x, -.075, castaway.root.position.z)
        ring.scale.setScalar(1 + impactAge * 4)
        ringMaterial.opacity = .7 * (1 - impactAge / .25)
      }
    }
    const wideFrame = smooth((aspect - 1.1) / 1.35)
    const distance = THREE.MathUtils.lerp(8.05, 6.75, wideFrame)
    const follow = flying || crashed ? smooth(flightAge / .3) : 0
    const groundBlend = crashed ? smooth(fall.progress) : 0
    const focusX = flying || crashed ? THREE.MathUtils.lerp(.05, air.x - .2, follow) : .05
    const focusY = flying || crashed ? THREE.MathUtils.lerp(1.68, Math.max(1.68, air.y + 1.9), follow) : 1.68
    const shake = landed && !reduced.matches ? Math.sin(time / 23) * .045 * (1 - impactAge / .25) : 0
    camera.position.set(focusX + 2.4 + shake, focusY + 1.37 - follow * .9 * (1 - groundBlend), distance)
    camera.lookAt(focusX, focusY, 0)
    renderer.render(scene, camera)
    if (castaway) {
      host.dataset.flightAgeMs = String(Math.round(flightAge * 1000))
      host.dataset.altitude = castaway.root.position.y.toFixed(3)
      host.dataset.cameraY = camera.position.y.toFixed(3)
      host.dataset.visualPhase = crashed ? fall.phase : state.phase
      host.dataset.impactAgeMs = landed ? String(Math.round(fall.impactAgeMs)) : ''
    }
    // Local DOM diagnostics for reproducible browser QA. Never sent as analytics,
    // never used for game outcomes, and no identifiers or browsing history stored.
    if (castaway && kicker && !measured) {
      measured = true
      host.dataset.readyMs = String(Math.round(performance.now() - mountedAt))
      host.dataset.firstCharacterMs = String(Math.round(performance.now()))
      host.dataset.firstMeaningfulMs = String(Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0))
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const own = resources.filter(resource => new URL(resource.name).origin === location.origin)
      host.dataset.transferBytes = String(own.reduce((sum, resource) => sum + resource.transferSize, navigation?.transferSize ?? 0))
      host.dataset.jsBytes = String(own.filter(resource => new URL(resource.name).pathname.endsWith('.js')).reduce((sum, resource) => sum + resource.encodedBodySize, 0))
      host.dataset.characterBytes = String(own.filter(resource => resource.name.includes('/originals/crash/runtime/')).reduce((sum, resource) => sum + resource.encodedBodySize, 0))
      host.dataset.posterBytes = String(own.filter(resource => resource.name.includes('island-crash-poster')).reduce((sum, resource) => sum + resource.encodedBodySize, 0))
      host.dataset.deferredCharacterBytes = '0' // both rigs and their round-critical clips are needed for the first round
      callbacks.ready()
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
