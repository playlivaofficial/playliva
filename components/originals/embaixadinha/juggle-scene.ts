import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EMBAIXADINHA_ASSETS } from '@/lib/originals/embaixadinha/definition'
import { TOUCHES, touchIndexAt, type TouchKind } from '@/lib/originals/embaixadinha/juggle'
import type { JuggleEngine, JuggleSnapshot } from '@/lib/originals/embaixadinha/engine'
import { BALL_RADIUS, BALL_REST, simulateEscape, sampleEscape, type Escape, type Vec3 } from './juggle-motion'
import { createMeshyPlayer } from './meshy-player'
import { controlledFlight, badTouchVelocity, touchProfile, type ContactSequence } from './touch-choreography'
import { buildCourt } from './court'

/** Cues the renderer fires on the exact frame an event becomes visible. */
export interface JuggleCueSink {
  touch(kind: TouchKind, tier: 0 | 1 | 2, index: number): void
  crash(variant: NonNullable<JuggleSnapshot['variant']>): void
  bounce(strength: number): void
}
export interface JuggleFrame { multiplier: number; phase: JuggleSnapshot['phase']; crashed: boolean }

/** Route-only renderer. The engine owns all timing and money; this is presentation. */
export function mountJuggleScene(host: HTMLDivElement, engine: JuggleEngine, callbacks: {
  ready: () => void; error: (unsupported?: boolean) => void
  frame: (frame: JuggleFrame) => void
  cues: () => JuggleCueSink | null
  /** Local visual-QA harness only; production always uses performance.now. */
  now?: () => number
  /** Optional local QA observer; no persistent production telemetry. */
  trace?: (event: { type: string; frameAt: number; scheduledAt: number; observedAt: number; roundId: string | null; index?: number }) => void
}) {
  const abort = new AbortController()
  const now = callbacks.now ?? (() => performance.now())
  let disposed = false, frameId = 0
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }) }
  catch { callbacks.error(true); return () => { abort.abort() } }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  host.appendChild(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog('#bfe4f6', 22, 70)
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 200)
  const sun = new THREE.DirectionalLight('#fff0d2', 3.3)
  sun.position.set(-4, 8, 6)
  scene.add(sun, new THREE.HemisphereLight('#d7efff', '#c6a878', 1.7))
  const court = buildCourt({ reducedMotion: reduced })
  scene.add(court.group)

  // Stage: the player turned slightly toward camera-left for depth.
  const stage = new THREE.Group(); stage.rotation.y = -0.32; scene.add(stage)
  const blob = (size: number, opacity: number) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')!, g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32)
    g.addColorStop(0, `rgba(10,30,20,${opacity})`); g.addColorStop(1, 'rgba(10,30,20,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }))
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = .005
    return mesh
  }
  const playerShadow = blob(1.3, .45); stage.add(playerShadow)
  const ballShadow = blob(.5, .5); stage.add(ballShadow)

  // Procedural classic football: dark pentagons at icosahedron vertices + seams.
  const ballMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .42, metalness: 0 })
  ballMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBall;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBall = normalize(position);')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vBall;
