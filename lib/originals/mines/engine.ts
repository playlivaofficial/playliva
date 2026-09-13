import { MAX_CREDIT_UNITS, isDemoIdentifier, type DemoSessionStore } from '../session'
import { BOARD_SIZE, DEFAULT_MINES, LIVA_MINES, MINE_COUNTS, MINES_STAKES, MINES_TIMING, generateMines, type MinesRandom } from './config'
import { configuredMultiplier, minesPayout } from './math'

export type MinesPhase = 'ready' | 'active' | 'cashed_out' | 'mine_hit' | 'result' | 'error'
export type MinesAction = { ok: true } | { ok: false; reason: string }
export interface MinesResult { readonly kind: 'cashout' | 'mine'; readonly stake: number; readonly returned: number; readonly profit: number; readonly multiplier: number; readonly picks: number }
export interface MinesSnapshot {
  readonly phase: MinesPhase; readonly revision: number; readonly roundId: string | null
  readonly stake: number; readonly mineCount: number; readonly safe: readonly number[]
  readonly revealedMines: readonly number[]; readonly hit: number | null
  readonly multiplier: number; readonly potential: number; readonly result: MinesResult | null
  readonly completed: number; readonly error: string | null
}
const empty: readonly number[] = Object.freeze([])
/** The layout stays private while active. Rendering/animation never authorizes a payout. */
export function createMinesEngine(wallet: DemoSessionStore, options: { random?: MinesRandom; now?: () => number; id?: () => string } = {}) {
  const now = options.now ?? (() => performance.now()), id = options.id ?? (() => crypto.randomUUID())
  const initial: MinesSnapshot = Object.freeze({ phase: 'ready', revision: 0, roundId: null, stake: 0, mineCount: DEFAULT_MINES,
    safe: empty, revealedMines: empty, hit: null, multiplier: 1_000_000, potential: 0, result: null, completed: 0, error: null })
  let snapshot = initial, layout = empty, busy = false, settled = false, abandonRequested = false, endedAt = 0, lastTime = 0
  const listeners = new Set<() => void>(), usedIds = new Set<string>()
  const fail = (reason: string): MinesAction => ({ ok: false, reason })
  function clock() { const at = now(); if (!Number.isFinite(at) || at < 0) throw new Error('Invalid clock'); return (lastTime = Math.max(at, lastTime)) }
  function publish(patch: Partial<MinesSnapshot>) { snapshot = Object.freeze({ ...snapshot, ...patch, revision: snapshot.revision + 1 }); listeners.forEach(fn => fn()) }
  function abandon() {
    if (busy) { abandonRequested = true; return }
    if (snapshot.roundId) wallet.releaseRound(snapshot.roundId)
    layout = empty; settled = true
    publish({ ...initial, completed: snapshot.completed, revision: snapshot.revision })
  }
  function unlock() { busy = false; if (abandonRequested) { abandonRequested = false; abandon() } }
  function finish(kind: 'cashout' | 'mine', at: number): MinesAction {
    if (settled || !snapshot.roundId) return fail('round-inactive')
    const returned = kind === 'mine' ? 0 : minesPayout(snapshot.stake, snapshot.mineCount, snapshot.safe.length)
    const result = Object.freeze({ kind, stake: snapshot.stake, returned, profit: returned - snapshot.stake,
      multiplier: snapshot.multiplier, picks: snapshot.safe.length })
    settled = true // before wallet listeners can call back into Cash Out
    if (returned && !wallet.credit(returned, { gameId: LIVA_MINES.id, roundId: snapshot.roundId }).ok) {
      wallet.releaseRound(snapshot.roundId); publish({ phase: 'error', error: 'settlement-failed' }); return fail('settlement-failed')
    }
    wallet.releaseRound(snapshot.roundId); endedAt = at
    publish({ phase: kind === 'mine' ? 'mine_hit' : 'cashed_out', result, revealedMines: layout, completed: snapshot.completed + 1 })
    return { ok: true }
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
    start(stake: number, mineCount: number, revision: number): MinesAction {
      if (busy || snapshot.phase !== 'ready' || revision !== snapshot.revision) return fail('round-active')
      if (!MINES_STAKES.includes(stake) || !MINE_COUNTS.includes(mineCount)) return fail('invalid-stake')
      busy = true
      try {
        wallet.hydrate()
        const { balance, sequence } = wallet.getSnapshot().session
        if (stake > balance) return fail('insufficient-credits')
        if (sequence > Number.MAX_SAFE_INTEGER - 2) return fail('history-limit')
        if (balance - stake + minesPayout(stake, mineCount, BOARD_SIZE - mineCount) > MAX_CREDIT_UNITS) return fail('balance-limit')
        let roundId: string, nextLayout: readonly number[]
        try { clock(); roundId = id(); nextLayout = generateMines(mineCount, options.random) } catch { return fail('random-unavailable') }
        if (!isDemoIdentifier(roundId) || usedIds.has(roundId)) return fail('random-unavailable')
        if (!wallet.acquireRound(roundId)) return fail('round-active')
        const debit = wallet.debit(stake, { gameId: LIVA_MINES.id, roundId })
        if (!debit.ok) { wallet.releaseRound(roundId); return debit }
        usedIds.add(roundId); layout = nextLayout; settled = false
        publish({ phase: 'active', roundId, stake, mineCount, safe: empty, hit: null, revealedMines: empty,
          multiplier: 1_000_000, potential: 0, result: null, error: null })
        return { ok: true }
      } finally { unlock() }
    },
    pick(index: number, roundId: string | null): MinesAction {
      if (busy || snapshot.phase !== 'active' || !roundId || snapshot.roundId !== roundId) return fail('round-inactive')
      if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE || snapshot.safe.includes(index)) return fail('invalid-tile')
      busy = true
      try {
        const at = clock()
        if (layout.includes(index)) { publish({ hit: index }); return finish('mine', at) }
        const safe = Object.freeze([...snapshot.safe, index]), multiplier = configuredMultiplier(snapshot.mineCount, safe.length)
        publish({ safe, multiplier, potential: minesPayout(snapshot.stake, snapshot.mineCount, safe.length) })
        return safe.length === BOARD_SIZE - snapshot.mineCount ? finish('cashout', at) : { ok: true }
      } catch { if (snapshot.roundId) wallet.releaseRound(snapshot.roundId); settled = true; publish({ phase: 'error', error: 'round-unavailable' }); return fail('round-unavailable') }
      finally { unlock() }
    },
    cashOut(roundId: string | null): MinesAction {
      if (busy || snapshot.phase !== 'active' || !roundId || snapshot.roundId !== roundId) return fail('round-inactive')
      if (!snapshot.safe.length) return fail('pick-first')
      busy = true
      try { return finish('cashout', clock()) }
      catch { return fail('round-unavailable') }
      finally { unlock() }
    },
    tick() {
      if (busy || !['cashed_out', 'mine_hit', 'result'].includes(snapshot.phase)) return
      busy = true
      try {
        const elapsed = clock() - endedAt
        if (snapshot.phase !== 'result' && elapsed >= MINES_TIMING.impactMs) publish({ phase: 'result' })
        if (elapsed >= MINES_TIMING.readyMs) publish({ phase: 'ready' })
      } finally { unlock() }
    },
    abandon,
  }
}
export type MinesEngine = ReturnType<typeof createMinesEngine>
