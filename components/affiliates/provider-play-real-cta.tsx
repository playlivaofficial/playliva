'use client'

import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import { getBetssonGamePlayCta } from '@/lib/affiliates/betsson'
import type { CategorySlug } from '@/lib/types'
import styles from './betsson-banner.module.css'
import { BrazilAdWarning } from './brazil-ad-warning'
import { AffiliateDisclosureLine } from '@/components/notices'

export function ProviderPlayRealCta({
  gameSlug,
  category,
}: {
  gameSlug: string
  category: CategorySlug
}) {
  const { marketCode, locale, t } = useCountry()
  const cta = marketCode ? getBetssonGamePlayCta(marketCode, locale, { gameSlug, category }) : null
  if (!cta) return null
  return (
    <div
      className={styles.playCta}
      data-betsson-game-cta=""
      data-operator-cta-mode={cta.mode}
      data-game-slug={gameSlug}
      data-betting-ad="" data-evidence-state="pending"
    >
      <Button
        size="lg"
        className={styles.playCtaButton}
        render={<a href={cta.href} target="_blank" rel="sponsored noopener noreferrer" />}
      >
        {t('affiliate.playRealBetsson')}
      </Button>
      <AffiliateDisclosureLine />
      <BrazilAdWarning operatorId="op-betsson" />
    </div>
  )
}
