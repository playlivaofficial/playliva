import { MAX_CREDIT_UNITS, type DemoSessionStore, type WalletResult } from '../session'
import { EMBAIXADINHA } from './definition'
import { DROP_MS, MAX_MULTIPLIER, PREPARING_MS, TOUCHES, failingTouch, failVariant, multiplierAt, timeToMultiplier, type FailVariant } from './juggle'
export { MAX_MULTIPLIER, PREPARING_MS, DROP_MS, multiplierAt, timeToMultiplier } from './juggle'

export type JugglePhase = 'ready' | 'preparing' | 'juggling' | 'dropped'
export type WagerPhase = 'none' | 'active' | 'cashed_out' | 'lost'
export interface JuggleResult { roundId: string; won: boolean; multiplier: number; stake: number; payout: number }
export interface JuggleSnapshot {
  phase: JugglePhase; roundId: string | null
  /** Start press and the flick (first touch): every touch time is relative to `flightAt`. */
  startedAt: number; flightAt: number
  /** The failing touch's exact scheduled time. 0 until that touch happens: never disclosed early. */
  crashAt: number
  /** Index of the failing touch and its presentation variant, revealed together with crashAt. */
  failTouch: number | null; variant: FailVariant | null
  multiplier: number; stake: number; auto: number | null
  wager: WagerPhase; result: JuggleResult | null; history: readonly JuggleResult[]
}
export interface RandomSource { uint32(): number }
export const secureRandom: RandomSource = { uint32: () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0] }

export function payoutFor(stake: number, multiplier: number): number {
  if (!Number.isSafeInteger(stake) || stake <= 0 || stake > MAX_CREDIT_UNITS ||
    !Number.isInteger(multiplier) || multiplier < 100 || multiplier > MAX_MULTIPLIER) throw new Error('Invalid payout inputs')
  return Number(BigInt(stake) * BigInt(multiplier) / BigInt(100))
}
export type StartResult = WalletResult | { ok: false; reason: 'invalid-auto' | 'random-unavailable' }
export const isRoundActive = (phase: JugglePhase) => phase !== 'ready'

/**
 * Pure scheduling/settlement owner. The failing touch is drawn at Start and
 * kept private; the renderer, HUD and audio only learn it from the snapshot
 * published at that touch's own deadline. Animation never moves money.
 */
export function createJuggleEngine(wallet: DemoSessionStore, options: {
  now?: () => number; random?: RandomSource; id?: () => string
} = {}) {
  const now = options.now ?? (() => performance.now())
  const random = options.random ?? secureRandom
  const makeId = options.id ?? (() => crypto.randomUUID())
  const initial: JuggleSnapshot = Object.freeze({ phase: 'ready', roundId: null, startedAt: 0, flightAt: 0, crashAt: 0,
    failTouch: null, variant: null, multiplier: 100, stake: 0, auto: null, wager: 'none', result: null, history: Object.freeze([]) })
  let snapshot = initial, failIndex = 0, busy = false, lastTime = 0
  const usedIds = new Set<string>(), listeners = new Set<() => void>()
  const timestamp = () => { const value = now(); if (!Number.isFinite(value)) throw new Error('Invalid clock'); return (lastTime = Math.max(lastTime, value)) }
  const publish = (patch: Partial<JuggleSnapshot>) => { snapshot = Object.freeze({ ...snapshot, ...patch }); listeners.forEach(listener => listener()) }
  function settleWager(won: boolean, multiplier: number) {
    if (snapshot.wager !== 'active' || !snapshot.roundId) return false
    const { roundId, stake } = snapshot
    const payout = won ? payoutFor(stake, multiplier) : 0
    // Lock BEFORE wallet notifications so a re-entrant cashout cannot pay twice.
    snapshot = Object.freeze({ ...snapshot, wager: won ? 'cashed_out' : 'lost' })
    const credited = !won || wallet.credit(payout, { gameId: EMBAIXADINHA.id, roundId }).ok
    const result = Object.freeze({ roundId, won: won && credited, multiplier, stake, payout: credited ? payout : 0 })
    publish({ wager: result.won ? 'cashed_out' : 'lost', result, history: Object.freeze([result, ...snapshot.history].slice(0, 12)) })
    return result.won
  }
  function advance(at: number) {
    if (snapshot.phase === 'preparing' || snapshot.phase === 'juggling') {
      if (at < snapshot.flightAt) return
      const crashAt = snapshot.flightAt + TOUCHES[failIndex].at
      // Compare event deadlines, not frame delivery order. Equality loses.
      if (snapshot.wager === 'active' && snapshot.auto !== null) {
        const autoAt = snapshot.flightAt + timeToMultiplier(snapshot.auto)
        if (autoAt < crashAt && at >= autoAt) settleWager(true, snapshot.auto)
      }
      if (at >= crashAt) {
        const multiplier = TOUCHES[failIndex].multiplier
        settleWager(false, multiplier)
        publish({ phase: 'dropped', crashAt, failTouch: failIndex, variant: failVariant(snapshot.roundId!, failIndex), multiplier })
        return
      }
      const multiplier = multiplierAt(at - snapshot.flightAt)
      if (snapshot.phase !== 'juggling' || multiplier !== snapshot.multiplier) publish({ phase: 'juggling', multiplier })
    } else if (snapshot.phase === 'dropped' && at >= snapshot.crashAt + DROP_MS) {
      wallet.releaseRound(snapshot.roundId!)
      publish({ phase: 'ready', wager: 'none', multiplier: 100 })
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
        if (!Number.isSafeInteger(stake) || stake <= 0 || stake > MAX_CREDIT_UNITS) return { ok: false, reason: 'invalid-amount' }
        if (stake > balance) return { ok: false, reason: 'insufficient-credits' }
        if (auto !== null && (!Number.isInteger(auto) || auto < 101 || auto > MAX_MULTIPLIER)) return { ok: false, reason: 'invalid-auto' }
        if (balance - stake + payoutFor(stake, MAX_MULTIPLIER) > MAX_CREDIT_UNITS) return { ok: false, reason: 'balance-limit' }
        if (sequence > Number.MAX_SAFE_INTEGER - 2) return { ok: false, reason: 'history-limit' }
        let roundId: string, fail: number, startedAt: number
        try { fail = failingTouch(random.uint32()); roundId = makeId(); startedAt = timestamp() } catch { return { ok: false, reason: 'random-unavailable' } }
        if (usedIds.has(roundId) || !wallet.acquireRound(roundId)) return { ok: false, reason: 'round-active' }
        usedIds.add(roundId)
        const debit = wallet.debit(stake, { gameId: EMBAIXADINHA.id, roundId })
        if (!debit.ok) { wallet.releaseRound(roundId); return debit }
        failIndex = fail
        publish({ phase: 'preparing', roundId, stake, auto, startedAt, flightAt: startedAt + PREPARING_MS, crashAt: 0,
          failTouch: null, variant: null, multiplier: 100, wager: 'active', result: null })
        return { ok: true }
      } finally { busy = false }
    },
    tick() {
      if (busy) return
      busy = true
      try { advance(timestamp()) } finally { busy = false }
    },
    cashOut(roundId: string | null = snapshot.roundId): boolean {
      if (busy || !roundId || roundId !== snapshot.roundId || snapshot.wager !== 'active') return false
      busy = true
      try {
        advance(timestamp())
        if (snapshot.phase !== 'juggling' || snapshot.wager !== 'active') return false
        return settleWager(true, snapshot.multiplier)
      } finally { busy = false }
    },
  }
}
export type JuggleEngine = ReturnType<typeof createJuggleEngine>
