'use client'

import { PageHero } from '@/components/page-hero'
import { useCountry } from '@/components/country-context'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'

export function OperatorsPageHero() {
  const { t } = useCountry()
  return (
    <PageHero
      eyebrow={t('operators.eyebrow')}
      title={t('operators.title')}
      description={t('operators.sub')}
      sponsor={<BetssonSponsoredBanner surface="operators" layout="compact-header" />}
    />
  )
}
