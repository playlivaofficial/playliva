'use client'

import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation, useCountry } from '@/components/country-context'
import { track } from '@/lib/tracking'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

/**
 * CTA for a mock sportsbook. Bookmakers here are placeholders — no real,
 * approved affiliate partnerships exist yet for this vertical.
 *
 * Intentionally does not use the real `/go` tracked-redirect (that resolves
 * against approved Operator records and would 404 for these placeholders).
 * Swap `affiliateUrl` for a real tracked destination once a real sportsbook
 * partnership is wired in — no other component needs to change. Click
 * tracking still fires so attribution reporting is consistent once this CTA
 * is swapped to a real, `/go`-backed destination.
 */
export function AffiliateCTA({
  affiliateUrl,
  bookmakerId,
  matchSlug,
  className,
  size = 'sm',
  variant = 'default',
}: {
  affiliateUrl: string
  /** Placeholder bookmaker id, forwarded for tracking only. */
  bookmakerId?: string
  /** Sports fixture slug, forwarded for tracking only. */
  matchSlug?: string
} & Pick<ComponentProps<typeof Button>, 'className' | 'size' | 'variant'>) {
  const { t } = useTranslation()
  const { countryCode, locale } = useCountry()

  const handleClick = () => {
    track('affiliate_click', {
      country: countryCode,
      language: locale,
      pageType: 'content',
      matchSlug,
      operatorId: bookmakerId,
      placement: 'sports_odds',
      destination: bookmakerId,
    })
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-1', className)}
      onClick={handleClick}
    >
      {t('sports.bet')}
      <ArrowUpRight className="size-3.5" />
    </Button>
  )
}
