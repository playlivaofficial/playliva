// World-space staging is shared with the deterministic contact regression.
export const CHARACTER_SCALE = 1.45
export { KICK_SPEED } from './timing'
import { fallDurationMs } from './timing'
export const CASTAWAY_START = [.35, -.1, .15] as const
// Pulled 0.06 back and 0.01 across so the descending foot clears the upper
// back (which sits 0.065 further forward than the buttocks) and lands on the
// rear hip instead. Both characters stay planted on the sand at y = -.1.
export const KICKER_START = [-1.11, -.1, -.54] as const

// Actual skinned-mesh lower bounds every 25ms of the useful crash clip.
// Short losses land near .45s, well before the old coarse dazed-pose samples.
const crashGround = [.23141, .23141, .23141, .24778, .45575, .45186, .38046, .34758,
  .32567, .31343, .29534, .27389, .25747, .2402, .22045, .19853, .17515, .13046,
  .11829, .12469, .14544, .18618, .23581, .27931, .30198, .29628, .28746, .28084,
  .27968, .2906, .31912, .32674, .31427, .30598, .299, .29316, .28821, .27523, .25784]
export function crashGroundAt(seconds: number) {
  const frame = Math.max(0, Math.min(crashGround.length - 1, seconds / .025))
  const a = Math.floor(frame), b = Math.min(a + 1, crashGround.length - 1)
  return crashGround[a] + (crashGround[b] - crashGround[a]) * (frame - a)
}

// Clock-derived presentation only. No frame-rate-dependent easing at contact:
// the first rendered frame after impact already has forward/upward velocity.
export function flightPosition(seconds: number, multiplier = 100) {
  const t = Math.max(0, seconds)
  const boost = 1 - Math.exp(-5.6 * t)
  return {
    x: CASTAWAY_START[0] + 17 * t + 2 * (t - boost / 5.6),
    // Settle into a high forward cruise instead of accumulating hundreds of
    // metres that would require an implausible sub-second return to ground.
    y: CASTAWAY_START[1] + 12 * (1 - Math.exp(-t / 3)) + 2.5 * boost,
    z: CASTAWAY_START[2],
    speed: Math.min(1 + Math.log2(Math.max(100, multiplier) / 100) * .55, 3.5),
  }
}

// Short ballistic visual descent, continuous in position and initial velocity.
// The result is already frozen by the engine; this function has no wallet input.
export function fallPosition(flightSeconds: number, elapsedMs: number, multiplier: number) {
  const start = flightPosition(flightSeconds, multiplier)
  const durationMs = fallDurationMs(flightSeconds * 1000), duration = durationMs / 1000
  const t = Math.max(0, Math.min(duration, elapsedMs / 1000))
  const vx = 19 - 2 * Math.exp(-5.6 * flightSeconds)
  const vy = 4 * Math.exp(-flightSeconds / 3) + 14 * Math.exp(-5.6 * flightSeconds)
  const gravity = 2 * (start.y - CASTAWAY_START[1] + vy * duration) / (duration * duration)
  return { x: start.x + vx * (t - t * t / (2 * duration)),
    y: start.y + vy * t - gravity * t * t / 2, z: start.z, speed: start.speed,
    durationMs, progress: t / duration, impactAgeMs: Math.max(0, elapsedMs - durationMs),
    phase: elapsedMs < durationMs ? 'falling' as const : 'impact' as const }
}
