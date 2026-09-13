import test from 'node:test'
import assert from 'node:assert/strict'
import cardsModule from '../lib/originals/blackjack/cards.ts'
import rulesModule from '../lib/originals/blackjack/config.ts'
import settlementModule from '../lib/originals/blackjack/settlement.ts'
import engineModule from '../lib/originals/blackjack/engine.ts'
import sessionModule from '../lib/originals/session.ts'
import simModule from '../lib/originals/blackjack/simulation.ts'
const { createDeck, shuffledCards, createShoe, randomBelow, handValue, dealerShouldHit, isPair } = cardsModule
const { BLACKJACK_RULES: rules } = rulesModule
const { settleHand } = settlementModule, { createBlackjackEngine } = engineModule
const { createDemoSessionStore, MAX_CREDIT_UNITS } = sessionModule
const { blackjackSeed, simulateBlackjack } = simModule
const cards = ranks => ranks.split(' ').map((rank, i) => Object.freeze({ id: `test-${i}-${rank}`, rank, suit: ['spades', 'hearts', 'clubs', 'diamonds'][i % 4] }))
function harness(sequence, options = {}) {
  let at = 0, id = 0, cursor = 0
  const shoe = { beginRound() {}, draw() { const card = cards(sequence)[cursor++]; assert.ok(card, `No card ${cursor} in ${sequence}`); return card } }
  const wallet = options.wallet ?? createDemoSessionStore(() => null)
  const engine = createBlackjackEngine(wallet, { now: () => at, id: () => `bj-${++id}`, shoe, ...options })
  const advance = (ms = 1000) => { at += ms; engine.tick() }
  const until = phase => { for (let i = 0; i < 100 && engine.getSnapshot().phase !== phase; i++) advance(); assert.equal(engine.getSnapshot().phase, phase) }
  const action = name => { const result = engine.act(name, engine.getSnapshot().revision); advance(); return result }
  return { engine, wallet, advance, until, action }
}

