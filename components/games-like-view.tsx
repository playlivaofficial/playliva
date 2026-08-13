'use client'

import { useEffect } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import {
  getComparisonsForGame,
  getCountryName,
  getOperatorsForGame,
  getRelatedGames,
} from '@/lib/data'
import { getCategoryName, getGameContent } from '@/lib/content'
import { PageHero } from '@/components/page-hero'
import { Section, SectionHeading } from '@/components/section'
import { GameCard } from '@/components/game-card'
import { ComparisonCard } from '@/components/comparison-card'
import { OperatorCard } from '@/components/operator-card'
import { AffiliateDisclosure, ResponsibleGamingNotice } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/tracking'
import type { Game } from '@/lib/types'

export function GamesLikeView({ game }: { game: Game }) {
  const { countryCode, t, locale } = useCountry()
  const categoryName = getCategoryName(game.category, locale)
  const categoryLower = categoryName.toLowerCase()
  const marketName = getCountryName(countryCode, locale)
  const content = getGameContent(game, locale)
  const alternatives = getRelatedGames(game, undefined, 8)
  const comparisons = getComparisonsForGame(game.id)
  const operators = getOperatorsForGame(game, countryCode)

  useEffect(() => {
    track('game_view', {
      gameId: game.id,
      category: game.category,
      country: countryCode,
      pageType: 'games_like',
    })
  }, [game.id, game.category, countryCode])

  return (
    <div>
      <PageHero
        eyebrow={t('like.eyebrow')}
        title={t('game.gamesLike', { game: game.title })}
        description={t('like.heroSub', { game: game.title, category: categoryLower })}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: game.title, href: `/games/${game.slug}` },
          { label: t('game.gamesLike', { game: game.title }) },
        ]}
      />

      {/* Why players like X */}
      <Section className="py-10">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-5" />
            <h2 className="font-display text-xl font-bold text-foreground">
              {t('like.why', { game: game.title })}
            </h2>
          </div>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
            {content.description}{' '}
            {t('like.whyBody', {
              category: categoryLower,
              mechanics: content.mechanics.slice(0, 2).join(', ').toLowerCase(),
            })}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button size="lg" render={<LocaleLink href={`/games/${game.slug}`} />}>
              {t('compare.viewGame', { game: game.title })}
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<LocaleLink href={`/${game.category}`} />}
            >
              {t('like.allCategory', { category: categoryName })}
            </Button>
          </div>
        </div>
      </Section>

      {/* Alternatives */}
      <Section className="border-t border-border bg-card/30">
        <SectionHeading
          eyebrow={t('game.discoveryEyebrow')}
          title={t('like.bestAlternatives', { game: game.title })}
          description={t('like.alternativesSub')}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {alternatives.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </Section>

      {/* Comparisons */}
      {comparisons.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow={t('cta.compare')}
            title={t('like.comparisons', { game: game.title })}
            description={t('like.comparisonsSub')}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((c) => (
              <ComparisonCard key={c.slug} comparison={c} />
            ))}
          </div>
        </Section>
      )}

      {/* Where to play */}
      <Section className="border-t border-border bg-card/30">
        <SectionHeading
          eyebrow={t('geo.whereToPlay')}
          title={t('compare.whereToPlayTitle', { market: marketName })}
          description={t('game.whereToPlaySub')}
          action={
            <Button
              variant="outline"
              size="lg"
              render={
                <LocaleLink
                  href={`/where-to-play/${game.slug}/${countryCode.toLowerCase()}`}
                />
              }
            >
              {t('compare.whereToPlayCta', { game: game.title })}
              <ArrowRight className="size-4" />
            </Button>
          }
        />
        {operators.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {operators.map((o) => (
              <OperatorCard key={o.id} operator={o} country={countryCode} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-base font-medium text-foreground">
              {t('geo.reviewingTitle', { market: marketName })}
            </p>
          </div>
        )}
      </Section>

      <Section>
        <SectionHeading title={t('rg.blockTitle')} />
        <div className="grid gap-4 md:grid-cols-2">
          <AffiliateDisclosure />
          <ResponsibleGamingNotice />
        </div>
      </Section>
    </div>
  )
}
