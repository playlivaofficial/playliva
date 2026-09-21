'use client'

import { useEffect } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, Check, GitCompare, SplitSquareHorizontal } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { getCountryName, getGameById, getOperatorsForGame } from '@/lib/data'
import { getCategoryName, getComparisonContent, getGameContent } from '@/lib/content'
import { PageHero } from '@/components/page-hero'
import { Section, SectionHeading } from '@/components/section'
import { WhereToPlayOperatorCard } from '@/components/where-to-play-operator-card'
import { GameArtwork } from '@/components/game-artwork'
import { AffiliateDisclosureLine, ResponsibleGamingNotice } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/tracking'
import type { Comparison } from '@/lib/types'
import { ContentCard } from '@/components/content-card'
import { discoveryCategory } from '@/lib/product-discovery'
import styles from '@/components/editorial-design.module.css'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'
import { EditorialByline } from '@/components/editorial-byline'

export function ComparisonView({ comparison }: { comparison: Comparison }) {
  const { countryCode, t, locale } = useCountry()
  const a = getGameById(comparison.gameAId)
  const b = getGameById(comparison.gameBId)

  useEffect(() => {
    if (a && b) {
      track('comparison_view', {
        country: countryCode,
        pageType: 'comparison',
        gameId: `${a.id}+${b.id}`,
      })
    }
  }, [a, b, countryCode])

  if (!a || !b) return null

  const content = getComparisonContent(comparison, locale)
  const marketName = getCountryName(countryCode, locale)
  const operators = getOperatorsForGame(a, countryCode)

  return (
    <div>
      <PageHero
        eyebrow={t('compare.eyebrow')}
        title={`${a.title} vs ${b.title}`}
        description={content.intro}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: a.title, href: `/games/${a.slug}` },
          { label: `${t('compare.eyebrow')}: ${b.title}` },
        ]}
        sponsor={<BetssonSponsoredBanner surface="comparison" layout="compact-header" />}
      />

      {/* Side-by-side game cards */}
      <Section className="py-10">
        <EditorialByline path={`/compare/${comparison.slug}`} locale={locale} />
        <div className="grid gap-5 sm:grid-cols-2">
          {[a, b].map((g) => {
            const gc = getGameContent(g, locale)
            return (
              <div
                key={g.id}
                className={`flex flex-col ${styles.comparisonGame}`}
              >
                <div className="relative aspect-[16/9]">
                  <GameArtwork game={g} sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {getCategoryName(discoveryCategory(g), locale)} · {g.provider}
                  </span>
                  <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                    {g.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {gc.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {gc.mechanics.slice(0, 3).map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    render={<LocaleLink href={`/games/${g.slug}`} />}
                    className="mt-5"
                  >
                    {t('compare.viewGame', { game: g.title })}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Similarities + differences */}
      <Section className="border-t border-border bg-card/30">
        <div className="grid gap-8 lg:grid-cols-2">
          <ContentCard>
            <div className="flex items-center gap-2 text-primary">
              <GitCompare className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('compare.similarities')}
              </h2>
            </div>
            <ul className="mt-4 space-y-3">
              {content.similarities.map((s) => (
                <li key={s} className="flex items-start gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </ContentCard>
          <ContentCard>
            <div className="flex items-center gap-2 text-primary">
              <SplitSquareHorizontal className="size-5" />
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('compare.differences')}
              </h2>
            </div>
            <ul className="mt-4 space-y-3">
              {content.differences.map((d) => (
                <li key={d} className="flex items-start gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </ContentCard>
        </div>
      </Section>

      {/* Which one may suit you */}
      <Section>
        <ContentCard tone="guide">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {t('compare.which')}
          </h2>
          <p className="mt-4 max-w-3xl text-pretty leading-relaxed text-muted-foreground">
            {content.editorialSummary}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {t('compare.editorialNote')}
          </p>
        </ContentCard>
      </Section>

      {/* Where to play */}
      <Section className="border-t border-border bg-card/30">
        <SectionHeading
          eyebrow={t('geo.whereToPlay')}
          title={t('compare.whereToPlayTitle', { market: marketName })}
          description={t('compare.whereToPlaySub')}
          action={
            <Button
              variant="outline"
              size="lg"
              render={<LocaleLink href={`/where-to-play/${a.slug}`} />}
            >
              {t('compare.whereToPlayCta', { game: a.title })}
              <ArrowRight className="size-4" />
            </Button>
          }
        />
        {operators.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {operators.map((o) => (
              <WhereToPlayOperatorCard key={o.id} operator={o} country={countryCode}
                category={a.category} gameSlug={a.slug} pageType="comparison" pageSlug={comparison.slug} />
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
        <ResponsibleGamingNotice />
        <AffiliateDisclosureLine className="mt-3" />
      </Section>
    </div>
  )
}
