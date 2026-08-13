'use client'

import { PageHero } from '@/components/page-hero'
import { useCountry } from '@/components/country-context'

export function GamesPageHero() {
  const { t } = useCountry()
  return (
    <PageHero
      eyebrow={t('games.pageEyebrow')}
      title={t('games.pageTitle')}
      description={t('games.pageSub')}
    />
  )
}
