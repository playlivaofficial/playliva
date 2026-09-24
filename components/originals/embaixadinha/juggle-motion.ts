import { LAST_TOUCH, TOUCHES, touchIndexAt, type FailVariant, type TouchKind } from '@/lib/originals/embaixadinha/juggle'

/**
 * Deterministic juggling presentation. Pure functions of logical time: the
 * same (elapsed, fail touch, variant) always gives the same pose and ball.
 * Nothing here can decide or change an outcome; the fail branch only starts
 * once the engine has published the failing touch at its own deadline.
 *
 * Character space: metres, player at the origin facing +Z, +X is his left.
 */
export type Vec3 = readonly [number, number, number]
export interface LegPose { flex: number; abduct: number; knee: number; ankle: number }
export interface ArmPose { down: number; forward: number; elbow: number }
export interface Pose {
  hipsDrop: number; hipsYaw: number; spineLean: number; spineSide: number
  left: LegPose; right: LegPose; leftArm: ArmPose; rightArm: ArmPose
}
export const BALL_RADIUS = 0.11
export const GRAVITY = 9.8
/** Ball resting on the court in front of the right foot before the flick. */
export const BALL_REST: Vec3 = [-0.12, BALL_RADIUS, 0.34]

/** Leg pose at the exact contact frame of each touch kind. */
export const CONTACT_POSES: Record<TouchKind, { leg: 'left' | 'right'; pose: LegPose }> = {
  flick: { leg: 'right', pose: { flex: 0.42, abduct: -0.04, knee: 0.34, ankle: -0.2 } },
  'right-foot': { leg: 'right', pose: { flex: 0.78, abduct: -0.05, knee: 0.92, ankle: 0.28 } },
  'left-foot': { leg: 'left', pose: { flex: 0.78, abduct: 0.05, knee: 0.92, ankle: 0.28 } },
  'right-thigh': { leg: 'right', pose: { flex: 1.5, abduct: -0.02, knee: 1.55, ankle: 0.25 } },
  'left-thigh': { leg: 'left', pose: { flex: 1.5, abduct: 0.02, knee: 1.55, ankle: 0.25 } },
}
const STAND_LEG: LegPose = { flex: 0.06, abduct: 0, knee: 0.16, ankle: -0.05 }
const RELAXED_ARM: ArmPose = { down: 1.12, forward: 0.18, elbow: 0.42 }
const HANDS_ON_HEAD: ArmPose = { down: -0.55, forward: 1.05, elbow: 2.35 }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }
const mixN = (a: number, b: number, t: number) => a + (b - a) * t
const mixLeg = (a: LegPose, b: LegPose, t: number): LegPose => ({ flex: mixN(a.flex, b.flex, t), abduct: mixN(a.abduct, b.abduct, t), knee: mixN(a.knee, b.knee, t), ankle: mixN(a.ankle, b.ankle, t) })
const mixArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({ down: mixN(a.down, b.down, t), forward: mixN(a.forward, b.forward, t), elbow: mixN(a.elbow, b.elbow, t) })

/** Kick envelope around a contact: lift over 190ms, recover over 210ms. Peak exactly at contact. */
function envelope(dt: number, lead = 0.19, recover = 0.21) {
  if (dt <= -lead || dt >= recover) return 0
  return dt < 0 ? smooth(1 + dt / lead) : smooth(1 - dt / recover)
}

export interface MotionInput {
  /** Milliseconds since the flick (negative while preparing, NaN when idle). */
  elapsed: number
  /** Milliseconds since Start (preparing wind-up), for the pre-flick pose. */
  sinceStart: number
  /** Failing touch once published by the engine, otherwise null. */
  failTouch: number | null
  variant: FailVariant | null
}

/** Full-body pose for a frame. */
export function poseAt(input: MotionInput): Pose {
  const pose: Pose = { hipsDrop: 0.03, hipsYaw: 0, spineLean: 0.08, spineSide: 0,
    left: { ...STAND_LEG }, right: { ...STAND_LEG }, leftArm: { ...RELAXED_ARM }, rightArm: { ...RELAXED_ARM } }
  const t = input.elapsed / 1000
  if (!Number.isFinite(t)) return pose
  const fail = input.failTouch
  const crashT = fail === null ? Infinity : TOUCHES[fail].at / 1000
  // Wind-up before the flick: right foot slides under the ball.
  if (t < 0) {
    const w = smooth(input.sinceStart / 380)
    pose.right = mixLeg(STAND_LEG, { flex: 0.2, abduct: -0.03, knee: 0.28, ankle: -0.35 }, w)
    pose.spineLean = 0.12
    return pose
  }
  const current = touchIndexAt(input.elapsed)
  // Kicking legs from the touches around now (previous and next overlap briefly).
  for (let k = Math.max(0, current - 1); k <= Math.min(LAST_TOUCH, current + 1); k++) {
    const touch = TOUCHES[k]
    if (touch.at / 1000 > crashT + 1e-9) continue // no touches after the failure
    let dt = t - touch.at / 1000
    // Between-feet failure: the foot arrives ~130ms late and swings through air.
    if (k === fail && input.variant === 'between-feet') dt -= 0.13
    const { leg, pose: contact } = CONTACT_POSES[touch.kind]
    const w = envelope(dt, touch.kind.endsWith('thigh') ? 0.17 : 0.19)
    if (w <= 0) continue
    pose[leg] = mixLeg(pose[leg], contact, w)
    const support = leg === 'left' ? 'right' : 'left'
    pose[support] = { ...pose[support], knee: pose[support].knee + 0.12 * w, flex: pose[support].flex + 0.05 * w }
    pose.hipsDrop += 0.025 * w
    // Counter-balance: opposite arm swings forward, same arm opens out.
    const opposite = leg === 'left' ? 'rightArm' : 'leftArm', same = leg === 'left' ? 'leftArm' : 'rightArm'
    const energy = touch.tier === 2 ? 1.6 : touch.tier === 1 ? 1.2 : 1
    pose[opposite] = { ...pose[opposite], forward: pose[opposite].forward + 0.35 * w * energy, down: pose[opposite].down - 0.12 * w * energy }
    pose[same] = { ...pose[same], down: pose[same].down - 0.28 * w * energy }
    pose.spineLean += (touch.kind.endsWith('thigh') ? -0.1 : 0.05) * w
    pose.hipsYaw += (leg === 'left' ? 0.08 : -0.08) * w
  }
  // Gentle rhythm bob on the support leg.
  pose.hipsDrop += 0.012 * (1 + Math.sin(t * Math.PI * 4.2))
  if (t >= crashT) {
    const since = t - crashT
    const react = smooth(since / 0.4), head = smooth((since - 0.45) / 0.45)
    pose.left = mixLeg(pose.left, STAND_LEG, react * 0.7)
    pose.right = mixLeg(pose.right, STAND_LEG, react * 0.7)
    pose.spineLean = mixN(pose.spineLean, input.variant === 'overhit' ? -0.12 : 0.22, react)
    pose.leftArm = mixArm(pose.leftArm, HANDS_ON_HEAD, head)
    pose.rightArm = mixArm(pose.rightArm, HANDS_ON_HEAD, head)
    pose.hipsDrop = mixN(pose.hipsDrop, 0.05, react)
  }
  return pose
}