float ballPattern(vec3 p) {
  const float g = 1.618034;
  vec3 v[12];
  v[0]=vec3(-1.0,g,0.0); v[1]=vec3(1.0,g,0.0); v[2]=vec3(-1.0,-g,0.0); v[3]=vec3(1.0,-g,0.0);
  v[4]=vec3(0.0,-1.0,g); v[5]=vec3(0.0,1.0,g); v[6]=vec3(0.0,-1.0,-g); v[7]=vec3(0.0,1.0,-g);
  v[8]=vec3(g,0.0,-1.0); v[9]=vec3(g,0.0,1.0); v[10]=vec3(-g,0.0,-1.0); v[11]=vec3(-g,0.0,1.0);
  float best = -1.0, second = -1.0;
  for (int i = 0; i < 12; i++) { float d = dot(p, normalize(v[i])); if (d > best) { second = best; best = d; } else if (d > second) second = d; }
  float pent = smoothstep(0.905, 0.915, best);
  float seam = 1.0 - smoothstep(0.004, 0.012, best - second) * 1.0;
  return max(pent, seam * 0.55);
}`).replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.06, 0.08), ballPattern(normalize(vBall)));')
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 28, 18), ballMaterial)
  stage.add(ball)

  let model: THREE.Object3D | null = null
  let player: ReturnType<typeof createMeshyPlayer> | null = null
  let contacts: ContactSequence | null = null
  let rest: Vec3 = BALL_REST
  const loader = new GLTFLoader()
  loader.load(EMBAIXADINHA_ASSETS.craque, gltf => {
    if (disposed) {
      gltf.scene.traverse(object => { const mesh = object as THREE.Mesh; mesh.geometry?.dispose(); const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []; materials.forEach(material => { Object.values(material).forEach(value => { if (value instanceof THREE.Texture) value.dispose() }); material.dispose() }) })
      return
    }
    try {
      player = createMeshyPlayer(gltf)
      model = player.model; contacts = player.contacts; rest = player.rest
      stage.add(model)
      renderer.compile(scene, camera)
      callbacks.ready()
    } catch { callbacks.error() }
  }, undefined, () => { if (!disposed) callbacks.error() })

  function resize() {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Keep head-to-boots plus the ball's highest arc and HUD headroom in frame.
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
    const byHeight = 1.5 / Math.tan(halfFov), byWidth = .9 / (Math.tan(halfFov) * camera.aspect)
    const distance = Math.max(byHeight, byWidth)
    // Slightly low camera looking up: the hillside and sky rise behind the player.
    camera.position.set(.45, .92, distance)
    camera.lookAt(0, 1.24, 0)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize); observer.observe(host); resize()

  // Per-round presentation memory (never read back into the engine).
  let roundId: string | null = null, lastTouch = -1, escape: Escape | null = null, bouncesPlayed = 0
  let restFrom: Vec3 | null = null, restStart = 0, lastBall: Vec3 = BALL_REST, spin = 0, markedCrash: string | null = null

  function frame() {
    if (disposed) return
    frameId = requestAnimationFrame(frame)
    const at = now()
    engine.tick() // same clock, immediately before sampling: no interval/RAF drift
    const round = engine.getSnapshot()
    court.update(at / 1000)
    if (!model || !contacts) { renderer.render(scene, camera); return }
    const cues = callbacks.cues()
    const trace = (type: string, scheduledAt: number, index?: number) => callbacks.trace?.({ type, scheduledAt, index, frameAt: at, observedAt: performance.now(), roundId: round.roundId })
    const pending: number[] = []
    const firstCrash = round.phase === 'dropped' && markedCrash !== round.roundId
    if (round.roundId !== roundId) { roundId = round.roundId; lastTouch = -1; escape = null; bouncesPlayed = 0; restFrom = null }
    let position: Vec3 = lastBall
    let elapsed = NaN
    if (round.phase === 'ready') {
      if (escape && !restFrom) { restFrom = lastBall; restStart = at }
      if (restFrom) {
        const u = Math.min(1, (at - restStart) / 650), e = 1 - (1 - u) ** 3
        position = [restFrom[0] + (rest[0] - restFrom[0]) * e, BALL_RADIUS, restFrom[2] + (rest[2] - restFrom[2]) * e]
        if (u >= 1) { restFrom = null; escape = null }
      } else position = rest
    } else {
      elapsed = at - round.flightAt
      const crashed = round.phase === 'dropped' && round.failTouch !== null
      // Touch cues exactly when a touch becomes visible; the failing touch plays the miss.
      const reached = Math.min(touchIndexAt(elapsed), crashed ? round.failTouch! : Infinity)
      for (let k = lastTouch + 1; k <= reached; k++) {
        // A resumed/throttled tab must not play a burst of missed contacts.
        // Only the contact actually represented by this frame is audible.
        if (k === reached) pending.push(k)
      }
      lastTouch = Math.max(lastTouch, reached)
      if (crashed) {
        if (!escape) {
          // Immediate outside-boot slip from the same incoming contact; no successful extra arc.
          escape = simulateEscape(contacts[round.failTouch!], badTouchVelocity(round.failTouch!), 2.4)
        }
        const since = (at - round.crashAt) / 1000
        position = sampleEscape(escape, since)
        while (bouncesPlayed < escape.bounceTimes.length && escape.bounceTimes[bouncesPlayed] <= since) { cues?.bounce(1 / (1 + bouncesPlayed)); bouncesPlayed++ }
        if (markedCrash !== round.roundId) {
          markedCrash = round.roundId
          // Sync evidence: the first rendered frame of the failure vs the engine deadline.
          performance.mark('embaixadinha:crash-frame', { detail: { crashAt: round.crashAt, frameAt: at, lagMs: at - round.crashAt } })
        }
      } else position = controlledFlight(elapsed, contacts).position
    }
    player!.update({ elapsed, sinceStart: at - round.startedAt, failTouch: round.failTouch, variant: round.variant }, at / 1000)
    if (firstCrash) trace('stumble-start', round.crashAt, round.failTouch!)
    const moved = Math.hypot(position[0] - lastBall[0], position[1] - lastBall[1], position[2] - lastBall[2])
    spin += moved / BALL_RADIUS
    ball.position.set(...position)
    if (firstCrash) trace('ball-escape-start', round.crashAt, round.failTouch!)
    ball.rotation.set(spin * .9, spin * .35, 0)
    lastBall = position
    ballShadow.position.set(position[0], .006, position[2])
    const lift = Math.max(0, position[1] - BALL_RADIUS)
    ballShadow.scale.setScalar(1 + lift * .6); (ballShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(.15, 1 - lift * .55)
    callbacks.frame({ multiplier: round.multiplier, phase: round.phase, crashed: round.phase === 'dropped' })
    if (firstCrash) trace('hud-freeze', round.crashAt, round.failTouch!)
    for (const index of pending) {
      const failed = round.phase === 'dropped' && index === round.failTouch
      if (failed) { cues?.crash(round.variant!); trace('crash-cue-dispatch', round.crashAt, index) }
      else { cues?.touch(touchProfile(index).kind, TOUCHES[index].tier, index); trace('contact-cue-dispatch', round.flightAt + TOUCHES[index].at, index) }
    }
    renderer.render(scene, camera)
    if (firstCrash) trace('crash-render', round.crashAt, round.failTouch!)
  }
  frameId = requestAnimationFrame(frame)

  return () => {
    disposed = true
    abort.abort()
    cancelAnimationFrame(frameId)
    observer.disconnect()
    player?.dispose()
    court.dispose()
    scene.traverse(object => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(material)) material.forEach(m => m.dispose()); else material?.dispose()
    })
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }
}
