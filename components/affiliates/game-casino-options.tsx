'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import { BadgeCheck, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import { AffiliateDisclosureLine, ResponsibleNotice } from '@/components/notices'
import { useCommercialImpression } from '@/components/analytics/use-commercial-impression'
import { campaignForGoHref } from '@/lib/affiliates/click-context'
import { getGameCasinoOptions, type GameCasinoOption } from '@/lib/affiliates/promotion'
import { getCountryName } from '@/lib/data'
import { track } from '@/lib/tracking'
import type { CategorySlug } from '@/lib/types'

/**
 * Multi-casino "Where to play" for a provider game. Verified availability and
 * brand discovery are separate, separately labelled lists; every approved
 * operator in the visitor's GEO stays visible, ordered by the sponsor chain.
 */
export function GameCasinoOptions({ game }: { game: { id: string; slug: string; title: string; category: CategorySlug } }) {
  const { marketCode, locale, t, commercial } = useCountry()
  const root = useRef<HTMLDivElement>(null), route = usePathname()
  const options = marketCode ? getGameCasinoOptions(commercial, marketCode, locale, game) : { verified: [], explore: [] }
  const total = options.verified.length + options.explore.length
  useCommercialImpression(root, `${route}:${marketCode}:${locale}:casinos`, () => {
    for (const option of [...options.verified, ...options.explore]) track('affiliate_impression', payload(option))
  })
  if (!marketCode || total === 0) return null
  const market = getCountryName(marketCode, locale)
  function payload(option: GameCasinoOption) {
    return { campaignKey: campaignForGoHref(option.href, commercial), gameSlug: game.slug, category: game.category, country: marketCode ?? undefined,
      language: locale, operatorId: option.operatorId, operatorSlug: option.operatorSlug, offerId: option.offer?.offerId,
      placement: option.placement, destination: option.operatorSlug, pageType: 'content' as const, pageSlug: game.slug }
  }
  const row = (option: GameCasinoOption, verified: boolean) => (
    <li key={option.operatorId} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4"
      data-casino-option={verified ? 'verified' : 'explore'} data-operator-id={option.operatorId} data-commercial-ad="">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
          <Image src={option.logo} alt="" fill sizes="44px" className="object-contain" />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-display text-base font-bold text-foreground">
            {option.operatorName}
            {verified && <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
              <BadgeCheck className="size-3.5" aria-hidden="true" />{t('casinos.verifiedBadge')}</span>}
          </p>
          {option.offer && <p className="mt-0.5 text-sm leading-snug text-muted-foreground" lang={locale}>
            <span className="font-semibold text-foreground">{t('casinos.offerLabel')}:</span> {option.offer.headline}
          </p>}
        </div>
      </div>
      <Button size="lg" variant={verified ? 'default' : 'outline'} className="min-h-11 w-full shrink-0 whitespace-normal sm:w-auto"
        render={<a href={option.href} target="_blank" rel="sponsored noopener noreferrer" onClick={() => track('affiliate_click', payload(option))} />}>
        {verified ? t('casinos.playAt', { name: option.operatorName }) : t('casinos.exploreCta', { name: option.operatorName })}
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Button>
    </li>
  )
  return (
    <div ref={root} className="space-y-6" data-game-casinos="" data-geo={marketCode}>
      {options.verified.length > 0 && <section aria-labelledby={`casinos-verified-${game.slug}`}>
        <h3 id={`casinos-verified-${game.slug}`} className="font-display text-lg font-bold text-foreground">{t('casinos.verifiedTitle', { game: game.title, market })}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('casinos.verifiedSub', { market })}</p>
        <ol className="mt-3 space-y-3">{options.verified.map(option => row(option, true))}</ol>
      </section>}
      {options.explore.length > 0 && <section aria-labelledby={`casinos-explore-${game.slug}`} data-casino-explore="">
        <h3 id={`casinos-explore-${game.slug}`} className="font-display text-lg font-bold text-foreground">{t('casinos.exploreTitle', { market })}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{options.verified.length === 0 && <>{t('casinos.noneVerified', { game: game.title, market })} </>}{t('casinos.exploreSub', { game: game.title })}</p>
        <ul className="mt-3 space-y-3">{options.explore.map(option => row(option, false))}</ul>
      </section>}
      <div className="space-y-1 text-xs text-muted-foreground">
        <AffiliateDisclosureLine />
        <ResponsibleNotice />
      </div>
    </div>
  )
}
