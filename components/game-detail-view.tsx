'use client'

import { useEffect } from 'react'
import { LocaleLink } from '@/components/locale-link'
import {
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  Globe,
  Info,
  ListChecks,
  MapPin,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useCountry } from '@/components/country-context'
import {
  getComparisonsForGame,
  getCountryName,
  getOperatorsForGame,
  getPublicMarkets,
  getRelatedGames,
} from '@/lib/data'
import { getCategoryName, getCrashHubContent, getGameContent } from '@/lib/content'
import { Section, SectionHeading } from '@/components/section'
import { GameCard } from '@/components/game-card'
import { GameArtwork } from '@/components/game-artwork'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ComparisonCard } from '@/components/comparison-card'
import { OperatorCard } from '@/components/operator-card'
import {
  ResponsibleNotice,
  ResponsibleGamingNotice,
  AffiliateDisclosureLine,
} from '@/components/notices'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/tracking'
import type { Game } from '@/lib/types'

export function GameDetailView({ game }: { game: Game }) {
  const { countryCode, country, t, locale } = useCountry()
  const categoryName = getCategoryName(game.category, locale)
  const marketName = getCountryName(countryCode, locale)
  const content = getGameContent(game, locale)

  const operators = getOperatorsForGame(game, countryCode)
  const related = getRelatedGames(game, undefined, 4)
  const comparisons = getComparisonsForGame(game.id)
  // Only surface publicly live launch markets (Brazil + Mexico); future GEOs
  // in the data model must not appear as active markets on public pages.
  const publicMarkets = getPublicMarkets(game.countries)

  useEffect(() => {
    track('game_view', {
      gameId: game.id,
      category: game.category,
      country: countryCode,
      pageType: 'game',
    })
  }, [game.id, game.category, countryCode])

  const info: { label: string; value: string }[] = [
    { label: t('label.category'), value: categoryName },
    { label: t('label.provider'), value: game.provider },
    { label: t('label.gameType'), value: game.gameType },
    { label: t('label.devices'), value: game.deviceSupport.join(', ') },
    {
      label: t('label.markets'),
      value: t('game.marketsSupported', { count: publicMarkets.length }),
    },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-3xl rounded-full bg-primary/20 blur-[100px]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
          <div>
            <Breadcrumbs
              className="mb-4"
              items={[
                { label: t('nav.home'), href: '/' },
                { label: categoryName, href: `/${game.category}` },
                { label: game.title },
              ]}
            />
            <LocaleLink
              href="/games"
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {t('cta.backToGames')}
            </LocaleLink>
            <div className="flex items-center gap-2">
              <LocaleLink
                href={`/${game.category}`}
                className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/25"
              >
                {categoryName}
              </LocaleLink>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {t(`label.${game.tag.toLowerCase()}`)}
              </span>
            </div>
            <h1 className="mt-4 text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {content.seo?.game?.h1 ?? game.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('game.byProvider', { provider: game.provider })}
            </p>
            <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {content.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" render={<a href="#where-to-play" />}>
                {t('cta.seeWhereToPlay')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<LocaleLink href={`/games-like/${game.slug}`} />}
              >
                {t('game.gamesLike', { game: game.title })}
              </Button>
            </div>
            <ResponsibleNotice className="mt-6" />
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border glow-primary">
            <GameArtwork
              game={game}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* About + How it works */}
      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <Gamepad2 className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {content.whatIsIt
                  ? t('game.whatIsTitle', { game: game.title })
                  : t('game.aboutTitle')}
              </h2>
            </div>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {content.whatIsIt ?? content.about}
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {t('game.ownershipNote', { game: game.title })}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <ListChecks className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('game.howItWorksTitle')}
              </h2>
            </div>
            <ol className="mt-4 space-y-3">
              {(content.howItWorks ?? [
                t('game.step1'),
                t('game.step2'),
                t('game.step3'),
              ]).map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              {t('game.chanceNote')}
            </p>
          </div>
        </div>

        {content.whyPopular && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('game.whyPopularTitle', { game: game.title })}
              </h2>
            </div>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              {content.whyPopular}
            </p>
          </div>
        )}
      </Section>

      {/* Key game information */}
      <Section className="border-t border-border bg-card/30 py-10">
        <div className="mb-6 flex items-center gap-2 text-primary">
          <Info className="size-5" />
          <h2 className="font-display text-xl font-bold text-foreground">
            {t('game.keyInfoTitle')}
          </h2>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
          {info.map((item) => (
            <div key={item.label} className="bg-card p-5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        {game.mechanics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {game.mechanics.map((m) => (
              <span
                key={m}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Best crash games hub — only for crash-category titles */}
      {game.category === 'crash' && (
        <Section className="pt-0">
          <LocaleLink
            href="/best/crash-games"
            className="group flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:glow-primary sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <Trophy className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {getCrashHubContent(locale).breadcrumbLabel}
                </h2>
                <p className="mt-1 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
                  {getCrashHubContent(locale).featuredSub}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">
              {t('cta.viewDetails')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </LocaleLink>
        </Section>
      )}

      {/* Games like X */}
      {related.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow={t('game.discoveryEyebrow')}
            title={t('game.gamesLike', { game: game.title })}
            description={t('game.gamesLikeSub')}
            action={
              <Button
                variant="outline"
                size="lg"
                render={<LocaleLink href={`/games-like/${game.slug}`} />}
              >
                {t('game.viewAllAlternatives')}
                <ArrowRight className="size-4" />
              </Button>
            }
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </Section>
      )}

      {/* Compare X */}
      {comparisons.length > 0 && (
        <Section className="border-t border-border bg-card/30">
          <SectionHeading
            eyebrow={t('cta.compare')}
            title={t('game.compareTitle', { game: game.title })}
            description={t('game.compareSub')}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((c) => (
              <ComparisonCard key={c.slug} comparison={c} />
            ))}
          </div>
        </Section>
      )}

      {/* Where to play in GEO */}
      <Section id="where-to-play">
        <SectionHeading
          eyebrow={t('geo.whereToPlay')}
          title={t('game.whereToPlayTitle', { game: game.title, market: marketName })}
          description={t('game.whereToPlaySub')}
          action={
            <Button
              variant="outline"
              size="lg"
              render={<LocaleLink href={`/where-to-play/${game.slug}`} />}
            >
              {t('game.fullGuide')}
              <ArrowRight className="size-4" />
            </Button>
          }
        />
        {operators.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {operators.map((operator) => (
              <OperatorCard
                key={operator.id}
                operator={operator}
                country={countryCode}
                category={game.category}
                pageType="game"
                pageSlug={game.slug}
                ctaLocation="game_where_to_play"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-base font-medium text-foreground">
              {t('geo.reviewingTitle', { market: marketName })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('geo.reviewingBody')}
            </p>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="size-4 text-primary" />
          {t('geo.viewingFor', { flag: country.flag, market: marketName })}
        </div>
        <AffiliateDisclosureLine className="mt-4" />
      </Section>

      {/* Availability markets */}
      <Section className="border-t border-border bg-card/30 py-10">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <MapPin className="size-5" />
          <h2 className="font-display text-xl font-bold text-foreground">
            {t('geo.availableMarkets')}
          </h2>
        </div>
        {publicMarkets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {publicMarkets.map((code) => (
              <span
                key={code}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground"
              >
                {getCountryName(code, locale)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('geo.reviewingBody')}
          </p>
        )}
      </Section>

      {/* Responsible gambling */}
      <Section className="border-t border-border bg-card/30">
        <SectionHeading title={t('rg.blockTitle')} />
        <ResponsibleGamingNotice />
      </Section>
    </div>
  )
}
