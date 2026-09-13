import { MAX_CREDIT_UNITS, type DemoSessionStore } from '../session'
import { LIVA_BLACKJACK } from './definition'
import { BLACKJACK_RULES, BLACKJACK_STAKES, DEAL_CARD_MS, ACTION_MS, DEALER_CARD_MS, RESULT_MS, validateRules, type BlackjackRules } from './config'
import { createShoe, handValue, isPair, dealerShouldHit, type Card, type CardRandom, type Shoe } from './cards'
import { settleHand, type HandSettlement } from './settlement'

export type BlackjackPhase = 'ready' | 'dealing' | 'player_turn' | 'dealer_turn' | 'settling' | 'result' | 'error'
export type BlackjackAction = 'hit' | 'stand' | 'double' | 'split'
export interface PlayerHand {
  readonly id: number; readonly cards: readonly Card[]; readonly stake: number
  readonly fromSplit: boolean; readonly splitAce: boolean; readonly doubled: boolean
  readonly state: 'playing' | 'stood' | 'bust'; readonly result: HandSettlement | null
}
export interface BlackjackSnapshot {
  readonly phase: BlackjackPhase; readonly roundId: string | null; readonly revision: number
  readonly hands: readonly PlayerHand[]; readonly dealer: readonly (Card | null)[]
  readonly activeHand: number; readonly dealerRevealed: boolean; readonly totalStake: number
  readonly totalReturn: number; readonly completed: number; readonly actions: Readonly<Record<BlackjackAction, boolean>>
  readonly error: string | null
}
type MutableHand = Omit<PlayerHand, 'cards'> & { cards: Card[] }
export type BlackjackResult = { ok: true } | { ok: false; reason: string }
const NO_ACTIONS = Object.freeze({ hit: false, stand: false, double: false, split: false })

/** Owns the local shoe, all wagers and the entire round. No UI/CSS callback
 * determines a card or settles credits. Hole/future cards never enter snapshots.
 * Revision tokens + timed action locks reject duplicate/stale button callbacks. */
