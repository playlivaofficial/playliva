'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { LocaleLink } from '@/components/locale-link'
import { Button } from '@/components/ui/button'
import { AffiliateDisclosureLine } from '@/components/notices'
import { useCountry } from '@/components/country-context'
import { getCountryName } from '@/lib/data'
import { BETSSON_PROMO_PLACEMENTS, betssonPromoExpiresAt, getBetssonPromo } from '@/lib/affiliates/betsson-promo'
import { trackBetssonPromo } from '@/lib/affiliates/betsson-promo-analytics'
import styles from './betsson-discovery-offer.module.css'
import { BrazilAdWarning } from './brazil-ad-warning'

/**
 * Where-to-Play card for the Betsson BR campaign on discovery/game pages.
 * Replaces the generic Betsson operator card with an actual promotional
 * reason to click while keeping the multi-operator grid intact. The claim is
 * the official campaign headline; the boundary line states this is a Betsson
 * casino promotion, not an offer tied to the game being viewed.
 */
export function BetssonDiscoveryOffer({ gameSlug, pageSlug }: { gameSlug?: string; pageSlug?: string }) {
  const { countryCode, locale, t } = useCountry()
  const model = getBetssonPromo(countryCode, locale, BETSSON_PROMO_PLACEMENTS.discoveryGame, { pageSlug: pageSlug ?? gameSlug })
  const card = useRef<HTMLDivElement>(null)
  const seen = useRef(false)
  const route = usePathname()
  const promoId = model?.promoId
  useEffect(() => {
    const node = card.current
    if (!node || !model || seen.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && !seen.current) {
        seen.current = true
        trackBetssonPromo('offer_impression', model, { gameSlug, route })
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoId, gameSlug, route])
  if (!model) return null
  const showArt = model.creative.kind === 'banner'
  return <div ref={card} className={styles.card} data-betsson-discovery-offer="" data-promo-id={model.promoId} data-game-slug={gameSlug}
    data-betting-ad="" data-evidence-state="pending">
    <div className={styles.head}>
      <span className={styles.logo}><Image src={model.logo.assetPath} alt="" fill sizes="48px" /></span>
      <span className={styles.identity}>
        <span className={styles.name}>
          <LocaleLink href={`/operators/${model.operatorSlug}`}>{model.operatorName}</LocaleLink>
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-label={t('label.verified')} />
        </span>
        <span className={styles.market}>{t('geo.availableIn', { country: getCountryName(model.market, locale) })}</span>
      </span>
      <span className={styles.badge}>{t('promo.eyebrow')}</span>
    </div>
    {showArt && <div className={styles.art} style={{ aspectRatio: `${model.creative.width} / ${model.creative.height}` }}>
      <Image src={model.creative.assetPath} alt={model.creative.alt[locale]} fill sizes="(max-width: 639px) 100vw, 400px" />
    </div>}
    <h3 className={styles.headline} lang="pt-BR">{model.headline}</h3>
    {model.subheadline && <p className={styles.subheadline} lang="pt-BR">{model.subheadline}</p>}
    <p className={styles.boundary}>{t('promo.casinoBoundary')}</p>
    <Button size="lg" className={styles.cta}
      render={<a href={model.href} target="_blank" rel="sponsored noopener noreferrer" data-promo-cta=""
        onClick={() => trackBetssonPromo('affiliate_click', model, { gameSlug, route })} />}>
      {model.ctaLabel}<ArrowUpRight className="size-4" aria-hidden="true" />
    </Button>
    <a href={model.href} target="_blank" rel="sponsored noopener noreferrer" className={styles.terms} data-promo-terms=""
      onClick={() => trackBetssonPromo('affiliate_click', model, { gameSlug, route })}>{t('promo.terms')}</a>
    <AffiliateDisclosureLine />
    <BrazilAdWarning operatorId={model.operatorId} expiresAt={betssonPromoExpiresAt()} />
  </div>
}
