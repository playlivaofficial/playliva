'use client'

import { campaignForGoHref } from '@/lib/affiliates/click-context'
import { useRef } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AffiliateDisclosureLine } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import {
  getSponsoredBanner,
  resolveBannerLayout,
  type BannerLayout,
  type BannerSurface,
  type SponsoredBannerModel,
} from '@/lib/affiliates/promotion'
import { track, type TrackPayload } from '@/lib/tracking'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
import styles from './betsson-banner.module.css'
import { CommercialAdDisclosure } from './commercial-ad-disclosure'
import type { CommercialSnapshot } from '@/lib/commercial/types'
import { useCampaignExpiry } from './use-campaign-expiry'

/** Compatibility wrapper for the shared compact homepage placement. */
export function BetssonHomeBanner() {
  return <BetssonSponsoredBanner surface="homepage" layout="compact-header" cta="explore" />
}

function promoPayload(banner: SponsoredBannerModel, route: string, commercial: CommercialSnapshot): TrackPayload {
  return {
    campaignKey: campaignForGoHref(banner.href, commercial),
    promoId: banner.promo?.promoId,
    brand: banner.promo?.brand,
    offerId: banner.promo?.offerId,
    placement: banner.placement,
    ctaLocation: banner.placement,
    surface: banner.surface === 'originals' ? 'originals' : banner.surface === 'offers' ? 'offers' : 'discovery',
    pageType: banner.pageType as TrackPayload['pageType'],
    operatorId: banner.operatorId,
    operatorSlug: banner.operatorSlug,
    destination: banner.promo?.offerId ?? banner.operatorSlug,
    country: banner.geo,
    language: banner.locale,
    url: route,
  }
}

export function BetssonSponsoredBanner({
  surface,
  layout = 'compact-header',
  cta = 'explore',
  lazy = false,
}: {
  surface: BannerSurface
  layout?: BannerLayout
  cta?: 'explore' | 'visit'
  lazy?: boolean
}) {
  const { marketCode, locale, t, commercial } = useCountry()
  const route = usePathname()
  const banner = marketCode ? getSponsoredBanner(commercial, marketCode, locale, surface) : null
  useCampaignExpiry(banner?.promo?.expiresAt)
  const root = useRef<HTMLElement>(null)
  useCommercialImpression(root, `${route}:${marketCode}:${locale}:${surface}`, () => {
    if (banner) track(banner.promo ? 'offer_impression' : 'affiliate_impression', promoPayload(banner, route, commercial))
  })
  if (!banner) return null
  const variant = resolveBannerLayout(layout)
  const compact = variant === 'compact-header'
  const { creative, promo } = banner
  const alt = creative.alt[locale] ?? banner.operatorName
  const genericLabel = cta === 'visit'
    ? t('affiliate.visitNamed', { name: banner.operatorName })
    : t('affiliate.exploreNamed', { name: banner.operatorName })
  // Originals header: the campaign CTA. Other surfaces keep their existing localized label.
  const label = promo && surface === 'originals'
    ? promo.ctaLabel
    : banner.ctaLabel || genericLabel
  const showArt = !compact && creative.kind === 'banner'
  return (
    <section
      ref={root}
      className={`${styles.banner} ${compact ? styles.compactHeader : styles.fullSupport}${surface === 'originals' ? ` ${styles.originalsHeader}` : ''}`}
      data-sponsored-banner={banner.surface}
      data-operator-cta-mode={banner.mode}
      data-creative-id={creative.id}
      data-creative-language={locale}
      data-banner-layout={variant}
      data-promo-id={promo?.promoId}
      aria-label={`${t('affiliate.sponsored')}: ${banner.operatorName}`}
    >
      <div className={styles.card} data-commercial-ad="">
        {showArt ? (
          <div className={styles.art}>
            <Image
              src={creative.assetPath}
              alt={alt}
              fill
              sizes="(max-width: 639px) 100vw, 80rem"
              loading={lazy ? 'lazy' : undefined}
            />
          </div>
        ) : (
          <div className={styles.logo}>
            <Image
              src={creative.assetPath}
              alt={alt}
              fill
              sizes={compact ? '40px' : '48px'}
              loading={lazy ? 'lazy' : undefined}
            />
          </div>
        )}
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{t('affiliate.sponsored')}{promo ? ` · ${banner.operatorName}` : ''}</p>
          {promo
            ? <p className={`${styles.title} ${styles.promoTitle}`} lang={locale}>{promo.headline}</p>
            : <p className={styles.title}>{banner.operatorName}</p>}
          <p className={styles.body}>{t('affiliate.homeBannerBody', { name: banner.operatorName })}</p>
        </div>
        <Button
          size="lg"
          className={`${styles.cta} min-h-11 min-w-11 whitespace-normal px-4 ${surface === 'originals' ? 'w-auto max-w-full' : 'w-full sm:w-auto'}`}
          render={<a href={banner.href} target="_blank" rel="sponsored noopener noreferrer" data-promo-cta={promo ? '' : undefined}
            onClick={() => track('affiliate_click', promoPayload(banner, route, commercial))} />}
        >
          {label}
        </Button>
        <div className={styles.meta}>
          <AffiliateDisclosureLine className={styles.disclosure} />
        </div>
        <CommercialAdDisclosure operatorId={banner.operatorId} />
      </div>
    </section>
  )
}
