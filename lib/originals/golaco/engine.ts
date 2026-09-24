import { MAX_CREDIT_UNITS, type DemoSessionStore, type WalletResult } from '../session'
import { GOLACO } from './definition'
import { GOLACO_CONFIG, REELS, type GolacoConfig, type GolacoSymbol } from './config'
import { preparedMath, secureRandom, validateGrid, type GolacoEvaluation, type GolacoGrid, type SlotRandom } from './math'

/** Reel k stops at FIRST_STOP_MS + k × STOP_GAP_MS; the last stop (SPIN_MS) settles. */
export const SPIN_MS = 1300, FIRST_STOP_MS = 700, STOP_GAP_MS = 150
/** Once two trophies are visible on a paid spin, each remaining reel stops this far apart. */
export const ANTICIPATION_GAP_MS = 620
export const RESULT_MS = 400, BONUS_RESULT_MS = 650, BONUS_WIN_MS = 1150
/** Trophy highlight + Final de Ouro intro before free spins start on their own. */
export const BONUS_INTRO_MS = 2100

export type GolacoPhase = 'ready' | 'spinning' | 'result' | 'bonus-intro' | 'bonus-summary' | 'error'
export interface GolacoResult { readonly id: string; readonly stake: number; readonly free: boolean; readonly grid: GolacoGrid; readonly evaluation: GolacoEvaluation }
export interface GolacoSnapshot {
  readonly phase: GolacoPhase; readonly seriesId: string | null; readonly spinAt: number; readonly revealAt: number
  readonly stake: number; readonly grid: GolacoGrid; readonly result: GolacoResult | null
  readonly bonusRemaining: number; readonly bonusAwarded: number; readonly streak: number; readonly bonusTotal: number
  /** Extra free spins won on the current free spin so far. */
  readonly retriggered: number
  readonly free: boolean
  /** Reels already showing this spin's symbols (REELS when idle/settled). */
  readonly stopped: number
  /** Two trophies are visible on a paid spin while later reels still spin. */
  readonly anticipation: boolean
  readonly completed: number; readonly error: string | null
}
export type SpinResult = WalletResult | { ok: false; reason: 'random-unavailable' | 'invalid-outcome' }
export const IDLE_GRID: GolacoGrid = Object.freeze([
  Object.freeze(['cone', 'chuteira', 'bandeira'] as const), Object.freeze(['luvas', 'camisa', 'refletor'] as const),
  Object.freeze(['apito', 'taca', 'cartoes'] as const), Object.freeze(['medalha', 'bandeira', 'luvas'] as const),
  Object.freeze(['refletor', 'cone', 'chuteira'] as const),
])

/**
 * This engine alone owns money and bonus state. Each outcome is fixed before
 * its first reel moves; reel stops, trophy anticipation, Goal Streak steps and
 * retriggers are only a timed disclosure of that fixed grid. The payout is
 * booked once, when the last reel stops. Reload never resumes or refunds.
 */
