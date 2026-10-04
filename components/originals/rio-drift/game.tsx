'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { useGameAudio } from '../use-game-audio'
import { useCountry } from '@/components/country-context'
import { RIO_DRIFT } from '@/lib/originals/rio-drift/definition'
import { driftCopy } from '@/lib/originals/rio-drift/copy'
import { createTurboEngine, payoutFor } from '@/lib/originals/rio-drift/crash-engine'
import { createDriftAudio } from '@/lib/originals/rio-drift/audio'
import { formatCredits } from '@/lib/originals/credits'
import { multiplierBucket, trackFreePlay } from '@/lib/originals/analytics'
import { renderTurbo } from './scene'
import styles from './drift.module.css'

export default function DriftGame() { return <DemoSessionProvider><DriftPlay /></DemoSessionProvider> }
export function DriftPlay() {
  const { locale, countryCode } = useCountry(), { wallet, storageStatus } = useDemoSession(), c = driftCopy(locale)
  const [engine] = useState(() => createTurboEngine(wallet)), [audio] = useState(createDriftAudio)
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [stake, setStake] = useState(100), [auto, setAuto] = useState<number | null>(null), [loaded, setLoaded] = useState(false), [unsupported, setUnsupported] = useState(false), [error, setError] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null), offerHeld = useRef(false), menuOpen = useRef(false)
  const context = useRef({ locale, countryCode }), notified = useRef({ result: '', end: '', complete: '' })
  useEffect(() => { context.current = { locale, countryCode } }, [locale, countryCode])
  useGameAudio(audio)
  const holdOffer = useCallback((on: boolean) => { offerHeld.current = on }, [])
  const holdSettings = useCallback((on: boolean) => { menuOpen.current = on }, [])
  const emit = useCallback((event: 'demo_round_start' | 'demo_round_complete' | 'demo_cashout' | 'demo_crash', id: string, multiplier = 100) => {
    trackFreePlay(event, { originalId: RIO_DRIFT.id, originalSlug: RIO_DRIFT.slug, category: RIO_DRIFT.category,
      country: context.current.countryCode, locale: context.current.locale, roundId: id, multiplierBucket: multiplierBucket(multiplier) })
  }, [])
  useEffect(() => {
    // The clock advances independently of canvas support, React, FPS and tab visibility.
    const update = () => {
      engine.tick()
      const s = engine.getSnapshot(), seen = notified.current
      if (s.result && s.result.roundId !== seen.result) { seen.result = s.result.roundId; if (s.result.won) { audio.cue('cashout'); emit('demo_cashout', s.result.roundId, s.result.multiplier) } }
      if ((s.phase === 'crashed' || s.phase === 'finished') && s.roundId !== seen.end) {
        seen.end = s.roundId!; audio.cue(s.phase === 'crashed' ? 'crash' : 'finish')
        if (s.phase === 'crashed') emit('demo_crash', s.roundId!, s.multiplier)
        if (wallet.getSnapshot().session.settings.haptics) navigator.vibrate?.(s.phase === 'crashed' ? 30 : 15)
      }
      if (s.phase === 'ready' && s.roundId && seen.complete !== s.roundId) { seen.complete = s.roundId; emit('demo_round_complete', s.roundId, s.multiplier) }
      audio.drive(s)
    }
    const timer = window.setInterval(update, 40)
    const visible = () => { audio.setVisible(document.visibilityState !== 'hidden'); update() }
    document.addEventListener('visibilitychange', visible)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); audio.dispose() }
  }, [audio, engine, emit, wallet])
  useEffect(() => {
    const element = canvas.current!, host = stage.current!, ctx = element.getContext('2d', { alpha: false })
    if (!ctx) { queueMicrotask(() => setUnsupported(true)); return }
    let width = 0, height = 0, frame = 0, frames = 0, dirty = true, painted = ''
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => { const r = host.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); width = Math.round(r.width); height = Math.round(r.height); element.width = Math.round(width*dpr); element.height = Math.round(height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); dirty = true }
    resize(); const observer = new ResizeObserver(resize); observer.observe(host)
    const render = () => {
      const s = engine.getSnapshot(), moving = ['launch','running','crashed'].includes(s.phase)
      if (document.visibilityState !== 'hidden' && (dirty || moving && !reduced || painted !== s.phase)) {
        renderTurbo(ctx,width,height,s,performance.now(),reduced); dirty = false; painted = s.phase; element.dataset.frames = String(++frames)
      }
      element.dataset.phase = s.phase; frame = requestAnimationFrame(render)
    }
    queueMicrotask(() => setLoaded(true)); frame = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(frame); observer.disconnect() }
  }, [engine])
  const active = round.phase !== 'ready', canCashOut = round.phase === 'running' && round.wager === 'active'
  const format = (n: number) => formatCredits(n, locale), multiplier = (n: number) => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n/100)+'×'
  function action() {
    if (canCashOut) { engine.cashOut(); return }
    if (!loaded || unsupported || storageStatus === 'loading' || menuOpen.current || offerHeld.current || active) return
    const result = engine.start(stake, auto); setError(!result.ok)
    if (result.ok) { audio.unlock(); audio.cue('start'); emit('demo_round_start', engine.getSnapshot().roundId!) }
  }
  const stateLabel = round.phase === 'ready' && round.result ? c.result : c[round.phase]
  return <div data-rio-drift><PlayGameShell game={RIO_DRIFT} compact roundActive={active} engagementActive={active} onEngagementHold={holdOffer} holdNextRound={holdSettings} controls={<div className={styles.controls}>
    <label>{c.stake}<select aria-label={c.stake} value={stake} disabled={active} onChange={e => setStake(Number(e.target.value))}>{[100,500,1000,2500,5000].map(n => <option value={n} key={n}>{format(n)}</option>)}</select></label>
    <label>{c.auto}<select aria-label={c.auto} value={auto ?? ''} disabled={active} onChange={e => setAuto(e.target.value ? Number(e.target.value) : null)}><option value="">{c.off}</option>{[150,200,300,500,1000,2500].map(n => <option value={n} key={n}>{multiplier(n)}</option>)}</select></label>
    <button data-turbo-action className={`${styles.action} ${canCashOut ? styles.cashOut : ''}`} onClick={action} disabled={!loaded || unsupported || active && !canCashOut}>{canCashOut ? `${c.cashOut} · ${format(payoutFor(round.stake,round.multiplier))}` : active ? round.wager === 'won' ? c.secured : stateLabel : round.result ? c.again : c.start}</button>
    <p>{c.actionHint}</p>{error && <p role="alert">{c.error}</p>}
  </div>}>
    <div ref={stage} className={styles.stage} data-turbo-phase={round.phase} aria-label={c.name}>
      <canvas ref={canvas} className={styles.canvas} aria-label={`${c.name} · ${c.racing}`} />
      <div className={styles.brand}><span>LIVA <b>TURBO CRASH</b></span><small>PLAYLIVA ORIGINAL</small></div>
      <div className={styles.hud} data-result={round.wager}><span>{stateLabel}</span><strong>{multiplier(round.multiplier)}</strong><small>{c.cap}</small></div>
      {!loaded && <div className={styles.loading} role="status">{unsupported ? c.unavailable : c.loading}</div>}
      <div className={styles.receipt} role="status">{round.result ? <><span>{round.result.won ? c.secured : c.lost}</span><strong>{round.result.won ? `${multiplier(round.result.multiplier)} · ${format(round.result.payout)}` : format(round.result.stake)}</strong></> : <p>{c.intro}</p>}</div>
      <div className={styles.history} aria-label={c.recent}>{round.history.slice(0,6).map(item => <span key={item.roundId}>{multiplier(item.multiplier)}</span>)}</div>
    </div>
  </PlayGameShell></div>
}
