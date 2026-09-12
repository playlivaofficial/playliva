import { MAX_CREDITS, type DemoSessionStore, type WalletResult } from '../session'
import { ISLAND_CRASH } from './definition'
import { PREPARING_MS, KICK_MS, IMPACT_BEAT_MS, fallDurationMs } from './timing'
export { PREPARING_MS, KICK_MS, IMPACT_MS } from './timing'

export const MAX_MULTIPLIER = 10_000 // 100.00x, hundredths throughout
export const RESULT_MS = 3200
export const SETTLED_MS = 600
export const GROWTH_MS = 7000
export type CrashPhase = 'ready' | 'preparing' | 'kick' | 'flying' | 'cashed_out' | 'crashed' | 'settled'
export interface CrashResult { roundId: string; won: boolean; multiplier: number; stake: number; payout: number }
export interface CrashSnapshot {
  phase: CrashPhase; roundId: string | null; startedAt: number; flightAt: number
  finishedAt: number; multiplier: number; stake: number; auto: number | null
  result: CrashResult | null; history: readonly CrashResult[]
}
export interface RandomSource { uint32(): number }
export const secureRandom: RandomSource = {
  uint32: () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0],
}

/** Inverse survival demo curve: P(reach m) ≈ 0.97/m, capped at 100x.
 * Local entertainment only. No server authority or fairness certification. */
export function generateCrashPoint(random: RandomSource = secureRandom): number {
  const sample = random.uint32()
  if (!Number.isInteger(sample) || sample < 0 || sample > 0xffff_ffff) throw new Error('Invalid random sample')
  return Math.max(100, Math.min(MAX_MULTIPLIER, Math.floor(97 / (1 - sample / 0x1_0000_0000))))
}
export function payoutFor(stake: number, multiplier: number): number {
  if (!Number.isSafeInteger(stake) || stake <= 0 || stake > MAX_CREDITS ||
    !Number.isInteger(multiplier) || multiplier < 100 || multiplier > MAX_MULTIPLIER) throw new Error('Invalid payout inputs')
  return Number(BigInt(stake) * BigInt(multiplier) / BigInt(100))
}
export function timeToMultiplier(multiplier: number): number { return GROWTH_MS * Math.log(multiplier / 100) }
export function multiplierAt(elapsed: number): number {
  return Math.min(MAX_MULTIPLIER, Math.max(100, Math.floor(100 * Math.exp(Math.max(0, elapsed) / GROWTH_MS))))
}
export type StartResult = WalletResult | { ok: false; reason: 'invalid-auto' | 'random-unavailable' }
export const isRoundActive = (phase: CrashPhase) => ['preparing', 'kick', 'flying'].includes(phase)

