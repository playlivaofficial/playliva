import { MAX_CREDIT_UNITS, type DemoSessionStore, type WalletResult } from '../session'
import { CAPYBARA_GOLD } from './definition'
import { REELS, SLOT_CONFIG, type SlotConfig, type SlotSymbol } from './config'
import { preparedMath, slotSecureRandom, validateGrid, type SlotEvaluation, type SlotGrid, type SlotRandom } from './math'

/** Reel k stops at FIRST_STOP_MS + k × STOP_GAP_MS; the last stop (SPIN_MS) settles. */
export const SPIN_MS = 1400, FIRST_STOP_MS = 800, STOP_GAP_MS = 150
/** Once two Suns are visible on a paid spin, each remaining reel stops this far apart. */
export const ANTICIPATION_GAP_MS = 560
export const RESULT_MS = 400, BONUS_RESULT_MS = 700, BONUS_WIN_MS = 1200
/** Sun highlight beat + Jungle Gold Bonus intro before free spins start on their own. */
export const BONUS_INTRO_MS = 2200
export type SlotPhase = 'ready' | 'spinning' | 'result' | 'bonus-intro' | 'bonus-summary' | 'error'
export interface SlotResult { readonly id: string; readonly stake: number; readonly free: boolean; readonly grid: SlotGrid; readonly evaluation: SlotEvaluation }
export interface SlotSnapshot {
  readonly phase: SlotPhase; readonly seriesId: string | null; readonly spinAt: number; readonly revealAt: number
  readonly stake: number; readonly grid: SlotGrid; readonly result: SlotResult | null
  readonly bonusRemaining: number; readonly bonusMultiplier: number; readonly bonusTotal: number; readonly free: boolean
  /** Reels already showing this spin's symbols (REELS when idle/settled). */
  readonly stopped: number
  /** Two Suns are visible on a paid spin and later reels are still spinning. */
  readonly anticipation: boolean
  /** Free spins awarded in this bonus including retriggers; retriggered = extra spins won on the current free spin. */
  readonly bonusAwarded: number; readonly retriggered: number
  readonly completed: number; readonly error: string | null
}
export type SpinResult = WalletResult | { ok: false; reason: 'random-unavailable' | 'invalid-outcome' }
export const IDLE_GRID: SlotGrid = Object.freeze([
  Object.freeze(['coconut', 'flower', 'leaf', 'pearl'] as const), Object.freeze(['toucan', 'wild', 'emerald', 'acai'] as const),
  Object.freeze(['emerald', 'pearl', 'coconut', 'flower'] as const), Object.freeze(['acai', 'leaf', 'scatter', 'toucan'] as const),
  Object.freeze(['flower', 'coconut', 'pearl', 'emerald'] as const),
])

