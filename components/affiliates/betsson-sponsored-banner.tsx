'use client'

import Image from 'next/image'
import { AffiliateDisclosureLine } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import {
  getBetssonSponsoredBanner,
  resolveBetssonBannerLayout,
  type BetssonBannerCta,
  type BetssonBannerLayout,
  type BetssonBannerSurface,
} from '@/lib/affiliates/betsson'
import styles from './betsson-banner.module.css'
import { BrazilAdWarning } from './brazil-ad-warning'

/** Homepage wrapper so existing homepage tests keep `data-betsson-banner="homepage"`. */
export function BetssonHomeBanner() {
  return <BetssonSponsoredBanner surface="homepage" layout="compact-header" cta="explore" />
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
  const { countryCode, locale, t } = useCountry()
  const banner = getBetssonSponsoredBanner(countryCode, locale, surface)
  if (!banner) return null
  const variant = resolveBetssonBannerLayout(layout)
  const compact = variant === 'compact-header'
  const { creative } = banner
  const alt = creative.alt[locale]
  const label = cta === 'visit'
    ? t('affiliate.visitNamed', { name: banner.operatorName })
    : t('affiliate.exploreNamed', { name: banner.operatorName })
  const showArt = !compact && creative.kind === 'banner'
  return (
    <section
      className={`${styles.banner} ${compact ? styles.compactHeader : styles.fullSupport}${surface === 'originals' ? ` ${styles.originalsHeader}` : ''}`}
      data-betsson-banner={banner.surface}
      data-operator-cta-mode={banner.mode}
      data-creative-id={creative.id}
      data-creative-language={creative.language}
      data-banner-layout={variant}
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
          <p className={styles.eyebrow}>{t('affiliate.sponsored')}</p>
          <h2 className={styles.title}>{banner.operatorName}</h2>
          <p className={styles.body}>{t('affiliate.homeBannerBody')}</p>
        </div>
        <Button
          size="lg"
          className={`${styles.cta} min-h-11 min-w-11 w-full whitespace-normal px-4 sm:w-auto`}
          render={<a href={banner.href} target="_blank" rel="sponsored noopener noreferrer" />}
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
