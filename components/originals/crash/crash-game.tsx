'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { ISLAND_CRASH } from '@/lib/originals/crash/definition'
import { crashCopy, parseAutoInput } from '@/lib/originals/crash/copy'
import { createCrashEngine, isRoundActive } from '@/lib/originals/crash/engine'
import { trackFreePlay } from '@/lib/originals/analytics'
import { ISLAND_CRASH_POSTER } from '@/lib/originals/discovery'
import styles from './crash-game.module.css'

export default function IslandCrashGame() {
  return <DemoSessionProvider><CrashGame /></DemoSessionProvider>
}

export function CrashGame() {
  const { locale, countryCode } = useCountry()
  const { wallet, session } = useDemoSession()
  const [engine] = useState(() => createCrashEngine(wallet))
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [stake, setStake] = useState('100')
  const [auto, setAuto] = useState(false)
  const [target, setTarget] = useState('2.00')
  const [error, setError] = useState<keyof ReturnType<typeof crashCopy>['errors'] | null>(null)
  const [load, setLoad] = useState<'loading' | 'ready' | 'error' | 'unsupported'>('loading')
  const [attempt, setAttempt] = useState(0)
  const host = useRef<HTMLDivElement>(null)
  const sound = useRef<AudioContext | null>(null)
  const completed = useRef<string | null>(null)
  const copy = crashCopy(locale)
  const active = isRoundActive(round.phase)
  const available = round.phase === 'ready'
  const format = (value: number) => new Intl.NumberFormat(locale).format(value)
  const multiplier = (value: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100) + '×'
  useEffect(() => {
    let disposed = false, cleanup: (() => void) | undefined
    void import('./island-scene').then(({ mountIslandScene }) => {
      if (disposed || !host.current) return
      cleanup = mountIslandScene(host.current, engine, {
        ready: () => setLoad('ready'), error: unsupported => setLoad(unsupported ? 'unsupported' : 'error'),
      })
    }).catch(() => { if (!disposed) setLoad('error') })
    return () => { disposed = true; cleanup?.() }
  }, [engine, attempt])
  useEffect(() => {
    // Logic stays independent of render success, animation callbacks and FPS.
    const timer = window.setInterval(() => engine.tick(), 40)
    const visible = () => engine.tick()
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [engine])
  useEffect(() => {
    if (!round.result || completed.current === round.result.roundId) return
    completed.current = round.result.roundId
    trackFreePlay('demo_round_complete', { originalId: ISLAND_CRASH.id, originalSlug: ISLAND_CRASH.slug,
      category: 'crash', country: countryCode, locale, roundId: round.result.roundId })
  }, [round.result, countryCode, locale])
  useEffect(() => {
    const frequency = round.phase === 'flying' ? 180 : round.phase === 'cashed_out' ? 660 : round.phase === 'crashed' ? 90 : 0
    if (!frequency) return
    if (session.settings.haptics && typeof navigator.vibrate === 'function') navigator.vibrate(round.phase === 'crashed' ? [20, 30, 20] : 15)
    const context = sound.current
    if (!session.settings.sound || !context || context.state !== 'running') return
    // Short original synthesized cues; no downloaded or competitor audio.
    const oscillator = context.createOscillator(), gain = context.createGain()
    oscillator.type = round.phase === 'crashed' ? 'triangle' : 'sine'
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(round.phase === 'cashed_out' ? 990 : frequency / 2, context.currentTime + .22)
    gain.gain.setValueAtTime(.075, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .3)
    oscillator.connect(gain); gain.connect(context.destination)
    oscillator.start(); oscillator.stop(context.currentTime + .31)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }, [round.phase, session.settings.sound, session.settings.haptics])
  useEffect(() => () => { void sound.current?.close(); sound.current = null }, [])

  function start() {
    if (load !== 'ready') return
    if (session.settings.sound) {
      try { sound.current ??= new AudioContext(); void sound.current.resume().catch(() => {}) } catch { /* Sound is optional. */ }
    }
    const amount = /^\d+$/.test(stake.trim()) ? Number(stake) : NaN
    const result = engine.start(amount, auto ? parseAutoInput(target) : null)
    setError(result.ok ? null : result.reason)
    if (result.ok) trackFreePlay('demo_round_start', { originalId: ISLAND_CRASH.id, originalSlug: ISLAND_CRASH.slug,
      category: 'crash', country: countryCode, locale, roundId: engine.getSnapshot().roundId ?? undefined })
  }
  const controls = <div className={styles.controls}>
    <fieldset disabled={!available} className={styles.stakeGroup}>
      <label htmlFor="crash-stake">{copy.stake}<span>Liva Credits</span></label>
      <input id="crash-stake" inputMode="numeric" autoComplete="off" value={stake} onChange={event => setStake(event.target.value)} maxLength={10} />
    </fieldset>
    <fieldset disabled={!available} className={styles.autoGroup}>
      <label className={styles.autoToggle}><input type="checkbox" checked={auto} onChange={event => setAuto(event.target.checked)} />{copy.auto}</label>
      <label htmlFor="crash-auto" className="sr-only">{copy.autoTarget}</label>
      <div className={styles.target}><input id="crash-auto" inputMode="decimal" autoComplete="off" value={target} onChange={event => setTarget(event.target.value)} disabled={!auto || !available} maxLength={6} /><span>×</span></div>
    </fieldset>
    <div className={styles.quick}>{[10, 50, 100, 250, 500].map(value => <button type="button" key={value} disabled={!available} aria-pressed={stake === String(value)} onClick={() => setStake(String(value))}>{value}</button>)}</div>
    <div className={styles.actionGroup}>
      {round.phase === 'flying' ? <button className={`${styles.action} ${styles.cashout}`} type="button" onClick={() => engine.cashOut(round.roundId)}>
        <span>{copy.cashOut}</span><strong>{format(Math.floor(round.stake * round.multiplier / 100))}</strong>
      </button> : <button className={styles.action} type="button" disabled={!available || load !== 'ready'} onClick={start}>
        {available ? round.history.length ? copy.again : copy.start : copy[round.phase]}
      </button>}
    </div>
    {error && <p role="alert" className={styles.error}>{copy.errors[error]}</p>}
  </div>

  return <div className={styles.game}>
    <PlayGameShell game={ISLAND_CRASH} roundActive={active} controls={controls} compact>
      <div className={styles.viewport} data-phase={round.phase}>
        <div className={styles.scene} ref={host} />
        <div className={styles.vignette} />
        <div className={styles.sceneBrand}>PLAYLIVA ORIGINALS <span>ISLAND CRASH</span></div>
        <div className={styles.hud}>
          <p className={styles.phase} aria-live="polite">{copy[round.phase]}</p>
          <p className={styles.multiplier} data-safe={!available && round.result?.won || undefined} data-crashed={round.phase === 'crashed' || undefined} aria-label={multiplier(round.multiplier)}>{multiplier(round.multiplier)}</p>
          {round.result && round.phase !== 'ready' && <p className={styles.result} role="status">
            {round.result.won ? `${copy.earned} +${format(round.result.payout)}` : `${copy.lost} ${format(round.result.stake)}`} <span>Liva Credits</span>
          </p>}
        </div>
        {load !== 'ready' && <div className={styles.loader} role="status">
          <Image src={ISLAND_CRASH_POSTER} alt="" fill sizes="(max-width: 700px) 100vw, 960px" priority className={styles.loadingPoster} />
          <span className={styles.islandIcon} aria-hidden="true">✦</span>
          <strong>{load === 'loading' ? copy.loading : load === 'unsupported' ? copy.unsupported : copy.loadError}</strong>
          {load === 'loading' ? <><span>{copy.loadingHint}</span><div className={styles.loadingBar} /></> :
            <button type="button" onClick={() => { setLoad('loading'); setAttempt(value => value + 1) }}>{copy.retry}</button>}
        </div>}
      </div>
    </PlayGameShell>
    <div className={styles.details}>
      <section className={styles.flights} aria-label={copy.yourFlights}>
        <h2>{copy.yourFlights}</h2>
        {round.history.length ? <ol>{round.history.map(result => <li key={result.roundId} data-won={result.won}><span>{result.won ? copy.cashed_out : copy.crashed}</span><strong>{multiplier(result.multiplier)}</strong></li>)}</ol> : <p>{copy.noFlights}</p>}
      </section>
      <details><summary>{copy.how}</summary><p>{copy.description}</p><ol><li>{copy.step1}</li><li>{copy.step2}</li><li>{copy.step3}</li></ol><p>{copy.math}</p><p>{copy.interruption}</p><p>{copy.soundHint}</p></details>
      <p>{copy.notice}</p>
    </div>
  </div>
}
