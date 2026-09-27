'use client'

import { campaignForGoHref } from '@/lib/affiliates/click-context'
import { useRef, type ComponentProps } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildGoHref, resolveDestination } from '@/lib/affiliate'
import { getGameById } from '@/lib/data'
import { track, type PageType, type TrackPayload } from '@/lib/tracking'
import { usePathname } from 'next/navigation'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
import { useCountry } from '@/components/country-context'
import type { CountryCode } from '@/lib/types'

/**
 * Renders a CTA that fires an `affiliate_impression` once it enters the
 * viewport, tracks `affiliate_click` on activation, then navigates to the
 * internal `/go` tracked-redirect in a new tab. Renders as a real `<a>` with
 * `rel="sponsored noopener noreferrer"` — the internal `/go` href is fine to
 * expose (it carries no external URL, only editorial identifiers), and a
 * real anchor lets crawlers correctly see this as a monetized outbound link
 * per Google's affiliate-link guidance. The external affiliate URL is
 * resolved server-side, inside `/go`, and never appears in the DOM. Geo,
 * language, and placement context are always forwarded through `/go` so the
 * tracking template can be filled server-side.
 */
export function AffiliateButton({
  operatorSlug,
  offerId,
  operatorId,
  gameId,
  gameSlug,
  matchId,
  category,
  pageType,
  pageSlug,
  ctaLocation = 'inline',
  country: countryProp,
  children,
  showIcon = true,
  promo,
  ...props
}: {
  operatorSlug?: string
  offerId?: string
  operatorId?: string
  gameId?: string
  gameSlug?: string
  /** Sports fixture identifier, when the CTA is placed on a match context. */
  matchId?: string
  category?: string
  pageType?: PageType
  /** Editorial slug of the current page (game slug, best-list slug, etc). */
  pageSlug?: string
  ctaLocation?: string
  /** Optional explicit market; defaults to the selected country. */
  country?: CountryCode
  children: React.ReactNode
  showIcon?: boolean
  /** Central campaign context: adds public campaign fields. */
  promo?: Pick<TrackPayload, 'promoId' | 'brand' | 'surface'>
} & Omit<ComponentProps<typeof Button>, 'onClick' | 'render'>) {
  const { marketCode, locale } = useCountry()
  const country = countryProp ?? marketCode
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const route = usePathname()
  const resolvedGame = gameSlug ?? (gameId ? getGameById(gameId)?.slug : undefined)
  const eligible = country !== null && country === marketCode && Boolean(resolveDestination({
    operatorSlug, offerId, country, category, gameSlug: resolvedGame,
    matchSlug: matchId, pageType, pageSlug, placement: ctaLocation,
  })) && (!gameId || Boolean(resolvedGame))

  const href = buildGoHref({
    operator: operatorSlug,
    offer: offerId,
    country: country ?? 'BR',
    language: locale,
    game: resolvedGame,
    match: matchId,
    category,
    page: pageType,
    pageSlug,
    cta: ctaLocation,
    placement: ctaLocation,
  })

  useCommercialImpression(buttonRef, `${route}:${country}:${locale}:${operatorSlug}:${offerId}:${ctaLocation}`, () => {
    track('affiliate_impression', {
      campaignKey: campaignForGoHref(href),
      country: country ?? undefined, language: locale, pageType, pageSlug,
      gameId, gameSlug: resolvedGame, matchId, category, operatorId, operatorSlug,
      offerId, placement: ctaLocation, ...promo,
    })
  })

  const handleClick = () => {
    track('affiliate_click', {
      campaignKey: campaignForGoHref(href),
      country: country ?? undefined,
      language: locale,
      pageType,
      pageSlug,
      gameId,
      gameSlug: resolvedGame,
      matchId,
      category,
      operatorId,
      operatorSlug,
      offerId,
      ctaLocation,
      placement: ctaLocation,
      destination: offerId ?? operatorSlug,
      ...promo,
    })
  }

  if (!eligible) return null

  return (
    <Button
      {...props}
      render={
        <a
          ref={buttonRef}
          href={href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={handleClick}
        />
      }
    >
      {children}
      {showIcon && <ArrowUpRight className="size-4" />}
    </Button>
  )
}
