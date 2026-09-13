'use client'

import Image from 'next/image'
import { AffiliateDisclosureLine } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import {
  getBetssonSponsoredBanner,
  type BetssonBannerCta,
  type BetssonBannerLayout,
  type BetssonBannerSurface,
} from '@/lib/affiliates/betsson'
import styles from './betsson-banner.module.css'

/** Homepage wrapper so existing homepage tests keep `data-betsson-banner="homepage"`. */
export function BetssonHomeBanner() {
  return <BetssonSponsoredBanner surface="homepage" layout="full" cta="explore" />
}

export function BetssonSponsoredBanner({
  surface,
  layout = 'full',
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
  const { creative } = banner
  const alt = creative.alt[locale]
  const label = cta === 'visit'
    ? t('affiliate.visitNamed', { name: banner.operatorName })
    : t('affiliate.exploreNamed', { name: banner.operatorName })
  return (
    <section
      className={`${styles.banner} ${layout === 'compact' ? styles.compact : ''} ${layout === 'hub' ? styles.hub : ''}`}
      data-betsson-banner={banner.surface}
      data-operator-cta-mode={banner.mode}
      data-creative-id={creative.id}
      data-creative-language={creative.language}
      data-banner-layout={layout}
      aria-label={`${t('affiliate.sponsored')}: ${banner.operatorName}`}
    >
      <div className={styles.card}>
        {creative.kind === 'banner' ? (
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
              sizes={layout === 'hub' ? '64px' : '48px'}
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
          className="min-h-11 min-w-11 w-full whitespace-normal px-4 sm:w-auto"
          render={<a href={banner.href} target="_blank" rel="sponsored noopener noreferrer" />}
        >
          {label}
        </Button>
        <div className={styles.meta}>
          <AffiliateDisclosureLine />
        </div>
      </div>
    </section>
  )
}
