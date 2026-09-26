import { MAX_CREDIT_UNITS, type DemoSessionStore, type WalletResult } from '../session'
import { SAMBA_DROP } from '../three-game-definitions'
import { bucketFor, configuration, drawPath, dropDuration, payoutFor, secureRandom, type RandomSource, type Risk, type Rows } from './math'
export interface DropResult { id: string; bucket: number; multiplier: number; payout: number; stake: number }
export interface DropSnapshot { phase: 'ready' | 'dropping' | 'landed' | 'error'; id: string | null; startedAt: number; landsAt: number; rows: Rows; risk: Risk; path: readonly number[]; result: DropResult | null; history: readonly DropResult[] }
export function createDropEngine(wallet: DemoSessionStore, options: { now?: () => number; random?: RandomSource; id?: () => string } = {}) {
  const now = options.now ?? (() => performance.now()), random = options.random ?? secureRandom
  const initial: DropSnapshot = Object.freeze({ phase: 'ready', id: null, startedAt: 0, landsAt: 0, rows: 12, risk: 'medium', path: [], result: null, history: [] })
  let snapshot = initial, pending: DropResult | null = null, busy = false, last = 0
  const used = new Set<string>(), listeners = new Set<() => void>()
  const publish = (patch: Partial<DropSnapshot>) => { snapshot = Object.freeze({ ...snapshot, ...patch }); listeners.forEach(fn => fn()) }
  const time = () => { const at = now(); if (!Number.isFinite(at) || at < 0) throw Error('Invalid clock'); return last = Math.max(last, at) }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
    start(stake: number, rows: Rows, risk: Risk): WalletResult {
      if (busy || snapshot.phase !== 'ready') return { ok: false, reason: 'round-active' }
      busy = true
      try {
        wallet.hydrate()
        if (!Number.isSafeInteger(stake) || stake < 100 || stake > 5000) return { ok: false, reason: 'invalid-amount' }
        const config = configuration(rows, risk), state = wallet.getSnapshot().session
        if (stake > state.balance) return { ok: false, reason: 'insufficient-credits' }
        if (state.balance - stake + payoutFor(stake, Math.max(...config.multipliers)) > MAX_CREDIT_UNITS) return { ok: false, reason: 'balance-limit' }
        if (state.sequence > Number.MAX_SAFE_INTEGER - 2) return { ok: false, reason: 'history-limit' }
        const path = drawPath(rows, random), bucket = bucketFor(path), at = time(), id = options.id?.() ?? crypto.randomUUID()
        if (used.has(id) || !wallet.acquireRound(id)) return { ok: false, reason: 'round-active' }
        const debit = wallet.debit(stake, { gameId: SAMBA_DROP.id, roundId: id })
        if (!debit.ok) { wallet.releaseRound(id); return debit }
        used.add(id); pending = Object.freeze({ id, bucket, multiplier: config.multipliers[bucket], payout: payoutFor(stake, config.multipliers[bucket]), stake })
        publish({ phase: 'dropping', id, startedAt: at, landsAt: at + dropDuration(rows), rows, risk, path, result: null })
        return { ok: true }
      } finally { busy = false }
    },
    tick() {
      if (busy) return
      busy = true
      try {
        const at = time()
        if (snapshot.phase === 'dropping' && at >= snapshot.landsAt && pending) {
          const result = pending; pending = null
          const ok = result.payout === 0 || wallet.credit(result.payout, { gameId: SAMBA_DROP.id, roundId: result.id }).ok
          publish({ phase: ok ? 'landed' : 'error', result: ok ? result : null, history: ok ? Object.freeze([result, ...snapshot.history].slice(0, 12)) : snapshot.history })
          if (!ok) wallet.releaseRound(result.id)
        } else if (snapshot.phase === 'landed' && at >= snapshot.landsAt + 650) {
          wallet.releaseRound(snapshot.id!); publish({ phase: 'ready' })
        }
      } finally { busy = false }
    },
  }
}
export type DropEngine = ReturnType<typeof createDropEngine>
