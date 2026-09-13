'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { LIVA_ROULETTE, pocketColor, ROULETTE_CHIPS } from '@/lib/originals/roulette/config'
import { aggregateBets, rouletteBet } from '@/lib/originals/roulette/bets'
import { createRouletteEngine, type RouletteEngine, type RouletteResult } from '@/lib/originals/roulette/engine'
import { rouletteBetLabel, rouletteCopy } from '@/lib/originals/roulette/copy'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import { RouletteWheel } from './roulette-wheel'
import { RouletteTable } from './roulette-table'
import styles from './roulette.module.css'

export default function LivaRouletteGame() { return <DemoSessionProvider><RouletteGame /></DemoSessionProvider> }
/** Optional dependencies belong to isolated component QA, not public URL/state inputs. */
export function RouletteGame({ suppliedEngine, presentationNow }: { suppliedEngine?: RouletteEngine; presentationNow?: () => number }) {
  const { locale, countryCode } = useCountry(), { wallet, session, storageStatus } = useDemoSession()
  const [engine] = useState(() => suppliedEngine ?? createRouletteEngine(wallet))
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [chip, setChip] = useState(1000), [error, setError] = useState<string | null>(null)
  const audio = useRef<AudioContext | null>(null), opened = useRef(''), completed = useRef(0)
  const copy = rouletteCopy(locale), ready = round.phase === 'betting', format = (n: number) => formatCredits(n, locale)
  const active = ['closing', 'spinning'].includes(round.phase), result = !active ? round.result : null
  const strongWin = Boolean(result?.bets.some(b => b.won && rouletteBet(b.betId)!.profitOdds >= 8) && result.profit > 0)
  useEffect(() => {
    const timer = window.setInterval(() => engine.tick(), 20), visible = () => engine.tick()
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); engine.abandon() }
  }, [engine])
  useEffect(() => {
    const context = { originalId: LIVA_ROULETTE.id, originalSlug: LIVA_ROULETTE.slug, category: LIVA_ROULETTE.category, locale, country: countryCode, roundId: round.roundId ?? undefined }
    if (round.roundId && opened.current !== round.roundId) { opened.current = round.roundId; trackFreePlay('demo_round_start', context) }
    if (round.completed > completed.current) { completed.current = round.completed; trackFreePlay('demo_round_complete', context) }
  }, [round.roundId, round.completed, locale, countryCode])
  useEffect(() => {
    if (!round.roundId || ready) return
    const soundOn = session.settings.sound, hapticsOn = session.settings.haptics
    function cue(frequency: number, length = .07, haptic = false) {
      if (haptic && hapticsOn && typeof navigator.vibrate === 'function') navigator.vibrate(9)
      const context = audio.current
      if (!soundOn || !context || context.state !== 'running') return
      const oscillator = context.createOscillator(), gain = context.createGain()
      oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.025, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + length)
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + length)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    }
    if (round.phase === 'closing') cue(180, .13)
    if (round.phase === 'settling') cue(430, .08, true)
    if (round.phase === 'result') cue(round.result?.returned ? 640 : 190, .17)
    const timers = round.phase === 'spinning' ? [2300, 2850, 3350].map(ms => window.setTimeout(() => cue(750, .025), ms)) : []
    return () => timers.forEach(clearTimeout)
  }, [round.phase, round.roundId, round.result, ready, session.settings.sound, session.settings.haptics])
  useEffect(() => () => { void audio.current?.close(); audio.current = null }, [])
  function interaction(result: RouletteResult, kind: 'chip' | 'clear' | 'spin' = 'chip') {
    setError(result.ok ? null : result.reason)
    if (!result.ok || !session.settings.sound) return
    try {
      const context = audio.current ??= new AudioContext()
      void context.resume().catch(() => {})
      if (kind !== 'spin') {
        const oscillator = context.createOscillator(), gain = context.createGain()
        oscillator.frequency.value = kind === 'clear' ? 160 : 370
        gain.gain.setValueAtTime(.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .06)
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .06)
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
      }
    } catch { /* Optional audio never blocks a virtual bet. */ }
  }
  const controls = <div className={styles.controls}>
    <div className={styles.primaryControls}>
      <label>{copy.chip}<select data-roulette-chip aria-label={copy.chip} value={chip} disabled={!ready} onChange={e => { setChip(Number(e.target.value)); setError(null) }}>
        {ROULETTE_CHIPS.map(value => <option key={value} value={value}>{format(value)}</option>)}
      </select></label>
      <div className={styles.total}>{copy.total}<b data-roulette-stake>{format(round.totalStake)}</b></div>
      <button type="button" className={styles.spin} data-roulette-spin disabled={!ready || !round.totalStake} onClick={() => interaction(engine.spin(round.revision), 'spin')}>{copy.spin}<span aria-hidden="true">↻</span></button>
    </div>
    <div className={styles.editControls}>
      <button type="button" data-roulette-undo disabled={!ready || !round.placements.length} onClick={() => interaction(engine.undo(), 'clear')}>{copy.undo}</button>
      <button type="button" data-roulette-clear disabled={!ready || !round.placements.length} onClick={() => interaction(engine.clear(), 'clear')}>{copy.clear}</button>
      <button type="button" data-roulette-repeat disabled={!ready || !!round.placements.length || !round.previousBets.length} onClick={() => interaction(engine.repeat())}>{copy.repeat}</button>
    </div>
    {(error || round.error) && <p role="alert" className={styles.error}>{error === 'insufficient-credits' ? copy.insufficient : error === 'stake-limit' ? copy.limit : copy.unavailable}</p>}
    {round.phase === 'error' && <button className={styles.retry} onClick={() => { engine.abandon(); setError(null) }}>{copy.retry}</button>}
  </div>
  return <div className={styles.game} data-roulette-game data-ready={storageStatus !== 'loading'}>
    <PlayGameShell game={LIVA_ROULETTE} compact controls={controls} roundActive={!ready && round.phase !== 'error'}>
      <div className={styles.stage} data-roulette-phase={round.phase} data-airing={!ready || undefined}>
        <div className={styles.orbitZone}>
          <div className={styles.brand}><span>PLAYLIVA ORIGINALS</span><b>{LIVA_ROULETTE.title[locale].split(': ')[1]}</b><small>{copy.wheel} · 0–36</small></div>
          <RouletteWheel round={round} locale={locale} now={presentationNow}/>
          <div className={styles.reveal} role="status" data-roulette-reveal data-big-win={strongWin || undefined}>
            {result ? <><span className={styles.resultNumber} data-result-number data-color={pocketColor(result.number)}>{result.number}</span>
              <div className={styles.resultText}>{ready && <small>{copy.last}</small>}<b>{copy[pocketColor(result.number)]} · {result.number === 0 ? copy.zero : result.number % 2 ? copy.odd : copy.even}</b>
                <span>{result.returned > 0 ? copy.won : copy.lost}{result.returned > 0 && <> · {copy.returned} <strong>{format(result.returned)}</strong></>}</span>
              </div></> : <div className={styles.statusText}><b>{copy[round.phase]}</b><span>{ready ? copy.choose : '0–36 · Liva Credits'}</span></div>}
          </div>
        </div>
        <RouletteTable round={round} locale={locale} place={id => interaction(engine.place(id, chip))}/>
      </div>
    </PlayGameShell>
    <div className={styles.details}>
      <details><summary>{copy.ticket} · {round.placements.length}</summary>
        {round.placements.length ? <ul>{aggregateBets(round.placements).map(b => <li key={b.betId}><span>{rouletteBetLabel(rouletteBet(b.betId)!, locale)}</span><b>{format(b.amount)}</b></li>)}</ul> : <p>{copy.noBets}</p>}
        {result && <p>{copy.last}: {result.number} · {copy.returned}: {format(result.returned)} ({copy.includesStake}) · {copy.profit}: {result.profit < 0 ? '−' : ''}{format(Math.abs(result.profit))}</p>}
      </details>
      <details><summary>{copy.how}</summary>{[copy.rules, copy.controls, copy.payouts, copy.interruption].map(text => <p key={text}>{text}</p>)}</details>
      <p>{copy.notice}</p>
    </div>
  </div>
}
