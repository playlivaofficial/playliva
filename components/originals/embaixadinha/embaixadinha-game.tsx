'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { EMBAIXADINHA, EMBAIXADINHA_POSTER } from '@/lib/originals/embaixadinha/definition'
import { embaixadinhaCopy, parseAutoInput, type EmbaixadinhaErrors } from '@/lib/originals/embaixadinha/copy'
import { createJuggleEngine, isRoundActive, payoutFor, type JuggleSnapshot } from '@/lib/originals/embaixadinha/engine'
import { createJuggleAudio } from '@/lib/originals/embaixadinha/audio'
import { formatCredits, parseCreditInput, CREDIT_SCALE } from '@/lib/originals/credits'
import { multiplierBucket, trackFreePlay } from '@/lib/originals/analytics'
import type { Locale } from '@/lib/types'
import type { JuggleCueSink } from './juggle-scene'
import styles from './embaixadinha.module.css'

export default function EmbaixadinhaGame() {
  return <DemoSessionProvider><EmbaixadinhaPlay /></DemoSessionProvider>
}

const formatMultiplier = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100) + '×'

/** One production control shared with UI regression tests. Amounts are subunits. */
export function JuggleAction({ round, locale, loaded, onStart, onCashOut, className, cashoutClassName }: {
  round: JuggleSnapshot; locale: Locale; loaded: boolean; onStart: () => void; onCashOut: () => void
  className?: string; cashoutClassName?: string
}) {
  const copy = embaixadinhaCopy(locale)
  if (round.phase === 'juggling' && round.wager === 'active') return <button
    className={`${className ?? ''} ${cashoutClassName ?? ''}`} type="button" onClick={onCashOut} data-action="cashout">
    <span>{copy.cashOut}</span><strong>{formatCredits(payoutFor(round.stake, round.multiplier), locale)}</strong>
  </button>
  if (round.phase !== 'ready' && round.wager === 'cashed_out' && round.result) return <button
    className={className} type="button" disabled data-action="locked">
    <span>{copy.cashed_out}</span><strong>{formatCredits(round.result.payout, locale)}</strong>
  </button>
  return <button className={className} type="button" disabled={round.phase !== 'ready' || !loaded} onClick={onStart} data-action="start">
    {round.phase === 'ready' ? round.history.length ? copy.again : copy.start : copy[round.phase]}
  </button>
}

