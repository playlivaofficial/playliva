'use client'

import { campaignForGoHref } from '@/lib/affiliates/click-context'
import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/tracking'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
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
  const root = useRef<HTMLDivElement>(null), route = usePathname()
  const payload = { campaignKey: cta ? campaignForGoHref(cta.href) : undefined, gameSlug, category, country: marketCode ?? undefined, language: locale,
    operatorSlug: 'betsson-group-affiliates', placement: 'game_detail_play_real', destination: 'betsson-group-affiliates' }
  useCommercialImpression(root, `${route}:${marketCode}:${locale}`, () => track('affiliate_impression', payload))
  if (!cta) return null
  return (
    <div ref={root}
      className={styles.playCta}
      data-betsson-game-cta=""
      data-operator-cta-mode={cta.mode}
      data-game-slug={gameSlug}
      data-betting-ad="" data-evidence-state="pending"
    >
      <Button
        size="lg"
        className={styles.playCtaButton}
        render={<a href={cta.href} target="_blank" rel="sponsored noopener noreferrer" onClick={() => track('affiliate_click', payload)} />}
      >
        {t('affiliate.playRealBetsson')}
      </Button>
      <AffiliateDisclosureLine />
      <BrazilAdWarning operatorId="op-betsson" />
    </div>
  )
}
