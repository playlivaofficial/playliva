'use client'

import { ArrowRight, Compass, Layers3, Gamepad2 } from 'lucide-react'
import { Hero } from '@/components/home/hero'
import { OriginalsDiscoverySection } from '@/components/originals/island-crash-feature'
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
  COMPARISONS,
  getGame,
  getRelatedGames,
} from '@/lib/data'
import { productCopy, DISCOVERY_ORDER } from '@/lib/product-discovery'
import styles from '@/components/product-design.module.css'

export function HomePageClient() {
  const { t, locale } = useCountry()
  const copy = productCopy(locale)
  const trending = ['gates-of-olympus', 'aviator', 'blackjack-live', 'lightning-roulette', 'mines', 'sweet-bonanza'].flatMap(slug => {
    const game = getGame(slug)
    return game ? [game] : []
  })
  const aviator = getGame('aviator')
  const aviatorAlternatives = aviator ? getRelatedGames(aviator, undefined, 4) : []
  const comparisons = COMPARISONS.slice(0, 3)

  return (
    <>
      <Hero />

      {/* Explore by game type */}
      <Section id="game-types">
        <SectionHeading
          eyebrow={t('nav.games')}
          title={copy.categories}
          description={copy.categoriesSub}
        />
        <div className={styles.categoryGrid}>
          {DISCOVERY_ORDER.slice(0, 4).map((slug) => (
            <CategoryCard key={slug} slug={slug} />
          ))}
        </div>
      </Section>

      {/* Curated provider catalog: no measured popularity claim. */}
      <Section className={styles.providerSection} id="provider-games">
        <SectionHeading
          eyebrow={copy.providerLabel}
          title={copy.providerTitle}
          description={copy.providerSub}
          action={
            <Button variant="outline" size="lg" render={<LocaleLink href="/games" />}>
              {t('cta.browseAllGames')}
              <ArrowRight className="size-4" />
            </Button>
          }
        />
        <div className={styles.providerGrid}>
          {trending.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </Section>

      <OriginalsDiscoverySection surface="home" />

      <Section className="pt-4">
        <div className={styles.trust} data-discovery-explainer>
          <SectionHeading eyebrow="PlayLiva" title={copy.trustTitle} description={copy.trustSub} />
          <div className={styles.trustGrid}>
            {[
              { icon: Compass, title: copy.trustDiscover, body: copy.trustDiscoverBody },
              { icon: Layers3, title: copy.trustCompare, body: copy.trustCompareBody },
              { icon: Gamepad2, title: copy.trustPlay, body: copy.trustPlayBody },
            ].map(({ icon: Icon, title, body }) => <article key={title}><Icon size={24} aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>)}
          </div>
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
