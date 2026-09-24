import { TOUCHES, touchIndexAt, type TouchKind } from '@/lib/originals/embaixadinha/juggle'
import { BALL_RADIUS, GRAVITY, type BallState, type Vec3 } from './juggle-motion'

export const LIFT_LEAD_MS = 190
export const RECOVERY_MS = 280
export const smooth = (v: number) => { const x = Math.max(0, Math.min(1, v)); return x * x * (3 - 2 * x) }
export function touchProfile(index: number) {
  const left = index % 2 === 0 && index > 0
  const cushion = index % 6 === 3
  return { side: left ? 'Left' as const : 'Right' as const,
    kind: (index === 0 ? 'flick' : left ? 'left-foot' : 'right-foot') as TouchKind,
    lift: index === 0 ? .015 : cushion ? .12 : .17,
    forward: index === 0 ? .09 : cushion ? .14 : .18,
    toeUp: index === 0 ? .08 : cushion ? .13 : .20,
    name: index === 0 ? 'scoop' : cushion ? 'cushion' : left ? 'left-instep' : 'right-instep' }
}
export function touchEnvelope(dt: number) {
  // Contact occurs while the boot is still rising; the follow-through peaks
  // 35 ms later, rather than stopping the foot at the impact frame.
  return dt < 35 ? smooth((dt + LIFT_LEAD_MS) / (LIFT_LEAD_MS + 35)) : 1 - smooth((dt - 35) / (RECOVERY_MS - 35))
}
export type ContactSequence = readonly Vec3[]
/** Engine timestamps are immutable; alternate legs get 840–1240 ms to recover. */
export function controlledFlight(elapsed: number, contacts: ContactSequence): BallState {
  if (elapsed < 0) return { position: contacts[0], velocity: [0, 0, 0], airborne: false, bounces: 0 }
  const k = touchIndexAt(elapsed), t = TOUCHES[k], from = contacts[k], to = contacts[Math.min(k + 1, contacts.length - 1)]
  const duration = t.hang / 1000, tau = (elapsed - t.at) / 1000
  const vx = (to[0] - from[0]) / duration, vz = (to[2] - from[2]) / duration
  const vy = (to[1] - from[1]) / duration + GRAVITY * duration / 2
  return { position: [from[0] + vx * tau, from[1] + vy * tau - GRAVITY * tau * tau / 2, from[2] + vz * tau],
    velocity: [vx, vy - GRAVITY * tau, vz], airborne: true, bounces: 0 }
}
/** Outside-boot mistake: immediate outward/downward velocity, never another high successful arc. */
export function badTouchVelocity(index: number): Vec3 {
  return [touchProfile(index).side === 'Left' ? 2.1 : -2.1, -.45, 1.3]
}
export const CONTACT_CLEARANCE = BALL_RADIUS + .002