/** Pure scheduling/settlement owner. Animation callbacks never move money. */
export function createCrashEngine(wallet: DemoSessionStore, options: {
  now?: () => number; random?: RandomSource; id?: () => string
} = {}) {
  const now = options.now ?? (() => performance.now())
  const random = options.random ?? secureRandom
  const makeId = options.id ?? (() => crypto.randomUUID())
  const initial: CrashSnapshot = Object.freeze({ phase: 'ready', roundId: null, startedAt: 0,
    flightAt: 0, finishedAt: 0, multiplier: 100, stake: 0, auto: null, result: null, history: Object.freeze([]) })
  let snapshot = initial
  let crashPoint = 100, busy = false, lastTime = 0
  const usedIds = new Set<string>()
  const listeners = new Set<() => void>()
  const timestamp = () => { lastTime = Math.max(lastTime, now()); return lastTime }
  const publish = (patch: Partial<CrashSnapshot>) => {
    snapshot = Object.freeze({ ...snapshot, ...patch })
    listeners.forEach(listener => listener())
  }
  function finish(won: boolean, multiplier: number, at: number) {
    if (!isRoundActive(snapshot.phase) || !snapshot.roundId) return
    const { roundId, stake } = snapshot
    const payout = won ? payoutFor(stake, multiplier) : 0
    // Enter a terminal state before wallet notifications can re-enter the engine.
    snapshot = Object.freeze({ ...snapshot, phase: won ? 'cashed_out' : 'crashed' })
    const credited = !won || wallet.credit(payout, { gameId: ISLAND_CRASH.id, roundId }).ok
    wallet.releaseRound(roundId)
    // Start reserves balance/history headroom. A failed credit is never presented
    // as a successful payment (e.g. an externally tampered local store).
    const result = Object.freeze({ roundId, won: won && credited, multiplier, stake, payout: credited ? payout : 0 })
    publish({ phase: result.won ? 'cashed_out' : 'crashed', finishedAt: at, multiplier, result,
      history: Object.freeze([result, ...snapshot.history].slice(0, 12)) })
  }
  function advance(at: number) {
    if (isRoundActive(snapshot.phase)) {
      if (at < snapshot.startedAt + PREPARING_MS) return
      if (at < snapshot.flightAt) {
        if (snapshot.phase !== 'kick') publish({ phase: 'kick' })
        return
      }
      const elapsed = at - snapshot.flightAt
      // Compare event deadlines, not frame delivery order. Equality loses.
      if (snapshot.auto !== null && snapshot.auto < crashPoint && at >= snapshot.flightAt + timeToMultiplier(snapshot.auto)) {
        finish(true, snapshot.auto, at); return
      }
      if (at >= snapshot.flightAt + timeToMultiplier(crashPoint)) { finish(false, crashPoint, at); return }
      const multiplier = multiplierAt(elapsed)
      if (snapshot.phase !== 'flying' || multiplier !== snapshot.multiplier) publish({ phase: 'flying', multiplier })
    } else if (snapshot.result && snapshot.phase !== 'ready') {
      // A loss is already final. Presentation cannot credit or alter its frozen
      // multiplier; its only deadline is a short fall plus an impact beat.
      const lossMs = fallDurationMs(timeToMultiplier(snapshot.result.multiplier)) + IMPACT_BEAT_MS
      if (at >= snapshot.finishedAt + (snapshot.result.won ? RESULT_MS + SETTLED_MS : lossMs)) publish({ phase: 'ready', multiplier: 100 })
      else if (at >= snapshot.finishedAt + RESULT_MS && snapshot.phase !== 'settled') publish({ phase: 'settled' })
    }
  }
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initial,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    start(stake: number, auto: number | null = null): StartResult {
      if (busy || snapshot.phase !== 'ready') return { ok: false, reason: 'round-active' }
      busy = true
      try {
        wallet.hydrate()
        const { balance, sequence } = wallet.getSnapshot().session
        if (!Number.isSafeInteger(stake) || stake <= 0 || stake > MAX_CREDITS) return { ok: false, reason: 'invalid-amount' }
        if (stake > balance) return { ok: false, reason: 'insufficient-credits' }
        if (auto !== null && (!Number.isInteger(auto) || auto < 101 || auto > MAX_MULTIPLIER)) return { ok: false, reason: 'invalid-auto' }
        if (balance - stake + payoutFor(stake, MAX_MULTIPLIER) > MAX_CREDITS) return { ok: false, reason: 'balance-limit' }
        if (sequence > Number.MAX_SAFE_INTEGER - 2) return { ok: false, reason: 'history-limit' }
        let roundId: string, point: number
        try { point = generateCrashPoint(random); roundId = makeId() } catch { return { ok: false, reason: 'random-unavailable' } }
        if (usedIds.has(roundId) || !wallet.acquireRound(roundId)) return { ok: false, reason: 'round-active' }
        usedIds.add(roundId)
        const debit = wallet.debit(stake, { gameId: ISLAND_CRASH.id, roundId })
        if (!debit.ok) { wallet.releaseRound(roundId); return debit }
        crashPoint = point
        const startedAt = timestamp()
        publish({ phase: 'preparing', roundId, stake, auto, startedAt, flightAt: startedAt + PREPARING_MS + KICK_MS,
          multiplier: 100, finishedAt: 0, result: null })
        return { ok: true }
      } finally { busy = false }
    },
    tick() {
      if (busy) return
      busy = true
      try { advance(timestamp()) } finally { busy = false }
    },
    cashOut(roundId: string | null = snapshot.roundId): boolean {
      if (busy || !roundId || roundId !== snapshot.roundId || !isRoundActive(snapshot.phase)) return false
      busy = true
      try {
        const at = timestamp()
        advance(at)
        if (snapshot.phase !== 'flying') return false
        finish(true, snapshot.multiplier, at)
        return true
      } finally { busy = false }
    },
  }
}
export type CrashEngine = ReturnType<typeof createCrashEngine>
