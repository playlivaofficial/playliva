import { MAX_CREDIT_UNITS, isDemoIdentifier, type DemoSessionStore } from '../session'
import { LIVA_ROULETTE, ROULETTE_CHIPS, ROULETTE_LIMITS, ROULETTE_TIMING as timing, samplePocket, type RouletteRandom } from './config'
import { rouletteBet, settleRoulette, type BetPlacement, type RouletteSettlement } from './bets'
import { createOrbitPlan, type OrbitPlan } from './presentation'

export type RoulettePhase = 'betting' | 'closing' | 'spinning' | 'settling' | 'result' | 'error'
export interface RouletteSnapshot {
  readonly phase: RoulettePhase; readonly revision: number; readonly roundId: string | null
  readonly placements: readonly BetPlacement[]; readonly totalStake: number
  readonly previousBets: readonly BetPlacement[]; readonly result: RouletteSettlement | null
  readonly orbit: OrbitPlan | null; readonly spinStartedAt: number; readonly completed: number
  readonly error: string | null
}
export type RouletteResult = { ok: true } | { ok: false; reason: string }
const emptyBets: readonly BetPlacement[] = Object.freeze([])
const total = (bets: readonly BetPlacement[]) => bets.reduce((n, b) => n + b.amount, 0)
/** Owns a whole ticket. Placement/Undo/Clear are reservations only; Spin books
 * ONE aggregate debit, and the frozen ticket credits ONE aggregate return.
 * Animation cannot supply or change a result or trigger settlement. */
