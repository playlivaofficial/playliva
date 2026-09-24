'use client'

import Image from 'next/image'
import { useEffect, useState, type CSSProperties } from 'react'
import type { Locale } from '@/lib/types'
import { golacoCopy } from '@/lib/originals/golaco/copy'
import { GOLACO_CONFIG, ROWS, SYMBOLS, type GolacoSymbol } from '@/lib/originals/golaco/config'
import type { GolacoSnapshot } from '@/lib/originals/golaco/engine'
import { golacoSymbolAsset } from '@/lib/originals/golaco/definition'
import { formatCredits } from '@/lib/originals/credits'
import styles from './golaco.module.css'

export function winTier(payout: number, stake: number) {
  return payout >= stake * 50 ? 'mega' : payout >= stake * 25 ? 'super' : payout >= stake * 10 ? 'big' : payout >= stake * 2 ? 'medium' : 'small'
}
function CountUp({ value, locale }: { value: number; locale: Locale }) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const start = performance.now(), duration = value > 0 ? 320 : 0
    const update = (at: number) => {
      const progress = duration ? Math.min(1, (at - start) / duration) : 1
      setDisplay(Math.floor(value * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <strong aria-label={formatCredits(value, locale)}>{formatCredits(display, locale)}</strong>
}
const count = (reels: readonly (readonly GolacoSymbol[])[], symbol: GolacoSymbol) => reels.flat().filter(value => value === symbol).length

/** Pure presentation: only engine snapshots can land reels, highlight or announce wins. */
export function GolacoCabinet({ round, locale, loaded, loadError, onAsset, onAssetError, onContinue, onRetry }: {
  round: GolacoSnapshot; locale: Locale; loaded: boolean; loadError: boolean
  onAsset: (symbol: GolacoSymbol) => void; onAssetError: () => void; onContinue: () => void; onRetry: () => void
}) {
  const copy = golacoCopy(locale), spinning = round.phase === 'spinning'
  const settled = spinning ? null : round.result
  const evaluation = settled?.evaluation, payout = evaluation?.payout ?? 0
  const tier = winTier(payout, round.stake)
  const bonus = round.free || round.bonusRemaining > 0 || round.phase === 'bonus-summary'
  const overlay = round.phase === 'bonus-intro' || round.phase === 'bonus-summary' || round.phase === 'error'
  const headline = tier === 'mega' ? copy.megaWin : tier === 'super' ? copy.superWin : tier === 'big' ? copy.bigWin : copy.win
  const landedReels = spinning ? round.stopped : round.grid.length
  const visibleTrophies = count(round.grid.slice(0, landedReels), 'taca')
  const streakKey = `${round.seriesId}-${round.streak}`
  return <div className={styles.cabinet} data-slot-phase={round.phase} data-tier={payout ? tier : 'none'} data-bonus={bonus || undefined}
    data-anticipation={spinning && round.anticipation || undefined} data-streak={bonus ? round.streak : undefined}>
    <div className={styles.stadium} aria-hidden="true" />
    <div className={styles.floodlights} aria-hidden="true"><span /><span /></div>
    <header className={styles.cabinetHeader}>
      <div className={styles.wordmark}><span>PLAYLIVA ORIGINALS</span><b>GOLAÇO</b><small>{bonus ? copy.finalBonus : copy.ways}</small></div>
      {bonus ? <div className={styles.scoreboard} data-bonus-hud>
        <span className={styles.board} aria-live="polite">
          <small>{copy.freeSpins}</small>
          <b data-free-spins-counter>{round.bonusRemaining}<i>/{round.bonusAwarded}</i></b>
          {round.free && round.retriggered > 0 && <em key={`${round.spinAt}-${round.retriggered}`} className={styles.pop} data-retrigger>
            +{round.retriggered} {round.retriggered === 1 ? copy.plusSpin : copy.freeSpins}</em>}
        </span>
        <span className={styles.board} aria-live="polite">
          <small>{copy.streak}</small>
          <b key={`streak-${streakKey}`} data-goal-streak={round.streak} data-max={round.streak >= GOLACO_CONFIG.maxStreak || undefined}>×{round.streak}</b>
          <span className={styles.net} aria-hidden="true">{Array.from({ length: GOLACO_CONFIG.maxStreak }, (_, i) => <i key={i} data-on={i < round.streak || undefined} />)}</span>
          {round.free && round.streak > 1 && <em key={`pop-${streakKey}`} className={styles.pop} data-goal aria-hidden="true">{copy.goal} ×{round.streak}</em>}
        </span>
      </div> : <div className={styles.featureBar}><span>{copy.wild} = 10</span><span data-trophy-rule>3 · 4 · 5 🏆 = {GOLACO_CONFIG.scatterAwards.join(' · ')} {copy.freeSpins}</span></div>}
    </header>
    <div className={styles.frame} role="group" aria-label={copy.result} aria-busy={spinning}>
      {round.grid.map((reel, column) => {
        const landed = column < landedReels
        return <div className={styles.reel} key={column} style={{ '--reel': column } as CSSProperties}
          data-landing={landed && round.spinAt > 0 || undefined} data-anticipation={spinning && round.anticipation && !landed || undefined}>
          <div className={styles.cells} key={landed ? `landed-${round.spinAt}` : 'spinning'}>
            {reel.map((symbol, row) => <div key={row} className={styles.cell} data-symbol={symbol}
              data-winning={evaluation?.winningCells.includes(column * ROWS + row) || undefined}
              data-trophy={landed && symbol === 'taca' && visibleTrophies >= 2 || undefined}>
              <Image src={golacoSymbolAsset(symbol)} alt={`${copy.reel} ${column + 1}, ${copy.row} ${row + 1}: ${copy.symbols[symbol]}`}
                width={192} height={192} unoptimized priority onLoad={() => onAsset(symbol)} onError={onAssetError} />
              {(symbol === 'camisa' || symbol === 'taca' || symbol === 'gol') && <span className={styles.symbolBadge} aria-hidden="true">
                {symbol === 'camisa' ? copy.wild : symbol === 'taca' ? copy.scatter : copy.goal}</span>}
            </div>)}
          </div>
          {spinning && !landed && <div className={styles.spinMask} aria-hidden="true"><div className={styles.strip}>
            {[...SYMBOLS, ...SYMBOLS].filter(symbol => round.free || symbol !== 'gol').map((symbol, index) => <Image src={golacoSymbolAsset(symbol)} key={index} alt="" width={192} height={192} unoptimized />)}
          </div></div>}
        </div>
      })}
    </div>
    <div className={styles.result} role="status" aria-live="polite" data-tier={payout ? tier : undefined}
      aria-label={payout > 0 ? `${headline}: ${formatCredits(payout, locale)} Liva Credits${evaluation && evaluation.multiplier > 1 ? `, ×${evaluation.multiplier}` : ''}` : undefined}>
      {spinning ? <span>{copy.spinning}</span> : payout > 0 ? <>
        <span>{headline}{evaluation && evaluation.multiplier > 1 ? ` · ×${evaluation.multiplier}` : ''}</span>
        <CountUp key={settled?.id} value={payout} locale={locale} /><small>Liva Credits</small>
      </> : <span>{settled ? copy.noWin : copy.ready}</span>}
    </div>
    {(!loaded || overlay) && <div className={styles.overlay} data-overlay={loaded ? round.phase : 'loading'}>
      {!loaded ? <div role="status"><strong>{loadError ? copy.loadError : copy.loading}</strong>{loadError && <button type="button" onClick={onRetry}>{copy.retry}</button>}</div> :
        round.phase === 'bonus-intro' ? <div role="group" aria-label={copy.finalBonus} className={styles.intro} data-bonus-intro>
          <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
          <div className={styles.introArt} aria-hidden="true">
            <Image src={golacoSymbolAsset('taca')} alt="" width={192} height={192} unoptimized className={styles.introTrophy} />
            <Image src={golacoSymbolAsset('gol')} alt="" width={192} height={192} unoptimized className={styles.introBall} />
          </div>
          <h2>{copy.finalBonus}</h2>
          <strong>{round.bonusAwarded} <small>{copy.freeSpins}</small></strong>
          <p>{copy.introNote}</p>
          <button type="button" onClick={onContinue}>{copy.begin}</button>
          <span className={styles.introTimer} aria-hidden="true" />
        </div> : round.phase === 'bonus-summary' ? <div role="group" aria-label={copy.bonusComplete} className={styles.summary} data-bonus-summary>
          <Image src={golacoSymbolAsset('taca')} alt="" width={192} height={192} unoptimized className={styles.introTrophy} />
          <h2>{copy.bonusComplete}</h2>
          <p>{copy.bonusTotal}</p>
          <strong>{formatCredits(round.bonusTotal, locale)}</strong><p>Liva Credits</p>
          <p className={styles.summaryStats}>{copy.spinsPlayed}: <b>{round.bonusAwarded}</b> · {copy.streak}: <b>×{round.streak}</b></p>
          <button type="button" onClick={onContinue}>{copy.again}</button>
        </div> : <div role="group" aria-label={copy.retry}>
          <h2>{copy.retry}</h2>
          <p>{round.error === 'settlement-failed' ? copy.settlementError : copy.unavailable}</p>
          <button type="button" onClick={onContinue}>{copy.retry}</button>
        </div>}
    </div>}
  </div>
}
