'use client'

import { useEffect } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, MapPin } from 'lucide-react'
import {
  getCountryName,
  getGamesByIds,
  getOperatorsForCountry,
  getOperatorsForGame,
} from '@/lib/data'
import { useCountry, useTranslation } from '@/components/country-context'
import {
  getCategoryName,
  getGameContent,
  getGameListContent,
} from '@/lib/content'
import { PageHero } from '@/components/page-hero'
import { Section, SectionHeading } from '@/components/section'
import { WhereToPlayOperatorCard } from '@/components/where-to-play-operator-card'
import { GameArtwork } from '@/components/game-artwork'
import { AffiliateDisclosureLine, ResponsibleGamingNotice } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/tracking'
import type { GameList } from '@/lib/types'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'
import { EditorialByline } from '@/components/editorial-byline'
import { isWhereToPlayIndexable } from '@/lib/seo-market'

export function BestListView({ list }: { list: GameList }) {
  const { commercial, locale, marketCode: countryCode } = useCountry()
  const { t } = useTranslation()

  const countryName = getCountryName(list.country, locale)
  const countryFlag = list.country
  const categoryName = getCategoryName(list.category, locale)
  const games = getGamesByIds(list.gameIds)
  const listContent = getGameListContent(list, locale)
  const operators = (countryCode ? getOperatorsForCountry(countryCode, commercial.operators) : []).filter((o) =>
    countryCode === list.country &&
    o.categories.includes(list.category),
  )

  useEffect(() => {
    track('category_view', {
      country: list.country,
      category: list.category,
      locale,
      pageType: 'best_list',
    })
  }, [list.country, list.category, locale])

  return (
    <div>
      <PageHero
        eyebrow={countryName}
        title={listContent.title}
        description={listContent.intro}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: categoryName, href: `/${list.category}` },
          { label: listContent.title },
        ]}
        sponsor={<BetssonSponsoredBanner surface="best-list" layout="compact-header" />}
      />

      {/* Ranked editorial list */}
      <Section className="py-10">
        <EditorialByline path={`/best/${list.slug}`} locale={locale} />
        {listContent.methodologyCriteria && (
          <div className="mb-8 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold text-foreground">
              Como selecionamos
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {listContent.editorialContent}
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {listContent.methodologyCriteria.map((criterion) => (
                <li key={criterion} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-5">
          {games.map((game, i) => {
            const gc = getGameContent(game, locale)
            return (
              <article
                key={game.id}
                className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:p-6"
              >
                <div className="flex items-start gap-4 sm:w-64 sm:shrink-0">
                  <span className="font-display text-3xl font-bold text-primary/40">
                    {['best-crash-games-brazil', 'best-slots-brazil'].includes(list.slug) ? '•' : String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border">
                    <GameArtwork game={game} sizes="(max-width: 640px) 60vw, 240px" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {game.title}
                    </h2>
                    <span className="text-xs font-medium text-muted-foreground">
                      {game.provider}
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {gc.description}
                  </p>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('best.whyIncluded')}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {listContent.selectionReasons?.[game.id] ?? gc.shortDescription}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t('best.keyMechanic')}
                      </dt>
                      <dd className="mt-1 text-sm text-foreground">
                        {gc.mechanics[0] ?? categoryName}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      render={<LocaleLink href={`/games/${game.slug}`} />}
                    >
                      {t('cta.viewGame')}
                    </Button>
                    {(getOperatorsForGame(game, list.country, commercial.operators).length > 0 ||
                      (locale === 'pt-BR' && isWhereToPlayIndexable(game, 'pt-br'))) && (
                      <Button
                        size="lg"
                        variant="outline"
                        render={<LocaleLink href={`/where-to-play/${game.slug}`} />}
                      >
                        {t('best.whereToPlayGame', { market: countryName })}
                      </Button>
                    )}
                    {game.relatedGameIds.length > 0 && (
                      <Button
                        size="lg"
                        variant="ghost"
                        render={<LocaleLink href={`/games-like/${game.slug}`} />}
                      >
                        {t('best.similarGames')}
                        <ArrowRight className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {!listContent.methodologyCriteria && <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold text-foreground">
            {t('best.methodologyTitle')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {listContent.editorialContent}
          </p>
          {list.slug === 'best-crash-games-brazil' && (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" render={<LocaleLink href="/best/crash-games" />}>
                {t('category.viewRanking')}
              </Button>
              <Button variant="ghost" render={<LocaleLink href="/crash" />}>
                {categoryName}
              </Button>
            </div>
          )}
        </div>}
        {list.slug === 'best-crash-games-brazil' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" render={<LocaleLink href="/best/crash-games" />}>Como avaliar crash games</Button>
            <Button variant="ghost" render={<LocaleLink href="/crash" />}>Explorar a categoria Crash</Button>
          </div>
        )}
        {list.slug === 'best-slots-brazil' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" render={<LocaleLink href="/slots" />}>Explorar a categoria Slots</Button>
            <Button variant="ghost" render={<LocaleLink href="/compare/gates-of-olympus-vs-sweet-bonanza" />}>Comparar Gates e Sweet Bonanza</Button>
            <Button variant="ghost" render={<LocaleLink href="/providers/pragmatic-play" />}>Catálogo da Pragmatic Play</Button>
          </div>
        )}
      </Section>

      {/* Where to play in GEO */}
      <Section className="border-t border-border bg-card/30">
        <SectionHeading
          eyebrow={t('best.whereToPlayEyebrow')}
          title={t('best.whereToPlayTitle', { market: countryName })}
          description={t('best.whereToPlaySub')}
        />
        {operators.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {operators.map((o) => (
              <WhereToPlayOperatorCard key={o.id} operator={o} country={list.country}
                category={list.category} pageType="best_list" pageSlug={list.slug} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-base font-medium text-foreground">
              {t('geo.offersReviewing', { market: countryName })}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('geo.offersReviewingBody')}
            </p>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 text-primary" />
          {t('best.guideCovers', { flag: countryFlag, market: countryName })}
        </div>
        <AffiliateDisclosureLine className="mt-4" />
      </Section>

      <Section>
        <SectionHeading title={t('rg.title')} />
        <ResponsibleGamingNotice />
      </Section>
    </div>
  )
}
