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
import { WhereToPlayOperatorCard } from '@/components/where-to-play-operator-card'
import {
  ResponsibleNotice,
  ResponsibleGamingNotice,
  AffiliateDisclosureLine,
} from '@/components/notices'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/tracking'
import type { Game } from '@/lib/types'

import { discoveryCategory, productCopy, providerSlug } from '@/lib/product-discovery'
import { ContentCard } from '@/components/content-card'
import styles from '@/components/editorial-design.module.css'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'
import { ProviderPlayRealCta } from '@/components/affiliates/provider-play-real-cta'
import { RtpFact } from '@/components/rtp-fact'
import { EditorialByline } from '@/components/editorial-byline'

export function GameDetailView({ game }: { game: Game }) {
  const { marketCode: countryCode, country, t, locale } = useCountry()
  const visibleCategory = discoveryCategory(game)
  const categoryName = getCategoryName(visibleCategory, locale)
  const marketName = countryCode ? getCountryName(countryCode, locale) : t('geo.marketLabel')
  const content = getGameContent(game, locale)
  const copy = productCopy(locale)
  const deviceNames: Record<string, string> = { Desktop: copy.desktop, Mobile: copy.mobile, Tablet: copy.tablet }

  const operators = countryCode ? getOperatorsForGame(game, countryCode) : []
  const providerPath = providerSlug(game.provider)
  const related = getRelatedGames(game, undefined, 4)
  const comparisons = getComparisonsForGame(game.id)
  // Only surface publicly live launch markets (Brazil + Mexico); future GEOs
  // in the data model must not appear as active markets on public pages.
  const publicMarkets = getPublicMarkets(game.countries)

  useEffect(() => {
    track('game_view', {
      gameId: game.id,
      category: game.category,
      country: countryCode ?? undefined,
      pageType: 'game',
    })
  }, [game.id, game.category, countryCode])

  const info: { label: string; value: string }[] = [
    { label: t('label.category'), value: categoryName },
    { label: t('label.provider'), value: game.provider },
    { label: t('label.gameType'), value: content.gameType },
    { label: t('label.devices'), value: game.deviceSupport.map(device => deviceNames[device] ?? device).join(', ') },
    {
      label: t('label.markets'),
      value: t('game.marketsSupported', { count: publicMarkets.length }),
    },
  ]

  return (
    <div>
      {/* Hero */}
      <section className={styles.detailHero} data-provider-detail={game.slug}>
        <div className={styles.detailInner}>
          <div className={styles.detailTrail}>
            <Breadcrumbs
              items={[
                { label: t('nav.home'), href: '/' },
                { label: categoryName, href: `/${visibleCategory}` },
                { label: game.title },
              ]}
            />
            <LocaleLink
              href="/games"
              className={styles.backLink}
            >
              <ArrowLeft className="size-4" />
              {t('cta.backToGames')}
            </LocaleLink>
          </div>
          <div className={styles.identity}>
            <div className={styles.identityLabels}>
              <LocaleLink
                href={`/${visibleCategory}`}
              >
                {categoryName}
              </LocaleLink>
              <span>
                {t(`label.${game.tag.toLowerCase()}`)}
              </span>
            </div>
            <h1>
              {content.seo?.game?.h1 ?? game.title}
            </h1>
            <p>
              {providerPath ? (
                <LocaleLink href={`/providers/${providerPath}`}>
                  {t('game.byProvider', { provider: game.provider })}
                </LocaleLink>
              ) : t('game.byProvider', { provider: game.provider })}
            </p>
          </div>
          <div className={styles.detailSponsor} data-detail-sponsor="" data-sponsor-slot="game-detail">
            <BetssonSponsoredBanner surface="game" layout="compact-header" />
          </div>
          <div className={styles.detailArt} data-provider-hero-art>
            <GameArtwork
              game={game}
              priority
              compact
              sizes="(max-width: 359px) 96px, (max-width: 639px) 112px, (max-width: 1023px) 220px, 560px"
            />
          </div>
          <div className={styles.detailSummary}>
            <p>
              {content.description}
            </p>
            <div className={styles.detailActions}>
              <ProviderPlayRealCta gameSlug={game.slug} category={game.affiliateCategory ?? game.category} />
              {operators.length > 0 && (
                <Button size="lg" variant="outline" render={<a href="#where-to-play" />}>
                  {t('cta.seeWhereToPlay')}
                </Button>
              )}
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

        </div>
      </section>

      <nav className={styles.contents} aria-label={copy.onPage}>
        <span>{copy.onPage}</span>
        <a href="#overview">{copy.overview}</a>
        <a href="#key-facts">{copy.details}</a>
        {related.length > 0 && <a href="#similar-games">{copy.related}</a>}
      </nav>

      {/* About + How it works */}
      <Section id="overview">
        <EditorialByline path={`/games/${game.slug}`} locale={locale} />
        <RtpFact slug={game.slug} provider={game.provider} locale={locale} />
        <div className="grid gap-8 lg:grid-cols-2">
          <ContentCard>
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
          </ContentCard>

          <ContentCard tone="guide">
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
          </ContentCard>
        </div>

        {content.whyPopular && (
          <ContentCard className="mt-8">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('game.whyPopularTitle', { game: game.title })}
              </h2>
            </div>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              {content.whyPopular}
            </p>
          </ContentCard>
        )}

        {content.entityDifference && (
          <ContentCard className="mt-8" tone="guide">
            <h2 className="font-display text-xl font-bold text-foreground">
              Como o Aviator se diferencia de outros jogos de cassino
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              {content.entityDifference}
            </p>
          </ContentCard>
        )}
      </Section>

      {/* Key game information */}
      <Section id="key-facts" className="border-t border-border bg-card/30 py-10">
        <div className="mb-6 flex items-center gap-2 text-primary">
          <Info className="size-5" />
          <h2 className="font-display text-xl font-bold text-foreground">
            {t('game.keyInfoTitle')}
          </h2>
        </div>
        <dl className={styles.infoGrid}>
          {info.map((item) => (
            <div key={item.label}>
              <dt>
                {item.label}
              </dt>
              <dd>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        {content.mechanics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {content.mechanics.map((m) => (
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

      {game.slug === 'aviator' && locale === 'pt-BR' && (
        <Section className="pt-0">
          <SectionHeading
            title="Explore o universo do Aviator"
            description="Cada guia abaixo responde a uma dúvida diferente sobre disponibilidade, alternativas e comparações."
          />
          <div className="flex flex-wrap gap-3">
            {operators.length > 0 && (
              <Button render={<LocaleLink href="/where-to-play/aviator" />}>Onde jogar Aviator no Brasil</Button>
            )}
            <Button variant="outline" render={<LocaleLink href="/games-like/aviator" />}>Alternativas ao Aviator</Button>
            <Button variant="outline" render={<LocaleLink href="/compare/aviator-vs-jetx" />}>Comparar Aviator e JetX</Button>
            <Button variant="outline" render={<LocaleLink href="/compare/aviator-vs-spaceman" />}>Comparar Aviator e Spaceman</Button>
            <Button variant="ghost" render={<LocaleLink href="/crash" />}>Explorar jogos crash</Button>
          </div>
        </Section>
      )}

      {/* Games like X */}
      {related.length > 0 && (
        <Section id="similar-games">
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
          action={operators.length > 0 ? (
            <Button
              variant="outline"
              size="lg"
              render={<LocaleLink href={`/where-to-play/${game.slug}`} />}
            >
              {t('game.fullGuide')}
              <ArrowRight className="size-4" />
            </Button>
          ) : undefined}
        />
        {operators.length > 0 && countryCode ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {operators.map((operator) => (
              <WhereToPlayOperatorCard
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
          {t('geo.viewingFor', { flag: countryCode ? country.flag : '🌐', market: marketName })}
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
