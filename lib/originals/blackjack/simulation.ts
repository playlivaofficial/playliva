import { createShoe, handValue, dealerShouldHit, type CardRandom } from './cards'
import { settleHand } from './settlement'

/** Dev/test-only entropy. Never imported by the public game. */
export function blackjackSeed(seed: number): CardRandom {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0xffff_ffff) throw new Error('Invalid seed')
  let value = seed >>> 0
  return { uint32() { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value >>> 0 } }
}
/** ENGINE VERIFICATION ONLY. This deliberately simple policy hits below 17
 * and otherwise stands, without double/split. It is NOT basic strategy and
 * its win/loss statistics must never be described as RTP or house edge. */
export function simulateBlackjack(rounds: number, seed = 7132026) {
  if (!Number.isSafeInteger(rounds) || rounds < 1 || rounds > 10000000) throw new Error('Invalid hand count')
  const shoe = createShoe(blackjackSeed(seed))
  let playerNaturals = 0, dealerNaturals = 0, wins = 0, losses = 0, pushes = 0, busts = 0
  for (let i = 0; i < rounds; i++) {
    shoe.beginRound()
    const player = [shoe.draw()], dealer = [shoe.draw()]
    player.push(shoe.draw()); dealer.push(shoe.draw())
    const p = handValue(player), d = handValue(dealer)
    if (p.blackjack) playerNaturals++
    if (d.blackjack) dealerNaturals++
    if (!p.blackjack && !d.blackjack) {
      while (handValue(player).total < 17) player.push(shoe.draw())
      if (!handValue(player).bust) while (dealerShouldHit(dealer)) dealer.push(shoe.draw())
    }
    const result = settleHand(player, dealer, 1000)
    if (result.outcome === 'blackjack' || result.outcome === 'win') wins++
    else if (result.outcome === 'push') pushes++
    else { losses++; if (result.outcome === 'bust') busts++ }
  }
  return { purpose: 'Engine verification only; not RTP or house edge', policy: 'Hit below 17, otherwise stand; no double/split',
    hands: rounds, seed, playerNaturals, dealerNaturals, wins, losses, pushes, busts,
    playerBlackjackFrequency: playerNaturals / rounds, dealerBlackjackFrequency: dealerNaturals / rounds,
    winRate: wins / rounds, lossRate: losses / rounds, pushRate: pushes / rounds, bustRate: busts / rounds }
}