export function EmbaixadinhaPlay() {
  const { locale, countryCode } = useCountry()
  const { wallet, session } = useDemoSession()
  const [engine] = useState(() => createJuggleEngine(wallet))
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [audio] = useState(createJuggleAudio)
  const [stake, setStake] = useState('100.00')
  const [auto, setAuto] = useState(false)
  const [target, setTarget] = useState('2.00')
  const [error, setError] = useState<EmbaixadinhaErrors | null>(null)
  const [load, setLoad] = useState<'loading' | 'ready' | 'error' | 'unsupported'>('loading')
  const [attempt, setAttempt] = useState(0)
  const host = useRef<HTMLDivElement>(null), hudValue = useRef<HTMLParagraphElement>(null)
  const sound = session.settings.sound, haptics = session.settings.haptics
  const cues = useRef<JuggleCueSink | null>(null), soundWas = useRef(sound)
  const settled = useRef<string | null>(null), cashedFor = useRef<string | null>(null)
  const copy = embaixadinhaCopy(locale)
  const active = isRoundActive(round.phase)
  const available = round.phase === 'ready'
  const context = { originalId: EMBAIXADINHA.id, originalSlug: EMBAIXADINHA.slug, category: EMBAIXADINHA.category, country: countryCode, locale }
  const { roundId, phase, multiplier, result: settledResult } = round

  // Cue sink the renderer calls on the exact frame an event becomes visible.
  useEffect(() => {
    const vibrate = (pattern: number | number[]) => { if (haptics && typeof navigator.vibrate === 'function') navigator.vibrate(pattern) }
    cues.current = {
      touch: (kind, tier, index) => { if (sound) audio.touch(kind, tier, index); if (index > 0 && index % 10 === 0) vibrate(8) },
      crash: variant => { if (sound) audio.crash(variant); vibrate([25, 40, 25]) },
      bounce: strength => { if (sound) audio.bounce(strength) },
    }
  }, [audio, sound, haptics])
  useEffect(() => {
    let disposed = false, cleanup: (() => void) | undefined
    void import('./juggle-scene').then(({ mountJuggleScene }) => {
      if (disposed || !host.current) return
      cleanup = mountJuggleScene(host.current, engine, {
        ready: () => setLoad('ready'), error: unsupported => setLoad(unsupported ? 'unsupported' : 'error'),
        cues: () => cues.current,
        frame: ({ multiplier, crashed }) => {
          const node = hudValue.current
          if (!node) return
          const text = formatMultiplier(multiplier, locale)
          if (node.textContent !== text) node.textContent = text
          if (crashed) node.setAttribute('data-crashed', ''); else node.removeAttribute('data-crashed')
        },
      })
    }).catch(() => { if (!disposed) setLoad('error') })
    return () => { disposed = true; cleanup?.() }
  }, [engine, attempt, locale])
  useEffect(() => {
    // Settlement never depends on rendering: a hidden or failed canvas still settles.
    const timer = window.setInterval(() => engine.tick(), 40)
    const visibility = () => { engine.tick(); audio.setVisible(document.visibilityState !== 'hidden') }
    document.addEventListener('visibilitychange', visibility)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility) }
  }, [engine, audio])
  useEffect(() => {
    audio.setEnabled(sound)
    if (sound && !soundWas.current) audio.unlock()
    soundWas.current = sound
  }, [audio, sound])
  useEffect(() => () => audio.dispose(), [audio])
  useEffect(() => {
    if (round.phase === 'ready') audio.roundEnd()
  }, [audio, round.phase])
  // Each round's cashout and crash are reported once (refs guard re-renders).
  useEffect(() => {
    if (!settledResult?.won || cashedFor.current === settledResult.roundId) return
    cashedFor.current = settledResult.roundId
    if (sound) audio.cashout(settledResult.multiplier)
    trackFreePlay('demo_cashout', { originalId: EMBAIXADINHA.id, originalSlug: EMBAIXADINHA.slug, category: EMBAIXADINHA.category,
      country: countryCode, locale, roundId: settledResult.roundId, multiplierBucket: multiplierBucket(settledResult.multiplier) })
  }, [settledResult, sound, audio, countryCode, locale])
  useEffect(() => {
    if (phase !== 'dropped' || !roundId || settled.current === roundId) return
    settled.current = roundId
    const base = { originalId: EMBAIXADINHA.id, originalSlug: EMBAIXADINHA.slug, category: EMBAIXADINHA.category, country: countryCode, locale, roundId }
    trackFreePlay('demo_crash', { ...base, multiplierBucket: multiplierBucket(multiplier) })
    trackFreePlay('demo_round_complete', base)
  }, [phase, roundId, multiplier, countryCode, locale])

  function start() {
    if (load !== 'ready') return
    audio.unlock() // mobile browsers only allow audio to start inside a real gesture
    const result = engine.start(parseCreditInput(stake), auto ? parseAutoInput(target) : null)
    setError(result.ok ? null : result.reason)
    if (result.ok) {
      if (sound) audio.roundStart()
      trackFreePlay('demo_round_start', { ...context, roundId: engine.getSnapshot().roundId ?? undefined })
    }
  }
  const controls = <div className={styles.controls}>
    <fieldset disabled={!available} className={styles.stakeGroup}>
      <label htmlFor="embaixadinha-stake">{copy.stake}<span>Liva Credits</span></label>
      <input id="embaixadinha-stake" inputMode="decimal" autoComplete="off" value={stake} onChange={event => setStake(event.target.value)} maxLength={13} />
    </fieldset>
    <fieldset disabled={!available} className={styles.autoGroup}>
      <label className={styles.autoToggle}><input type="checkbox" checked={auto} onChange={event => setAuto(event.target.checked)} />{copy.auto}</label>
      <label htmlFor="embaixadinha-auto" className="sr-only">{copy.autoTarget}</label>
      <div className={styles.target}><input id="embaixadinha-auto" inputMode="decimal" autoComplete="off" value={target} onChange={event => setTarget(event.target.value)} disabled={!auto || !available} maxLength={6} /><span>×</span></div>
    </fieldset>
    <div className={styles.quick}>{[10, 50, 100, 250, 500].map(value => <button type="button" key={value} disabled={!available} aria-pressed={parseCreditInput(stake) === value * CREDIT_SCALE} onClick={() => setStake(value.toFixed(2))}>{value}</button>)}</div>
    <div className={styles.actionGroup}>
      <JuggleAction round={round} locale={locale} loaded={load === 'ready'} onStart={start}
        onCashOut={() => engine.cashOut(round.roundId)} className={styles.action} cashoutClassName={styles.cashout} />
    </div>
    {error && <p role="alert" className={styles.error}>{copy.errors[error]}</p>}
  </div>
  const touches = round.phase === 'dropped' && round.failTouch !== null ? round.failTouch : null
  return <div className={styles.game} data-embaixadinha-game data-ready={load === 'ready'} onPointerDown={() => { if (sound) audio.unlock() }}>
    <PlayGameShell game={EMBAIXADINHA} roundActive={active} controls={controls} compact>
      <div className={styles.viewport} data-phase={round.phase} data-wager={round.wager}>
        <div className={styles.scene} ref={host} />
        <div className={styles.vignette} />
        <div className={styles.sceneBrand}>PLAYLIVA ORIGINALS <span>EMBAIXADINHA</span></div>
        <div className={styles.hud}>
          <p className={styles.phase} aria-live="polite">{copy[round.phase]}</p>
          <p ref={hudValue} className={styles.multiplier} data-multiplier data-cashed={round.wager === 'cashed_out' || undefined}
            aria-label={formatMultiplier(round.multiplier, locale)}>{formatMultiplier(round.multiplier, locale)}</p>
        </div>
        {round.result && round.phase !== 'ready' && <p className={styles.result} role="status" data-won={round.result.won}>
          {round.result.won ? <><span>{copy.youCashedOut} <b>{formatMultiplier(round.result.multiplier, locale)}</b></span><strong>{formatCredits(round.result.payout, locale)}</strong></> :
            <><span>{copy.lost}{touches !== null ? ` · ${touches} ${touches === 1 ? copy.touch : copy.touches}` : ''}</span><strong>{formatCredits(round.result.stake, locale)}</strong></>}<span>Liva Credits</span>
        </p>}
        {load !== 'ready' && <div className={styles.loader} role="status">
          <Image src={EMBAIXADINHA_POSTER} alt="" fill sizes="(max-width: 700px) 100vw, 960px" priority className={styles.loadingPoster} />
          <span className={styles.ballIcon} aria-hidden="true">⚽</span>
          <strong>{load === 'loading' ? copy.loading : load === 'unsupported' ? copy.unsupported : copy.loadError}</strong>
          {load === 'loading' ? <><span>{copy.loadingHint}</span><div className={styles.loadingBar} /></> :
            <button type="button" onClick={() => { setLoad('loading'); setAttempt(value => value + 1) }}>{copy.retry}</button>}
        </div>}
      </div>
    </PlayGameShell>
    <div className={styles.details}>
      <section className={styles.rounds} aria-label={copy.history}>
        <h2>{copy.history}</h2>
        {round.history.length ? <ol>{round.history.map(result => <li key={result.roundId} data-won={result.won}><span>{result.won ? copy.cashed_out : copy.crashed}</span><strong>{formatMultiplier(result.multiplier, locale)}</strong></li>)}</ol> : <p>{copy.noHistory}</p>}
      </section>
      <details><summary>{copy.how}</summary><ol><li>{copy.step1}</li><li>{copy.step2}</li><li>{copy.step3}</li></ol><p>{copy.math}</p><p>{copy.interruption}</p><p>{copy.soundHint}</p></details>
      <p>{copy.notice}</p>
    </div>
  </div>
}
