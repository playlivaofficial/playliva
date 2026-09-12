// World-space staging is shared with the deterministic contact regression.
export const CHARACTER_SCALE = 1.45
export const KICK_SPEED = 3.5
export const CASTAWAY_START = [.35, -.1, .15] as const
export const KICKER_START = [-1.05, -.1, -.55] as const

// Clock-derived presentation only. No frame-rate-dependent easing at contact:
// the first rendered frame after impact already has forward/upward velocity.
export function flightPosition(seconds: number, multiplier = 100) {
  const t = Math.max(0, seconds)
  const boost = 1 - Math.exp(-5 * t)
  return {
    x: CASTAWAY_START[0] + 7 * t + 2 * (t - boost / 5),
    y: CASTAWAY_START[1] + 4 * t + 2 * (1 - Math.exp(-5 * t)),
    z: CASTAWAY_START[2],
    speed: Math.min(1 + Math.log2(Math.max(100, multiplier) / 100) * .55, 3.5),
  }
}