export function createRouletteEngine(wallet: DemoSessionStore, options: { now?: () => number; id?: () => string; random?: RouletteRandom } = {}) {
  const now = options.now ?? (() => performance.now()), makeId = options.id ?? (() => crypto.randomUUID())
  const initial: RouletteSnapshot = Object.freeze({ phase: 'betting', revision: 0, roundId: null, placements: emptyBets,
    totalStake: 0, previousBets: emptyBets, result: null, orbit: null, spinStartedAt: 0, completed: 0, error: null })
  let snapshot = initial, phase: RoulettePhase = 'betting', placements: BetPlacement[] = [], previousBets = emptyBets
  let revision = 0, roundId: string | null = null, result: RouletteSettlement | null = null, pending: RouletteSettlement | null = null
  let orbit: OrbitPlan | null = null, spinStartedAt = 0, resultUntil = 0, completed = 0, lastTime = 0
  let busy = false, settled = false, abandonRequested = false
  const listeners = new Set<() => void>(), ids = new Set<string>()
  const fail = (reason: string): RouletteResult => ({ ok: false, reason })
  const clock = () => { const at = now(); if (!Number.isFinite(at) || at < 0) throw new Error('Invalid clock'); return (lastTime = Math.max(lastTime, at)) }
  function publish(error: string | null = null) {
    snapshot = Object.freeze({ phase, revision, roundId, placements: Object.freeze([...placements]), previousBets,
      totalStake: total(placements), result, orbit, spinStartedAt, completed, error })
    listeners.forEach(fn => fn())
  }
  function abandon() {
    if (busy) { abandonRequested = true; return }
    if (!roundId || phase === 'betting') return
    wallet.releaseRound(roundId); settled = true; revision++; phase = 'betting'; roundId = null
    placements = []; result = null; pending = null; orbit = null; publish()
  }
  function unlock() { busy = false; if (abandonRequested) { abandonRequested = false; abandon() } }
  function edit(next: BetPlacement[]): RouletteResult {
    const stake = total(next)
    wallet.hydrate()
    if (!Number.isSafeInteger(stake) || stake > ROULETTE_LIMITS.maxStake || next.length > ROULETTE_LIMITS.maxPlacements) return fail('stake-limit')
    if (stake > wallet.getSnapshot().session.balance) return fail('insufficient-credits')
    placements = next; revision++; publish(); return { ok: true }
  }
  function canEdit() { return !busy && phase === 'betting' }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
    place(betId: string, amount: number): RouletteResult {
      if (!canEdit()) return fail('round-active')
      if (!rouletteBet(betId) || !ROULETTE_CHIPS.includes(amount)) return fail('invalid-bet')
      busy = true
      try { return edit([...placements, Object.freeze({ betId, amount })]) } finally { unlock() }
    },
    undo(): RouletteResult {
      if (!canEdit()) return fail('round-active')
      if (!placements.length) return fail('empty-bets')
      busy = true
      try { return edit(placements.slice(0, -1)) } finally { unlock() }
    },
    clear(): RouletteResult {
      if (!canEdit()) return fail('round-active')
      busy = true
      try { return edit([]) } finally { unlock() }
    },
    repeat(): RouletteResult {
      if (!canEdit()) return fail('round-active')
      if (placements.length || !previousBets.length) return fail('repeat-unavailable')
      busy = true
      try { return edit([...previousBets]) } finally { unlock() }
    },
    spin(expectedRevision: number): RouletteResult {
      if (busy || phase !== 'betting' || expectedRevision !== revision) return fail('round-active')
      if (!placements.length) return fail('empty-bets')
      busy = true
      try {
        wallet.hydrate()
        const { balance, sequence } = wallet.getSnapshot().session, stake = total(placements)
        if (stake > balance) return fail('insufficient-credits')
        if (sequence > Number.MAX_SAFE_INTEGER - 2) return fail('history-limit')
        let nextResult: RouletteSettlement, nextOrbit: OrbitPlan, id: string, at: number
        try {
          const maxReturn = Math.max(...Array.from({ length: 37 }, (_, n) => settleRoulette(placements, n).returned))
          if (balance - stake + maxReturn > MAX_CREDIT_UNITS) return fail('balance-limit')
          id = makeId(); at = clock()
          if (!isDemoIdentifier(id)) return fail('random-unavailable')
          const number = samplePocket(options.random)
          nextResult = settleRoulette(placements, number); nextOrbit = createOrbitPlan(number, orbit)
        } catch { return fail('random-unavailable') }
        if (ids.has(id) || !wallet.acquireRound(id)) return fail('round-active')
        const debit = wallet.debit(stake, { gameId: LIVA_ROULETTE.id, roundId: id })
        if (!debit.ok) { wallet.releaseRound(id); return debit }
        ids.add(id); roundId = id; pending = nextResult; result = null; orbit = nextOrbit; settled = false
        revision++; phase = 'closing'; spinStartedAt = at + timing.closingMs; publish(); return { ok: true }
      } finally { unlock() }
    },
    tick() {
      if (busy || phase === 'betting' || phase === 'error') return
      busy = true
      try {
        const at = clock()
        if (phase === 'closing' && at >= spinStartedAt) { phase = 'spinning'; publish() }
        if (phase === 'spinning' && at >= spinStartedAt + timing.spinMs) { phase = 'settling'; result = pending; publish() }
        if (phase === 'settling' && at >= spinStartedAt + timing.spinMs + timing.settlingMs && !settled && pending && roundId) {
          settled = true // before any wallet listener can reenter
          if (pending.returned && !wallet.credit(pending.returned, { gameId: LIVA_ROULETTE.id, roundId }).ok) {
            phase = 'error'; wallet.releaseRound(roundId); publish('settlement-failed'); return
          }
          previousBets = Object.freeze([...placements]); completed++; result = pending
          wallet.releaseRound(roundId); phase = 'result'; resultUntil = at + timing.resultMs; publish()
        }
        if (phase === 'result' && at >= resultUntil) { phase = 'betting'; placements = []; revision++; publish() }
      } catch { phase = 'error'; if (roundId) wallet.releaseRound(roundId); publish('round-unavailable') }
      finally { unlock() }
    },
    abandon,
  }
}
export type RouletteEngine = ReturnType<typeof createRouletteEngine>
