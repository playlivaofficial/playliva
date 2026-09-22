'use client'

import { useMemo, type ReactNode } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, Trophy } from 'lucide-react'
import {
  CATEGORIES,
  GAMES,
  getCountryName,
  getPopularGamesForCountry,
  getGameListByCategoryCountry,
  getComparisonsForCategory,
} from '@/lib/data'
import { getCategoryContent, getGameListContent } from '@/lib/content'
import { useCountry } from '@/components/country-context'
import { PageHero } from '@/components/page-hero'
import { OriginalsDiscoverySection } from '@/components/originals/island-crash-feature'
import { CapybaraDiscoverySection } from '@/components/originals/capybara-feature'
import { BlackjackDiscoverySection } from '@/components/originals/blackjack-feature'
import { RouletteDiscoverySection } from '@/components/originals/roulette-feature'
import { MinesDiscoverySection } from '@/components/originals/mines-feature'
import { Section, SectionHeading } from '@/components/section'
import { GameCard } from '@/components/game-card'
import { ComparisonCard } from '@/components/comparison-card'
import { WhereToPlay } from '@/components/where-to-play'
import { AffiliateDisclosureLine, ResponsibleGamingNotice } from '@/components/notices'
import type { CategorySlug } from '@/lib/types'
import { cn } from '@/lib/utils'
import { discoveryCategory, DISCOVERY_ORDER, productCopy } from '@/lib/product-discovery'
import styles from '@/components/product-design.module.css'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'
import type { BetssonBannerSurface } from '@/lib/affiliates/betsson'
import { Button } from '@/components/ui/button'
import { ContentCard } from '@/components/content-card'

