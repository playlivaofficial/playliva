'use client'

import Image from 'next/image'
import { useEffect, useState, type CSSProperties } from 'react'
import type { Locale } from '@/lib/types'
import { capybaraCopy } from '@/lib/originals/capybara/copy'
import { SLOT_CONFIG, SYMBOLS, type SlotSymbol } from '@/lib/originals/capybara/config'
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

const sunCount = (reels: readonly (readonly SlotSymbol[])[]) => reels.flat().filter(symbol => symbol === 'scatter').length

/** Pure presentation: only engine snapshots can land reels, highlight or announce wins. */
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
  const landedReels = spinning ? round.stopped : round.grid.length
  const visibleSuns = sunCount(round.grid.slice(0, landedReels))
  // Remount keys replay CSS entrances exactly once per engine event.
  const multiplierKey = `${round.seriesId}-${round.bonusMultiplier}`
  return <div className={styles.cabinet} data-slot-phase={round.phase} data-tier={payout ? tier : 'none'} data-bonus={bonus || undefined}
    data-anticipation={spinning && round.anticipation || undefined}>
    <div className={styles.river} aria-hidden="true" />
    {bonus && <div className={styles.bonusGlow} aria-hidden="true" />}
    <header className={styles.cabinetHeader}>
      <div className={styles.wordmark}><span>PLAYLIVA ORIGINALS</span><b>CAPYBARA <em>GOLD</em></b><small>{bonus ? copy.jungleBonus : copy.ways}</small></div>
      <span key={round.free ? multiplierKey : 'base'} className={styles.mascotWrap} data-cheer={round.free && round.bonusMultiplier > 1 || undefined}>
        <Image src="/originals/capybara-gold/mascot.webp" alt="" width={384} height={384} unoptimized priority className={styles.mascot} />
      </span>
    </header>
    {bonus ? <div className={styles.bonusBar} data-bonus-hud>
      <span className={styles.hudSpins} aria-live="polite">
        <small>{copy.freeSpins}</small>
        <b data-free-spins-counter>{round.bonusRemaining}<i> / {round.bonusAwarded}</i></b>
        {round.free && round.retriggered > 0 && <em key={`${round.spinAt}-${round.retriggered}`} className={styles.hudPop} data-retrigger>
          +{round.retriggered} {round.retriggered === 1 ? copy.plusSpin : copy.freeSpins}</em>}
      </span>
      <span className={styles.hudMultiplier} aria-live="polite">
        <small>{copy.bonusMultiplier}</small>
        <b key={`pill-${multiplierKey}`} data-gold-multiplier={round.bonusMultiplier} data-max={round.bonusMultiplier >= SLOT_CONFIG.maxBonusMultiplier || undefined}>×{round.bonusMultiplier}</b>
        {round.free && round.bonusMultiplier > 1 && <em key={`pop-${multiplierKey}`} className={styles.hudPop} data-multiplier-up aria-hidden="true">×{round.bonusMultiplier}!</em>}
      </span>
    </div> : <div className={styles.featureBar}><span>{copy.wild} ×2 · ×3 · ×5 · ×10</span><span data-sun-rule>3 · 4 · 5 ☀ = {SLOT_CONFIG.scatterAwards.join(' · ')} {copy.freeSpins}</span></div>}
    <div className={styles.frame} role="group" aria-label={copy.result} aria-busy={spinning}>
      {round.grid.map((reel, column) => {
        const landed = column < landedReels
        return <div className={styles.reel} key={column} style={{ '--reel': column } as CSSProperties}
          data-landing={landed && round.spinAt > 0 || undefined} data-anticipation={spinning && round.anticipation && !landed || undefined}>
          <div className={styles.cells} key={landed ? `landed-${round.spinAt}` : 'spinning'}>
            {reel.map((symbol, row) => <div key={row} className={styles.cell} data-symbol={symbol}
              data-winning={evaluation?.winningCells.includes(column * 4 + row) || undefined}
              data-scatter={landed && symbol === 'scatter' && visibleSuns >= 2 || undefined}
              data-sun={landed && symbol === 'scatter' || undefined}>
              <Image src={symbolAsset(symbol)} alt={`${copy.reel} ${column + 1}, ${copy.row} ${row + 1}: ${copy.symbols[symbol]}`}
                width={160} height={160} unoptimized priority onLoad={() => onAsset(symbol)} onError={onAssetError} />
              {(symbol === 'wild' || symbol === 'scatter') && <span className={styles.symbolBadge} aria-hidden="true">{symbol === 'wild' ? copy.wild : copy.scatter}</span>}
            </div>)}
          </div>
          {spinning && !landed && <div className={styles.spinMask} aria-hidden="true"><div className={styles.strip}>
            {[...SYMBOLS, ...SYMBOLS].map((symbol, index) => <Image src={symbolAsset(symbol)} key={index} alt="" width={160} height={160} unoptimized />)}
          </div></div>}
        </div>
      })}
    </div>
    <div className={styles.result} role="status" aria-live="polite" aria-label={payout > 0 ? `${headline}: ${formatCredits(payout, locale)} Liva Credits${evaluation && evaluation.multiplier > 1 ? `, ×${evaluation.multiplier}` : ''}` : undefined}>
      {spinning ? <span>{copy.spinning}</span> : payout > 0 ? <>
        <span>{headline}{evaluation && evaluation.multiplier > 1 ? ` · ×${evaluation.multiplier}` : ''}</span>
        <CountUp key={settled?.id} value={payout} locale={locale} /><small>Liva Credits</small>
      </> : <span>{settled ? copy.noWin : copy.ready}</span>}
    </div>
    {(!loaded || overlay) && <div className={styles.overlay} data-overlay={loaded ? round.phase : 'loading'}>
      {!loaded ? <div role="status"><strong>{loadError ? copy.loadError : copy.loading}</strong>{loadError && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div> :
        round.phase === 'bonus-intro' ? <div role="group" aria-label={copy.jungleBonus} className={styles.intro} data-bonus-intro>
          <div className={styles.introArt} aria-hidden="true">
            <span className={styles.rays} />
            <Image src={symbolAsset('scatter')} alt="" width={160} height={160} unoptimized className={styles.introSun} />
            <Image src="/originals/capybara-gold/mascot.webp" alt="" width={384} height={384} unoptimized className={styles.introMascot} />
          </div>
          <h2>{copy.jungleBonus}</h2>
          <strong>{round.bonusAwarded} <small>{copy.freeSpins}</small></strong>
          <p>{copy.introNote}</p>
          <button type="button" onClick={onContinue}>{copy.begin}</button>
          <span className={styles.introTimer} aria-hidden="true" />
        </div> : round.phase === 'bonus-summary' ? <div role="group" aria-label={copy.bonusComplete} className={styles.summary} data-bonus-summary>
          <Image src="/originals/capybara-gold/mascot.webp" alt="" width={384} height={384} unoptimized className={styles.introMascot} />
          <h2>{copy.bonusComplete}</h2>
          <p>{copy.bonusTotal}</p>
          <strong>{formatCredits(round.bonusTotal, locale)}</strong><p>Liva Credits</p>
          <p className={styles.summaryStats}>{copy.spinsPlayed}: <b>{round.bonusAwarded}</b> · {copy.bonusMultiplier}: <b>×{round.bonusMultiplier}</b></p>
          <button type="button" onClick={onContinue}>{copy.again}</button>
        </div> : <div role="group" aria-label={copy.retry}>
          <Image src="/originals/capybara-gold/mascot.webp" alt="" width={100} height={100} unoptimized />
          <h2>{copy.retry}</h2>
          <p>{round.error === 'settlement-failed' ? copy.settlementError : copy.unavailable}</p>
          <button type="button" onClick={onContinue}>{copy.retry}</button>
        </div>}
    </div>}
  </div>
}
