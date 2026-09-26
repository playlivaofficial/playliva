'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useGameAudio } from '../use-game-audio'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { CAPYBARA_GOLD } from '@/lib/originals/capybara/definition'
import { SLOT_CONFIG, PAYING_SYMBOLS, STAKES, SYMBOLS, type SlotSymbol } from '@/lib/originals/capybara/config'
import { capybaraCopy } from '@/lib/originals/capybara/copy'
import { createSlotEngine, type SlotEngine } from '@/lib/originals/capybara/engine'
import { createSlotAudio } from '@/lib/originals/capybara/audio'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import { CapybaraCabinet } from './capybara-cabinet'
import { useSlotSound } from './slot-sound'
import styles from './capybara.module.css'

export default function CapybaraGoldGame() { return <DemoSessionProvider><CapybaraGame /></DemoSessionProvider> }

/** Supplied engine is for isolated deterministic component QA, never URL/session input. */
export function CapybaraGame({ suppliedEngine }: { suppliedEngine?: SlotEngine }) {
  const { locale, countryCode } = useCountry(), { wallet, session } = useDemoSession()
  const [engine] = useState(() => suppliedEngine ?? createSlotEngine(wallet))
  const round = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot)
  const [stake, setStake] = useState(100), [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false), [loadError, setLoadError] = useState(false), [attempt, setAttempt] = useState(0)
  // One lazily-built audio graph per mounted game (no AudioContext until a gesture).
  const assets = useRef(new Set<SlotSymbol>()), [audio] = useState(createSlotAudio)
  useGameAudio(audio)
  const lastStarted = useRef<string | null>(null), lastCompleted = useRef<string | null>(null)
  const copy = capybaraCopy(locale), ready = round.phase === 'ready' || round.phase === 'bonus-summary'
  const sound = session.settings.sound
  const context = { originalId: CAPYBARA_GOLD.id, originalSlug: CAPYBARA_GOLD.slug, category: CAPYBARA_GOLD.category, locale, country: countryCode }
  useEffect(() => {
    // 16ms keeps each reel stop (and its cue) within one frame of its schedule.
    const timer = window.setInterval(() => engine.tick(), 16)
    const visible = () => engine.tick()
    document.addEventListener('visibilitychange', visible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible) }
  }, [engine])
  // The AudioContext is closed on unmount/navigation and paused while the tab is hidden.
  useEffect(() => {
    const visibility = () => audio.setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', visibility)
    return () => { document.removeEventListener('visibilitychange', visibility); audio.dispose() }
  }, [audio])
  useEffect(() => {
    audio.setEnabled(sound)
    // Turning Sound on is itself a gesture; never create audio on mount.
  }, [audio, sound])
  const bonusMusic = sound && round.phase !== 'bonus-summary' && round.phase !== 'error'
  useEffect(() => { audio.bonusMusic(bonusMusic, round.free) }, [audio, bonusMusic, round.free, round.phase])
  useSlotSound(round, sound ? audio : null, session.settings.haptics)
  useEffect(() => {
    // Tracking failures/consent never control functional accounting.
    const id = round.phase === 'spinning' ? `${round.seriesId}:${round.spinAt}` : null
    if (id && lastStarted.current !== id) {
      lastStarted.current = id
      trackFreePlay('demo_round_start', { originalId: CAPYBARA_GOLD.id, originalSlug: CAPYBARA_GOLD.slug, category: 'slots', locale, country: countryCode, roundId: round.seriesId ?? undefined })
    }
    if (round.result && lastCompleted.current !== round.result.id) {
      lastCompleted.current = round.result.id
      trackFreePlay('demo_round_complete', { originalId: CAPYBARA_GOLD.id, originalSlug: CAPYBARA_GOLD.slug, category: 'slots', locale, country: countryCode, roundId: round.result.id })
    }
  }, [round.phase, round.seriesId, round.spinAt, round.result, locale, countryCode])
  function unlockSound() { if (sound) audio.unlock() }
  function start() {
    if (!loaded) return
    unlockSound()
    const result = engine.spin(stake)
    setError(result.ok ? null : result.reason)
  }
  const format = (value: number) => formatCredits(value, locale)
  const controls = <div className={styles.controls}>
    <label htmlFor="capybara-bet">{copy.bet}<select id="capybara-bet" value={stake} disabled={!ready} onChange={event => { setStake(Number(event.target.value)); setError(null) }}>
      {STAKES.map(value => <option key={value} value={value}>{format(value)}</option>)}
    </select></label>
    <button className={styles.spin} type="button" onClick={start} disabled={!ready || !loaded} data-slot-spin>
      <span aria-hidden="true">↻</span>{(round.free || round.phase === 'bonus-intro') && round.phase !== 'bonus-summary' ? copy.freeSpins : round.phase === 'spinning' ? copy.spinning : copy.spin}
    </button>
    {error && <p role="alert" className={styles.error}>{error === 'insufficient-credits' ? copy.insufficient : copy.unavailable}</p>}
  </div>
  return <div data-turbo={Boolean(session.settings.turbo)} className={styles.game} data-capybara-game data-ready={loaded} data-original-id={context.originalId} onPointerDown={unlockSound}>
    <PlayGameShell game={CAPYBARA_GOLD} compact controls={controls} roundActive={!['ready', 'bonus-summary'].includes(round.phase) && round.error !== 'settlement-failed'}>
      <CapybaraCabinet key={attempt} round={round} locale={locale} loaded={loaded} loadError={loadError}
        onAsset={symbol => { assets.current.add(symbol); if (assets.current.size === SYMBOLS.length) setLoaded(true) }}
        onAssetError={() => setLoadError(true)} onRetry={() => { assets.current.clear(); setLoadError(false); setAttempt(value => value + 1) }}
        onContinue={() => { unlockSound(); engine.continueBonus(); setError(null) }} />
    </PlayGameShell>
    <div className={styles.details}>
      <details><summary>{copy.how}</summary><p>{copy.rules}</p><p>{copy.wildRules}</p><p>{copy.bonusRules}</p><p>{copy.interruption}</p></details>
      <details><summary>{copy.paytable}</summary><p>{copy.paytableNote}</p>
        <table><thead><tr><th>{copy.result}</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>
          {PAYING_SYMBOLS.map(symbol => <tr key={symbol}><th>{copy.symbols[symbol]}</th>{SLOT_CONFIG.paytable[symbol].map((rate, i) => <td key={i}>{new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(rate / SLOT_CONFIG.payScale)}×</td>)}</tr>)}
        </tbody></table>
      </details>
      <p>{copy.notice}</p>
    </div>
  </div>
}
