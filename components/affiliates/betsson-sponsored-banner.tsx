'use client'

import { campaignForGoHref } from '@/lib/affiliates/click-context'
import { useRef } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AffiliateDisclosureLine } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import {
  getBetssonSponsoredBanner,
  resolveBetssonBannerLayout,
  type BetssonBannerCta,
  type BetssonBannerLayout,
  type BetssonBannerSurface,
  type BetssonSponsoredBannerModel,
} from '@/lib/affiliates/betsson'
import { track, type TrackPayload } from '@/lib/tracking'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
import styles from './betsson-banner.module.css'
import { BrazilAdWarning } from './brazil-ad-warning'

/** Homepage wrapper so existing homepage tests keep `data-betsson-banner="homepage"`. */
export function BetssonHomeBanner() {
  return <BetssonSponsoredBanner surface="homepage" layout="compact-header" cta="explore" />
}

function promoPayload(banner: BetssonSponsoredBannerModel, route: string): TrackPayload {
  return {
    campaignKey: campaignForGoHref(banner.href),
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
  surface: BetssonBannerSurface
  layout?: BetssonBannerLayout
  cta?: BetssonBannerCta
  lazy?: boolean
}) {
  const { marketCode, locale, t } = useCountry()
  const route = usePathname()
  const banner = marketCode ? getBetssonSponsoredBanner(marketCode, locale, surface) : null
  const root = useRef<HTMLElement>(null)
  useCommercialImpression(root, `${route}:${marketCode}:${locale}:${surface}`, () => {
    if (banner) track(banner.promo ? 'offer_impression' : 'affiliate_impression', promoPayload(banner, route))
  })
  if (!banner) return null
  const variant = resolveBetssonBannerLayout(layout)
  const compact = variant === 'compact-header'
  const { creative, promo } = banner
  const alt = creative.alt[locale]
  const genericLabel = cta === 'visit'
    ? t('affiliate.visitNamed', { name: banner.operatorName })
    : t('affiliate.exploreNamed', { name: banner.operatorName })
  // Originals header: the campaign CTA. Other surfaces keep their existing localized label.
  const label = promo && surface === 'originals'
    ? (locale === 'pt-BR' ? promo.ctaLabel : t('affiliate.playAtNamed', { name: banner.operatorName }))
    : genericLabel
  const showArt = !compact && creative.kind === 'banner'
  return (
    <section
      ref={root}
      className={`${styles.banner} ${compact ? styles.compactHeader : styles.fullSupport}${surface === 'originals' ? ` ${styles.originalsHeader}` : ''}`}
      data-betsson-banner={banner.surface}
      data-operator-cta-mode={banner.mode}
      data-creative-id={creative.id}
      data-creative-language={creative.language}
      data-banner-layout={variant}
      data-promo-id={promo?.promoId}
      aria-label={`${t('affiliate.sponsored')}: ${banner.operatorName}`}
    >
      <div className={styles.card} data-betting-ad="" data-evidence-state="pending">
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
            ? <p className={`${styles.title} ${styles.promoTitle}`} lang="pt-BR">{promo.headline}</p>
            : <p className={styles.title}>{banner.operatorName}</p>}
          <p className={styles.body}>{t('affiliate.homeBannerBody')}</p>
        </div>
        <Button
          size="lg"
          className={`${styles.cta} min-h-11 min-w-11 whitespace-normal px-4 ${surface === 'originals' ? 'w-auto max-w-full' : 'w-full sm:w-auto'}`}
          render={<a href={banner.href} target="_blank" rel="sponsored noopener noreferrer" data-promo-cta={promo ? '' : undefined}
            onClick={() => track('affiliate_click', promoPayload(banner, route))} />}
        >
          {label}
        </Button>
        <div className={styles.meta}>
          <AffiliateDisclosureLine className={styles.disclosure} />
        </div>
        <BrazilAdWarning operatorId="op-betsson" />
      </div>
    </section>
  )
}