test('blackjack: central default rules and immutable shoe composition', () => {
  assert.equal(rules.decks, 6); assert.equal(rules.dealerHitsSoft17, false); assert.equal(rules.maxHands, 3)
  assert.deepEqual(rules.blackjackProfit, [3, 2]); assert.equal(rules.pairRule, 'value')
  assert.equal(createDeck().length, 52)
  const deck = createDeck(6); assert.equal(deck.length, 312); assert.equal(new Set(deck.map(c => c.id)).size, 312)
  for (const suit of cardsModule.SUITS) for (const rank of cardsModule.RANKS) assert.equal(deck.filter(c => c.rank === rank && c.suit === suit).length, 6)
  assert.throws(() => { rules.blackjackProfit[0] = 6 }, TypeError)
  assert.throws(() => createDeck(0)); assert.throws(() => rulesModule.validateRules({ ...rules, maxHands: 4 }))
})
test('blackjack: secure Fisher-Yates sampling rejects modulo tail and invalid entropy', () => {
  const values = [0xffff_ffff, 7]; assert.equal(randomBelow({ uint32: () => values.shift() }, 10), 7)
  assert.throws(() => randomBelow({ uint32: () => -1 }, 10))
  const original = createDeck(6), shuffled = shuffledCards(original, blackjackSeed(42))
  assert.deepEqual(shuffled.map(c => c.id).sort(), original.map(c => c.id).sort())
  assert.notDeepEqual(shuffled, original); assert.deepEqual(shuffled, shuffledCards(original, blackjackSeed(42)))
})
test('blackjack: local shoe draws sequentially, reshuffles between hands at penetration, never during a hand', () => {
  let calls = 0
  const random = { uint32: () => { calls++; return 0 } }, shoe = createShoe(random)
  shoe.beginRound(); const start = calls, ids = []
  for (let i = 0; i < 220; i++) ids.push(shoe.draw().id)
  assert.equal(new Set(ids).size, 220); shoe.beginRound(); assert.equal(calls, start)
  for (let i = 0; i < 14; i++) shoe.draw()
  assert.equal(calls, start); shoe.beginRound(); assert.ok(calls > start)
  const full = createShoe(blackjackSeed(1)); full.beginRound()
  for (let i = 0; i < 312; i++) full.draw()
  assert.throws(() => full.draw(), /exhausted/)
})
test('blackjack: Aces, hard/soft totals, multiple Aces, natural and split 21', () => {
  assert.deepEqual(handValue(cards('A 6')), { total: 17, soft: true, bust: false, blackjack: false })
  assert.equal(handValue(cards('A A 9')).total, 21); assert.equal(handValue(cards('A A 9')).soft, true)
  assert.equal(handValue(cards('A A 9 K')).total, 21); assert.equal(handValue(cards('A A 9 K')).soft, false)
  assert.equal(handValue(cards('A K')).blackjack, true); assert.equal(handValue(cards('A K'), true).blackjack, false)
  assert.equal(handValue(cards('K Q 2')).bust, true)
})
test('blackjack: deterministic dealer hits under 17 and stands on hard/soft 17', () => {
  assert.equal(dealerShouldHit(cards('K 6')), true); assert.equal(dealerShouldHit(cards('A 5')), true)
  assert.equal(dealerShouldHit(cards('K 7')), false); assert.equal(dealerShouldHit(cards('A 6')), false)
  assert.equal(dealerShouldHit(cards('A 6'), { ...rules, dealerHitsSoft17: true }), true)
})
test('blackjack: pure settlement returns stake, profit and natural 3:2 exactly', () => {
  for (const [p, d, outcome, returned] of [['K Q', 'K 8', 'win', 2000], ['K 8', 'K Q', 'loss', 0],
    ['K Q', 'J Q', 'push', 1000], ['A K', 'Q 9', 'blackjack', 2500], ['A K', 'A Q', 'push', 1000],
    ['K Q', 'A K', 'loss', 0], ['K Q 2', 'K 9 5', 'bust', 0], ['K Q', 'K 9 5', 'win', 2000]]) {
    assert.deepEqual(settleHand(cards(p), cards(d), 1000), { outcome, returned, profit: returned - 1000 })
  }
  assert.equal(settleHand(cards('A K'), cards('Q 9'), 1000, true).returned, 2000)
  assert.equal(settleHand(cards('A K'), cards('Q 9'), 101).returned, 252)
})
test('blackjack: correct initial sequence, public hole secrecy and natural resolution', () => {
  const h = harness('A 9 K 8')
  assert.equal(h.engine.deal(1000).ok, true)
  assert.equal(h.engine.getSnapshot().hands[0].cards.length, 0)
  h.advance(); assert.equal(h.engine.getSnapshot().hands[0].cards[0].rank, 'A')
  h.advance(); assert.equal(h.engine.getSnapshot().dealer[0].rank, '9')
  h.advance(); assert.equal(h.engine.getSnapshot().hands[0].cards[1].rank, 'K')
  h.advance(); assert.equal(h.engine.getSnapshot().dealer[1], null)
  h.until('result'); assert.equal(h.engine.getSnapshot().hands[0].result.outcome, 'blackjack')
  assert.equal(h.wallet.getSnapshot().session.balance, 1001500)
})
test('blackjack: dealer natural and both-natural push resolve before any player action', () => {
  for (const [seq, expected, balance] of [['9 A K Q', 'loss', 999000], ['A A K Q', 'push', 1000000]]) {
    const h = harness(seq); h.engine.deal(1000); h.until('result')
    assert.equal(h.engine.getSnapshot().hands[0].result.outcome, expected)
    assert.equal(h.wallet.getSnapshot().session.balance, balance)
  }
})
test('blackjack: Hit disables Double and Stand advances dealer; no duplicate rapid Hit', () => {
  const h = harness('5 10 6 7 4'); h.engine.deal(1000); h.until('player_turn')
  const revision = h.engine.getSnapshot().revision
  assert.equal(h.engine.act('hit', revision).ok, true)
  assert.equal(h.engine.act('hit', revision).ok, false)
  assert.equal(h.engine.act('hit', h.engine.getSnapshot().revision).ok, false)
  h.advance(); assert.equal(h.engine.getSnapshot().actions.double, false)
  h.action('stand'); h.until('result'); assert.equal(h.engine.getSnapshot().hands[0].result.outcome, 'loss')
})
test('blackjack: Double debits once, draws exactly one, and settles doubled wager', () => {
  const h = harness('5 9 6 8 K'); h.engine.deal(1000); h.until('player_turn')
  const revision = h.engine.getSnapshot().revision
  assert.equal(h.engine.act('double', revision).ok, true); assert.equal(h.engine.act('double', revision).ok, false)
  h.until('result'); const hand = h.engine.getSnapshot().hands[0]
  assert.equal(hand.cards.length, 3); assert.equal(hand.stake, 2000); assert.equal(hand.result.returned, 4000)
  assert.deepEqual(h.wallet.getSnapshot().session.transactions.map(t => [t.kind, t.amount]), [['debit', 1000], ['debit', 1000], ['credit', 4000]])
})
test('blackjack: matching-value vs matching-rank pair rule is explicit', () => {
  assert.equal(isPair(cards('K Q')), true); assert.equal(isPair(cards('K Q'), { ...rules, pairRule: 'rank' }), false)
  assert.equal(isPair(cards('8 8')), true); assert.equal(isPair(cards('8 9')), false)
})
test('blackjack: Split produces independently wagered active hands and allows Double After Split', () => {
  const h = harness('8 10 8 7 3 2 K'); h.engine.deal(1000); h.until('player_turn'); h.action('split')
  assert.equal(h.engine.getSnapshot().hands.length, 2); assert.equal(h.engine.getSnapshot().activeHand, 0)
  assert.equal(h.engine.getSnapshot().actions.double, true); h.action('double')
  assert.equal(h.engine.getSnapshot().activeHand, 1); h.action('stand'); h.until('result')
  assert.deepEqual(h.engine.getSnapshot().hands.map(v => [v.stake, v.result.outcome, v.result.returned]), [[2000, 'win', 4000], [1000, 'loss', 0]])
  assert.equal(h.wallet.getSnapshot().session.balance, 1001000)
})
test('blackjack: maximum three hands, no fourth split, prior resolved hands preserved', () => {
  const h = harness('8 10 8 7 8 8 8 2'); h.engine.deal(100); h.until('player_turn'); h.action('split'); h.action('split')
  assert.equal(h.engine.getSnapshot().hands.length, 3); assert.equal(h.engine.getSnapshot().actions.split, false)
  h.action('stand'); assert.equal(h.engine.getSnapshot().activeHand, 1)
  assert.equal(h.engine.getSnapshot().hands[0].state, 'stood')
  h.action('stand'); h.action('stand'); h.until('result')
  assert.equal(h.wallet.getSnapshot().session.transactions.filter(t => t.kind === 'debit').length, 3)
})
test('blackjack: split Aces get one card, cannot resplit/Hit/Double, and 21 pays normal odds', () => {
  const h = harness('A 10 A 7 K A'); h.engine.deal(1000); h.until('player_turn'); h.action('split'); h.until('result')
  assert.equal(h.engine.getSnapshot().hands.length, 2)
  assert.ok(h.engine.getSnapshot().hands.every(v => v.cards.length === 2 && v.splitAce))
  assert.deepEqual(h.engine.getSnapshot().hands.map(v => v.result.outcome), ['win', 'loss'])
  assert.equal(h.engine.getSnapshot().hands[0].result.returned, 2000)
})
test('blackjack: bust skips unnecessary dealer draws; dealer bust still pays live hands', () => {
  const bust = harness('K 6 9 5 5'); bust.engine.deal(100); bust.until('player_turn'); bust.action('hit'); bust.until('result')
  assert.equal(bust.engine.getSnapshot().hands[0].result.outcome, 'bust'); assert.equal(bust.engine.getSnapshot().dealer.length, 2)
  const dealer = harness('K 6 8 9 K'); dealer.engine.deal(100); dealer.until('player_turn'); dealer.action('stand'); dealer.until('result')
  assert.equal(dealer.engine.getSnapshot().hands[0].result.outcome, 'win'); assert.equal(dealer.engine.getSnapshot().dealer.length, 3)
})
test('blackjack: insufficient funds disable Split/Double; invalid stakes never debit', () => {
  const h = harness('8 10 8 7'); h.wallet.debit(999900)
  for (const stake of [0, -100, 100.5, 101, NaN, 10000]) assert.equal(h.engine.deal(stake).ok, false)
  assert.equal(h.engine.deal(200).reason, 'insufficient-credits'); assert.equal(h.engine.deal(100).ok, true)
  h.until('player_turn'); assert.equal(h.engine.getSnapshot().actions.double, false); assert.equal(h.engine.getSnapshot().actions.split, false)
  assert.equal(h.wallet.getSnapshot().session.balance, 0)
})
test('blackjack: duplicate/reentrant deal, dealer callbacks and settlements never repeat ledger entries', () => {
  const h = harness('A 9 K 8'); let attempted = false
  h.wallet.hydrate()
  h.wallet.subscribe(() => { if (!attempted) { attempted = true; assert.equal(h.engine.deal(1000).ok, false) } })
  h.engine.deal(1000); assert.equal(h.engine.deal(1000).ok, false); h.until('result')
  for (let i = 0; i < 10; i++) h.advance()
  assert.equal(h.wallet.getSnapshot().session.transactions.length, 2)
  assert.equal(h.engine.getSnapshot().completed, 1)
})
test('blackjack: reload/abandon preserves spent credits, clears unfinished hand and invalidates residue', () => {
  const saved = new Map(), storage = { getItem: k => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v) }
  const wallet = createDemoSessionStore(() => storage), h = harness('8 10 8 7', { wallet })
  h.engine.deal(1000); h.until('player_turn'); const revision = h.engine.getSnapshot().revision
  h.engine.abandon(); h.advance(); assert.equal(h.engine.act('stand', revision).ok, false)
  assert.equal(wallet.getSnapshot().session.balance, 999000)
  const fresh = createDemoSessionStore(() => storage); fresh.hydrate()
  assert.equal(fresh.getSnapshot().session.balance, 999000)
  assert.equal(createBlackjackEngine(fresh).getSnapshot().phase, 'ready')
  assert.equal(fresh.getSnapshot().session.transactions.length, 1)
})
test('blackjack: consecutive hands reuse the shoe, change IDs and keep exact fractional returns', () => {
  const h = harness('A 9 K 8 A 9 Q 8')
  for (let i = 0; i < 2; i++) { assert.equal(h.engine.deal(100).ok, true); h.until('result'); h.until('ready') }
  assert.equal(h.wallet.getSnapshot().session.balance, 1000300); assert.equal(h.engine.getSnapshot().completed, 2)
  assert.deepEqual(h.wallet.getSnapshot().session.transactions.map(t => t.amount), [100, 250, 100, 250])
})
test('blackjack: headroom and crypto failures fail closed before debit', () => {
  const high = harness('A 9 K 8'); high.wallet.credit(MAX_CREDIT_UNITS - 1000000)
  assert.equal(high.engine.deal(100).reason, 'balance-limit')
  const h = harness('', { shoe: { beginRound() { throw new Error('entropy') }, draw() { throw new Error('unused') } } })
  assert.equal(h.engine.deal(100).reason, 'random-unavailable'); assert.equal(h.wallet.getSnapshot().session.transactions.length, 0)
  assert.equal(h.wallet.reset().ok, true)
})
test('blackjack: large deterministic simulation is explicitly verification-only, never RTP', () => {
  const a = simulateBlackjack(10000, 42), b = simulateBlackjack(10000, 42)
  assert.deepEqual(a, b); assert.equal(a.wins + a.losses + a.pushes, a.hands)
  assert.ok(a.playerBlackjackFrequency > .03 && a.playerBlackjackFrequency < .06)
  assert.ok(a.busts <= a.losses); assert.equal(Object.hasOwn(a, 'rtp'), false)
  assert.match(a.purpose, /verification only/); assert.throws(() => simulateBlackjack(0))
})
