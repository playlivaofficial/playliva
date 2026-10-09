'use client'

import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { LocaleLink } from '@/components/locale-link'
import { Button } from '@/components/ui/button'
import { AffiliateDisclosureLine } from '@/components/notices'
import { useCountry } from '@/components/country-context'
import { getCountryName } from '@/lib/data'
import { PROMO_PLACEMENTS, getPromotion } from '@/lib/affiliates/promotion'
import { trackBetssonPromo } from '@/lib/affiliates/betsson-promo-analytics'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
import styles from './betsson-discovery-offer.module.css'
import { CommercialAdDisclosure } from './commercial-ad-disclosure'
import { useCampaignExpiry } from './use-campaign-expiry'

/**
 * Where-to-Play card for the Betsson BR campaign on discovery/game pages.
 * Replaces the generic Betsson operator card with an actual promotional
 * reason to click while keeping the multi-operator grid intact. The claim is
 * the official campaign headline; the boundary line states this is a Betsson
 * casino promotion, not an offer tied to the game being viewed.
 */
export function BetssonDiscoveryOffer({ gameSlug, pageSlug, operatorId }: { gameSlug?: string; pageSlug?: string; operatorId?: string }) {
  const { marketCode, locale, t, commercial } = useCountry()
  const model = marketCode ? getPromotion(commercial, marketCode, locale, PROMO_PLACEMENTS.discoveryGame, { pageSlug: pageSlug ?? gameSlug, operatorId }) : null
  useCampaignExpiry(model?.expiresAt)
  const card = useRef<HTMLDivElement>(null)
  const route = usePathname()
  useCommercialImpression(card, `${route}:${marketCode}:${locale}:${model?.promoId}`, () => {
    if (model) trackBetssonPromo('offer_impression', model, { gameSlug, route })
  })
  if (!model) return null
  const showArt = model.creative.kind === 'banner'
  return <div ref={card} className={styles.card} data-discovery-offer="" data-promo-id={model.promoId} data-game-slug={gameSlug}
    data-commercial-ad="">
    <div className={styles.head}>
      <span className={styles.logo}><Image src={model.logo.assetPath} alt="" fill sizes="48px" /></span>
      <span className={styles.identity}>
        <span className={styles.name}>
          <LocaleLink href={`/operators/${model.operatorSlug}`}>{model.operatorName}</LocaleLink>
        </span>
        <span className={styles.market}>{t('geo.availableIn', { country: getCountryName(model.market, locale) })}</span>
      </span>
      <span className={styles.badge}>{t('promo.eyebrow')}</span>
    </div>
    {showArt && <div className={styles.art} style={{ aspectRatio: `${model.creative.width} / ${model.creative.height}` }}>
      <Image src={model.creative.assetPath} alt={model.creative.alt[locale] ?? model.operatorName} fill sizes="(max-width: 639px) 100vw, 400px" />
    </div>}
    <h3 className={styles.headline} lang={locale}>{model.headline}</h3>
    {model.subheadline && <p className={styles.subheadline} lang={locale}>{model.subheadline}</p>}
    <p className={styles.boundary}>{t('promo.casinoBoundary', { name: model.operatorName })}</p>
    <Button size="lg" className={styles.cta}
      render={<a href={model.href} target="_blank" rel="sponsored noopener noreferrer" data-promo-cta=""
        onClick={() => trackBetssonPromo('affiliate_click', model, { gameSlug, route })} />}>
      {model.ctaLabel}<ArrowUpRight className="size-4" aria-hidden="true" />
    </Button>
    <a href={model.href} target="_blank" rel="sponsored noopener noreferrer" className={styles.terms} data-promo-terms=""
      onClick={() => trackBetssonPromo('affiliate_click', model, { gameSlug, route })}>{t('promo.terms')}</a>
    <AffiliateDisclosureLine />
    <CommercialAdDisclosure operatorId={model.operatorId} />
  </div>
}
