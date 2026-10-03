'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AffiliateDisclosureLine } from '@/components/notices'
import { useCountry } from '@/components/country-context'
import { localeToSegment } from '@/lib/locale'
import { BETSSON_PROMO_PLACEMENTS, betssonPromoExpiresAt, getBetssonPromo, type BetssonPromoModel } from '@/lib/affiliates/betsson-promo'
import { createEngagementTrigger, type EngagementMilestone } from '@/lib/affiliates/betsson-engagement'
import { trackBetssonPromo, type BetssonPromoEventContext } from '@/lib/affiliates/betsson-promo-analytics'
import type { OriginalGameDefinition } from '@/lib/originals/definition'
import styles from './betsson-engagement-offer.module.css'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
import { BrazilAdWarning } from './brazil-ad-warning'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Recurring contextual Betsson offer for Original gameplay routes. Opens only
 * at a natural cycle boundary after every third completed cycle (3, 6, 9 …),
 * once per milestone, never over live gameplay, and dismissing never cancels
 * the next milestone. Rendered outside the game unit as a fixed overlay, so
 * the viewport/controls layout never shifts. Desktop: compact centered card.
 * Mobile: bottom sheet with the game still visible behind it.
 */
export function BetssonEngagementOffer({ game, roundActive, onHold }: { game: OriginalGameDefinition; roundActive: boolean; onHold?: (held: boolean) => void }) {
  const { marketCode, locale, t } = useCountry()
  const [milestone, setMilestone] = useState<EngagementMilestone | null>(null)
  const model = marketCode ? getBetssonPromo(marketCode, locale, BETSSON_PROMO_PLACEMENTS.originalsEngagement, { pageSlug: game.slug }) : null
  const trigger = useRef<ReturnType<typeof createEngagementTrigger> | null>(null)
  const promoId = model?.promoId
  const every = model?.engagement.cycleMultiple
  const delay = model?.engagement.delayMs

  useEffect(() => {
    if (!promoId || every === undefined || delay === undefined) { trigger.current = null; return }
    const instance = createEngagementTrigger({
      cycleMultiple: every, delayMs: delay,
      open: (next) => setMilestone(next),
      close: () => setMilestone(null),
      hold: onHold,
      schedule: (fn, ms) => window.setTimeout(fn, ms),
      cancel: (id) => window.clearTimeout(id),
    })
    trigger.current = instance
    return () => { instance.dispose(); trigger.current = null }
  }, [promoId, every, delay, onHold])

  useEffect(() => { trigger.current?.observe(roundActive) }, [roundActive])

  const dismiss = useCallback(() => {
    trigger.current?.dismiss()
    setMilestone(null)
  }, [])

  if (!milestone || !model) return null
  return <EngagementDialog key={milestone.completedCycleNumber} model={model} game={game} milestone={milestone} onDismiss={dismiss} t={t}
    route={`/${localeToSegment(locale)}/play/${game.slug}`} />
}

function EngagementDialog({ model, game, milestone, onDismiss, t, route }: {
  model: BetssonPromoModel
  game: OriginalGameDefinition
  milestone: EngagementMilestone
  onDismiss: () => void
  t: ReturnType<typeof useCountry>['t']
  route: string
}) {
  const dialog = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const restore = useRef<Element | null>(null)
  const context: BetssonPromoEventContext = { gameSlug: game.slug, originalId: game.id, category: game.category, route, milestone }
  useCommercialImpression(dialog, `${route}:${milestone.completedCycleNumber}`, () => trackBetssonPromo('offer_impression', model, context))
  const dismiss = useCallback(() => {
    trackBetssonPromo('offer_dismiss', model, context)
    onDismiss()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, onDismiss, game.slug, game.id, route, milestone])

  useEffect(() => {
    restore.current = document.activeElement
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

  const copy = model.engagementCopy
  const titleId = `betsson-engagement-title-${milestone.completedCycleNumber}`
  return <div className={styles.overlay} data-betsson-engagement-offer="" data-promo-id={model.promoId} data-placement={model.placement}
    data-completed-cycle={milestone.completedCycleNumber} data-exposure={milestone.exposureNumber}>
    <div className={styles.backdrop} onClick={dismiss} aria-hidden="true" />
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={`${titleId}-condition`}
      className={styles.sheet} data-betting-ad="" data-evidence-state="pending">
      <button ref={closeButton} type="button" className={styles.close} onClick={dismiss} aria-label={t('promo.close')}>
        <X className="size-5" aria-hidden="true" />
      </button>
      <div className={styles.grabber} aria-hidden="true" />
      <div className={styles.brand}>
        <span className={styles.logo}><Image src={model.logo.assetPath} alt="" fill sizes="44px" /></span>
        <span className={styles.brandCopy}>
          <span className={styles.eyebrow}>{t('affiliate.sponsored')} · {t('promo.eyebrow')}</span>
          <span className={styles.operator}>{model.operatorName}</span>
        </span>
      </div>
      <h2 id={titleId} className={styles.headline}>{copy.headline}</h2>
      <p id={`${titleId}-condition`} className={styles.condition} data-promo-condition="">{copy.condition}</p>
      <Button size="lg" className={styles.cta}
        render={<a href={model.href} target="_blank" rel="sponsored noopener noreferrer" data-promo-cta=""
          onClick={() => trackBetssonPromo('affiliate_click', model, context)} />}>
        {copy.cta}
      </Button>
      <div className={styles.secondary}>
        <button type="button" className={styles.keepPlaying} onClick={dismiss}>{t('promo.keepPlaying')}</button>
        <a href={model.href} target="_blank" rel="sponsored noopener noreferrer" className={styles.terms} data-promo-terms=""
          onClick={() => trackBetssonPromo('affiliate_click', model, context)}>{t('promo.terms')}</a>
      </div>
      <AffiliateDisclosureLine className={styles.disclosure} />
      <BrazilAdWarning operatorId={model.operatorId} expiresAt={betssonPromoExpiresAt()} />
    </div>
  </div>
}
