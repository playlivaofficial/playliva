'use client'

import { useEffect } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, ArrowLeft, ClipboardCheck, ListChecks, MapPin, ShieldCheck } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import {
  getCountryName,
  getOperatorsForGame,
  getComparisonsForGame,
  getRelatedGames,
} from '@/lib/data'
import { getCategoryName, getGameContent } from '@/lib/content'
import { Section, SectionHeading } from '@/components/section'
import { WhereToPlayOperatorCard } from '@/components/where-to-play-operator-card'
import { GameCard } from '@/components/game-card'
import { GameArtwork } from '@/components/game-artwork'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ComparisonCard } from '@/components/comparison-card'
import { AffiliateDisclosureLine, ResponsibleNotice } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/tracking'
import type { Game } from '@/lib/types'
import { EditorialByline } from '@/components/editorial-byline'
import { editorialCopy } from '@/lib/editorial'

export function WhereToPlayView({ game }: { game: Game }) {
  const { marketCode: country, locale, t } = useCountry()
  const countryName = country ? getCountryName(country, locale) : t('geo.marketLabel')
  const categoryName = getCategoryName(game.category, locale)
  const gc = getGameContent(game, locale)
  const operators = country ? getOperatorsForGame(game, country) : []
  const comparisons = getComparisonsForGame(game.id).slice(0, 2)
  const related = getRelatedGames(game, country ?? undefined, 4)

  useEffect(() => {
    track('where_to_play_view', {
      gameId: game.id,
      gameSlug: game.slug,
      country: country ?? undefined,
      locale,
      pageType: 'where_to_play',
    })
  }, [game.id, game.slug, country, locale])

  return (
    <div className="pb-16">
      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: t('nav.home'), href: '/' },
              { label: game.title, href: `/games/${game.slug}` },
              { label: t('geo.whereToPlay') },
            ]}
          />
          <LocaleLink
            href={`/games/${game.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t('cta.backToGame', { game: game.title })}
          </LocaleLink>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:w-56">
              <GameArtwork game={game} sizes="(max-width: 640px) 100vw, 224px" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <MapPin className="size-3.5" />
                {countryName}
              </span>
              <h1 className="mt-3 text-balance font-display text-3xl font-bold sm:text-4xl">
                {gc.seo?.whereToPlay?.h1 ??
                  t('game.whereToPlayTitle', {
                    game: game.title,
                    market: countryName,
                  })}
              </h1>
              <p className="mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
                {operators.length > 0 && gc.whereToPlayIntro
                  ? gc.whereToPlayIntro
                  : <>{gc.shortDescription}{' '}{t('wtp.intro', { country: countryName, game: game.title })}</>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Section className="pt-10">
        <EditorialByline path={`/where-to-play/${game.slug}`} locale={locale} />
        {operators.length > 0 && country ? (
          <>
            <SectionHeading
              title={t('category.operatorsTitle', {
                category: categoryName,
                market: countryName,
              })}
              description={t('wtp.operatorsSub')}
              className="mb-6"
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {operators.map((operator) => (
                <WhereToPlayOperatorCard
                  key={operator.id}
                  operator={operator}
                  country={country}
                  category={game.category}
                  pageType="where_to_play"
                  pageSlug={game.slug}
                  ctaLocation="where_to_play"
                />
              ))}
            </div>
            <AffiliateDisclosureLine className="mt-6" />
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
            <p className="text-pretty text-muted-foreground">
              {t('wtp.empty', { game: game.title, market: countryName })}
            </p>
          </div>
        )}
      </Section>

      {comparisons.length > 0 && (
        <Section className="pt-4">
          <SectionHeading
            title={t('game.compareTitle', { game: game.title })}
            description={t('game.compareSub')}
            className="mb-6"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {comparisons.map((c) => (
              <ComparisonCard key={c.slug} comparison={c} />
            ))}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section className="pt-4">
          <SectionHeading
            title={t('game.gamesLike', { game: game.title })}
            description={t('geo.popularInSub', { country: countryName })}
            className="mb-6"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </Section>
      )}

      <Section className="pt-4">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <ListChecks className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('wtp.methodologyTitle')}
              </h2>
            </div>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {gc.availabilityNote ?? gc.whatIsIt ?? gc.about}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{game.provider} · {gc.mechanics.join(' · ')}</p>
            <LocaleLink href="/editorial-policy" className="mt-4 inline-flex min-h-11 items-center text-sm underline underline-offset-4">{editorialCopy(locale).research}</LocaleLink>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-primary">
              <ClipboardCheck className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('wtp.checklistTitle')}
              </h2>
            </div>
            <ol className="mt-4 space-y-3">
              {[
                t('wtp.checklist1'),
                t('wtp.checklist2'),
                t('wtp.checklist3'),
                t('wtp.checklist4'),
                t('wtp.checklist5'),
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="rounded-2xl border border-border bg-card/50 p-6">
          <h2 className="font-display text-lg font-bold text-foreground">
            {t('wtp.aboutGameTitle', { game: game.title })}
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
            {gc.shortDescription}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" render={<LocaleLink href={`/games/${game.slug}`} />}>
              {t('wtp.viewGameCta')}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={<LocaleLink href={`/games-like/${game.slug}`} />}
            >
              {t('wtp.viewGamesLikeCta')}
            </Button>
            {locale === 'pt-BR' && game.category === 'slots' && (
              <>
                <Button size="sm" variant="ghost" render={<LocaleLink href="/slots" />}>
                  Explorar jogos de slots
                </Button>
                <Button size="sm" variant="ghost" render={<LocaleLink href="/providers/pragmatic-play" />}>
                  Catálogo da Pragmatic Play
                </Button>
                {(game.slug === 'gates-of-olympus' || game.slug === 'sweet-bonanza') && (
                  <Button size="sm" variant="ghost" render={<LocaleLink href="/compare/gates-of-olympus-vs-sweet-bonanza" />}>
                    Comparar Gates e Sweet Bonanza
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/50 p-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('wtp.serviceNote')}
          </p>
        </div>
        <ResponsibleNotice className="mt-4" />
      </Section>
    </div>
  )
}