export function createBlackjackEngine(wallet: DemoSessionStore, options: {
  now?: () => number; id?: () => string; random?: CardRandom; rules?: BlackjackRules
  /** Isolated test harness only; no URL/storage outcome overrides. */
  shoe?: Shoe
} = {}) {
  const rules = options.rules ?? BLACKJACK_RULES
  validateRules(rules)
  const shoe = options.shoe ?? createShoe(options.random, rules)
  const now = options.now ?? (() => performance.now()), makeId = options.id ?? (() => crypto.randomUUID())
  const initial: BlackjackSnapshot = Object.freeze({ phase: 'ready', roundId: null, revision: 0,
    hands: Object.freeze([]), dealer: Object.freeze([]), activeHand: 0, dealerRevealed: false,
    totalStake: 0, totalReturn: 0, completed: 0, actions: NO_ACTIONS, error: null })
  let snapshot = initial, hands: MutableHand[] = [], dealer: Card[] = [], phase: BlackjackPhase = 'ready'
  let roundId: string | null = null, revision = 0, active = 0, shown = 0, revealed = false
  let deadline = 0, actionAt = 0, lastTime = 0, nextHand = 1, settled = false, busy = false
  const ids = new Set<string>(), listeners = new Set<() => void>()
  const clock = () => {
    const value = now()
    if (!Number.isFinite(value) || value < 0) throw new Error('Invalid clock')
    return (lastTime = Math.max(lastTime, value))
  }
  const legal = (at: number) => {
    const hand = hands[active]
    if (phase !== 'player_turn' || at < actionAt || !hand || hand.state !== 'playing') return NO_ACTIONS
    const funded = wallet.getSnapshot().session.balance >= hand.stake
    return Object.freeze({ hit: true, stand: true,
      double: funded && hand.cards.length === 2 && !hand.splitAce && (!hand.fromSplit || rules.doubleAfterSplit),
      split: funded && hands.length < rules.maxHands && !hand.splitAce && isPair(hand.cards, rules) })
  }
  function publish(at: number, error: string | null = null) {
    const visibleDealer: (Card | null)[] = phase === 'dealing' ? (shown < 2 ? [] : shown < 4 ? [dealer[0]] : [dealer[0], null]) :
      revealed ? dealer : dealer.length ? [dealer[0], null] : []
    snapshot = Object.freeze({ phase, roundId, revision, activeHand: active, dealerRevealed: revealed,
      hands: Object.freeze(hands.map(h => Object.freeze({ ...h, cards: Object.freeze(phase === 'dealing' ? h.cards.slice(0, shown < 1 ? 0 : shown < 3 ? 1 : 2) : [...h.cards]) }))),
      dealer: Object.freeze([...visibleDealer]), totalStake: hands.reduce((sum, h) => sum + h.stake, 0),
      totalReturn: hands.reduce((sum, h) => sum + (h.result?.returned ?? 0), 0),
      completed: snapshot.completed + (phase === 'result' && snapshot.phase !== 'result' ? 1 : 0), actions: legal(at), error })
    listeners.forEach(fn => fn())
  }
  function next(at: number) {
    const unresolved = hands.findIndex(h => h.state === 'playing')
    if (unresolved >= 0) { active = unresolved; actionAt = at + ACTION_MS }
    else { phase = 'dealer_turn'; deadline = at + ACTION_MS }
  }
  function settle(at: number) {
    if (settled || !roundId) return
    settled = true // BEFORE any synchronous wallet subscriber or duplicate tick
    const results = hands.map(h => settleHand(h.cards, dealer, h.stake, h.fromSplit, rules))
    for (let i = 0; i < hands.length; i++) {
      const result = results[i]
      if (result.returned && !wallet.credit(result.returned, { gameId: LIVA_BLACKJACK.id, roundId }).ok) {
        phase = 'error'; wallet.releaseRound(roundId); publish(at, 'settlement-failed'); return
      }
      hands[i] = { ...hands[i], result }
    }
    wallet.releaseRound(roundId); phase = 'result'; deadline = at + RESULT_MS; publish(at)
  }
  const fail = (reason: string): BlackjackResult => ({ ok: false, reason })
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } },
    deal(stake: number): BlackjackResult {
      if (busy || phase !== 'ready') return fail('round-active')
      busy = true
      try {
        wallet.hydrate()
        const { balance, sequence } = wallet.getSnapshot().session
        if (!BLACKJACK_STAKES.includes(stake)) return fail('invalid-amount')
        if (stake > balance) return fail('insufficient-credits')
        // Reserve for three doubled hands and each debit/credit before locking.
        const maxReturn = Math.max(4 * rules.maxHands, 1 + rules.blackjackProfit[0] / rules.blackjackProfit[1])
        if (balance + Math.ceil(stake * maxReturn) > MAX_CREDIT_UNITS) return fail('balance-limit')
        if (sequence > Number.MAX_SAFE_INTEGER - rules.maxHands * 3) return fail('history-limit')
        let id: string, at: number, cards: Card[]
        try { id = makeId(); at = clock() } catch { return fail('random-unavailable') }
        if (ids.has(id) || !wallet.acquireRound(id)) return fail('round-active')
        try { shoe.beginRound(); cards = Array.from({ length: 4 }, () => shoe.draw()) }
        catch { wallet.releaseRound(id); return fail('random-unavailable') }
        const debit = wallet.debit(stake, { gameId: LIVA_BLACKJACK.id, roundId: id })
        if (!debit.ok) { wallet.releaseRound(id); return debit }
        ids.add(id); roundId = id; revision++; active = 0; shown = 0; revealed = false; nextHand = 1; settled = false
        hands = [{ id: 0, cards: [cards[0], cards[2]], stake, fromSplit: false, splitAce: false, doubled: false, state: 'playing', result: null }]
        dealer = [cards[1], cards[3]]; phase = 'dealing'; deadline = at + 60
        publish(at); return { ok: true }
      } finally { busy = false }
    },
    act(action: BlackjackAction, expectedRevision: number): BlackjackResult {
      if (busy || phase !== 'player_turn' || expectedRevision !== revision) return fail('stale-action')
      busy = true
      try {
        const at = clock()
        if (!legal(at)[action]) return fail('illegal-action')
        const hand = hands[active]
        let cards: Card[] = []
        try { if (action !== 'stand') cards = Array.from({ length: action === 'split' ? 2 : 1 }, () => shoe.draw()) }
        catch { phase = 'error'; if (roundId) wallet.releaseRound(roundId); publish(at, 'shoe-unavailable'); return fail('shoe-unavailable') }
        if (action === 'double' || action === 'split') {
          const debit = wallet.debit(hand.stake, { gameId: LIVA_BLACKJACK.id, roundId: roundId! })
          if (!debit.ok) return debit
        }
        revision++
        if (action === 'split') {
          const ace = hand.cards[0].rank === 'A'
          const splitHands = hand.cards.map((card, index): MutableHand => {
            const pair = [card, cards[index]]
            return { id: index ? nextHand++ : hand.id, cards: pair, stake: hand.stake, fromSplit: true,
              splitAce: ace, doubled: false, state: ace || handValue(pair).total === 21 ? 'stood' : 'playing', result: null }
          })
          hands.splice(active, 1, ...splitHands)
        } else if (action === 'stand') hands[active] = { ...hand, state: 'stood' }
        else {
          const nextCards = [...hand.cards, ...cards], value = handValue(nextCards)
          hands[active] = { ...hand, cards: nextCards, stake: action === 'double' ? hand.stake * 2 : hand.stake,
            doubled: action === 'double', state: value.bust ? 'bust' : action === 'double' || value.total === 21 ? 'stood' : 'playing' }
        }
        next(at); publish(at); return { ok: true }
      } finally { busy = false }
    },
    tick() {
      if (busy) return
      busy = true
      try {
        const at = clock()
        if (phase === 'dealing' && at >= deadline) {
          if (shown < 4) { shown++; deadline = at + DEAL_CARD_MS }
          else if (handValue(hands[0].cards).blackjack || handValue(dealer).blackjack) {
            revealed = true; phase = 'settling'; deadline = at + DEALER_CARD_MS
          } else { phase = 'player_turn'; actionAt = at }
          publish(at)
        } else if (phase === 'player_turn' && at >= actionAt && !snapshot.actions.hit) publish(at)
        else if (phase === 'dealer_turn' && at >= deadline) {
          if (!revealed) { revealed = true; deadline = at + DEALER_CARD_MS }
          else if (hands.some(h => h.state !== 'bust') && dealerShouldHit(dealer, rules)) {
            dealer.push(shoe.draw()); deadline = at + DEALER_CARD_MS
          } else { phase = 'settling'; deadline = at + 120 }
          publish(at)
        } else if (phase === 'settling' && at >= deadline) settle(at)
        else if (phase === 'result' && at >= deadline) { phase = 'ready'; publish(at) }
      } catch {
        phase = 'error'; if (roundId) wallet.releaseRound(roundId); publish(lastTime, 'shoe-unavailable')
      } finally { busy = false }
    },
    abandon() {
      // Unmount/reload never resumes, refunds or settles an unfinished wager.
      // Safe during Strict Mode's initial effect replay (there is no active hand).
      if (!roundId || phase === 'ready') return
      if (roundId) wallet.releaseRound(roundId)
      settled = true; revision++; phase = 'ready'; hands = []; dealer = []; roundId = null; publish(lastTime)
    },
  }
}
export type BlackjackEngine = ReturnType<typeof createBlackjackEngine>
