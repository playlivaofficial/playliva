import { WHEEL_ORDER, validPocket } from './config'

export const POCKET_DEGREES = 360 / 37
export const BALL_TRACK_RADIUS = 172, BALL_POCKET_RADIUS = 122
export interface OrbitPlan {
  readonly number: number; readonly index: number
  readonly wheelStart: number; readonly wheelEnd: number
  readonly ballStart: number; readonly ballEnd: number; readonly ballStartRadius: number
}
const mod = (n: number) => ((n % 360) + 360) % 360
const clamp = (n: number) => Math.min(1, Math.max(0, n))
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t) }
export function createOrbitPlan(number: number, previous?: OrbitPlan | null): OrbitPlan {
  if (!validPocket(number)) throw new Error('Invalid orbit pocket')
  const index = WHEEL_ORDER.indexOf(number), wheelStart = mod(previous?.wheelEnd ?? 0), ballStart = mod(previous?.ballEnd ?? -35)
  const wheelEnd = wheelStart + 720 + 110 + number * 2
  const target = wheelEnd + index * POCKET_DEGREES
  const ballEnd = ballStart - 1800 - mod(ballStart - target)
  return Object.freeze({ number, index, wheelStart, wheelEnd, ballStart, ballEnd,
    ballStartRadius: previous ? BALL_POCKET_RADIUS : BALL_TRACK_RADIUS })
}
/** Presentation only: no RNG, wallet, collision result or completion callback. */
export function sampleOrbit(plan: OrbitPlan, progress: number, reducedMotion = false) {
  const t = clamp(Number.isFinite(progress) ? progress : 0)
  const wheelEase = 1 - (1 - t) ** 3, ballEase = 1 - (1 - t) ** 3
  const entry = clamp((t - .7) / .3)
  const startRadius = plan.ballStartRadius + (BALL_TRACK_RADIUS - plan.ballStartRadius) * smooth(t / .12)
  const radius = startRadius + (BALL_POCKET_RADIUS - startRadius) * smooth(entry) + Math.sin(entry * Math.PI * 6) * 3 * entry * (1 - entry)
  // Reduced motion reveals the deterministic landing without orbiting/flashing.
  if (reducedMotion) return { wheel: plan.wheelEnd, ball: plan.ballEnd, radius: BALL_POCKET_RADIUS, landed: t >= 1, opacity: t >= 1 ? 1 : 0 }
  return { wheel: plan.wheelStart + (plan.wheelEnd - plan.wheelStart) * wheelEase,
    ball: plan.ballStart + (plan.ballEnd - plan.ballStart) * ballEase,
    radius, landed: t >= 1, opacity: 1 }
}
export function pocketUnderBall(wheel: number, ball: number) {
  return WHEEL_ORDER[Math.round(mod(ball - wheel) / POCKET_DEGREES) % 37]
}
