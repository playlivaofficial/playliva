import { BLACKJACK_RULES, validateRules, type BlackjackRules } from './config'

export const RANKS = Object.freeze(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const)
export const SUITS = Object.freeze(['spades', 'hearts', 'diamonds', 'clubs'] as const)
export type Rank = typeof RANKS[number]
export type Suit = typeof SUITS[number]
export interface Card { readonly id: string; readonly rank: Rank; readonly suit: Suit }
export interface CardRandom { uint32(): number }
export interface Shoe { beginRound(): void; draw(): Card }

export const secureCardRandom: CardRandom = {
  uint32() { return crypto.getRandomValues(new Uint32Array(1))[0] },
}
export function randomBelow(random: CardRandom, limit: number) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 0x1_0000_0000) throw new Error('Invalid random bound')
  const cutoff = Math.floor(0x1_0000_0000 / limit) * limit
  for (let tries = 0; tries < 10000; tries++) {
    const value = random.uint32()
    if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) throw new Error('Invalid entropy')
    if (value < cutoff) return value % limit
  }
  throw new Error('Random source unavailable')
}
export function createDeck(decks = 1): Card[] {
  if (!Number.isInteger(decks) || decks < 1 || decks > 8) throw new Error('Invalid deck count')
  return Array.from({ length: decks }, (_, deck) => SUITS.flatMap(suit => RANKS.map(rank =>
    Object.freeze({ id: `${deck}-${suit}-${rank}`, rank, suit })))).flat()
}
export function shuffledCards(cards: readonly Card[], random: CardRandom = secureCardRandom): Card[] {
  const result = [...cards]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomBelow(random, i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export function createShoe(random: CardRandom = secureCardRandom, rules: BlackjackRules = BLACKJACK_RULES): Shoe {
  validateRules(rules)
  let cards: Card[] = [], cursor = 0
  return {
    beginRound() {
      // A conservative maximum reserve prevents ANY in-hand reshuffle. With
      // six decks this stays in the requested roughly 70–80% penetration band.
      const reserve = (rules.maxHands + 1) * 21
      if (!cards.length || cursor >= Math.floor(cards.length * rules.penetration) || cards.length - cursor < reserve) {
        const next = shuffledCards(createDeck(rules.decks), random)
        cards = next; cursor = 0
      }
    },
    draw() {
      if (cursor >= cards.length) throw new Error('Shoe exhausted')
      return cards[cursor++]
    },
  }
}
export function cardValue(card: Card) { return card.rank === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(card.rank) ? 10 : Number(card.rank) }
export function handValue(cards: readonly Card[], fromSplit = false) {
  let total = 0, aces = 0
  for (const card of cards) { total += cardValue(card); if (card.rank === 'A') aces++ }
  const soft = aces > 0 && total + 10 <= 21
  if (soft) total += 10
  return { total, soft, bust: total > 21, blackjack: !fromSplit && cards.length === 2 && total === 21 }
}
export function isPair(cards: readonly Card[], rules: BlackjackRules = BLACKJACK_RULES) {
  return cards.length === 2 && (rules.pairRule === 'rank' ? cards[0].rank === cards[1].rank : cardValue(cards[0]) === cardValue(cards[1]))
}
export function dealerShouldHit(cards: readonly Card[], rules: BlackjackRules = BLACKJACK_RULES) {
  const { total, soft } = handValue(cards)
  return total < 17 || (total === 17 && soft && rules.dealerHitsSoft17)
}
