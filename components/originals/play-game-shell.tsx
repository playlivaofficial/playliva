'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import { useDemoSession } from './demo-session'
import { PlayRealCTA } from './play-real-cta'
import { originalsCopy } from '@/lib/originals/copy'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import type { OriginalGameDefinition } from '@/lib/originals/definition'
import { LocaleLink } from '@/components/locale-link'
import { productCopy } from '@/lib/product-discovery'

function subscribeFullscreen(listener: () => void) {
  document.addEventListener('fullscreenchange', listener)
  return () => document.removeEventListener('fullscreenchange', listener)
}

/** Shared by the five implemented Originals; game engines remain route-isolated. */
export function PlayGameShell({ game, children, controls, roundActive = false, compact = false }: {
  game: OriginalGameDefinition
  children: ReactNode
  controls: ReactNode
  roundActive?: boolean
  compact?: boolean
}) {
  const { locale, countryCode } = useCountry()
  const { session, storageStatus, wallet } = useDemoSession()
  const copy = originalsCopy(locale)
  const format = (value: number) => formatCredits(value, locale)
  const root = useRef<HTMLElement>(null)
  const opened = useRef<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState(false)
  const capabilities = useSyncExternalStore(subscribeFullscreen, () =>
    `${Boolean(document.fullscreenEnabled && root.current?.requestFullscreen)}:${typeof navigator.vibrate === 'function'}:${document.fullscreenElement === root.current}`,
  () => 'false:false:false').split(':')
  const { id, slug, category } = game
  useEffect(() => {
    if (opened.current === id) return
    opened.current = id
    trackFreePlay('free_play_open', { originalId: id, originalSlug: slug, category, country: countryCode, locale })
  }, [id, slug, category, countryCode, locale])
  async function toggleFullscreen() {
    try {
      setFullscreenError(false)
      if (document.fullscreenElement === root.current) await document.exitFullscreen()
      else await root.current?.requestFullscreen()
    } catch { setFullscreenError(true) }
  }
  const ready = storageStatus !== 'loading'
  return <section ref={root} data-game-shell className={`mx-auto w-full max-w-7xl overflow-auto bg-background text-foreground ${compact ? 'space-y-3 p-3 sm:p-4' : 'space-y-5 p-4 sm:p-6'}`}>
    <header className={compact ? 'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3' : 'flex flex-wrap items-start justify-between gap-4'}>
      <div><p className="text-sm font-semibold text-primary"><LocaleLink href="/play" aria-label={productCopy(locale).lobbyBack} className="hover:underline">‹ PlayLiva Originals</LocaleLink></p>
        <h1 className={`font-display font-bold ${compact ? 'text-lg leading-tight sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>{game.title[locale]}</h1>
        <p className="mt-2 text-xs font-semibold tracking-wide">{copy.freePlay} · {copy.demo}</p></div>
      <div className={`rounded-xl border border-border bg-card ${compact ? 'p-2 sm:px-4' : 'px-4 py-3'}`}>
        <p className="text-xs text-muted-foreground">{copy.balance}</p>
        <p className={`font-display font-bold ${compact ? 'text-base sm:text-xl' : 'text-xl'}`} aria-live="polite">{format(session.balance)} <span className={compact ? 'block text-[10px] sm:inline sm:text-xs' : 'text-sm'}>{copy.credits}</span></p>
      </div>
    </header>
    <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>{copy.boundary}</p>
    {storageStatus === 'memory-only' && <p role="status" className="text-sm text-muted-foreground">{copy.memoryOnly}</p>}
    {storageStatus === 'recovered' && <p role="status" className="text-sm text-muted-foreground">{copy.recovered}</p>}
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        <div aria-label={copy.viewport} data-game-viewport className="min-h-64 overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
        <PlayRealCTA game={game} />
        <fieldset disabled={!ready} aria-label={copy.controls} data-game-controls className="min-w-0 rounded-2xl border border-border bg-card p-4">{controls}</fieldset>
      </div>
      <aside data-session-panel aria-label={productCopy(locale).settings} className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" disabled={!ready} aria-pressed={session.settings.sound}
            onClick={() => wallet.setSettings({ ...session.settings, sound: !session.settings.sound })}>{copy.sound}</Button>
          {capabilities[1] === 'true' && <Button variant="outline" disabled={!ready} aria-pressed={session.settings.haptics}
            onClick={() => wallet.setSettings({ ...session.settings, haptics: !session.settings.haptics })}>{copy.haptics}</Button>}
          {capabilities[0] === 'true' && <Button variant="outline" onClick={toggleFullscreen}>{capabilities[2] === 'true' ? copy.exitFullscreen : copy.fullscreen}</Button>}
        </div>
        {fullscreenError && <p role="status" className="text-sm">{copy.fullscreenUnavailable}</p>}
        <Button variant="outline" disabled={!ready || roundActive} onClick={() => setResetOpen(true)}>{copy.reset}</Button>
        {resetOpen && <div className="space-y-2" role="group" aria-label={copy.resetConfirm}>
          <p className="text-sm">{copy.resetConfirm}</p>
          <Button disabled={!ready || roundActive} onClick={() => {
            if (wallet.reset().ok) {
              trackFreePlay('demo_balance_reset', { originalId: id, originalSlug: slug, category, country: countryCode, locale })
              setResetOpen(false)
            }
          }}>{copy.confirm}</Button>{' '}<Button variant="ghost" onClick={() => setResetOpen(false)}>{copy.cancel}</Button>
        </div>}
        <h2 className="font-semibold">{copy.history}</h2>
        {session.transactions.length === 0 ? <p className="text-sm text-muted-foreground">{copy.empty}</p> :
          <ol className="max-h-64 space-y-2 overflow-auto text-sm">{session.transactions.slice().reverse().map(item =>
            <li key={item.sequence} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
              <span>{item.kind === 'reset' ? copy.resetEntry : copy[item.kind]}</span>
              <span>{format(item.amount)} {copy.credits}</span>
            </li>,
          )}</ol>}
      </aside>
    </div>
  </section>
}
