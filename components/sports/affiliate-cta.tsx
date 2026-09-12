import type { ComponentProps, ComponentType } from 'react'
import type { Button } from '@/components/ui/button'

/** Archived Sports has no betting CTA or click tracking. */
export const AffiliateCTA: ComponentType<{
  affiliateUrl: string
  bookmakerId?: string
  matchSlug?: string
} & Pick<ComponentProps<typeof Button>, 'className' | 'size' | 'variant'>> = () => null
