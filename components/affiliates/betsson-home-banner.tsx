'use client'

import Image from 'next/image'
import { AffiliateButton } from '@/components/affiliate-button'
import { AffiliateDisclosureLine } from '@/components/notices'
import { useCountry } from '@/components/country-context'
import {
  getBetssonHomepageBanner,
  HOMEPAGE_BANNER_PLACEMENT,
} from '@/lib/affiliates/betsson'
import styles from './betsson-banner.module.css'

export function BetssonHomeBanner() {
  const { countryCode, locale, t } = useCountry()
  const banner = getBetssonHomepageBanner(countryCode, locale)
  if (!banner) return null
  const { creative } = banner
  const alt = creative.alt[locale]
  return (
    <section className={styles.banner} data-betsson-banner="homepage" data-operator-cta-mode={banner.mode}
      data-creative-id={creative.id} data-creative-language={creative.language}
      aria-label={`${t('affiliate.sponsored')}: ${banner.operatorName}`}>
      <div className={styles.card}>
        {creative.kind === 'banner' ? (
          <div className={styles.art}>
            <Image src={creative.assetPath} alt={alt} fill sizes="(max-width: 639px) 100vw, 80rem" />
          </div>
        ) : (
          <div className={styles.logo}>
            <Image src={creative.assetPath} alt={alt} fill sizes="48px" />
          </div>
        )}
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{t('affiliate.sponsored')}</p>
          <h2 className={styles.title}>{banner.operatorName}</h2>
          <p className={styles.body}>{t('affiliate.homeBannerBody')}</p>
        </div>
        <AffiliateButton
          operatorSlug={banner.operatorSlug}
          operatorId={banner.operatorId}
          country={countryCode}
          pageType="home"
          ctaLocation={HOMEPAGE_BANNER_PLACEMENT}
          size="lg"
          className="min-h-11 min-w-11 w-full whitespace-normal px-4 sm:w-auto"
        >
          {t('affiliate.exploreNamed', { name: banner.operatorName })}
        </AffiliateButton>
        <div className={styles.meta}>
          <AffiliateDisclosureLine />
        </div>
      </div>
    </section>
  )
}
