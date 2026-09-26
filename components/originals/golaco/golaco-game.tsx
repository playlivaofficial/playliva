'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useGameAudio } from '../use-game-audio'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { GOLACO } from '@/lib/originals/golaco/definition'
import { GOLACO_CONFIG, PAYING_SYMBOLS, STAKES, SYMBOLS, type GolacoSymbol } from '@/lib/originals/golaco/config'
import { golacoCopy } from '@/lib/originals/golaco/copy'
import { createGolacoEngine, type GolacoEngine } from '@/lib/originals/golaco/engine'
import { createGolacoAudio } from '@/lib/originals/golaco/audio'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import { GolacoCabinet, winTier } from './golaco-cabinet'
import { useGolacoSound } from './golaco-sound'
import styles from './golaco.module.css'

export default function GolacoGame() { return <DemoSessionProvider><GolacoPlay /></DemoSessionProvider> }

/** Supplied engine is for isolated deterministic component QA, never URL/session input. */
export function GolacoPlay({ suppliedEngine }: { suppliedEngine?: GolacoEngine }) {
  const { locale, countryCode } = useCountry(), { wallet, session } = useDemoSession()
  const [engine] = useState(() => suppliedEngine ?? createGolacoEngine(wallet))
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [stake, setStake] = useState(100), [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false), [loadError, setLoadError] = useState(false), [attempt, setAttempt] = useState(0)
  // One lazily-built audio graph per mounted game (no AudioContext until a gesture).
  const assets = useRef(new Set<GolacoSymbol>()), [audio] = useState(createGolacoAudio)
  useGameAudio(audio)
  const reported = useRef({ spin: '', result: '', streak: '', bonus: '', summary: '' })
  const copy = golacoCopy(locale), ready = round.phase === 'ready' || round.phase === 'bonus-summary'
  const sound = session.settings.sound
  useEffect(() => {
    // 16ms keeps each reel stop (and its cue) within one frame of its schedule.
    const timer = window.setInterval(() => engine.tick(), 16)
    const visible = () => engine.tick()
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [engine])
  useEffect(() => {
    const visibility = () => audio.setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', visibility)
    return () => { document.removeEventListener('visibilitychange', visibility); audio.dispose() }
  }, [audio])
  useEffect(() => {
    audio.setEnabled(sound)
  }, [audio, sound])
  const bonusMusic = sound && round.phase !== 'bonus-summary' && round.phase !== 'error'
  useEffect(() => { audio.bonusMusic(bonusMusic, round.free) }, [audio, bonusMusic, round.free, round.phase])
  useGolacoSound(round, sound ? audio : null, session.settings.haptics)
  // Analytics: each engine event is reported once (refs guard re-renders). Coarse labels only.
  useEffect(() => {
    const base = { originalId: GOLACO.id, originalSlug: GOLACO.slug, category: GOLACO.category, locale, country: countryCode, roundId: round.seriesId ?? undefined }
    const seen = reported.current
    const spinKey = `${round.seriesId}:${round.spinAt}`
    if (round.phase === 'spinning' && seen.spin !== spinKey) {
      seen.spin = spinKey
      trackFreePlay(round.free ? 'demo_free_spin_start' : 'demo_round_start', base)
    }
    if (round.free && round.streak > 1 && seen.streak !== `${round.seriesId}:${round.streak}`) {
      seen.streak = `${round.seriesId}:${round.streak}`
      trackFreePlay('demo_streak_increase', { ...base, streakLevel: String(round.streak) })
    }
    const result = round.result
    if (result && round.phase !== 'spinning' && seen.result !== result.id) {
      seen.result = result.id
      if (result.evaluation.payout > 0) trackFreePlay('demo_slot_win', { ...base, winTier: winTier(result.evaluation.payout, round.stake) })
      if (!result.free) trackFreePlay('demo_round_complete', base)
    }
    if (round.phase === 'bonus-intro' && seen.bonus !== round.seriesId) {
      seen.bonus = round.seriesId ?? ''
      trackFreePlay('demo_bonus_trigger', { ...base, spinsAwarded: String(round.bonusAwarded) })
    }
    if (round.phase === 'bonus-summary' && seen.summary !== round.seriesId) {
      seen.summary = round.seriesId ?? ''
      trackFreePlay('demo_bonus_complete', { ...base, spinsAwarded: String(round.bonusAwarded), streakLevel: String(round.streak) })
    }
  }, [round, locale, countryCode])
  function unlockSound() { if (sound) audio.unlock() }
  function start() {
    if (!loaded) return
    unlockSound()
    const result = engine.spin(stake)
    setError(result.ok ? null : result.reason)
  }
  const format = (value: number) => formatCredits(value, locale)
  const controls = <div className={styles.controls}>
    <label htmlFor="golaco-bet">{copy.bet}<select id="golaco-bet" value={stake} disabled={!ready} onChange={event => { setStake(Number(event.target.value)); setError(null) }}>
      {STAKES.map(value => <option key={value} value={value}>{format(value)}</option>)}
    </select></label>
    <button className={styles.spin} type="button" onClick={start} disabled={!ready || !loaded} data-slot-spin>
      <span aria-hidden="true">⚽</span>{(round.free || round.phase === 'bonus-intro') && round.phase !== 'bonus-summary' ? copy.freeSpins : round.phase === 'spinning' ? copy.spinning : copy.spin}
    </button>
    {error && <p role="alert" className={styles.error}>{error === 'insufficient-credits' ? copy.insufficient : copy.unavailable}</p>}
  </div>
  return <div data-turbo={Boolean(session.settings.turbo)} className={styles.game} data-golaco-game data-ready={loaded} data-original-id={GOLACO.id} onPointerDown={unlockSound}>
    <PlayGameShell game={GOLACO} compact controls={controls} roundActive={!['ready', 'bonus-summary'].includes(round.phase) && round.error !== 'settlement-failed'}>
      <GolacoCabinet key={attempt} round={round} locale={locale} loaded={loaded} loadError={loadError}
        onAsset={symbol => { assets.current.add(symbol); if (assets.current.size >= SYMBOLS.length - 1) setLoaded(true) }}
        onAssetError={() => setLoadError(true)} onRetry={() => { assets.current.clear(); setLoadError(false); setAttempt(value => value + 1) }}
        onContinue={() => { unlockSound(); engine.continueBonus(); setError(null) }} />
    </PlayGameShell>
    <div className={styles.details}>
      <details><summary>{copy.how}</summary><p>{copy.rules}</p><p>{copy.wildRules}</p><p>{copy.bonusRules}</p><p>{copy.interruption}</p></details>
      <details><summary>{copy.paytable}</summary><p>{copy.paytableNote}</p>
        <table><thead><tr><th>{copy.result}</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>
          {PAYING_SYMBOLS.map(symbol => <tr key={symbol}><th>{copy.symbols[symbol]}</th>{GOLACO_CONFIG.paytable[symbol].map((rate, i) => <td key={i}>{new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(rate / GOLACO_CONFIG.payScale)}×</td>)}</tr>)}
        </tbody></table>
      </details>
      <p>{copy.notice}</p>
    </div>
  </div>
}
