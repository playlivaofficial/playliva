// Measured on the supplied skinned foot and the castaway's staged idle pose:
// first surface contact is at source 1.925s (between source frames 115–116/60).
export const CONTACT_CLIP_SECONDS = 1.925
export const KICK_SPEED = 3.5
export const PREPARING_MS = 150
export const IMPACT_MS = CONTACT_CLIP_SECONDS / KICK_SPEED * 1000
export const KICK_MS = IMPACT_MS
export const IMPACT_BEAT_MS = 220
export function fallDurationMs(flightMs: number) {
  return Math.min(850, 450 + Math.sqrt(Math.max(0, flightMs) / 1000) * 75)
}
