/**
 * Liva Embaixadinha — the one shared juggling contract.
 *
 * Every touch of the ball happens at a fixed, public time after the first
 * touch (`touchTimes`). A round ends when ONE of those touches goes wrong:
 * the engine draws which touch fails before the round starts, and the
 * multiplier, the ball's escape, the HUD and the crash sound all derive from
 * that single touch time. Presentation can never move it.
 *
 * Maths: the multiplier grows as 100 · e^(t / GROWTH_MS). Touch k happens at
 * t_k and the juggle is still alive there with probability
 * SURVIVAL · e^(−t_k / GROWTH_MS) (the flick at t_0 = 0 always happens).
 * An auto cashout at `a` (reached at T(a)) wins when the failing touch comes
 * after T(a), so its expected return is (a / 100) · SURVIVAL · e^(−t_next / G)
 * < SURVIVAL, where t_next is the first touch after T(a). The edge is at
 * least 1% for every target and ~3–4% on average (the gap between touches).
 */

export const MAX_MULTIPLIER = 10_000 // 100.00×, hundredths throughout
/** Multiplier growth: 100 · e^(t / GROWTH_MS). 2× at ~5.5s, 10× at ~18.4s. */
export const GROWTH_MS = 8000
/** Foot wind-up before the flick that starts the juggle (first touch). */
export const PREPARING_MS = 420
/** Visual loss beat after the failed touch before the court resets. */
export const DROP_MS = 1650
/** Upper bound on any target's expected return. */
export const SURVIVAL = 0.99

export type TouchKind = 'flick' | 'right-foot' | 'left-foot' | 'right-thigh' | 'left-thigh'
export interface Touch {
  readonly index: number
  /** Milliseconds after the first touch (the flick). */
  readonly at: number
  readonly kind: TouchKind
  /** Flight time to the next touch, milliseconds. */
  readonly hang: number
  /** Multiplier (hundredths) displayed at this touch. */
  readonly multiplier: number
  /** 0 early, 1 mid, 2 high: presentation energy only. */
  readonly tier: 0 | 1 | 2
}

export function multiplierAt(elapsedMs: number): number {
  return Math.min(MAX_MULTIPLIER, Math.max(100, Math.floor(100 * Math.exp(Math.max(0, elapsedMs) / GROWTH_MS))))
}
export function timeToMultiplier(multiplier: number): number { return GROWTH_MS * Math.log(multiplier / 100) }

/** Deterministic touch rhythm; identical for every round and every client. */
function nextTouch(index: number, previous: TouchKind): { kind: TouchKind; hang: number; tier: 0 | 1 | 2 } {
  if (index === 0) return { kind: 'flick', hang: 520, tier: 0 }
  if (index <= 8) return { kind: 'right-foot', hang: 480, tier: 0 }
  if (index <= 22) {
    // Alternate feet with a thigh control every fourth touch.
    if (index % 4 === 0) return { kind: previous === 'left-foot' ? 'right-thigh' : 'left-thigh', hang: 420, tier: 1 }
    return { kind: previous === 'right-foot' || previous === 'right-thigh' ? 'left-foot' : 'right-foot', hang: 470, tier: 1 }
  }
  // Higher, more expressive arcs with thigh controls in between.
  const cycle: readonly [TouchKind, number][] = [['right-foot', 620], ['left-thigh', 420], ['left-foot', 560], ['right-thigh', 420], ['right-foot', 560], ['left-foot', 620]]
  const [kind, hang] = cycle[(index - 23) % cycle.length]
  return { kind, hang, tier: 2 }
}

function buildSchedule(): readonly Touch[] {
  const touches: Touch[] = []
  let at = 0, kind: TouchKind = 'flick'
  for (let index = 0; ; index++) {
    const next = nextTouch(index, kind)
    kind = next.kind
    const multiplier = multiplierAt(at)
    touches.push(Object.freeze({ index, at, kind, hang: next.hang, multiplier, tier: next.tier }))
    if (multiplier >= MAX_MULTIPLIER) break
    at += next.hang
  }
  return Object.freeze(touches)
}
export const TOUCHES: readonly Touch[] = buildSchedule()
export const LAST_TOUCH = TOUCHES.length - 1

/** Index of the last touch at or before `elapsedMs` (−1 before the flick). */
export function touchIndexAt(elapsedMs: number): number {
  if (elapsedMs < 0) return -1
  let lo = 0, hi = LAST_TOUCH
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (TOUCHES[mid].at <= elapsedMs) lo = mid; else hi = mid - 1 }
  return lo
}

/** Probability that the juggle is still alive when touch `index` happens. */
export const survivalTo = (index: number) => index <= 0 ? 1 : SURVIVAL * Math.exp(-TOUCHES[Math.min(index, LAST_TOUCH)].at / GROWTH_MS)

/**
 * Failing touch for a uniform 32-bit sample: P(fail index ≥ k) = survivalTo(k).
 * The final (100×) touch always fails, so a round can never exceed the cap.
 */
export function failingTouch(sample: number): number {
  if (!Number.isInteger(sample) || sample < 0 || sample > 0xffff_ffff) throw new Error('Invalid random sample')
  const reachMs = GROWTH_MS * Math.log(SURVIVAL / (1 - sample / 0x1_0000_0000))
  let index = 0
  while (index < LAST_TOUCH && TOUCHES[index + 1].at <= reachMs) index++
  return index
}

/** Exact expected return (per unit stake) of an auto cashout at `target` hundredths. */
export function expectedReturn(target: number): number {
  const deadline = timeToMultiplier(target)
  const next = TOUCHES.find(touch => touch.at > deadline)
  return next ? (target / 100) * survivalTo(next.index) : 0
}

export type FailVariant = 'sideways' | 'heel' | 'overhit' | 'between-feet'
export const FAIL_VARIANTS: readonly FailVariant[] = ['sideways', 'heel', 'overhit', 'between-feet']
/** Presentation-only choice derived from the round id; it never changes the result. */
export function failVariant(roundId: string, touch: number): FailVariant {
  let hash = 2166136261
  for (let i = 0; i < roundId.length; i++) hash = Math.imul(hash ^ roundId.charCodeAt(i), 16777619)
  return FAIL_VARIANTS[((hash >>> 0) + touch) % FAIL_VARIANTS.length]
}
