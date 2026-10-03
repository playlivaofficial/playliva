import { generateCrashPoint, multiplierAt, payoutFor, timeToMultiplier, type RandomSource } from '../crash/engine'
export { multiplierAt, payoutFor } from '../crash/engine'

export const COUNTDOWN_MS = 6500
export const RESULT_MS = 2800
export const MAX_STAKE = 5000
export type AviaPhase = 'betting' | 'flying' | 'result'
export interface AviaReceipt { sequence: number; kind: 'debit' | 'credit'; amount: number; roundId: string }
export interface AviaWager { stake: number; auto: number | null; status: 'active' | 'won' | 'lost'; multiplier: number; payout: number }
export interface AviaState {
  id: string; number: number; phase: AviaPhase; opensAt: number; flightAt: number; crashAt: number; point: number
  wager: AviaWager | null; sequence: number; receipts: AviaReceipt[]; history: { id: string; multiplier: number }[]
}
export type AviaAction = { type: 'state' } | { type: 'next'; roundId: string } |
  { type: 'bet'; roundId: string; stake: number; auto: number | null } | { type: 'cashout'; roundId: string }
export function newAviaRound(now: number, id: string, random?: RandomSource, previous?: AviaState): AviaState {
  const point = generateCrashPoint(random), flightAt = now + COUNTDOWN_MS
  return { id, number: (previous?.number ?? 0) + 1, phase: 'betting', opensAt: now, flightAt,
    crashAt: flightAt + timeToMultiplier(point), point, wager: null,
    sequence: previous?.sequence ?? 0, receipts: previous?.receipts ?? [], history: previous?.history ?? [] }
}
function receipt(state: AviaState, kind: AviaReceipt['kind'], amount: number) {
  state.receipts.push({ sequence: ++state.sequence, kind, amount, roundId: state.id })
  state.receipts = state.receipts.slice(-100)
}
function settle(state: AviaState, multiplier: number | null) {
  const wager = state.wager
  if (!wager || wager.status !== 'active') return
  wager.status = multiplier === null ? 'lost' : 'won'
  wager.multiplier = multiplier ?? state.point
  wager.payout = multiplier === null ? 0 : payoutFor(wager.stake, multiplier)
  if (wager.payout) receipt(state, 'credit', wager.payout)
}
/** Server calls this inside a durable compare-and-swap. Deadlines, not request ordering, decide races. */
export function advanceAvia(state: AviaState, now: number) {
  if (state.phase === 'result' || now < state.flightAt) return
  state.phase = 'flying'
  if (state.wager?.status === 'active' && state.wager.auto !== null && state.wager.auto < state.point &&
      now >= state.flightAt + timeToMultiplier(state.wager.auto)) settle(state, state.wager.auto)
  if (now >= state.crashAt) {
    settle(state, null)
    state.phase = 'result'
    state.history = [{ id: state.id, multiplier: state.point }, ...state.history].slice(0, 12)
  }
}
export function actAvia(state: AviaState, action: AviaAction, now: number): string | null {
  advanceAvia(state, now)
  if (action.type === 'state') return null
  if (action.roundId !== state.id) return 'stale-round'
  if (action.type === 'next') return state.phase === 'result' && now >= state.crashAt + RESULT_MS ? null : 'round-active'
  if (action.type === 'bet') {
    if (state.wager) return state.wager.stake === action.stake && state.wager.auto === action.auto ? null : 'already-bet'
    if (state.phase !== 'betting' || now >= state.flightAt) return 'betting-closed'
    if (!Number.isSafeInteger(action.stake) || action.stake < 100 || action.stake > MAX_STAKE) return 'invalid-stake'
    if (action.auto !== null && (!Number.isInteger(action.auto) || action.auto < 101 || action.auto > 10000)) return 'invalid-auto'
    state.wager = { stake: action.stake, auto: action.auto, status: 'active', multiplier: 100, payout: 0 }
    receipt(state, 'debit', action.stake)
    return null
  }
  if (!state.wager || state.wager.status === 'lost' || state.phase !== 'flying') return 'not-active'
  if (state.wager.status === 'won') return null
  settle(state, multiplierAt(now - state.flightAt))
  return null
}
/** Future point/deadline never enter the client response. */
export function publicAvia(state: AviaState, now: number) {
  return { id: state.id, number: state.number, phase: state.phase, flightAt: state.flightAt,
    serverAt: now, resultAt: state.phase === 'result' ? state.crashAt : null,
    multiplier: state.phase === 'result' ? state.point : state.phase === 'betting' ? 100 : multiplierAt(now - state.flightAt),
    wager: state.wager, sequence: state.sequence, receipts: state.receipts, history: state.history }
}
export type AviaSnapshot = ReturnType<typeof publicAvia>
