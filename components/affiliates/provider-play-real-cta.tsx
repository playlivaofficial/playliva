'use client'

import { campaignForGoHref } from '@/lib/affiliates/click-context'
import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/tracking'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import { getProviderGameCta } from '@/lib/affiliates/promotion'
import type { CategorySlug } from '@/lib/types'
import styles from './betsson-banner.module.css'
import { CommercialAdDisclosure } from './commercial-ad-disclosure'
import { AffiliateDisclosureLine } from '@/components/notices'

export function ProviderPlayRealCta({
  gameSlug,
  category,
}: {
  gameSlug: string
  category: CategorySlug
}) {
  const { marketCode, locale, t, commercial } = useCountry()
  const cta = marketCode ? getProviderGameCta(commercial, marketCode, locale, { gameSlug, category }) : null
  const root = useRef<HTMLDivElement>(null), route = usePathname()
  const payload = { campaignKey: cta ? campaignForGoHref(cta.href, commercial) : undefined, gameSlug, category, country: marketCode ?? undefined, language: locale,
    operatorId: cta?.operatorId, operatorSlug: cta?.operatorSlug, placement: 'game_detail_play_real', destination: cta?.operatorSlug }
  useCommercialImpression(root, `${route}:${marketCode}:${locale}`, () => track('affiliate_impression', payload))
  if (!cta) return null
  return (
    <div ref={root}
      className={styles.playCta}
      data-provider-game-cta=""
      data-operator-cta-mode={cta.mode}
      data-game-slug={gameSlug}
      data-commercial-ad=""
    >
      <Button
        size="lg"
        className={styles.playCtaButton}
        render={<a href={cta.href} target="_blank" rel="sponsored noopener noreferrer" onClick={() => track('affiliate_click', payload)} />}
      >
        {cta.ctaLabel || t('affiliate.playAtNamed', { name: cta.operatorName })}
      </Button>
      <AffiliateDisclosureLine />
      <CommercialAdDisclosure operatorId={cta.operatorId} />
    </div>
  )
}