/** Where the ball's centre sits at each touch kind's contact frame (calibrated from the rig). */
export type ContactMap = Record<TouchKind, Vec3>

export interface BallState { position: Vec3; velocity: Vec3; airborne: boolean; bounces: number }

function parabola(from: Vec3, to: Vec3, duration: number, tau: number): BallState {
  const vy = (to[1] - from[1] + GRAVITY * duration * duration / 2) / duration
  const vx = (to[0] - from[0]) / duration, vz = (to[2] - from[2]) / duration
  return {
    position: [from[0] + vx * tau, from[1] + vy * tau - GRAVITY * tau * tau / 2, from[2] + vz * tau],
    velocity: [vx, vy - GRAVITY * tau, vz], airborne: true, bounces: 0,
  }
}

/** Launch velocity for each failure look. `side` is +1 for the left leg, −1 for the right. */
function escapeVelocity(variant: FailVariant, side: number, incoming: Vec3): Vec3 {
  switch (variant) {
    case 'sideways': return [side * 2.3, 2.1, 1.1]
    case 'heel': return [side * 0.5, 1.5, -2.3]
    case 'overhit': return [side * 0.7, 6.4, 1.35]
    case 'between-feet': return [incoming[0] * 0.3, incoming[1], incoming[2] + 0.35]
  }
}

export interface Escape { samples: Float32Array; step: number; bounceTimes: number[] }
/** Integrates the loose ball once at the failing touch: bounces, then rolls to rest. */
export function simulateEscape(start: Vec3, velocity: Vec3, seconds: number, step = 1 / 240): Escape {
  const count = Math.ceil(seconds / step) + 1
  const samples = new Float32Array(count * 3), bounceTimes: number[] = []
  let [x, y, z] = start, [vx, vy, vz] = velocity
  for (let i = 0; i < count; i++) {
    samples[i * 3] = x; samples[i * 3 + 1] = y; samples[i * 3 + 2] = z
    vy -= GRAVITY * step
    x += vx * step; y += vy * step; z += vz * step
    if (y < BALL_RADIUS) {
      y = BALL_RADIUS
      if (Math.abs(vy) > 0.45) { bounceTimes.push((i + 1) * step); vy = -vy * 0.56; vx *= 0.82; vz *= 0.82 }
      else { vy = 0; vx *= 1 - 1.4 * step; vz *= 1 - 1.4 * step } // rolling friction
    }
  }
  return { samples, step, bounceTimes }
}

export function escapeFor(variant: FailVariant, kind: TouchKind, contact: Vec3, incoming: Vec3, seconds: number): Escape {
  const side = CONTACT_POSES[kind].leg === 'left' ? 1 : -1
  return simulateEscape(contact, escapeVelocity(variant, side, incoming), seconds)
}

export function sampleEscape(escape: Escape, since: number): Vec3 {
  const f = Math.min(escape.samples.length / 3 - 1, Math.max(0, since / escape.step))
  const i = Math.floor(f), j = Math.min(i + 1, escape.samples.length / 3 - 1), u = f - i
  const s = escape.samples
  return [s[i * 3] + (s[j * 3] - s[i * 3]) * u, s[i * 3 + 1] + (s[j * 3 + 1] - s[i * 3 + 1]) * u, s[i * 3 + 2] + (s[j * 3 + 2] - s[i * 3 + 2]) * u]
}

/**
 * Ball during a live juggle: an exact ballistic arc from one contact point to
 * the next, so it meets the foot/thigh exactly at every touch time.
 */
export function ballInFlight(elapsed: number, contacts: ContactMap): BallState {
  if (elapsed < 0) return { position: BALL_REST, velocity: [0, 0, 0], airborne: false, bounces: 0 }
  const k = touchIndexAt(elapsed)
  const touch = TOUCHES[k], next = TOUCHES[Math.min(k + 1, LAST_TOUCH)]
  const from = touch.kind === 'flick' ? BALL_REST : contacts[touch.kind]
  if (k === LAST_TOUCH) return { position: from, velocity: [0, 0, 0], airborne: true, bounces: 0 }
  return parabola(from, contacts[next.kind], touch.hang / 1000, (elapsed - touch.at) / 1000)
}
