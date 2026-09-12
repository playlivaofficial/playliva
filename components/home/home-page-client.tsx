'use client'

import { ArrowRight } from 'lucide-react'
import { Hero } from '@/components/home/hero'
import { Section, SectionHeading } from '@/components/section'
import { CategoryCard } from '@/components/category-card'
import { GameCard } from '@/components/game-card'
import { ComparisonCard } from '@/components/comparison-card'
import { PopularInMarket } from '@/components/popular-in-market'
import { FeaturedOperators } from '@/components/featured-operators'
import { AffiliateDisclosureLine } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import {
  CATEGORIES,
  COMPARISONS,
  GAMES,
  getGame,
  getRelatedGames,
} from '@/lib/data'

export function HomePageClient() {
  const { t } = useCountry()
  const trending = GAMES.filter((g) => g.featured).slice(0, 6)
  const aviator = getGame('aviator')
  const aviatorAlternatives = aviator ? getRelatedGames(aviator, undefined, 4) : []
  const comparisons = COMPARISONS.slice(0, 3)

  return (
    <>
      <Hero />

      {/* Explore by game type */}
      <Section id="game-types">
        <SectionHeading
          eyebrow={t('label.editorial')}
          title={t('home.exploreByType')}
          description={t('home.exploreByTypeSub')}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.filter((c) => c.slug !== 'table-games' && c.slug !== 'instant-games').map((c) => (
            <CategoryCard key={c.slug} {...c} />
          ))}
          <CategoryCard slug="sports" />
        </div>
      </Section>

      {/* Trending games */}
      <Section className="py-8">
        <SectionHeading
          eyebrow={t('label.popular')}
          title={t('home.trending')}
          description={t('home.trendingSub')}
          action={
            <Button variant="outline" size="lg" render={<LocaleLink href="/games" />}>
              {t('cta.browseAllGames')}
              <ArrowRight className="size-4" />
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {trending.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </Section>

      {/* Find games like Aviator */}
      {aviator && aviatorAlternatives.length > 0 && (
        <Section className="border-t border-border bg-card/30">
          <SectionHeading
            eyebrow={t('label.editorial')}
            title={t('home.gamesLike', { game: 'Aviator' })}
            description={t('home.gamesLikeSub', { game: 'Aviator' })}
            action={
              <Button
                variant="outline"
                size="lg"
                render={<LocaleLink href="/games-like/aviator" />}
              >
                {t('like.alternatives', { game: 'Aviator' })}
                <ArrowRight className="size-4" />
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {aviatorAlternatives.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </Section>
      )}

      {/* Compare popular games */}
      <Section>
        <SectionHeading
          eyebrow={t('nav.games')}
          title={t('home.compare')}
          description={t('home.compareSub')}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((c) => (
            <ComparisonCard key={c.slug} comparison={c} />
          ))}
        </div>
      </Section>

      {/* Popular in your market (GEO-aware) */}
      <Section className="border-t border-border bg-card/30">
        <PopularInMarket />
      </Section>

      {/* Where to play — operators appear as the final discovery step */}
      <Section>
        <SectionHeading
          eyebrow={t('geo.whereToPlay')}
          title={t('geo.whereToPlay')}
          description={t('home.whereToPlaySub')}
        />
        <FeaturedOperators limit={3} />
        <AffiliateDisclosureLine className="mt-6" />
      </Section>

      {/* Responsible gambling block */}
      <Section className="py-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <span className="inline-grid size-10 place-items-center rounded-xl border border-primary/40 font-bold text-primary">
              18+
            </span>
            <h2 className="mt-5 text-balance font-display text-3xl font-bold text-foreground sm:text-4xl">
              {t('rg.blockTitle')}
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
              {t('rg.blockBody')}
            </p>
            <Button
              size="lg"
              variant="outline"
              render={<LocaleLink href="/responsible-gaming" />}
              className="mt-6"
            >
              {t('footer.responsible')}
            </Button>
          </div>
        </div>
      </Section>
    </>
  )
}
