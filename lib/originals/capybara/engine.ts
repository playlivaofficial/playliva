import { MAX_CREDIT_UNITS, type DemoSessionStore, type WalletResult } from '../session'
import { CAPYBARA_GOLD } from './definition'
import { SLOT_CONFIG, type SlotConfig } from './config'
import { preparedMath, slotSecureRandom, validateGrid, type SlotEvaluation, type SlotGrid, type SlotRandom } from './math'

export const SPIN_MS = 1400, RESULT_MS = 400, BONUS_RESULT_MS = 700
export type SlotPhase = 'ready' | 'spinning' | 'result' | 'bonus-intro' | 'bonus-summary' | 'error'
export interface SlotResult { readonly id: string; readonly stake: number; readonly free: boolean; readonly grid: SlotGrid; readonly evaluation: SlotEvaluation }
export interface SlotSnapshot {
  readonly phase: SlotPhase; readonly seriesId: string | null; readonly spinAt: number; readonly revealAt: number
  readonly stake: number; readonly grid: SlotGrid; readonly result: SlotResult | null
  readonly bonusRemaining: number; readonly bonusMultiplier: number; readonly bonusTotal: number; readonly free: boolean
  readonly completed: number; readonly error: string | null
}
export type SpinResult = WalletResult | { ok: false; reason: 'random-unavailable' | 'invalid-outcome' }
export const IDLE_GRID: SlotGrid = Object.freeze([
  Object.freeze(['coconut', 'flower', 'leaf', 'pearl'] as const), Object.freeze(['toucan', 'wild', 'emerald', 'acai'] as const),
  Object.freeze(['emerald', 'pearl', 'coconut', 'flower'] as const), Object.freeze(['acai', 'leaf', 'scatter', 'toucan'] as const),
  Object.freeze(['flower', 'coconut', 'pearl', 'emerald'] as const),
])

/** This engine alone owns money and bonus state. Reel/CSS callbacks are visual only.
 * A reload does not restore pending spins/free spins or refund a spent stake. */