export function CategoryPageView({ slug, referenceCatalog }: { slug: CategorySlug; referenceCatalog?: ReactNode }) {
  const { marketCode: country, t, locale } = useCountry()
  const category = getCategoryContent(slug, locale)
  const countryName = country ? getCountryName(country, locale) : t('geo.marketLabel')
  const categoryLower = category.name.toLowerCase()

  // Preserve the indexed Table Games archive as a secondary discovery path.
  const allGames = useMemo(() => GAMES.filter((g) => discoveryCategory(g) === slug || slug === 'table-games' && g.category === slug), [slug])
  const popular = useMemo(
    () => country ? getPopularGamesForCountry(country, undefined, GAMES.length).filter(g => discoveryCategory(g) === slug).slice(0, 8) : [],
    [country, slug],
  )
  const bestList = country ? getGameListByCategoryCountry(slug, country) : undefined
  const bestListContent = bestList
    ? getGameListContent(bestList, locale)
    : undefined
  const comparisons = getComparisonsForCategory(slug).slice(0, 2)

  // Lead with market-popular games; fall back to the full catalog.
  const leadGames = popular.length > 0 ? popular : allGames

  return (
    <div>
      <PageHero
        eyebrow={t('category.eyebrow')}
        title={category.h1 ?? category.name}
        description={category.description}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: category.name },
        ]}
        sponsor={<BetssonSponsoredBanner surface={slug as BetssonBannerSurface} layout="compact-header" />}
      />

      <div className="border-b border-border bg-card/30">
        <nav className={styles.categoryTabs} aria-label={t('home.exploreByType')}>
          {DISCOVERY_ORDER.map(categorySlug => CATEGORIES.find(c => c.slug === categorySlug)!).map((c) => (
            <LocaleLink
              key={c.slug}
              href={`/${c.slug}`}
              aria-current={c.slug === slug ? 'page' : undefined}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors',
                c.slug === slug
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {getCategoryContent(c.slug, locale).name}
            </LocaleLink>
          ))}
        </nav>
      </div>

      {slug === 'crash' && <OriginalsDiscoverySection surface="category" />}
      {slug === 'slots' && <CapybaraDiscoverySection />}
      {slug === 'live-casino' && <BlackjackDiscoverySection />}
      {slug === 'table-games' && <RouletteDiscoverySection />}
      {slug === 'live-casino' && <RouletteDiscoverySection liveContext />}
      {slug === 'instant-games' && <MinesDiscoverySection />}

      <Section>
        <SectionHeading
          eyebrow={productCopy(locale).providerLabel}
          title={slug === 'crash' && locale === 'pt-BR'
            ? 'Títulos crash no catálogo'
            : slug === 'slots' && locale === 'pt-BR'
              ? 'Títulos de slots no catálogo'
            : t('category.popularTitle', { category: categoryLower, market: countryName })}
          description={slug === 'crash' && locale === 'pt-BR'
            ? 'Compare os títulos catalogados pela PlayLiva por provedor, mecânicas e apresentação.'
            : slug === 'slots' && locale === 'pt-BR'
              ? 'Compare os títulos catalogados pela PlayLiva por provedor, formato, mecânicas e apresentação.'
            : t('category.popularSub', { category: categoryLower, market: countryName })}
          action={slug === 'crash' ? (
            <Button variant="outline" render={<LocaleLink href="/best/crash-games" />}>
              {t('category.viewRanking')}
              <ArrowRight className="size-4" />
            </Button>
          ) : undefined}
        />
        {leadGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {leadGames.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{t('category.empty')}</p>
        )}
      </Section>

      {slug === 'crash' && locale === 'pt-BR' && (
        <Section className="border-t border-border bg-card/30">
          <SectionHeading
            eyebrow="Explore por intenção"
            title="Continue pelo guia certo"
            description="Use a página de Aviator para entender o jogo, as comparações para avaliar diferenças e os guias editoriais para escolher critérios ou opções verificadas no Brasil."
          />
          <div className="flex flex-wrap gap-3">
            <Button render={<LocaleLink href="/games/aviator" />}>Como funciona o Aviator</Button>
            <Button variant="outline" render={<LocaleLink href="/games-like/aviator" />}>Jogos como Aviator</Button>
            <Button variant="outline" render={<LocaleLink href="/compare/aviator-vs-jetx" />}>Aviator vs JetX</Button>
            <Button variant="outline" render={<LocaleLink href="/compare/aviator-vs-spaceman" />}>Aviator vs Spaceman</Button>
            <Button variant="ghost" render={<LocaleLink href="/best/crash-games" />}>Como escolher crash games</Button>
            <Button variant="ghost" render={<LocaleLink href="/best/best-crash-games-brazil" />}>Seleção para o Brasil</Button>
            <Button variant="ghost" render={<LocaleLink href="/play/crash" />}>Jogar Island Crash grátis</Button>
          </div>
        </Section>
      )}

      {slug === 'slots' && locale === 'pt-BR' && (
        <Section className="border-t border-border bg-card/30">
          <SectionHeading
            eyebrow="Guia da categoria"
            title="Entenda os formatos antes de escolher um slot"
            description="Os jogos do catálogo usam estruturas diferentes. Compare a forma de pagamento, as cascatas e os recursos documentados em cada ficha."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <ContentCard>
              <h2 className="font-display text-xl font-bold text-foreground">O que são jogos de slots?</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Slots organizam símbolos em rolos ou grades e avaliam combinações conforme as regras de cada título. A PlayLiva separa a identidade do jogo, o provedor e as mecânicas registradas sem transformar essas diferenças em promessa de resultado.
              </p>
            </ContentCard>
            <ContentCard tone="guide">
              <h2 className="font-display text-xl font-bold text-foreground">Como os formatos modernos diferem</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Alguns títulos usam linhas fixas; outros pagam em qualquer posição ou por grupos conectados. Cascatas removem combinações e deixam novos símbolos ocupar a grade. Multiplicadores, rodadas grátis e recursos de coleta dependem da ficha de cada jogo.
              </p>
            </ContentCard>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<LocaleLink href="/games/gates-of-olympus" />}>Como funciona Gates of Olympus</Button>
            <Button variant="outline" render={<LocaleLink href="/games/sweet-bonanza" />}>Conhecer Sweet Bonanza</Button>
            <Button variant="outline" render={<LocaleLink href="/games/big-bass-bonanza" />}>Conhecer Big Bass Bonanza</Button>
            <Button variant="ghost" render={<LocaleLink href="/games-like/gates-of-olympus" />}>Alternativas a Gates of Olympus</Button>
            <Button variant="ghost" render={<LocaleLink href="/compare/gates-of-olympus-vs-sweet-bonanza" />}>Gates vs Sweet Bonanza</Button>
            <Button variant="ghost" render={<LocaleLink href="/providers/pragmatic-play" />}>Catálogo da Pragmatic Play</Button>
            <Button variant="ghost" render={<LocaleLink href="/best/best-slots-brazil" />}>Seleção editorial para o Brasil</Button>
          </div>
        </Section>
      )}

      {referenceCatalog}

      {bestList && bestListContent && (
        <Section className="pt-0">
          <LocaleLink
            href={`/best/${bestList.slug}`}
            className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:glow-primary sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <Trophy className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {bestListContent.title}
                </h3>
                <p className="mt-1 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
                  {bestListContent.intro}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
              {t('category.viewRanking')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </LocaleLink>
        </Section>
      )}

      {comparisons.length > 0 && (
        <Section className="pt-0">
          <SectionHeading
            eyebrow={t('cta.compare')}
            title={t('category.headToHead', { category: category.name })}
            description={t('category.headToHeadSub')}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {comparisons.map((c) => (
              <ComparisonCard key={c.slug} comparison={c} />
            ))}
          </div>
        </Section>
      )}

      <Section className="border-t border-border bg-card/30">
        <SectionHeading
          eyebrow={t('geo.whereToPlay')}
          title={t('category.operatorsTitle', {
            category: category.name,
            market: countryName,
          })}
          description={t('category.operatorsSub')}
        />
        <WhereToPlay category={slug} />
      </Section>

      <Section>
        <SectionHeading title={t('rg.blockTitle')} />
        <ResponsibleGamingNotice />
        <AffiliateDisclosureLine className="mt-3" />
      </Section>
    </div>
  )
}
