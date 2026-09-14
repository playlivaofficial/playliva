'use client'

import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import { getBetssonGamePlayCta } from '@/lib/affiliates/betsson'
import type { CategorySlug } from '@/lib/types'
import styles from './betsson-banner.module.css'

export function ProviderPlayRealCta({
  gameSlug,
  category,
}: {
  gameSlug: string
  category: CategorySlug
}) {
  const { countryCode, locale, t } = useCountry()
  const cta = getBetssonGamePlayCta(countryCode, locale, { gameSlug, category })
  if (!cta) return null
  return (
    <div
      className={styles.playCta}
      data-betsson-game-cta=""
      data-operator-cta-mode={cta.mode}
      data-game-slug={gameSlug}
    >
      <Button
        size="lg"
        className={styles.playCtaButton}
        render={<a href={cta.href} target="_blank" rel="sponsored noopener noreferrer" />}
      >
        {t('affiliate.playRealBetsson')}
      </Button>
    </div>
  )
}
