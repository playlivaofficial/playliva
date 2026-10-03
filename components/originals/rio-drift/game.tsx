'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, Play, RotateCcw } from 'lucide-react'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { useGameAudio } from '../use-game-audio'
import { useCountry } from '@/components/country-context'
import { RIO_DRIFT } from '@/lib/originals/rio-drift/definition'
import { driftCopy } from '@/lib/originals/rio-drift/copy'
import { newDriftRun, advanceDrift, scoreFor, scoreBucket, steeringInput, trackAt } from '@/lib/originals/rio-drift/engine'
import { createDriftRecordStore } from '@/lib/originals/rio-drift/records'
import { createDriftAudio } from '@/lib/originals/rio-drift/audio'
import { trackFreePlay } from '@/lib/originals/analytics'
import { renderDrift } from './scene'
import styles from './drift.module.css'

export default function DriftGame() { return <DemoSessionProvider><DriftPlay /></DemoSessionProvider> }
export function DriftPlay() {
  const { locale, countryCode } = useCountry(), { wallet, storageStatus } = useDemoSession(), c = driftCopy(locale)
  const [audio] = useState(createDriftAudio), [records] = useState(() => createDriftRecordStore(() => window.localStorage))
  const record = useSyncExternalStore(records.subscribe, records.getSnapshot, records.getServerSnapshot)
  useGameAudio(audio)
  const [run, setRun] = useState(newDriftRun), [paused, setPaused] = useState(false), [loaded, setLoaded] = useState(false), [unsupported, setUnsupported] = useState(false), [personalBest, setPersonalBest] = useState(false)
  const current = useRef(newDriftRun()), pause = useRef(false), offerHeld = useRef(false), menuOpen = useRef(false)
  const inputs = useRef({ keys: new Set<string>(), pointers: new Map<number, -1 | 1>(), drag: 0, dragId: -1, dragStart: 0 })
  const canvas = useRef<HTMLCanvasElement>(null), stage = useRef<HTMLDivElement>(null), remainder = useRef(0)
  const context = useRef({ locale, countryCode })
  useEffect(() => { context.current = { locale, countryCode } }, [locale, countryCode])
  const clearInput = useCallback(() => { const i = inputs.current; i.keys.clear(); i.pointers.clear(); i.drag = 0; i.dragId = -1 }, [])
  const holdOffer = useCallback((on: boolean) => { offerHeld.current = on; clearInput() }, [clearInput])
  const holdSettings = useCallback((on: boolean) => {
    menuOpen.current = on; clearInput()
    if (on && (current.current.phase === 'running' || current.current.phase === 'impact')) { pause.current = true; setPaused(true); setRun({ ...current.current }) }
  }, [clearInput])
  const emit = useCallback((event: 'demo_round_start' | 'demo_round_complete' | 'demo_best_score', id: string, score = 0) => {
    trackFreePlay(event, { originalId: RIO_DRIFT.id, originalSlug: RIO_DRIFT.slug, category: RIO_DRIFT.category,
      country: context.current.countryCode, locale: context.current.locale, roundId: id, scoreBucket: scoreBucket(score) })
  }, [])
  useEffect(() => {
    const element = canvas.current!, host = stage.current!, ctx = element.getContext('2d', { alpha: false })
    if (!ctx) { queueMicrotask(() => setUnsupported(true)); return }
    let width = 0, height = 0, frame = 0, previousAt = 0, hudAt = 0, completed = '', wasPhase = 'ready', combo = 1, near = 0, needsPaint = true, paintedPhase = ''
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => {
      const r = host.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1)
      width = Math.round(r.width); height = Math.round(r.height); element.width = Math.round(width * dpr); element.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      needsPaint = true
    }
    resize(); const observer = new ResizeObserver(resize); observer.observe(host)
    const visibility = () => {
      clearInput(); previousAt = 0; remainder.current = 0
      audio.setVisible(document.visibilityState !== 'hidden')
      if (document.visibilityState === 'hidden' && ['running', 'impact'].includes(current.current.phase)) { pause.current = true; setPaused(true); setRun({ ...current.current }) }
    }
    const blur = () => { clearInput(); if (current.current.phase === 'running') { pause.current = true; setPaused(true); setRun({ ...current.current }) } }
    const key = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key) || current.current.phase !== 'running' || pause.current || menuOpen.current || document.querySelector('dialog[open]')) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input,textarea,select,[contenteditable="true"]') || !host.contains(document.activeElement)) return
      event.preventDefault()
      if (event.type === 'keydown') inputs.current.keys.add(event.key.toLowerCase())
      else inputs.current.keys.delete(event.key.toLowerCase())
    }
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', blur)
    window.addEventListener('keydown', key); window.addEventListener('keyup', key)
    const render = (at: number) => {
      const s = current.current, i = inputs.current
      const left = i.keys.has('arrowleft') || i.keys.has('a') || [...i.pointers.values()].includes(-1)
      const right = i.keys.has('arrowright') || i.keys.has('d') || [...i.pointers.values()].includes(1)
      if (previousAt && !pause.current && document.visibilityState !== 'hidden') remainder.current = advanceDrift(s, steeringInput(left, right, i.drag), (at - previousAt) / 1000, remainder.current)
      previousAt = at
      if (s.phase === 'impact' && wasPhase !== 'impact') { clearInput(); audio.cue('crash'); if (wallet.getSnapshot().session.settings.haptics) navigator.vibrate?.(35) }
      if (s.combo > combo) { audio.cue('combo'); if (wallet.getSnapshot().session.settings.haptics) navigator.vibrate?.(10) }
      if (s.nearMisses > near) audio.cue('near')
      if (s.phase === 'result' && s.id !== completed) {
        completed = s.id; const result = records.complete(s); setPersonalBest(result.best)
        audio.cue('finish'); emit('demo_round_complete', s.id, scoreFor(s)); if (result.best) emit('demo_best_score', s.id, scoreFor(s))
      }
      wasPhase = s.phase; combo = s.combo; near = s.nearMisses
      audio.drive(s, pause.current)
      // 10Hz accessible HUD; canvas rendering is never coupled to React renders.
      const moving = !pause.current && (s.phase === 'running' || s.phase === 'impact')
      if (moving && at - hudAt > 100 || s.phase !== runPhase) { hudAt = at; runPhase = s.phase; setRun({ ...s }) }
      if (moving || needsPaint || s.phase !== paintedPhase) { renderDrift(ctx, width, height, s, reduced); needsPaint = false; paintedPhase = s.phase; element.dataset.frames = String(++renderedFrames) }
      element.dataset.phase = s.phase
      frame = requestAnimationFrame(render)
    }
    let runPhase = 'ready', renderedFrames = 0
    queueMicrotask(() => setLoaded(true)); frame = requestAnimationFrame(render)
    return () => { cancelAnimationFrame(frame); observer.disconnect(); clearInput(); audio.dispose(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', blur); window.removeEventListener('keydown', key); window.removeEventListener('keyup', key) }
  }, [audio, clearInput, records, wallet, emit])
  function start() {
    if (!loaded || storageStatus === 'loading' || menuOpen.current || offerHeld.current || !['ready', 'result'].includes(current.current.phase)) return
    clearInput(); pause.current = false; setPaused(false); setPersonalBest(false); remainder.current = 0
    const id = `rio-${crypto.randomUUID()}`; current.current = newDriftRun(id); setRun({ ...current.current })
    audio.unlock(); audio.cue('start'); emit('demo_round_start', id); stage.current?.focus({ preventScroll: true })
  }
  function resume() { if (menuOpen.current || document.visibilityState === 'hidden') return; clearInput(); remainder.current = 0; pause.current = false; setPaused(false); audio.unlock(); stage.current?.focus({ preventScroll: true }) }
  function direction(event: PointerEvent<HTMLButtonElement>, value: -1 | 1) {
    if (current.current.phase !== 'running' || pause.current) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputs.current.pointers.set(event.pointerId, value); stage.current?.focus({ preventScroll: true })
  }
  function release(event: PointerEvent<HTMLButtonElement>) { inputs.current.pointers.delete(event.pointerId) }
  function dragStart(event: PointerEvent<HTMLCanvasElement>) {
    if (current.current.phase !== 'running' || pause.current || inputs.current.dragId !== -1) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); inputs.current.dragId = event.pointerId; inputs.current.dragStart = event.clientX; stage.current?.focus({ preventScroll: true })
  }
  function dragMove(event: PointerEvent<HTMLCanvasElement>) { const i = inputs.current; if (i.dragId === event.pointerId) i.drag = Math.max(-1, Math.min(1, (event.clientX - i.dragStart) / Math.max(40, event.currentTarget.clientWidth * .2))) }
  function dragEnd(event: PointerEvent<HTMLCanvasElement>) { if (inputs.current.dragId === event.pointerId) { inputs.current.drag = 0; inputs.current.dragId = -1 } }
  const active = run.phase === 'running' || run.phase === 'impact', format = (n: number) => Math.floor(n).toLocaleString(locale)
  return <div data-rio-drift><PlayGameShell game={RIO_DRIFT} compact roundActive={active} engagementActive={active} onEngagementHold={holdOffer} holdNextRound={holdSettings} controls={<div className={styles.controls}>
    <button className={styles.start} onClick={paused ? resume : start} disabled={!loaded || unsupported || (active && !paused)}>{paused ? <Play size={20} /> : run.phase === 'result' ? <RotateCcw size={20} /> : <Play size={20} />}{paused ? c.resume : run.phase === 'result' ? c.again : c.start}</button>
    <p>{c.steer}</p><small>{c.actionHint}</small>
  </div>}>
    <div ref={stage} className={styles.stage} tabIndex={0} role="group" aria-label={`Rio Drift · ${c.steer}`} data-drift-phase={run.phase} data-paused={paused}>
      <canvas ref={canvas} className={styles.canvas} aria-label={`Rio Drift · ${c.racing}`} onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd} onLostPointerCapture={dragEnd} />
      <div className={styles.brand}><span>RIO <b>DRIFT</b></span><small>PLAYLIVA ORIGINAL</small></div>
      <div className={styles.hud} aria-label={c.score}><div><small>{c.score}</small><strong>{format(scoreFor(run))}</strong></div><div><small>{c.combo}</small><strong className={run.drifting ? styles.combo : ''}>×{run.combo}</strong></div><div><small>{c.best}</small><strong>{format(record.record.score)}</strong></div></div>
      <div className={styles.telemetry}><span>{c[trackAt(run.distance).district]}</span><span>{format(run.distance)} m · {format(run.speed * 3.6)} km/h</span></div>
      {!loaded && <div className={styles.overlay}><p role="status">{unsupported ? c.unavailable : c.loading}</p></div>}
      {loaded && (run.phase === 'ready' || run.phase === 'result' || paused) && <div className={styles.overlay}>
        <div className={styles.summary}><span className={styles.kicker}>{paused ? c.paused : personalBest ? c.bestNotice : c[run.phase === 'result' ? 'result' : 'ready']}</span>
          <h2>{run.phase === 'ready' ? 'RIO DRIFT' : paused ? c.paused : format(scoreFor(run))}</h2>
          {run.phase === 'ready' ? <p>{c.intro}</p> : !paused && <dl><div><dt>{c.bestCombo}</dt><dd>×{run.bestCombo}</dd></div><div><dt>{c.distance}</dt><dd>{format(run.distance)} m</dd></div><div><dt>{c.clean}</dt><dd>{run.cleanCorners}</dd></div><div><dt>{c.near}</dt><dd>{run.nearMisses}</dd></div></dl>}
          <button disabled={storageStatus === 'loading'} onClick={paused ? resume : start}><Play size={18} />{paused ? c.resume : run.phase === 'result' ? c.again : c.start}</button>
        </div>
      </div>}
      {run.phase === 'impact' && <p className={styles.impact} role="status">{c.impact}</p>}
      {run.drifting && !paused && <div className={styles.driftLabel}>{c.drift}</div>}
      <div className={styles.touch} aria-label={c.steer}>{([-1, 1] as const).map(value => <button type="button" key={value} disabled={run.phase !== 'running' || paused} aria-label={value < 0 ? c.left : c.right} onPointerDown={e => direction(e, value)} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); inputs.current.keys.add(value < 0 ? 'a' : 'd') } }} onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') inputs.current.keys.delete(value < 0 ? 'a' : 'd') }} onBlur={clearInput}>{value < 0 ? <ArrowLeft size={25} /> : <ArrowRight size={25} />}</button>)}</div>
    </div>
  </PlayGameShell>{!record.saved && <p className={styles.storage} role="status">{c.storage}</p>}</div>
}
