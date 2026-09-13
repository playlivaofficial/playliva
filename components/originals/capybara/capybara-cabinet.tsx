'use client'

import Image from 'next/image'
import { useEffect, useState, type CSSProperties } from 'react'
import type { Locale } from '@/lib/types'
import { capybaraCopy } from '@/lib/originals/capybara/copy'
import { SYMBOLS, type SlotSymbol } from '@/lib/originals/capybara/config'
import type { SlotSnapshot } from '@/lib/originals/capybara/engine'
import { formatCredits } from '@/lib/originals/credits'
import styles from './capybara.module.css'

export const symbolAsset = (symbol: SlotSymbol) => `/originals/capybara-gold/${symbol}.webp`
export function winTier(payout: number, stake: number) {
  return payout >= stake * 50 ? 'mega' : payout >= stake * 25 ? 'super' : payout >= stake * 10 ? 'big' : payout >= stake * 2 ? 'medium' : 'small'
}
function CountUp({ value, locale }: { value: number; locale: Locale }) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const start = performance.now()
    const update = (at: number) => {
      const progress = Math.min(1, (at - start) / 280)
      setDisplay(Math.floor(value * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <strong aria-label={formatCredits(value, locale)}>{formatCredits(display, locale)}</strong>
}

/** Pure presentation: only settled engine snapshots can highlight or announce wins. */
export function CapybaraCabinet({ round, locale, loaded, loadError, onAsset, onAssetError, onContinue, onRetry }: {
  round: SlotSnapshot; locale: Locale; loaded: boolean; loadError: boolean
  onAsset: (symbol: SlotSymbol) => void; onAssetError: () => void; onContinue: () => void; onRetry: () => void
}) {
  const copy = capybaraCopy(locale), spinning = round.phase === 'spinning'
  const settled = spinning ? null : round.result
  const evaluation = settled?.evaluation, payout = evaluation?.payout ?? 0
  const tier = winTier(payout, round.stake)
  const bonus = round.free || round.bonusRemaining > 0 || round.phase === 'bonus-summary'
  const overlay = round.phase === 'bonus-intro' || round.phase === 'bonus-summary' || round.phase === 'error'
  const headline = tier === 'mega' ? copy.megaWin : tier === 'super' ? copy.superWin : tier === 'big' ? copy.bigWin : copy.win
  return <div className={styles.cabinet} data-slot-phase={round.phase} data-tier={payout ? tier : 'none'} data-bonus={bonus || undefined}>
    <div className={styles.river} aria-hidden="true" />
    <header className={styles.cabinetHeader}>
      <div className={styles.wordmark}><span>PLAYLIVA ORIGINALS</span><b>CAPYBARA <em>GOLD</em></b><small>{copy.ways}</small></div>
      <Image src="/originals/capybara-gold/mascot.webp" alt="" width={384} height={384} unoptimized priority className={styles.mascot} />
    </header>
    {bonus ? <div className={styles.bonusBar} aria-live="polite">
      <span>{copy.remaining}<b>{round.bonusRemaining}</b></span>
      <span>{copy.bonusMultiplier}<b>×{round.bonusMultiplier}</b></span>
    </div> : <div className={styles.featureBar}><span>{copy.wild} ×2 · ×3 · ×5 · ×10</span><span>3 ☀ = 8 {copy.freeSpins}</span></div>}
    <div className={styles.frame} role="group" aria-label={copy.result} aria-busy={spinning}>
      {round.grid.map((reel, column) => <div className={styles.reel} key={column} style={{ '--reel': column } as CSSProperties}>
        <div className={styles.cells}>
          {reel.map((symbol, row) => <div key={row} className={styles.cell} data-symbol={symbol}
            data-winning={evaluation?.winningCells.includes(column * 4 + row) || undefined}
            data-scatter={evaluation && evaluation.scatters >= 2 && symbol === 'scatter' || undefined}>
            <Image src={symbolAsset(symbol)} alt={`${copy.reel} ${column + 1}, ${copy.row} ${row + 1}: ${copy.symbols[symbol]}`}
              width={160} height={160} unoptimized priority onLoad={() => onAsset(symbol)} onError={onAssetError} />
            {(symbol === 'wild' || symbol === 'scatter') && <span className={styles.symbolBadge} aria-hidden="true">{symbol === 'wild' ? copy.wild : copy.scatter}</span>}
          </div>)}
        </div>
        {spinning && <div className={styles.spinMask} aria-hidden="true"><div className={styles.strip}>
          {[...SYMBOLS, ...SYMBOLS].map((symbol, index) => <Image src={symbolAsset(symbol)} key={index} alt="" width={160} height={160} unoptimized />)}
        </div></div>}
      </div>)}
    </div>
    <div className={styles.result} role="status" aria-live="polite" aria-label={payout > 0 ? `${headline}: ${formatCredits(payout, locale)} Liva Credits${evaluation && evaluation.multiplier > 1 ? `, ×${evaluation.multiplier}` : ''}` : undefined}>
      {spinning ? <span>{copy.spinning}</span> : payout > 0 ? <>
        <span>{headline}{evaluation && evaluation.multiplier > 1 ? ` · ×${evaluation.multiplier}` : ''}</span>
        <CountUp key={settled?.id} value={payout} locale={locale} /><small>Liva Credits</small>
      </> : <span>{settled ? copy.noWin : copy.ready}</span>}
    </div>
    {(!loaded || overlay) && <div className={styles.overlay}>
      {!loaded ? <div role="status"><strong>{loadError ? copy.loadError : copy.loading}</strong>{loadError && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div> :
        <div role="group" aria-label={round.phase === 'error' ? copy.retry : copy.jungleBonus}>
          <Image src={round.phase === 'bonus-intro' ? symbolAsset('scatter') : '/originals/capybara-gold/mascot.webp'} alt="" width={100} height={100} unoptimized />
          <h2>{round.phase === 'error' ? copy.retry : round.phase === 'bonus-summary' ? copy.bonusTotal : copy.jungleBonus}</h2>
          {round.phase === 'error' ? <p>{round.error === 'settlement-failed' ? copy.settlementError : copy.unavailable}</p> :
            round.phase === 'bonus-summary' ? <><strong>{formatCredits(round.bonusTotal, locale)}</strong><p>Liva Credits</p></> : <strong>8 <small>{copy.freeSpins}</small></strong>}
          <button type="button" onClick={onContinue}>{round.phase === 'bonus-intro' ? copy.begin : round.phase === 'error' ? copy.retry : copy.again}</button>
        </div>}
    </div>}
  </div>
}
