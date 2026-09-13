'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { LIVA_MINES, DEFAULT_MINES, MINE_COUNTS, MINES_STAKES } from '@/lib/originals/mines/config'
import { createMinesEngine, type MinesEngine, type MinesAction } from '@/lib/originals/mines/engine'
import { minesCopy } from '@/lib/originals/mines/copy'
import { multiplierLabel } from '@/lib/originals/mines/math'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import { MinesBoard } from './mines-board'
import styles from './mines.module.css'

export default function LivaMinesGame() { return <DemoSessionProvider><MinesGame/></DemoSessionProvider> }
/** Injected engine is for isolated local QA only; never public URL/storage inputs. */
export function MinesGame({ suppliedEngine }: { suppliedEngine?: MinesEngine }) {
  const { locale, countryCode } = useCountry(), { wallet, session, storageStatus } = useDemoSession()
  const [engine] = useState(() => suppliedEngine ?? createMinesEngine(wallet))
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [stake, setStake] = useState(1000), [count, setCount] = useState(DEFAULT_MINES), [error, setError] = useState<string | null>(null)
  const audio = useRef<AudioContext | null>(null), opened = useRef(''), completed = useRef(0)
  const copy = minesCopy(locale), ready = round.phase === 'ready', active = round.phase === 'active', result = round.result
  const format = (units: number) => formatCredits(units, locale)
  useEffect(() => {
    const timer = window.setInterval(() => engine.tick(), 20), visible = () => engine.tick()
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); engine.abandon() }
  }, [engine])
  useEffect(() => {
    const context = { originalId: LIVA_MINES.id, originalSlug: LIVA_MINES.slug, category: LIVA_MINES.category, locale, country: countryCode, roundId: round.roundId ?? undefined }
    if (round.roundId && opened.current !== round.roundId) { opened.current = round.roundId; trackFreePlay('demo_round_start', context) }
    if (round.completed > completed.current) { completed.current = round.completed; trackFreePlay('demo_round_complete', context) }
  }, [round.roundId, round.completed, locale, countryCode])
  useEffect(() => () => { void audio.current?.close(); audio.current = null }, [])
  function interaction(action: MinesAction, kind: 'start' | 'pick' | 'cash') {
    setError(action.ok ? null : action.reason)
    if (!action.ok) return
    const current = engine.getSnapshot(), secured = current.phase === 'cashed_out', hit = current.phase === 'mine_hit'
    try {
      if (session.settings.haptics && kind !== 'start' && typeof navigator.vibrate === 'function') navigator.vibrate(hit ? 18 : 8)
      if (!session.settings.sound) return
      const context = audio.current ??= new AudioContext()
      void context.resume().catch(() => {})
      const frequency = hit ? 120 : secured ? 880 : kind === 'pick' ? 500 + Math.min(current.safe.length, 20) * 24 : 280
      const length = hit || secured ? .16 : .055
      const oscillator = context.createOscillator(), gain = context.createGain()
      oscillator.type = hit ? 'triangle' : 'sine'; oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(.035, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + length)
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + length)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    } catch { /* Optional feedback must never block a tile or settlement. */ }
  }
  const controls = <div className={styles.controls}>
    <div className={styles.selectors}>
      <label>{copy.stake}<select data-mines-stake aria-label={copy.stake} value={stake} disabled={!ready} onChange={e => { setStake(Number(e.target.value)); setError(null) }}>
        {MINES_STAKES.map(units => <option key={units} value={units}>{format(units)}</option>)}
      </select></label>
      <label>{copy.count}<select data-mines-count aria-label={copy.count} value={count} disabled={!ready} onChange={e => { setCount(Number(e.target.value)); setError(null) }}>
        {MINE_COUNTS.map(n => <option key={n} value={n}>{n}</option>)}
      </select></label>
    </div>
    {active ? <button className={styles.primary} data-mines-cash disabled={!round.safe.length} onClick={() => interaction(engine.cashOut(round.roundId), 'cash')}>
      {round.safe.length ? <>{copy.cash} <strong>{format(round.potential)}</strong></> : copy.pickFirst}
    </button> : <button className={styles.primary} data-mines-start disabled={!ready} onClick={() => interaction(engine.start(stake, count, round.revision), 'start')}>{result ? copy.again : copy.start}<span aria-hidden="true">→</span></button>}
    {(error || round.error) && <p role="alert" className={styles.error}>{error === 'insufficient-credits' ? copy.insufficient : copy.unavailable}</p>}
    {round.phase === 'error' && <button className={styles.retry} onClick={() => { engine.abandon(); setError(null) }}>{copy.retry}</button>}
  </div>
  return <div className={styles.game} data-mines-game data-ready={storageStatus !== 'loading'}>
    <PlayGameShell game={LIVA_MINES} compact controls={controls} roundActive={!ready && round.phase !== 'error'}>
      <div className={styles.stage} data-mines-phase={round.phase} data-result={result?.kind}>
        <div className={styles.canopy} aria-hidden="true"><i/><i/><i/></div>
        <div className={styles.hud} role="status" data-mines-hud>
          <span className={styles.wordmark} aria-hidden="true">JUNGLE GOLD</span>
          <b className={styles.status}>{result ? result.kind === 'cashout' ? copy.cashed_out : copy.mine_hit : copy[round.phase]}</b>
          <strong className={styles.multiplier} data-mines-multiplier data-long={round.multiplier >= 100_000_000_000 || undefined}>{multiplierLabel(round.multiplier, locale)}</strong>
          <span className={styles.return}>{result ? copy.returned : copy.potential} <b data-mines-return>{format(result ? result.returned : round.potential)}</b> <small>{copy.credits}</small></span>
          <span className={styles.desktopHint}>{copy.choose}</span>
        </div>
        <div className={styles.boardZone}>
          <MinesBoard round={round} locale={locale} pick={index => interaction(engine.pick(index, round.roundId), 'pick')}/>
          <div className={styles.trailCaption}><span>✦ {copy.trail} <b>{round.safe.length}</b></span><span>{copy.mines} <b>{active || result ? round.mineCount : count}</b></span></div>
        </div>
      </div>
    </PlayGameShell>
    <div className={styles.details}>
      <details><summary>{copy.how}</summary>{[copy.rules, copy.payouts, copy.interruption].map(text => <p key={text}>{text}</p>)}</details>
      {result && <p>{copy.last}: {result.kind === 'cashout' ? copy.cashed_out : copy.mine_hit} · {copy.returned} {format(result.returned)} · {copy.profit} {result.profit < 0 ? '−' : ''}{format(Math.abs(result.profit))} {copy.credits}</p>}
      <p>{copy.notice}</p>
    </div>
  </div>
}
