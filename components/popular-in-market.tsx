'use client'

import { LocaleLink } from '@/components/locale-link'
import { ArrowRight } from 'lucide-react'
import { useCountry, useTranslation } from '@/components/country-context'
import { GameCard } from '@/components/game-card'
import { SectionHeading } from '@/components/section'
import { Button } from '@/components/ui/button'
import {
  GAMES,
  getCountryName,
  getGameListByCategoryCountry,
  getPopularGamesForCountry,
} from '@/lib/data'
import { getGameListContent } from '@/lib/content'

/**
 * GEO-aware editorial "Popular in your market" grid. Ordering comes from
 * manual editorial ranking in data — never fabricated live statistics.
 */
export function PopularInMarket({
  category,
  limit = 6,
}: {
  category?: string
  limit?: number
}) {
  const { marketCode: countryCode } = useCountry()
  const { t, locale } = useTranslation()
  const marketName = countryCode ? getCountryName(countryCode, locale) : t('geo.marketLabel')

  let games = countryCode ? getPopularGamesForCountry(countryCode, category, limit) : []
  // Fallback so the section is never empty for lighter markets.
  if (games.length === 0) {
    games = GAMES.filter(
      (g) =>
        countryCode !== null && g.countries.includes(countryCode) &&
        (category ? g.category === category : g.featured),
    ).slice(0, limit)
  }

  const bestList = category
    ? countryCode ? getGameListByCategoryCountry(category, countryCode) : undefined
    : undefined
  const bestTitle = bestList
    ? getGameListContent(bestList, locale).title
    : undefined

  return (
    <>
      <SectionHeading
        eyebrow={t('geo.marketLabel')}
        title={t('geo.popularIn', { country: marketName })}
        description={t('geo.popularInSub', { country: marketName })}
        action={
          bestList ? (
            <Button
              variant="outline"
              size="lg"
              render={<LocaleLink href={`/best/${bestList.slug}`} />}
            >
              {bestTitle}
              <ArrowRight className="size-4" />
            </Button>
          ) : undefined
        }
      />
      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
          <p className="text-pretty text-muted-foreground">
            {t('geo.emptyMarket', { country: marketName })}
          </p>
          <Button
            variant="outline"
            size="lg"
            render={<LocaleLink href="/games" />}
            className="mt-4"
          >
            {t('cta.browseAllGames')}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </>
  )
}
