'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { useGameAudio } from '../use-game-audio'
import { AVIA } from '@/lib/originals/avia/definition'
import { aviaCopy } from '@/lib/originals/avia/copy'
import { createAviaAudio } from '@/lib/originals/avia/audio'
import { COUNTDOWN_MS, RESULT_MS, multiplierAt, payoutFor, type AviaSnapshot, type AviaAction } from '@/lib/originals/avia/engine'
import { formatCredits, MAX_CREDIT_UNITS, parseCreditInput } from '@/lib/originals/credits'
import { trackFreePlay, multiplierBucket } from '@/lib/originals/analytics'
import { RioArt, AviaAircraft } from './art'
import { aircraftPresentation } from './aircraft-motion'
import styles from './avia.module.css'

export default function AviaGame() { return <DemoSessionProvider><AviaPlay /></DemoSessionProvider> }
export function AviaPlay() {
  const { locale, countryCode } = useCountry(), { session, wallet } = useDemoSession(), c = aviaCopy(locale)
  const [audio] = useState(createAviaAudio); useGameAudio(audio)
  const [round, setRound] = useState<AviaSnapshot | null>(null), [display, setDisplay] = useState({ multiplier: 100, seconds: 7 })
  const [stake, setStake] = useState('10'), [auto, setAuto] = useState('2.00'), [autoEnabled, setAutoEnabled] = useState(false)
  const [pending, setPending] = useState(false), [error, setError] = useState<'invalid' | 'unavailable' | 'rejected' | null>(null)
  const current = useRef<AviaSnapshot | null>(null), busy = useRef(0), held = useRef(false), received = useRef(0), offline = useRef(false)
  const plane = useRef<HTMLDivElement>(null), coast = useRef<HTMLDivElement>(null), cloud = useRef<HTMLDivElement>(null), progress = useRef<HTMLDivElement>(null)
  const hold = useCallback((on: boolean) => { held.current = on }, [])
  const settingsOpen = useRef(false)
  const holdSettings = useCallback((on: boolean) => { settingsOpen.current = on }, [])
  const format = (units: number) => formatCredits(units, locale)
  const context = useRef({ locale, countryCode })
  useEffect(() => { context.current = { locale, countryCode } }, [locale, countryCode])
  const emitted = useRef(new Set<string>())
  const emit = useCallback((event: 'demo_round_start' | 'demo_round_complete' | 'demo_crash' | 'demo_cashout', s: AviaSnapshot) => {
    const key = `${s.id}:${event}`
    if (emitted.current.has(key)) return
    emitted.current.add(key)
    if (emitted.current.size > 100) emitted.current.delete(emitted.current.values().next().value!)
    trackFreePlay(event, { originalId: AVIA.id, originalSlug: AVIA.slug, category: AVIA.category,
      locale: context.current.locale, country: context.current.countryCode, roundId: s.id,
      multiplierBucket: multiplierBucket(event === 'demo_cashout' ? s.wager!.multiplier : s.multiplier) })
  }, [])

  const request = useCallback(async (action: AviaAction) => {
    if (busy.current && (action.type === 'state' || action.type === 'next')) return
    busy.current++
    try {
      const response = await fetch('/api/originals/avia', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action), signal: AbortSignal.timeout(10000) })
      const data = await response.json() as { view?: AviaSnapshot; guestId: string; error?: string }
      if (!response.ok || !data.view) throw new Error('round-unavailable')
      const s = data.view, previous = current.current
      if (previous && s.serverAt < previous.serverAt) return
      const reconcile = () => {
        for (const receipt of s.receipts) {
          if (!wallet.applyAviaReceipt(data.guestId, receipt).ok) throw new Error('wallet-reconciliation-required')
        }
      }
      if (navigator.locks) await navigator.locks.request('playliva-originals-wallet', reconcile)
      else reconcile()
      if (s.phase === 'result') wallet.releaseRound(s.id)
      else if (s.wager || s.phase === 'flying') wallet.acquireRound(s.id)
      received.current = performance.now(); current.current = s; offline.current = false
      setRound(s); setError(data.error ? 'rejected' : null)
      // Rejoining an already-started flight is not a second start event.
      if (!previous && s.phase !== 'betting') emitted.current.add(`${s.id}:demo_round_start`)
      audio.flight(s.phase === 'flying', s.multiplier)
      if (s.wager && !previous?.wager) audio.cue('bet')
      if (previous && s.phase === 'flying' && previous.phase !== 'flying') { audio.cue('takeoff'); emit('demo_round_start', s) }
      if (previous?.id === s.id && s.wager?.status === 'won' && previous.wager?.status === 'active') { audio.cue('cashout'); emit('demo_cashout', s) }
      if (previous && s.phase === 'result' && previous.phase !== 'result') { audio.cue('crash'); emit('demo_round_start', s); emit('demo_crash', s); emit('demo_round_complete', s) }
      if (s.phase === 'betting' && previous?.id !== s.id) audio.cue('reset')
    } catch { offline.current = true; setError('unavailable') }
    finally { busy.current--; if (action.type === 'bet' || action.type === 'cashout') setPending(false) }
  }, [audio, wallet, emit])

  useEffect(() => {
    let stopped = false, timer: ReturnType<typeof setTimeout>, frame = 0, lastCountdown = -1, renderedAt = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const visible = () => audio.setVisible(document.visibilityState !== 'hidden')
    visible(); document.addEventListener('visibilitychange', visible)
    const poll = async () => {
      const s = current.current, at = s ? s.serverAt + performance.now() - received.current : 0
      if ((document.visibilityState !== 'hidden' || s?.wager?.status === 'active') && !(s?.phase === 'result' && (held.current || settingsOpen.current))) {
        const next = s?.phase === 'result' && at >= s.resultAt! + RESULT_MS && !held.current && !settingsOpen.current
        await request(next ? { type: 'next', roundId: s!.id } : { type: 'state' })
      }
      const latest = current.current
      const delay = offline.current ? 2500 : latest?.phase === 'betting' ? Math.max(100, latest.flightAt - latest.serverAt - (performance.now() - received.current) + 25) : latest?.phase === 'flying' ? 650 : 900
      if (!stopped) timer = setTimeout(poll, delay)
    }
    void poll()
    const render = (at: number) => {
      const s = current.current
      if (s) {
        const delta = Math.max(0, at - received.current), serverNow = s.serverAt + delta
        // Interpolation is presentation only. A stale connection freezes the HUD; it cannot pay credits.
        const elapsed = Math.max(0, s.serverAt + Math.min(delta, 850) - s.flightAt)
        const multiplier = s.phase === 'flying' && !offline.current ? multiplierAt(elapsed) : s.multiplier
        const seconds = Math.max(0, Math.ceil((s.flightAt - serverNow) / 1000))
        if (at - renderedAt > 32) { setDisplay({ multiplier, seconds }); renderedAt = at }
        if (s.phase === 'betting' && seconds !== lastCountdown) { lastCountdown = seconds; if (seconds > 0 && seconds <= 3) audio.cue('countdown') }
        const fly = s.phase === 'flying', result = s.phase === 'result'
        if (plane.current) {
          const pose = aircraftPresentation(s.phase, result ? s.resultAt! - s.flightAt : elapsed, multiplier, result ? serverNow - s.resultAt! : 0, reduced)
          plane.current.style.transform = pose.transform
          plane.current.style.opacity = String(pose.opacity)
          plane.current.style.setProperty('--avia-exhaust-opacity', String(pose.trail))
          plane.current.style.setProperty('--avia-exhaust-length', String(pose.trailLength))
        }
        if (coast.current && !reduced) coast.current.style.transform = `scale(1.06) translate(${fly ? -Math.min(1.8, elapsed / 13000) : 0}%, ${fly ? Math.min(1.5, elapsed / 18000) : 0}%)`
        if (cloud.current && !reduced) cloud.current.style.transform = `translateX(${fly ? -((at / (160 - Math.min(60, Math.log(multiplier / 100) * 10))) % 500) : 0}%)`
        if (progress.current) progress.current.style.transform = `scaleX(${s.phase === 'betting' ? Math.max(0, (s.flightAt - serverNow) / COUNTDOWN_MS) : 0})`
      }
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => { stopped = true; clearTimeout(timer); cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visible); audio.dispose(); if (current.current) wallet.releaseRound(current.current.id) }
  }, [audio, request, wallet])

  function act() {
    const s = current.current
    if (!s || pending) return
    audio.unlock()
    if (s.phase === 'flying' && s.wager?.status === 'active') { setPending(true); void request({ type: 'cashout', roundId: s.id }); return }
    const amount = parseCreditInput(stake), target = autoEnabled ? parseCreditInput(auto) : null
    if (!Number.isSafeInteger(amount) || amount < 100 || amount > 5000 || (target !== null && (!Number.isSafeInteger(target) || target < 101 || target > 10000))) { setError('invalid'); return }
    if (amount > session.balance || session.balance - amount + amount * 100 > MAX_CREDIT_UNITS) { setError('rejected'); return }
    setPending(true); void request({ type: 'bet', roundId: s.id, stake: amount, auto: target })
  }
  const flying = round?.phase === 'flying', active = Boolean(flying || (round?.phase === 'betting' && round.wager))
  const canCash = flying && round?.wager?.status === 'active', canBet = round?.phase === 'betting' && !round.wager && display.seconds > 0
  const label = pending ? c.pending : canCash ? c.cashout : round?.wager?.status === 'won' ? c.cashed : round?.phase === 'betting' ? round.wager ? c.booked : c.bet : round?.phase === 'result' ? c.next : c.watching
  return <div className={styles.game} data-avia-game><PlayGameShell game={AVIA} compact roundActive={active} engagementActive={Boolean(round && round.phase !== 'result')} onEngagementHold={hold} holdNextRound={holdSettings} controls={<div className={styles.controls}>
    <label className={styles.field}><span>{c.stake}</span><input type="text" inputMode="decimal" maxLength={5} value={stake} onChange={e => setStake(e.target.value)} /></label>
    <div className={styles.field}><label><span><input type="checkbox" checked={autoEnabled} onChange={e => setAutoEnabled(e.target.checked)} /> {c.auto}</span></label><input aria-label={c.auto} type="text" inputMode="decimal" maxLength={6} value={auto} disabled={!autoEnabled} onChange={e => setAuto(e.target.value)} /></div>
    <button className={styles.action} data-cashout={Boolean(canCash)} disabled={pending || error === 'unavailable' || (!canCash && !canBet)} onClick={act}>{label}{canCash && <strong>{format(payoutFor(round!.wager!.stake, display.multiplier))}</strong>}</button>
    <p className={styles.hint}>{round?.wager ? `${c.current}: ${format(round.wager.stake)} · ${c.auto}: ${round.wager.auto ? (round.wager.auto / 100).toFixed(2) + '×' : c.off}. ` : ''}{c.draft}</p>
    {error && <p className={styles.error} role="alert">{c[error]}</p>}
  </div>}>
    <div className={styles.stage} data-phase={round?.phase ?? 'betting'}>
      <div className={styles.scenery} ref={coast}><RioArt /></div><div className={styles.shade} />
      <div className={styles.topline}><div className={styles.mark}>SKYLINE<small>LIVA</small></div><span>PLAYLIVA ORIGINAL</span></div>
      <div className={`${styles.cloud} ${styles.cloudOne}`} /><div ref={cloud} className={`${styles.cloud} ${styles.cloudTwo}`} />
      <div ref={plane} className={styles.aircraft} data-avia-aircraft="ipanema"><span className={`${styles.exhaust} ${styles.exhaustFar}`} aria-hidden="true" /><span className={`${styles.exhaust} ${styles.exhaustNear}`} aria-hidden="true" /><AviaAircraft /></div>
      <div className={styles.hud} data-result={round?.phase === 'result'}><span>{round ? c[round.phase] : c.syncing}</span><strong>{(display.multiplier / 100).toFixed(2)}×</strong><div className={styles.subline}>{round?.phase === 'betting' ? `${c.countdown} ${display.seconds}s` : round?.phase === 'result' ? c.next : c.coast}</div></div>
      {round?.wager?.status === 'won' && <div className={styles.status} role="status">✓ {c.cashed} · {format(round.wager.payout)}</div>}
      <div className={styles.footer}><span className={styles.signal}>{c.coast}</span><span>{round ? `#${String(round.number).padStart(4, '0')}` : '—'} · LIVA CREDITS</span></div>
      <div ref={progress} className={styles.progress} />
    </div>
  </PlayGameShell><div className={styles.history} aria-label={c.history}><span>{c.history}</span>{round?.history.map(item => <b key={item.id}>{(item.multiplier / 100).toFixed(2)}×</b>)}</div></div>
}
