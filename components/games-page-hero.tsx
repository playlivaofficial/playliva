'use client'

import { PageHero } from '@/components/page-hero'
import { useCountry } from '@/components/country-context'
import { productCopy } from '@/lib/product-discovery'
import { catalogCopy } from '@/lib/catalog/copy'

export function GamesPageHero() {
  const { t, locale } = useCountry()
  return (
    <PageHero
      eyebrow={productCopy(locale).providerLabel}
      title={t('games.pageTitle')}
      description={catalogCopy(locale).directoryIntro}
    />
  )
}
