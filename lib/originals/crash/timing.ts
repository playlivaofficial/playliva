// Measured on the supplied skinned foot and the castaway's staged idle pose.
// The kicking foot swings above head height, then sweeps down the castaway's
// rear. Source 1.925s caught it at 70.5% body height — shoulder blades, which
// read on camera as a kick to the head. 1.975s is the frame where the same
// skinned foot meets the buttocks: 55.6% body height, nearest bone Hips, on
// the rear side, with 0.067 world units of clearance 16ms earlier so the foot
// never grazes the back on approach. `scripts/crash-rig.mjs` + the
// crash-surface regression re-derive these numbers from the shipped GLBs.
export const CONTACT_CLIP_SECONDS = 1.975
export const KICK_SPEED = 3.5
export const PREPARING_MS = 150
export const IMPACT_MS = CONTACT_CLIP_SECONDS / KICK_SPEED * 1000
export const KICK_MS = IMPACT_MS
export const IMPACT_BEAT_MS = 220
export function fallDurationMs(flightMs: number) {
  return Math.min(850, 450 + Math.sqrt(Math.max(0, flightMs) / 1000) * 75)
}
