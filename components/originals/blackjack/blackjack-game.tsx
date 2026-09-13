'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { LIVA_BLACKJACK } from '@/lib/originals/blackjack/definition'
import { BLACKJACK_STAKES } from '@/lib/originals/blackjack/config'
import { createBlackjackEngine, type BlackjackAction, type BlackjackEngine } from '@/lib/originals/blackjack/engine'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import { BlackjackTable } from './blackjack-table'
import styles from './blackjack.module.css'

export default function LivaBlackjackGame() { return <DemoSessionProvider><BlackjackGame /></DemoSessionProvider> }
/** Supplied engine is only for isolated component QA, never a public input. */
export function BlackjackGame({ suppliedEngine }: { suppliedEngine?: BlackjackEngine }) {
  const { locale, countryCode } = useCountry(), { wallet, session, storageStatus } = useDemoSession()
  const [engine] = useState(() => suppliedEngine ?? createBlackjackEngine(wallet))
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [stake, setStake] = useState(1000), [error, setError] = useState<string | null>(null)
  const sound = useRef<AudioContext | null>(null), lastCue = useRef(''), opened = useRef(''), completed = useRef('')
  const copy = blackjackCopy(locale), ready = round.phase === 'ready', format = (n: number) => formatCredits(n, locale)
  useEffect(() => {
    const timer = window.setInterval(() => engine.tick(), 30)
    const visible = () => engine.tick()
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); engine.abandon() }
  }, [engine])
  useEffect(() => {
    const context = { originalId: LIVA_BLACKJACK.id, originalSlug: LIVA_BLACKJACK.slug, category: LIVA_BLACKJACK.category, locale, country: countryCode, roundId: round.roundId ?? undefined }
    if (round.roundId && opened.current !== round.roundId) { opened.current = round.roundId; trackFreePlay('demo_round_start', context) }
    if (round.hands.some(h => h.result) && round.roundId && completed.current !== round.roundId) { completed.current = round.roundId; trackFreePlay('demo_round_complete', context) }
  }, [round.roundId, round.hands, locale, countryCode])
  const cardCount = round.hands.reduce((n, h) => n + h.cards.length, 0) + round.dealer.length
  useEffect(() => {
    const key = `${round.roundId}:${cardCount}:${round.dealerRevealed}:${round.phase === 'result'}`
    if (!round.roundId || key === lastCue.current || round.phase === 'ready') return
    lastCue.current = key
    if (session.settings.haptics && typeof navigator.vibrate === 'function') navigator.vibrate(8)
    const audio = sound.current
    if (!session.settings.sound || !audio || audio.state !== 'running') return
    const oscillator = audio.createOscillator(), gain = audio.createGain()
    const frequency = round.phase === 'result' ? (round.totalReturn > 0 ? 660 : 170) : 260
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.25, audio.currentTime + .07)
    gain.gain.setValueAtTime(.035, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12)
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .13)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }, [round.roundId, cardCount, round.dealerRevealed, round.phase, round.totalReturn, session.settings.sound, session.settings.haptics])
  useEffect(() => () => { void sound.current?.close(); sound.current = null }, [])
  function unlock() { if (session.settings.sound) { try { sound.current ??= new AudioContext(); void sound.current.resume().catch(() => {}) } catch { /* Sound is optional. */ } } }
  function deal() { unlock(); const result = engine.deal(stake); setError(result.ok ? null : result.reason) }
  function act(action: BlackjackAction) {
    unlock(); const result = engine.act(action, round.revision)
    if (result.ok) setError(null)
    else if (!['stale-action', 'illegal-action'].includes(result.reason)) setError(result.reason)
  }
  const controls = <div className={styles.controls}>
    <div className={styles.betRow}>
      <label htmlFor="blackjack-bet">{copy.bet}<select id="blackjack-bet" disabled={!ready} value={stake} onChange={e => { setStake(Number(e.target.value)); setError(null) }}>
        {BLACKJACK_STAKES.map(value => <option key={value} value={value}>{format(value)}</option>)}
      </select></label>
      {ready ? <button type="button" className={styles.deal} onClick={deal} data-blackjack-deal>{round.completed ? copy.again : copy.deal}<span aria-hidden="true">↗</span></button> :
        <div className={styles.totalBet}>{copy.totalBet}<b>{format(round.totalStake)}</b></div>}
    </div>
    {!ready && <div className={styles.actions}>{(['hit', 'stand', 'double', 'split'] as const).map(action =>
      <button type="button" key={action} className={styles[action]} disabled={!round.actions[action]} onClick={() => act(action)} data-blackjack-action={action}>
        <span aria-hidden="true">{{ hit: '+', stand: '−', double: '×2', split: '⑂' }[action]}</span>{copy[action]}
      </button>)}</div>}
    {(error || round.error) && <p role="alert" className={styles.error}>{error === 'insufficient-credits' ? copy.insufficient : copy.unavailable}</p>}
    {round.phase === 'error' && <button onClick={() => { engine.abandon(); setError(null) }} className={styles.retry}>{copy.retry}</button>}
  </div>
  return <div className={styles.game} data-blackjack-game data-ready={storageStatus !== 'loading'}>
    <PlayGameShell game={LIVA_BLACKJACK} compact controls={controls} roundActive={!ready && round.phase !== 'error'}>
      <BlackjackTable round={round} locale={locale} />
    </PlayGameShell>
    <div className={styles.details}><details><summary>{copy.how}</summary>
      {[copy.rules, copy.actionRules, copy.aceRules, copy.payouts, copy.interruption].map(text => <p key={text}>{text}</p>)}
    </details><p>{copy.notice}</p></div>
  </div>
}