export function createGolacoEngine(wallet: DemoSessionStore, options: {
  now?: () => number; random?: SlotRandom; id?: () => string; config?: GolacoConfig
  /** Dependency injection for deterministic local/DOM QA, never a public control. */
  draw?: (random: SlotRandom, bonus: boolean) => GolacoGrid
} = {}) {
  const now = options.now ?? (() => performance.now()), random = options.random ?? secureRandom
  const config = options.config ?? GOLACO_CONFIG, math = preparedMath(config), draw = options.draw ?? math.draw
  const makeId = options.id ?? (() => crypto.randomUUID())
  const initial: GolacoSnapshot = Object.freeze({ phase: 'ready', seriesId: null, spinAt: 0, revealAt: 0, stake: 100,
    grid: IDLE_GRID, result: null, bonusRemaining: 0, bonusAwarded: 0, streak: 1, bonusTotal: 0, retriggered: 0, free: false,
    stopped: REELS, anticipation: false, completed: 0, error: null })
  let snapshot = initial, pending: GolacoResult | null = null, busy = false, lastTime = 0, freeIndex = 0
  let stops: number[] = []
  const usedIds = new Set<string>(), listeners = new Set<() => void>()
  const publish = (patch: Partial<GolacoSnapshot>) => { snapshot = Object.freeze({ ...snapshot, ...patch }); listeners.forEach(fn => fn()) }
  const timestamp = () => {
    const value = now()
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid clock')
    return (lastTime = Math.max(lastTime, value))
  }
  function outcome(stake: number, free: boolean, id: string): GolacoResult {
    const raw = draw(random, free)
    validateGrid(raw)
    const grid = Object.freeze(raw.map(reel => Object.freeze([...reel])))
    return Object.freeze({ id, stake, free, grid, evaluation: math.evaluate(grid, stake, free ? snapshot.streak : null) })
  }
  function schedule(at: number) {
    stops = Array.from({ length: REELS }, (_, reel) => at + FIRST_STOP_MS + reel * STOP_GAP_MS)
    return stops[REELS - 1]
  }
  const count = (symbols: readonly GolacoSymbol[], symbol: GolacoSymbol) => symbols.filter(value => value === symbol).length
  /** Disclosure patch for one landed reel of the pending (already decided) grid. */
  function landReel(result: GolacoResult, reel: number): Partial<GolacoSnapshot> {
    const column = result.grid[reel]
    const patch: { -readonly [K in keyof GolacoSnapshot]?: GolacoSnapshot[K] } = { stopped: reel + 1,
      grid: Object.freeze(snapshot.grid.map((symbols, i) => i === reel ? column : symbols)) }
    if (result.free) {
      const goals = count(column, 'gol'), trophies = count(column, 'taca')
      if (goals) patch.streak = Math.min(config.maxStreak, snapshot.streak + goals)
      const extra = Math.min(trophies * config.retriggerSpins, config.maxFreeSpins - snapshot.bonusAwarded)
      if (extra > 0) Object.assign(patch, { bonusRemaining: snapshot.bonusRemaining + extra,
        bonusAwarded: snapshot.bonusAwarded + extra, retriggered: snapshot.retriggered + extra })
    } else if (!snapshot.anticipation && reel < REELS - 1 &&
      count(result.grid.slice(0, reel + 1).flat(), 'taca') >= config.scatterTrigger - 1) {
      // Reacts to trophies that already landed; the remaining symbols are already fixed.
      for (let next = reel + 1; next < REELS; next++) stops[next] = stops[next - 1] + ANTICIPATION_GAP_MS
      Object.assign(patch, { anticipation: true, revealAt: stops[REELS - 1] })
    }
    return patch
  }
  function startFree(at: number) {
    if (!snapshot.seriesId || snapshot.bonusRemaining <= 0) return
    let next: GolacoResult
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
    if (payout > 0 && !wallet.credit(payout, { gameId: GOLACO.id, roundId: snapshot.seriesId }).ok) {
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
      streak: result.evaluation.streak, bonusTotal: result.free ? snapshot.bonusTotal + payout : 0 })
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
        let id: string, result: GolacoResult, at: number
        try { id = makeId(); at = timestamp(); result = outcome(stake, false, id) } catch { return { ok: false, reason: 'random-unavailable' } }
        if (usedIds.has(id) || !wallet.acquireRound(id)) return { ok: false, reason: 'round-active' }
        usedIds.add(id)
        const debit = wallet.debit(stake, { gameId: GOLACO.id, roundId: id })
        if (!debit.ok) { wallet.releaseRound(id); return debit }
        pending = result; freeIndex = 0
        publish({ phase: 'spinning', seriesId: id, stake, spinAt: at, revealAt: schedule(at),
          stopped: 0, anticipation: false, bonusAwarded: 0, retriggered: 0,
          bonusRemaining: 0, streak: 1, bonusTotal: 0, free: false, error: null })
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
export type GolacoEngine = ReturnType<typeof createGolacoEngine>
