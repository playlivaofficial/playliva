import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EMBAIXADINHA_ASSETS } from '@/lib/originals/embaixadinha/definition'
import { TOUCHES, touchIndexAt, type TouchKind } from '@/lib/originals/embaixadinha/juggle'
import type { JuggleEngine, JuggleSnapshot } from '@/lib/originals/embaixadinha/engine'
import { BALL_RADIUS, BALL_REST, CONTACT_POSES, ballInFlight, escapeFor, poseAt, sampleEscape, type ContactMap, type Escape, type Pose, type Vec3 } from './juggle-motion'
import { applyCraqueKit } from './craque-kit'
import { buildCourt } from './court'

/** Cues the renderer fires on the exact frame an event becomes visible. */
export interface JuggleCueSink {
  touch(kind: TouchKind, tier: 0 | 1 | 2, index: number): void
  crash(variant: NonNullable<JuggleSnapshot['variant']>): void
  bounce(strength: number): void
}
export interface JuggleFrame { multiplier: number; phase: JuggleSnapshot['phase']; crashed: boolean }

const BONES = ['Hips', 'Spine02', 'Spine01', 'Spine', 'neck', 'Head', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase',
  'LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm'] as const
type BoneName = typeof BONES[number]
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1)

/** Route-only renderer. The engine owns all timing and money; this is presentation. */
export function mountJuggleScene(host: HTMLDivElement, engine: JuggleEngine, callbacks: {
  ready: () => void; error: (unsupported?: boolean) => void
  frame: (frame: JuggleFrame) => void
  cues: () => JuggleCueSink | null
  /** Local visual-QA harness only; production always uses performance.now. */
  now?: () => number
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

  let model: THREE.Object3D | null = null, disposeKit: (() => void) | null = null
  const bones = {} as Record<BoneName, THREE.Bone>
  const restLocal = {} as Record<BoneName, THREE.Quaternion>, restWorld = {} as Record<BoneName, THREE.Quaternion>
  let hipsRestY = 0
  let contacts: ContactMap | null = null

  const tmpQ = new THREE.Quaternion(), tmpA = new THREE.Quaternion(), tmpB = new THREE.Quaternion(), inv = new THREE.Quaternion()
  /** Rotate a bone about character-space axes, expressed relative to its rest orientation. */
  function setBone(name: BoneName, rotation: THREE.Quaternion) {
    const bone = bones[name]
    inv.copy(restWorld[name]).invert()
    tmpQ.copy(inv).multiply(rotation).multiply(restWorld[name])
    bone.quaternion.copy(restLocal[name]).multiply(tmpQ)
  }
  const axis = (a: THREE.Vector3, angle: number, out = new THREE.Quaternion()) => out.setFromAxisAngle(a, angle)
  function applyPose(pose: Pose, look: { yaw: number; pitch: number }) {
    bones.Hips.position.y = hipsRestY - pose.hipsDrop
    setBone('Hips', axis(Y, pose.hipsYaw, tmpA))
    setBone('Spine02', axis(X, pose.spineLean * .4, tmpA).multiply(axis(Z, pose.spineSide * .4, tmpB)))
    setBone('Spine01', axis(X, pose.spineLean * .35, tmpA))
    setBone('Spine', axis(X, pose.spineLean * .25, tmpA))
    setBone('neck', axis(Y, look.yaw * .35, tmpA).multiply(axis(X, look.pitch * .35, tmpB)))
    setBone('Head', axis(Y, look.yaw * .65, tmpA).multiply(axis(X, look.pitch * .65, tmpB)))
    for (const [side, leg] of [['Left', pose.left], ['Right', pose.right]] as const) {
      setBone(`${side}UpLeg`, axis(X, -leg.flex, tmpA).multiply(axis(Z, leg.abduct, tmpB)))
      setBone(`${side}Leg`, axis(X, leg.knee, tmpA))
      setBone(`${side}Foot`, axis(X, leg.ankle, tmpA))
    }
    for (const [side, arm, sign] of [['Left', pose.leftArm, -1], ['Right', pose.rightArm, 1]] as const) {
      setBone(`${side}Arm`, axis(Y, sign * arm.forward, tmpA).multiply(axis(Z, sign * arm.down, tmpB)))
      setBone(`${side}ForeArm`, axis(Y, sign * arm.elbow, tmpA))
    }
  }

  function calibrate(): ContactMap {
    const result = {} as Record<TouchKind, Vec3>
    const p = new THREE.Vector3(), q = new THREE.Vector3(), up = new THREE.Vector3()
    for (const kind of Object.keys(CONTACT_POSES) as TouchKind[]) {
      const { leg, pose } = CONTACT_POSES[kind]
      const base = poseAt({ elapsed: NaN, sinceStart: 0, failTouch: null, variant: null })
      base[leg] = pose
      applyPose(base, { yaw: 0, pitch: 0 })
      model!.updateMatrixWorld(true)
      const side = leg === 'left' ? 'Left' : 'Right'
      if (kind === 'flick') { result[kind] = BALL_REST; continue }
      if (kind.endsWith('thigh')) {
        stage.worldToLocal(bones[`${side}UpLeg`].getWorldPosition(p)); stage.worldToLocal(bones[`${side}Leg`].getWorldPosition(q))
        p.lerp(q, .72)
        up.set(0, 1, 0)
        result[kind] = [p.x, p.y + .085 + BALL_RADIUS, p.z]
      } else {
        stage.worldToLocal(bones[`${side}Foot`].getWorldPosition(p)); stage.worldToLocal(bones[`${side}ToeBase`].getWorldPosition(q))
        const forward = q.clone().sub(p).normalize()
        up.set(0, 1, 0).addScaledVector(forward, -forward.y).normalize()
        p.lerp(q, .55).addScaledVector(up, .045 + BALL_RADIUS)
        result[kind] = [p.x, p.y, p.z]
      }
    }
    return result
  }

  const loader = new GLTFLoader()
  loader.load(EMBAIXADINHA_ASSETS.craque, gltf => {
    if (disposed) return
    model = gltf.scene
    model.traverse(object => {
      const mesh = object as THREE.SkinnedMesh
      if (mesh.isSkinnedMesh) { disposeKit = applyCraqueKit(mesh.material as THREE.MeshStandardMaterial); mesh.frustumCulled = false }
    })
    stage.add(model)
    model.updateMatrixWorld(true)
    for (const name of BONES) {
      const bone = model.getObjectByName(name) as THREE.Bone | undefined
      if (!bone) { callbacks.error(); return }
      bones[name] = bone; restLocal[name] = bone.quaternion.clone(); restWorld[name] = bone.getWorldQuaternion(new THREE.Quaternion())
      // Stage rotation is not part of the rest pose frame.
      restWorld[name].premultiply(stage.getWorldQuaternion(new THREE.Quaternion()).invert())
    }
    hipsRestY = bones.Hips.position.y
    contacts = calibrate()
    renderer.compile(scene, camera)
    callbacks.ready()
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
  const ballWorld = new THREE.Vector3(), headWorld = new THREE.Vector3()

  function frame() {
    if (disposed) return
    frameId = requestAnimationFrame(frame)
    const at = now()
    engine.tick() // same clock, immediately before sampling: no interval/RAF drift
    const round = engine.getSnapshot()
    court.update(at / 1000)
    if (!model || !contacts) { renderer.render(scene, camera); return }
    const cues = callbacks.cues()
    if (round.roundId !== roundId) { roundId = round.roundId; lastTouch = -1; escape = null; bouncesPlayed = 0; restFrom = null }
    let position: Vec3 = lastBall
    let elapsed = NaN
    if (round.phase === 'ready') {
      if (escape && !restFrom) { restFrom = lastBall; restStart = at }
      if (restFrom) {
        const u = Math.min(1, (at - restStart) / 650), e = 1 - (1 - u) ** 3
        position = [restFrom[0] + (BALL_REST[0] - restFrom[0]) * e, BALL_RADIUS, restFrom[2] + (BALL_REST[2] - restFrom[2]) * e]
        if (u >= 1) { restFrom = null; escape = null }
      } else position = BALL_REST
    } else {
      elapsed = at - round.flightAt
      const crashed = round.phase === 'dropped' && round.failTouch !== null
      // Touch cues exactly when a touch becomes visible; the failing touch plays the miss.
      const reached = Math.min(touchIndexAt(elapsed), crashed ? round.failTouch! : Infinity)
      for (let k = lastTouch + 1; k <= reached; k++) {
        if (crashed && k === round.failTouch) cues?.crash(round.variant!)
        else cues?.touch(TOUCHES[k].kind, TOUCHES[k].tier, k)
      }
      lastTouch = Math.max(lastTouch, reached)
      if (crashed) {
        const fail = TOUCHES[round.failTouch!]
        if (!escape) {
          const before = ballInFlight(fail.at - 0.001, contacts)
          const start = fail.kind === 'flick' ? BALL_REST : contacts[fail.kind]
          escape = escapeFor(round.variant!, fail.kind, round.variant === 'between-feet' ? before.position : start, before.velocity, 2.4)
        }
        const since = (at - round.crashAt) / 1000
        position = sampleEscape(escape, since)
        while (bouncesPlayed < escape.bounceTimes.length && escape.bounceTimes[bouncesPlayed] <= since) { cues?.bounce(1 / (1 + bouncesPlayed)); bouncesPlayed++ }
        if (markedCrash !== round.roundId) {
          markedCrash = round.roundId
          // Sync evidence: the first rendered frame of the failure vs the engine deadline.
          performance.mark('embaixadinha:crash-frame', { detail: { crashAt: round.crashAt, frameAt: at, lagMs: at - round.crashAt } })
        }
      } else position = ballInFlight(elapsed, contacts).position
    }
    const pose = poseAt({ elapsed, sinceStart: at - round.startedAt, failTouch: round.failTouch, variant: round.variant })
    // Head follows the ball (presentation only).
    ballWorld.set(...position)
    headWorld.set(0, 1.55, .05)
    const dx = ballWorld.x - headWorld.x, dy = ballWorld.y - headWorld.y, dz = Math.max(.15, ballWorld.z - headWorld.z)
    const look = { yaw: THREE.MathUtils.clamp(Math.atan2(dx, dz), -.9, .9), pitch: THREE.MathUtils.clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -.5, .7) }
    applyPose(pose, look)
    const moved = Math.hypot(position[0] - lastBall[0], position[1] - lastBall[1], position[2] - lastBall[2])
    spin += moved / BALL_RADIUS
    ball.position.set(...position)
    ball.rotation.set(spin * .9, spin * .35, 0)
    lastBall = position
    ballShadow.position.set(position[0], .006, position[2])
    const lift = Math.max(0, position[1] - BALL_RADIUS)
    ballShadow.scale.setScalar(1 + lift * .6); (ballShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(.15, 1 - lift * .55)
    callbacks.frame({ multiplier: round.multiplier, phase: round.phase, crashed: round.phase === 'dropped' })
    renderer.render(scene, camera)
  }
  frameId = requestAnimationFrame(frame)

  return () => {
    disposed = true
    abort.abort()
    cancelAnimationFrame(frameId)
    observer.disconnect()
    disposeKit?.()
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