export function createSlotEngine(wallet: DemoSessionStore, options: {
  now?: () => number; random?: SlotRandom; id?: () => string; config?: SlotConfig
  /** Dependency injection for deterministic local/DOM QA, never a public control. */
  draw?: (random: SlotRandom, bonus: boolean) => SlotGrid
} = {}) {
  const now = options.now ?? (() => performance.now()), random = options.random ?? slotSecureRandom
  const config = options.config ?? SLOT_CONFIG, math = preparedMath(config), draw = options.draw ?? math.draw
  const makeId = options.id ?? (() => crypto.randomUUID())
  const initial: SlotSnapshot = Object.freeze({ phase: 'ready', seriesId: null, spinAt: 0, revealAt: 0, stake: 100,
    grid: IDLE_GRID, result: null, bonusRemaining: 0, bonusMultiplier: 1, bonusTotal: 0, free: false, completed: 0, error: null })
  let snapshot = initial, pending: SlotResult | null = null, busy = false, lastTime = 0, freeIndex = 0
  const usedIds = new Set<string>(), listeners = new Set<() => void>()
  const publish = (patch: Partial<SlotSnapshot>) => { snapshot = Object.freeze({ ...snapshot, ...patch }); listeners.forEach(fn => fn()) }
  const timestamp = () => {
    const value = now()
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid clock')
    return (lastTime = Math.max(lastTime, value))
  }
  function outcome(stake: number, free: boolean, id: string): SlotResult {
    const raw = draw(random, free)
    validateGrid(raw)
    const grid = Object.freeze(raw.map(reel => Object.freeze([...reel])))
    return Object.freeze({ id, stake, free, grid, evaluation: math.evaluate(grid, stake, free ? snapshot.bonusMultiplier : null) })
  }
  function startFree(at: number) {
    if (!snapshot.seriesId || snapshot.bonusRemaining <= 0) return
    let next: SlotResult
    try { next = outcome(snapshot.stake, true, `${snapshot.seriesId}-fs-${freeIndex + 1}`) }
    catch { publish({ phase: 'error', error: 'random-unavailable' }); return }
    freeIndex++; pending = next
    publish({ phase: 'spinning', free: true, spinAt: at, revealAt: at + SPIN_MS, error: null,
      bonusRemaining: snapshot.bonusRemaining - 1 })
  }
  function reveal() {
    if (!pending || !snapshot.seriesId) return
    const result = pending
    pending = null // lock BEFORE synchronous wallet subscriber callbacks
    const payout = result.evaluation.payout
    if (payout > 0 && !wallet.credit(payout, { gameId: CAPYBARA_GOLD.id, roundId: snapshot.seriesId }).ok) {
      wallet.releaseRound(snapshot.seriesId)
      publish({ phase: 'error', result: null, error: 'settlement-failed', bonusRemaining: 0 })
      return
    }
    const awarded = result.evaluation.awardedSpins
    const terminal = !awarded && (!result.free || snapshot.bonusRemaining === 0)
    if (terminal) wallet.releaseRound(snapshot.seriesId)
    publish({ phase: awarded ? 'bonus-intro' : result.free && snapshot.bonusRemaining === 0 ? 'bonus-summary' : 'result',
      grid: result.grid, result, completed: snapshot.completed + 1,
      bonusRemaining: awarded || snapshot.bonusRemaining,
      bonusMultiplier: result.evaluation.bonusMultiplier,
      bonusTotal: result.free ? snapshot.bonusTotal + payout : 0 })
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
    spin(stake: number): SpinResult {
      if (busy || snapshot.phase !== 'ready') return { ok: false, reason: 'round-active' }
      busy = true
      try {
        wallet.hydrate()
        const { balance, sequence } = wallet.getSnapshot().session
        if (!Number.isSafeInteger(stake) || stake < 100 || stake > 5000) return { ok: false, reason: 'invalid-amount' }
        if (stake > balance) return { ok: false, reason: 'insufficient-credits' }
        if (balance - stake + stake * config.maxWinMultiple * (config.freeSpins + 1) > MAX_CREDIT_UNITS) return { ok: false, reason: 'balance-limit' }
        if (sequence > Number.MAX_SAFE_INTEGER - config.freeSpins - 2) return { ok: false, reason: 'history-limit' }
        let id: string, result: SlotResult, at: number
        try { id = makeId(); at = timestamp(); result = outcome(stake, false, id) } catch { return { ok: false, reason: 'random-unavailable' } }
        if (usedIds.has(id) || !wallet.acquireRound(id)) return { ok: false, reason: 'round-active' }
        usedIds.add(id)
        const debit = wallet.debit(stake, { gameId: CAPYBARA_GOLD.id, roundId: id })
        if (!debit.ok) { wallet.releaseRound(id); return debit }
        pending = result; freeIndex = 0
        publish({ phase: 'spinning', seriesId: id, stake, spinAt: at, revealAt: at + SPIN_MS,
          bonusRemaining: 0, bonusMultiplier: 1, bonusTotal: 0, free: false, error: null })
        return { ok: true }
      } finally { busy = false }
    },
    tick() {
      if (busy) return
      busy = true
      try {
        const at = timestamp()
        if (snapshot.phase === 'spinning' && at >= snapshot.revealAt) reveal()
        // At most one new free spin per tick; throttled tabs never skip a bonus.
        else if (snapshot.phase === 'result' && at >= snapshot.revealAt + (snapshot.free ? BONUS_RESULT_MS : RESULT_MS)) {
          if (snapshot.free && snapshot.bonusRemaining > 0) startFree(at)
          else publish({ phase: 'ready' })
        }
      } finally { busy = false }
    },
    continueBonus() {
      if (busy || !['bonus-intro', 'bonus-summary', 'error'].includes(snapshot.phase)) return false
      busy = true
      try {
        if (snapshot.phase === 'bonus-intro' || (snapshot.phase === 'error' && snapshot.bonusRemaining > 0)) startFree(timestamp())
        else publish({ phase: 'ready', bonusRemaining: 0, free: false, error: null })
        return true
      } finally { busy = false }
    },
  }
}
export type SlotEngine = ReturnType<typeof createSlotEngine>
