/** Skill-only fixed-step arcade simulation. No RNG outcome, wager, wallet or reward. */
export const STEP = 1 / 120
export const IMPACT_SECONDS = .8
export type DriftPhase = 'ready' | 'running' | 'impact' | 'result'
export type District = 'coast' | 'city' | 'tunnel'
export interface DriftRun {
  phase: DriftPhase; id: string; time: number; distance: number; speed: number
  x: number; lateral: number; steer: number; angle: number; score: number
  combo: number; bestCombo: number; cleanCorners: number; nearMisses: number
  driftTime: number; comboTime: number; outsideTime: number; impactTime: number
  corner: number; cornerDrift: number; brokenCorner: boolean; obstacle: number
  drifting: boolean; reason: 'edge' | 'traffic' | 'finished' | null
}
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export const normalizedSteer = (n: number) => Number.isFinite(n) ? clamp(n, -1, 1) : 0
/** Opposite keys/touches cancel, rather than depending on event arrival order. */
export const steeringInput = (left: boolean, right: boolean, drag = 0) => normalizedSteer(Number(right) - Number(left) + normalizedSteer(drag))

/** Repeating authored section grammar; smooth entry/exit prevents impossible discontinuities. */
export function trackAt(distance: number) {
  const d = Math.max(0, Number.isFinite(distance) ? distance : 0), section = Math.floor(d / 300)
  const progress = (d % 300) / 300, signs = [0, 1, -1, 1, -1, 0, -1, 1]
  const hairpin = section % 8 === 3 || section % 8 === 6
  const curve = signs[section % signs.length] * Math.sin(progress * Math.PI) * (hairpin ? .82 : .46)
  const district: District = ['coast', 'city', 'tunnel'][Math.floor(d / 900) % 3] as District
  return { section, progress, curve, hairpin, district, halfWidth: Math.max(.76, 1 - d / 18000) }
}
/** One visible, stationary fictional service vehicle per section, always with a wide escape lane. */
export function trafficAt(index: number) {
  return { id: index, distance: 540 + index * 330, x: [-.42, .42, 0, .42, -.42][index % 5], kind: index % 3 === 0 ? 'taxi' : index % 3 === 1 ? 'van' : 'cones' }
}
export function newDriftRun(id = ''): DriftRun {
  return { phase: id ? 'running' : 'ready', id, time: 0, distance: 0, speed: 0, x: 0, lateral: 0, steer: 0, angle: 0,
    score: 0, combo: 1, bestCombo: 1, cleanCorners: 0, nearMisses: 0, driftTime: 0, comboTime: 0,
    outsideTime: 0, impactTime: 0, corner: 0, cornerDrift: 0, brokenCorner: false, obstacle: 0, drifting: false, reason: null }
}
function collide(s: DriftRun, reason: DriftRun['reason']) {
  s.phase = 'impact'; s.reason = reason; s.combo = 1; s.drifting = false; s.impactTime = 0
}
/** Called only with fixed STEP by advanceDrift. Mutable state stays outside React's hot render path. */
export function stepDrift(s: DriftRun, input: number, dt = STEP) {
  if (!Number.isFinite(dt) || dt <= 0 || dt > .1) return
  if (s.phase === 'impact') { s.impactTime += dt; if (s.impactTime >= IMPACT_SECONDS) s.phase = 'result'; return }
  if (s.phase !== 'running') return
  const road = trackAt(s.distance)
  s.time += dt
  s.speed += (Math.min(54, 27 + s.distance / 950) - s.speed) * (1 - Math.exp(-dt * 1.2))
  s.steer += (normalizedSteer(input) - s.steer) * (1 - Math.exp(-dt * 11))
  // The road turns under the car. Steering creates lateral slip, then traction settles it smoothly.
  const target = s.steer * .7 - road.curve * .67 * (s.speed / 28)
  s.lateral += (target - s.lateral) * (1 - Math.exp(-dt * (Math.abs(s.steer) > .1 ? 3.8 : 6)))
  s.x += s.lateral * dt
  s.angle += (s.steer * .35 + s.lateral * .35 - s.angle) * (1 - Math.exp(-dt * 8))
  s.distance += s.speed * dt
  s.score += s.speed * dt * 1.4
  s.drifting = Math.abs(road.curve) > .12 && Math.abs(s.steer) > .16 && s.steer * road.curve > 0 && Math.abs(s.x) < road.halfWidth * .86 && Math.abs(s.angle) > .08
  if (s.drifting) {
    s.driftTime += dt; s.comboTime += dt; s.cornerDrift += dt
    s.combo = Math.min(5, 1 + Math.floor(s.comboTime / 1.4)); s.bestCombo = Math.max(s.bestCombo, s.combo)
    s.score += (40 + Math.abs(s.angle) * 160) * s.combo * dt
  } else if (Math.abs(s.x) > road.halfWidth * .86 || s.steer * road.curve < -.08) {
    s.combo = 1; s.comboTime = 0; s.brokenCorner = true
  }
  const nextRoad = trackAt(s.distance)
  if (nextRoad.section !== s.corner) {
    if (s.cornerDrift >= 1 && !s.brokenCorner) { s.cleanCorners++; s.score += 150 * s.combo }
    s.corner = nextRoad.section; s.cornerDrift = 0; s.brokenCorner = false
  }
  s.outsideTime = Math.abs(s.x) > road.halfWidth ? s.outsideTime + dt : 0
  if (s.outsideTime > .12) { collide(s, 'edge'); return }
  const obstacle = trafficAt(s.obstacle), gap = Math.abs(s.x - obstacle.x)
  if (Math.abs(s.distance - obstacle.distance) < 5 && gap < .23) { collide(s, 'traffic'); return }
  if (s.distance > obstacle.distance + 5) {
    if (gap < .43) { s.nearMisses++; s.score += 125 * s.combo }
    s.obstacle++
  }
  // Bounded safety ceiling, not a second launch mode.
  if (s.time >= 1800) { s.phase = 'result'; s.reason = 'finished'; s.drifting = false }
}
export function advanceDrift(s: DriftRun, input: number, seconds: number, remainder = 0) {
  if (!Number.isFinite(seconds) || seconds < 0) return remainder
  let accumulated = (Number.isFinite(remainder) ? clamp(remainder, 0, STEP) : 0) + Math.min(.1, seconds)
  while (accumulated >= STEP) { stepDrift(s, input); accumulated -= STEP }
  return accumulated
}
export const scoreFor = (s: DriftRun) => Math.max(0, Math.min(100000000, Math.floor(s.score)))
export function scoreBucket(score: number) { return score < 1000 ? 'under-1k' : score < 5000 ? '1k-5k' : score < 10000 ? '5k-10k' : '10k-plus' }
