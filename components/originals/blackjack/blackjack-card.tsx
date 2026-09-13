import type { Card, Suit } from '@/lib/originals/blackjack/cards'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import type { Locale } from '@/lib/types'
import styles from './blackjack.module.css'

const SUIT_PATH: Record<Suit, string> = {
  spades: 'M16 1C11 7 2 11 2 18c0 8 10 9 14 3-1 6-3 8-6 10h12c-3-2-5-4-6-10 4 6 14 5 14-3C30 11 21 7 16 1Z',
  hearts: 'M16 30C12 25 1 17 1 9 1-1 13-2 16 7 19-2 31-1 31 9c0 8-11 16-15 21Z',
  diamonds: 'M16 1 29 16 16 31 3 16Z',
  clubs: 'M16 1a7 7 0 0 0-5 12C0 7-4 25 7 26c4 0 7-3 9-6-1 6-3 9-6 11h12c-3-2-5-5-6-11 2 3 5 6 9 6 11-1 7-19-4-13A7 7 0 0 0 16 1Z',
}

/** Original vector deck: no raster/provider artwork, hidden-card rank or suit. */
export function BlackjackCard({ card, locale, flip = false }: { card: Card | null; locale: Locale; flip?: boolean }) {
  const copy = blackjackCopy(locale)
  const rankName = card ? ({ A: copy.ace, J: copy.jack, Q: copy.queen, K: copy.king }[card.rank as 'A' | 'J' | 'Q' | 'K'] ?? card.rank) : ''
  const red = card?.suit === 'hearts' || card?.suit === 'diamonds'
  return <span className={`${styles.card} ${flip ? styles.flip : ''}`} role="img"
    aria-label={card ? `${rankName} · ${copy[card.suit]}` : copy.hidden} data-card={card ? `${card.rank}-${card.suit}` : 'hidden'}>
    <svg viewBox="0 0 88 124" className={styles.fullFace} aria-hidden="true">
    {card ? <>
      <rect x="1" y="1" width="86" height="122" rx="9" fill="#fff9ec" stroke="#dfceaa" strokeWidth="2" />
      <rect x="5" y="5" width="78" height="114" rx="6" fill="none" stroke="#dfceaa" strokeWidth=".6" />
      <g fill={red ? '#b22a39' : '#132d3b'}>
        <text x="9" y="28" fontFamily="Georgia,serif" fontSize="28" fontWeight="bold">{card.rank}</text>
        <path d={SUIT_PATH[card.suit]} transform="translate(10 30) scale(.39)" />
        <g transform="rotate(180 44 62)"><text x="9" y="28" fontFamily="Georgia,serif" fontSize="28" fontWeight="bold">{card.rank}</text><path d={SUIT_PATH[card.suit]} transform="translate(10 30) scale(.39)" /></g>
        <path d={SUIT_PATH[card.suit]} transform="translate(27 44) scale(1.08)" />
        {['J', 'Q', 'K'].includes(card.rank) && <><path d="m28 80-3-11 10 4 9-12 9 12 10-4-3 11Z" fill="#b69a57" /><path d="M29 84h30" stroke="#b69a57" strokeWidth="2" /></>}
      </g>
    </> : <>
      <rect x="1" y="1" width="86" height="122" rx="9" fill="#091b30" stroke="#e0c58a" strokeWidth="2" />
      <rect x="6" y="6" width="76" height="112" rx="5" fill="#0d2c40" stroke="#bd9d57" />
      {[22, 44, 66].map(x => [24, 48, 72, 96].map(y => <path key={`${x}-${y}`} d={`M${x} ${y-10}l8 10-8 10-8-10Z`} fill="none" stroke="#c5a760" opacity=".25" />))}
      <path d="M44 35 64 62 44 89 24 62Z" fill="#0b2236" stroke="#ddc58b" />
      <path d="M36 49v24h17v-4H41V49Z" fill="#e8d7a5" /><path d="m45 52 8 10-8 10" fill="none" stroke="#26a5ed" strokeWidth="2" />
    </>}
    </svg>
    {card && <span className={styles.miniFace} aria-hidden="true" style={{ color: red ? '#b22a39' : '#132d3b' }}>{card.rank}<i>{{ spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }[card.suit]}</i></span>}
  </span>
}
