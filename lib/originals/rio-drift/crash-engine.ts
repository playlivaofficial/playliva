import { MAX_CREDIT_UNITS, type DemoSessionStore, type WalletResult } from '../session'
import { generateCrashPoint, payoutFor, type RandomSource } from '../crash/engine'
import { RIO_DRIFT } from './definition'

export const LAUNCH_MS = 850
export const REACTION_MS = 1100
export const GROWTH_MS = 6000
export const MAX_MULTIPLIER = 2500
export const MAX_STAKE = 5000
export const timeToMultiplier = (value: number) => GROWTH_MS * Math.log(value / 100)
export const multiplierAt = (elapsed: number) => Math.min(MAX_MULTIPLIER, Math.max(100, Math.floor(100 * Math.exp(Math.max(0, elapsed) / GROWTH_MS))))
export { payoutFor }
export type TurboPhase = 'ready' | 'launch' | 'running' | 'crashed' | 'finished'
export interface TurboResult { roundId: string; won: boolean; multiplier: number; stake: number; payout: number }
export interface TurboSnapshot {
  phase: TurboPhase; roundId: string | null; startedAt: number; runningAt: number; finishedAt: number
  multiplier: number; stake: number; auto: number | null; wager: 'none' | 'active' | 'won' | 'lost'
  result: TurboResult | null; history: readonly { roundId: string; multiplier: number; capped: boolean }[]
}
export type TurboStartResult = WalletResult | { ok: false; reason: 'invalid-auto' | 'random-unavailable' }

/** Single-player virtual-credit crash. A monotonic clock owns outcomes, never canvas callbacks.
 * A sampled point >25x reaches the finish and auto-banks at 25x. Equality always crashes.
 * The future point is private to this closure; this local demo is not a fairness certification. */
export function createTurboEngine(wallet: DemoSessionStore, options: { now?: () => number; random?: RandomSource; id?: () => string } = {}) {
  const now = options.now ?? (() => performance.now()), id = options.id ?? (() => crypto.randomUUID())
  const initial: TurboSnapshot = Object.freeze({ phase: 'ready', roundId: null, startedAt: 0, runningAt: 0, finishedAt: 0,
    multiplier: 100, stake: 0, auto: null, wager: 'none', result: null, history: Object.freeze([]) })
  let snapshot = initial, point = 100, clock = 0, busy = false
  const used = new Set<string>(), listeners = new Set<() => void>()
  const timestamp = () => { const next = now(); if (Number.isFinite(next)) clock = Math.max(clock, next); return clock }
  const publish = (patch: Partial<TurboSnapshot>) => { snapshot = Object.freeze({ ...snapshot, ...patch }); listeners.forEach(fn => fn()) }
  function settle(won: boolean, multiplier: number) {
    if (snapshot.wager !== 'active' || !snapshot.roundId) return false
    const { roundId, stake } = snapshot, payout = won ? payoutFor(stake, multiplier) : 0
    snapshot = Object.freeze({ ...snapshot, wager: won ? 'won' : 'lost' })
    const credited = !won || wallet.credit(payout, { gameId: RIO_DRIFT.id, roundId }).ok
    const result = Object.freeze({ roundId, stake, multiplier, won: won && credited, payout: credited ? payout : 0 })
    publish({ wager: result.won ? 'won' : 'lost', result })
    return result.won
  }
  function advance(at: number) {
    if (snapshot.phase === 'launch' || snapshot.phase === 'running') {
      if (at < snapshot.runningAt) return
      if (snapshot.wager === 'active' && snapshot.auto !== null && snapshot.auto < point && at >= snapshot.runningAt + timeToMultiplier(snapshot.auto)) settle(true, snapshot.auto)
      const end = Math.min(point, MAX_MULTIPLIER)
      if (at >= snapshot.runningAt + timeToMultiplier(end)) {
        const capped = point > MAX_MULTIPLIER
        settle(capped, end)
        // Reaction starts when the deadline is observed, never before settlement.
        publish({ phase: capped ? 'finished' : 'crashed', finishedAt: at, multiplier: end,
          history: Object.freeze([Object.freeze({ roundId: snapshot.roundId!, multiplier: end, capped }), ...snapshot.history].slice(0, 12)) })
      } else {
        const multiplier = multiplierAt(at - snapshot.runningAt)
        if (snapshot.phase !== 'running' || multiplier !== snapshot.multiplier) publish({ phase: 'running', multiplier })
      }
    } else if ((snapshot.phase === 'crashed' || snapshot.phase === 'finished') && at >= snapshot.finishedAt + REACTION_MS) {
      wallet.releaseRound(snapshot.roundId!)
      publish({ phase: 'ready' })
    }
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
    start(stake: number, auto: number | null = null): TurboStartResult {
      if (busy || snapshot.phase !== 'ready') return { ok: false, reason: 'round-active' }
      busy = true
      try {
        wallet.hydrate()
        const { balance, sequence } = wallet.getSnapshot().session
        if (!Number.isSafeInteger(stake) || stake < 100 || stake > MAX_STAKE) return { ok: false, reason: 'invalid-amount' }
        if (stake > balance) return { ok: false, reason: 'insufficient-credits' }
        if (auto !== null && (!Number.isInteger(auto) || auto < 101 || auto > MAX_MULTIPLIER)) return { ok: false, reason: 'invalid-auto' }
        if (balance - stake + payoutFor(stake, MAX_MULTIPLIER) > MAX_CREDIT_UNITS) return { ok: false, reason: 'balance-limit' }
        if (sequence > Number.MAX_SAFE_INTEGER - 2) return { ok: false, reason: 'history-limit' }
        let roundId: string, sample: number
        try { roundId = id(); sample = generateCrashPoint(options.random) } catch { return { ok: false, reason: 'random-unavailable' } }
        if (used.has(roundId) || !wallet.acquireRound(roundId)) return { ok: false, reason: 'round-active' }
        const debit = wallet.debit(stake, { gameId: RIO_DRIFT.id, roundId })
        if (!debit.ok) { wallet.releaseRound(roundId); return debit }
        used.add(roundId); point = sample
        const startedAt = timestamp()
        publish({ phase: 'launch', roundId, startedAt, runningAt: startedAt + LAUNCH_MS, finishedAt: 0,
          multiplier: 100, stake, auto, wager: 'active', result: null })
        return { ok: true }
      } finally { busy = false }
    },
    tick() { if (busy) return; busy = true; try { advance(timestamp()) } finally { busy = false } },
    cashOut(roundId: string | null = snapshot.roundId) {
      if (busy || !roundId || roundId !== snapshot.roundId || snapshot.wager !== 'active') return false
      busy = true
      try { advance(timestamp()); return snapshot.phase === 'running' && snapshot.wager === 'active' ? settle(true, snapshot.multiplier) : false }
      finally { busy = false }
    },
  }
}