/** This engine alone owns money and bonus state. Reel/CSS callbacks are visual only.
 * Every outcome is fixed before its first reel moves. Reel stops, anticipation,
 * multiplier steps and retriggers are only a timed disclosure of that fixed
 * grid: each reel's symbols become visible at its own stop, the payout is
 * booked once when the last reel stops. Nothing here can alter an outcome.
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
    grid: IDLE_GRID, result: null, bonusRemaining: 0, bonusMultiplier: 1, bonusTotal: 0, free: false,
    stopped: REELS, anticipation: false, bonusAwarded: 0, retriggered: 0, completed: 0, error: null })
  let snapshot = initial, pending: SlotResult | null = null, busy = false, lastTime = 0, freeIndex = 0
  let stops: number[] = []
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
  function schedule(at: number) {
    stops = Array.from({ length: REELS }, (_, reel) => at + FIRST_STOP_MS + reel * STOP_GAP_MS)
    return stops[REELS - 1]
  }
  const count = (symbols: readonly SlotSymbol[], symbol: SlotSymbol) => symbols.filter(value => value === symbol).length
  /** Disclosure patch for one landed reel of the pending (already decided) grid. */
  function landReel(result: SlotResult, reel: number): Partial<SlotSnapshot> {
    const column = result.grid[reel]
    const patch: { -readonly [K in keyof SlotSnapshot]?: SlotSnapshot[K] } = { stopped: reel + 1,
      grid: Object.freeze(snapshot.grid.map((symbols, i) => i === reel ? column : symbols)) }
    if (result.free) {
      const wilds = count(column, 'wild'), suns = count(column, 'scatter')
      if (wilds) patch.bonusMultiplier = Math.min(config.maxBonusMultiplier, snapshot.bonusMultiplier + wilds * config.bonusStep)
      const extra = Math.min(suns * config.retriggerSpins, config.maxFreeSpins - snapshot.bonusAwarded)
      if (extra > 0) Object.assign(patch, { bonusRemaining: snapshot.bonusRemaining + extra,
        bonusAwarded: snapshot.bonusAwarded + extra, retriggered: snapshot.retriggered + extra })
    } else if (!snapshot.anticipation && reel < REELS - 1 &&
      count(result.grid.slice(0, reel + 1).flat(), 'scatter') >= config.scatterTrigger - 1) {
      // Reacts to Suns that already landed; the remaining symbols are already fixed.
      for (let next = reel + 1; next < REELS; next++) stops[next] = stops[next - 1] + ANTICIPATION_GAP_MS
      Object.assign(patch, { anticipation: true, revealAt: stops[REELS - 1] })
    }
    return patch
  }
  function startFree(at: number) {
    if (!snapshot.seriesId || snapshot.bonusRemaining <= 0) return
    let next: SlotResult
    try { next = outcome(snapshot.stake, true, `${snapshot.seriesId}-fs-${freeIndex + 1}`) }
    catch { publish({ phase: 'error', error: 'random-unavailable' }); return }
    freeIndex++; pending = next
    publish({ phase: 'spinning', free: true, spinAt: at, revealAt: schedule(at), error: null,
      stopped: 0, anticipation: false, retriggered: 0, bonusRemaining: snapshot.bonusRemaining - 1 })
  }
  function reveal() {
    if (!pending || !snapshot.seriesId) return
    const result = pending
    pending = null // lock BEFORE synchronous wallet subscriber callbacks
    const payout = result.evaluation.payout
    if (payout > 0 && !wallet.credit(payout, { gameId: CAPYBARA_GOLD.id, roundId: snapshot.seriesId }).ok) {
      wallet.releaseRound(snapshot.seriesId)
      publish({ phase: 'error', result: null, error: 'settlement-failed', bonusRemaining: 0, grid: result.grid, stopped: REELS, anticipation: false })
      return
    }
    const landed = landReel(result, REELS - 1)
    const awarded = result.free ? 0 : result.evaluation.awardedSpins
    const remaining = result.free ? landed.bonusRemaining ?? snapshot.bonusRemaining : awarded
    const terminal = !awarded && (!result.free || remaining === 0)
    if (terminal) wallet.releaseRound(snapshot.seriesId)
    publish({ ...landed, phase: awarded ? 'bonus-intro' : result.free && remaining === 0 ? 'bonus-summary' : 'result',
      grid: result.grid, result, completed: snapshot.completed + 1, revealAt: stops[REELS - 1],
      bonusRemaining: remaining, bonusAwarded: result.free ? landed.bonusAwarded ?? snapshot.bonusAwarded : awarded,
      bonusMultiplier: result.evaluation.bonusMultiplier,
      bonusTotal: result.free ? snapshot.bonusTotal + payout : 0 })
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
    spin(stake: number): SpinResult {
      // A finished bonus summary is settled and unlocked: Spin may dismiss it directly.
      if (busy || (snapshot.phase !== 'ready' && snapshot.phase !== 'bonus-summary')) return { ok: false, reason: 'round-active' }
      busy = true
      try {
        wallet.hydrate()
        const { balance, sequence } = wallet.getSnapshot().session
        if (!Number.isSafeInteger(stake) || stake < 100 || stake > 5000) return { ok: false, reason: 'invalid-amount' }
        if (stake > balance) return { ok: false, reason: 'insufficient-credits' }
        if (balance - stake + stake * config.maxWinMultiple * (config.maxFreeSpins + 1) > MAX_CREDIT_UNITS) return { ok: false, reason: 'balance-limit' }
        if (sequence > Number.MAX_SAFE_INTEGER - config.maxFreeSpins - 2) return { ok: false, reason: 'history-limit' }
        let id: string, result: SlotResult, at: number
        try { id = makeId(); at = timestamp(); result = outcome(stake, false, id) } catch { return { ok: false, reason: 'random-unavailable' } }
        if (usedIds.has(id) || !wallet.acquireRound(id)) return { ok: false, reason: 'round-active' }
        usedIds.add(id)
        const debit = wallet.debit(stake, { gameId: CAPYBARA_GOLD.id, roundId: id })
        if (!debit.ok) { wallet.releaseRound(id); return debit }
        pending = result; freeIndex = 0
        publish({ phase: 'spinning', seriesId: id, stake, spinAt: at, revealAt: schedule(at),
          stopped: 0, anticipation: false, bonusAwarded: 0, retriggered: 0,
          bonusRemaining: 0, bonusMultiplier: 1, bonusTotal: 0, free: false, error: null })
        return { ok: true }
      } finally { busy = false }
    },
    tick() {
      if (busy) return
      busy = true
      try {
        const at = timestamp()
        if (snapshot.phase === 'spinning') {
          // Catch up every overdue stop in order; a throttled tab settles once.
          while (pending && snapshot.phase === 'spinning' && at >= stops[snapshot.stopped]) {
            if (snapshot.stopped === REELS - 1) reveal()
            else publish(landReel(pending, snapshot.stopped))
          }
        }
        // At most one new free spin per tick; throttled tabs never skip a bonus.
        else if (snapshot.phase === 'result' && at >= snapshot.revealAt +
          (!snapshot.free ? RESULT_MS : snapshot.result?.evaluation.payout ? BONUS_WIN_MS : BONUS_RESULT_MS)) {
          if (snapshot.free && snapshot.bonusRemaining > 0) startFree(at)
          else publish({ phase: 'ready' })
        }
        else if (snapshot.phase === 'bonus-intro' && at >= snapshot.revealAt + BONUS_INTRO_MS) startFree(at)
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
