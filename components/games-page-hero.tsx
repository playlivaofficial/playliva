'use client'

import { PageHero } from '@/components/page-hero'
import { useCountry } from '@/components/country-context'
import { productCopy } from '@/lib/product-discovery'
import { catalogCopy } from '@/lib/catalog/copy'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'

export function GamesPageHero() {
  const { t, locale } = useCountry()
  return (
    <PageHero
      eyebrow={productCopy(locale).providerLabel}
      title={t('games.pageTitle')}
      description={catalogCopy(locale).directoryIntro}
      sponsor={<BetssonSponsoredBanner surface="games" layout="compact-header" />}
    />
  )
}
