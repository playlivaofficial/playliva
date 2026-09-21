'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AffiliateDisclosureLine } from '@/components/notices'
import { useCountry } from '@/components/country-context'
import { localeToSegment } from '@/lib/locale'
import { BETSSON_PROMO_PLACEMENTS, betssonPromoExpiresAt, getBetssonPromo, type BetssonPromoModel } from '@/lib/affiliates/betsson-promo'
import { createEngagementTrigger } from '@/lib/affiliates/betsson-engagement'
import { trackBetssonPromo } from '@/lib/affiliates/betsson-promo-analytics'
import type { OriginalGameDefinition } from '@/lib/originals/definition'
import styles from './betsson-engagement-offer.module.css'
import { BrazilAdWarning } from './brazil-ad-warning'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function sessionStore() {
  try { return typeof window === 'undefined' ? null : window.sessionStorage } catch { return null }
}

/**
 * Contextual Betsson offer for Original gameplay routes. Opens only at a
 * natural round boundary after the configured number of completed rounds,
 * at most once per browser session, and never over live gameplay. Rendered
 * outside the game unit as a fixed overlay, so the viewport/controls layout
 * never shifts. Desktop: compact centered card. Mobile: bottom sheet.
 */
export function BetssonEngagementOffer({ game, roundActive }: { game: OriginalGameDefinition; roundActive: boolean }) {
  const { countryCode, locale, t } = useCountry()
  const [open, setOpen] = useState(false)
  const model = getBetssonPromo(countryCode, locale, BETSSON_PROMO_PLACEMENTS.originalsEngagement, { pageSlug: game.slug })
  const trigger = useRef<ReturnType<typeof createEngagementTrigger> | null>(null)
  const promoId = model?.promoId
  const rounds = model?.engagement.roundsBeforeOffer
  const delay = model?.engagement.delayMs
  const max = model?.frequencyCap.max

  useEffect(() => {
    if (!promoId || rounds === undefined || delay === undefined || max === undefined) { trigger.current = null; return }
    const instance = createEngagementTrigger({
      promoId, roundsBeforeOffer: rounds, delayMs: delay, max, storage: sessionStore(),
      open: () => setOpen(true),
      close: () => setOpen(false),
      schedule: (fn, ms) => window.setTimeout(fn, ms),
      cancel: (id) => window.clearTimeout(id),
    })
    trigger.current = instance
    return () => { instance.dispose(); trigger.current = null }
  }, [promoId, rounds, delay, max])

  useEffect(() => { trigger.current?.observe(roundActive) }, [roundActive])

  const dismiss = useCallback(() => {
    trigger.current?.dismiss()
    setOpen(false)
  }, [])

  if (!open || !model) return null
  return <EngagementDialog model={model} game={game} onDismiss={dismiss} t={t} route={`/${localeToSegment(locale)}/play/${game.slug}`} />
}

function EngagementDialog({ model, game, onDismiss, t, route }: {
  model: BetssonPromoModel
  game: OriginalGameDefinition
  onDismiss: () => void
  t: ReturnType<typeof useCountry>['t']
  route: string
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const restore = useRef<Element | null>(null)
  const context = { gameSlug: game.slug, originalId: game.id, route }
  const dismiss = useCallback(() => {
    trackBetssonPromo('offer_dismiss', model, context)
    onDismiss()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, onDismiss, game.slug, game.id, route])

  useEffect(() => {
    restore.current = document.activeElement
    trackBetssonPromo('offer_impression', model, context)
    closeButton.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); return }
      if (event.key !== 'Tab' || !dialog.current) return
      const nodes = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (nodes.length === 0) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (restore.current instanceof HTMLElement) restore.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const alt = model.creative.alt[model.locale]
  const showArt = model.creative.kind === 'banner'
  return <div className={styles.overlay} data-betsson-engagement-offer="" data-promo-id={model.promoId} data-placement={model.placement}>
    <div className={styles.backdrop} onClick={dismiss} aria-hidden="true" />
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="betsson-engagement-title" aria-label={t('promo.dialogLabel')}
      className={styles.sheet} data-betting-ad="" data-evidence-state="pending">
      <button ref={closeButton} type="button" className={styles.close} onClick={dismiss} aria-label={t('promo.close')}>
        <X className="size-5" aria-hidden="true" />
      </button>
      <div className={styles.grabber} aria-hidden="true" />
      <div className={styles.brand}>
        <span className={styles.logo}><Image src={model.logo.assetPath} alt="" fill sizes="40px" /></span>
        <span className={styles.brandCopy}>
          <span className={styles.eyebrow}>{t('affiliate.sponsored')} · {t('promo.eyebrow')}</span>
          <span className={styles.operator}>{model.operatorName}</span>
        </span>
      </div>
      {showArt && <div className={styles.art} style={{ aspectRatio: `${model.creative.width} / ${model.creative.height}` }}>
        <Image src={model.creative.assetPath} alt={alt} fill sizes="(max-width: 639px) 100vw, 24rem" />
      </div>}
      <h2 id="betsson-engagement-title" className={styles.headline} lang="pt-BR">{model.headline}</h2>
      {model.subheadline && <p className={styles.subheadline} lang="pt-BR">{model.subheadline}</p>}
      <p className={styles.boundary}>{t('promo.casinoBoundary')}</p>
      <Button size="lg" className={styles.cta}
        render={<a href={model.href} target="_blank" rel="sponsored noopener noreferrer" data-promo-cta=""
          onClick={() => trackBetssonPromo('affiliate_click', model, context)} />}>
        {model.ctaLabel}
      </Button>
      <div className={styles.secondary}>
        <Button variant="ghost" size="sm" onClick={dismiss}>{t('promo.keepPlaying')}</Button>
        <a href={model.href} target="_blank" rel="sponsored noopener noreferrer" className={styles.terms} data-promo-terms=""
          onClick={() => trackBetssonPromo('affiliate_click', model, context)}>{t('promo.terms')}</a>
      </div>
      <AffiliateDisclosureLine className={styles.disclosure} />
      <BrazilAdWarning operatorId={model.operatorId} expiresAt={betssonPromoExpiresAt()} />
    </div>
  </div>
}
