import type { CSSProperties } from 'react'
import type { Locale } from '@/lib/types'
import { handValue, type Card } from '@/lib/originals/blackjack/cards'
import type { BlackjackSnapshot } from '@/lib/originals/blackjack/engine'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import { formatCredits } from '@/lib/originals/credits'
import { BlackjackCard } from './blackjack-card'
import styles from './blackjack.module.css'

export function BlackjackTable({ round, locale }: { round: BlackjackSnapshot; locale: Locale }) {
  const copy = blackjackCopy(locale), format = (n: number) => formatCredits(n, locale)
  const finished = round.hands.some(h => h.result), dealerCards = round.dealer.filter((c): c is Card => c !== null)
  const dealer = handValue(dealerCards)
  const status = round.phase === 'dealing' ? copy.dealing : round.phase === 'player_turn' ? copy.playerTurn :
    round.phase === 'dealer_turn' ? copy.dealerTurn : round.phase === 'settling' ? copy.settling : copy.ready
  return <div className={styles.table} data-blackjack-phase={round.phase} data-hands={round.hands.length} data-finished={finished || undefined}>
    <div className={styles.tableHeader}><span>PLAYLIVA ORIGINALS</span><b>LIVA <em>BLACKJACK</em></b><span className={styles.shoe} aria-hidden="true">♠</span></div>
    <div className={styles.dealerZone} aria-label={copy.dealer}>
      <div className={styles.zoneLabel}><span>{copy.dealer}</span>{dealerCards.length > 0 && <strong data-dealer-total>{dealer.total}{!round.dealerRevealed && round.dealer.length > 1 ? ' + ?' : ''}{dealer.soft && <small> {copy.soft}</small>}</strong>}</div>
      <div className={styles.cards}>{round.dealer.length ? round.dealer.map((card, i) => <BlackjackCard key={i} card={card} locale={locale} flip={i === 1 && round.dealerRevealed} />) : round.phase === 'ready' && !round.hands.length ? <><BlackjackCard card={null} locale={locale} /><BlackjackCard card={null} locale={locale} /></> : null}</div>
    </div>
    <div className={styles.tableRule}><span>{copy.shortRules}</span><small>{copy.dealerRule}</small></div>
    <div className={styles.hands} style={{ '--hands': Math.max(1, round.hands.length) } as CSSProperties}>
      {round.hands.length ? round.hands.map((hand, index) => {
        const value = handValue(hand.cards, hand.fromSplit), active = round.phase === 'player_turn' && round.activeHand === index
        return <section key={hand.id} className={styles.hand} data-active={active || undefined} data-hand={hand.id} data-card-count={hand.cards.length} data-long={hand.cards.length >= 6 || undefined} data-outcome={hand.result?.outcome} aria-label={`${copy.hand} ${index + 1}`}>
          <div className={styles.zoneLabel}><span>{active ? `● ${round.hands.length > 1 ? `${copy.hand} ${index + 1}` : copy.active}` : round.hands.length > 1 ? `${copy.hand} ${index + 1}` : copy.player}</span><strong data-hand-total>{hand.cards.length ? value.total : '—'}</strong></div>
          <div className={styles.cards}>{hand.cards.map(card => <BlackjackCard key={card.id} card={card} locale={locale} />)}</div>
          <div className={styles.handMeta}><span className={styles.chip} aria-hidden="true" /><span>{copy.bet} <b>{format(hand.stake)}</b></span>{hand.doubled && <b>×2</b>}</div>
          {(hand.result ? round.hands.length > 1 : hand.state !== 'playing') && <p className={styles.handState}>{hand.result ? copy[hand.result.outcome] : hand.splitAce ? copy.splitAces : hand.state === 'bust' ? copy.bust : copy.stood}</p>}
          {hand.result && round.hands.length > 1 && <p className={styles.handReturn}>{copy.returned} <b>{format(hand.result.returned)}</b></p>}
        </section>
      }) : <div className={styles.emptySeat}><span className={styles.seatMark} aria-hidden="true">♠</span><span>{copy.player}</span></div>}
    </div>
    <div className={styles.result} role="status" aria-live="polite">
      {finished ? <><span>{round.hands.length === 1 ? copy[round.hands[0].result!.outcome] : copy.totalReturn}</span><span className={styles.returnAmount}><small>{copy.returned}</small> <strong>{format(round.totalReturn)}</strong><small>Liva Credits</small></span></> : <span>{status}</span>}
    </div>
  </div>
}
