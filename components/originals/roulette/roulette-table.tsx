'use client'
import { useState } from 'react'
import type { Locale } from '@/lib/types'
import type { RouletteSnapshot } from '@/lib/originals/roulette/engine'
import { aggregateBets, ROULETTE_BETS, rouletteBet, type RouletteBet, type BetType } from '@/lib/originals/roulette/bets'
import { pocketColor } from '@/lib/originals/roulette/config'
import { rouletteBetLabel, rouletteCopy } from '@/lib/originals/roulette/copy'
import { formatCredits } from '@/lib/originals/credits'
import styles from './roulette.module.css'

const insideTypes: BetType[] = ['split', 'street', 'corner', 'six-line', 'first-four']
const outsideTypes: BetType[] = ['low', 'even', 'red', 'black', 'odd', 'high', 'dozen', 'column']
const outside = outsideTypes.flatMap(type => ROULETTE_BETS.filter(b => b.type === type))
export function RouletteTable({ round, locale, place }: { round: RouletteSnapshot; locale: Locale; place: (id: string) => void }) {
  const [mode, setMode] = useState<'outside' | 'numbers' | 'inside'>('outside'), [page, setPage] = useState(0)
  const [type, setType] = useState<BetType>('split')
  const copy = rouletteCopy(locale), stacks = new Map(aggregateBets(round.placements).map(b => [b.betId, b.amount]))
  const ready = round.phase === 'betting', winningNumber = round.result?.number
  function button(bet: RouletteBet, compact = false) {
    const stake = stacks.get(bet.id), label = rouletteBetLabel(bet, locale)
    const color = bet.type === 'straight' ? pocketColor(bet.numbers[0]) : ['red', 'black'].includes(bet.type) ? bet.type : undefined
    return <button type="button" key={bet.id} data-bet={bet.id} data-color={color} data-selected={Boolean(stake) || undefined}
      data-hit={winningNumber !== undefined && bet.numbers.includes(winningNumber) || undefined}
      disabled={!ready} onClick={() => place(bet.id)} aria-label={`${label}${stake ? ` · ${copy.selected} ${formatCredits(stake, locale)}` : ''}`}>
      <span>{compact ? bet.numbers[0] : insideTypes.includes(bet.type) ? bet.numbers.join('·') : label}</span>
      {stake ? <b className={styles.stack}>{formatCredits(stake, locale).replace(/[.,]00$/, '')}</b> : insideTypes.includes(bet.type) ? <small>{bet.profitOdds}:1</small> : null}
    </button>
  }
  const range = <div className={styles.ranges} role="group" aria-label={copy.range}>{[0, 1, 2].map(n =>
    <button type="button" key={n} aria-pressed={page === n} onClick={() => setPage(n)}>{n * 12 + 1}–{n * 12 + 12}</button>)}</div>
  return <div className={styles.bettingTable} data-roulette-table>
    <div className={styles.desktopNumbers} aria-label={copy.numbers}>
      {button(rouletteBet('straight:0')!, true)}
      {[3, 2, 1].flatMap(row => Array.from({ length: 12 }, (_, col) => button(rouletteBet(`straight:${row + col * 3}`)!, true)))}
    </div>
    <div className={styles.modeTabs} role="group" aria-label={copy.betType}>{(['outside', 'numbers', 'inside'] as const).map(value =>
      <button type="button" key={value} data-mode={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{copy[value]}</button>)}</div>
    <div className={styles.outside} data-visible={mode === 'outside'}>{outside.map(b => button(b))}</div>
    {mode === 'numbers' && <div className={styles.mobileNumbers}>{range}<div className={styles.numberPage}>
      {[0, ...Array.from({ length: 12 }, (_, i) => page * 12 + i + 1)].map(n => button(rouletteBet(`straight:${n}`)!, true))}
    </div></div>}
    {mode === 'inside' && <div className={styles.insidePicker}>
      <label>{copy.betType}<select value={type} onChange={e => setType(e.target.value as BetType)}>{insideTypes.map(t => <option key={t} value={t}>{copy[t]}</option>)}</select></label>
      {type !== 'first-four' && range}
      <p>{copy.groupHint}</p>
      <div className={styles.insideGrid} role="group" aria-label={copy[type]} tabIndex={0}>
        {ROULETTE_BETS.filter(b => b.type === type && (type === 'first-four' || Math.floor((Math.max(1, b.numbers[0]) - 1) / 12) === page)).map(b => button(b))}
      </div>
    </div>}
  </div>
}
