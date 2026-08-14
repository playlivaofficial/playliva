'use client'

import { useEffect, useMemo } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { ArrowRight } from 'lucide-react'
import { GAMES, getGamesByIds } from '@/lib/data'
import { getCategoryName, getCrashHubContent, getGameContent } from '@/lib/content'
import { useCountry } from '@/components/country-context'
import { PageHero } from '@/components/page-hero'
import { Section, SectionHeading } from '@/components/section'
import { GameArtwork } from '@/components/game-artwork'
import { WhereToPlay } from '@/components/where-to-play'
import { AffiliateDisclosure, ResponsibleGamingNotice } from '@/components/notices'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/tracking'

// The three crash games that get a dedicated editorial H2 section. Order is
// intentional (Aviator first, matching the featured grid).
const SPOTLIGHT_SLUGS = ['aviator', 'jetx', 'spaceman']

export function CrashGamesHubView() {
  const { countryCode, locale, t } = useCountry()
  const content = getCrashHubContent(locale)
  const categoryName = getCategoryName('crash', locale)

  // Real, verified crash-category games only — Aviator/JetX/Spaceman first,
  // any other genuinely crash-tagged title after.
  const crashGames = useMemo(() => {
    const priority = ['g1', 'g2', 'g3']
    const all = GAMES.filter((g) => g.category === 'crash')
    return getGamesByIds([
      ...priority.filter((id) => all.some((g) => g.id === id)),
      ...all.filter((g) => !priority.includes(g.id)).map((g) => g.id),
    ])
  }, [])

  const spotlightGames = crashGames.filter((g) => SPOTLIGHT_SLUGS.includes(g.slug))

  useEffect(() => {
    track('category_view', {
      country: countryCode,
      category: 'crash',
      locale,
      pageType: 'best_list',
      pageSlug: 'crash-games',
    })
  }, [countryCode, locale])

  return (
    <div>
      <PageHero
        eyebrow={categoryName}
        title={content.h1}
        description={content.intro}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: categoryName, href: '/crash' },
          { label: content.breadcrumbLabel },
        ]}
      />

      {/* Featured crash games */}
      <Section className="py-10">
        <SectionHeading
          title={content.featuredHeading}
          description={content.featuredSub}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {crashGames.map((game) => {
            const gc = getGameContent(game, locale)
            return (
              <article
                key={game.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-[4/3] w-full border-b border-border">
                  <GameArtwork game={game} sizes="(max-width: 640px) 90vw, 320px" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {game.title}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground">
                      {game.provider} &middot; {categoryName}
                    </p>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    {gc.shortDescription}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 self-start"
                    render={<LocaleLink href={`/games/${game.slug}`} />}
                  >
                    {t('cta.viewGame')}
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </Section>

      {/* Dedicated sections for Aviator, JetX and Spaceman */}
      {spotlightGames.map((game) => {
        const gc = getGameContent(game, locale)
        return (
          <Section key={game.id} className="border-t border-border bg-card/30">
            <SectionHeading
              eyebrow={game.provider}
              title={game.title}
              description={gc.whatIsIt ?? gc.description}
            />
            <div className="flex flex-wrap gap-3">
              <Button size="lg" render={<LocaleLink href={`/games/${game.slug}`} />}>
                {t('cta.viewGame')}
              </Button>
              {game.relatedGameIds.length > 0 && (
                <Button
                  size="lg"
                  variant="outline"
                  render={<LocaleLink href={`/games-like/${game.slug}`} />}
                >
                  {t('best.similarGames')}
                </Button>
              )}
              <Button
                size="lg"
                variant="ghost"
                render={<LocaleLink href={`/where-to-play/${game.slug}`} />}
              >
                {t('geo.whereToPlay')}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </Section>
        )
      })}

      {/* How to choose */}
      <Section className="border-t border-border bg-card/30">
        <SectionHeading
          title={content.howToChooseHeading}
          description={content.howToChooseIntro}
        />
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.criteria.map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
              <dt className="font-display text-base font-bold text-foreground">
                {c.label}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.text}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Where to play in GEO */}
      <Section className="border-t border-border bg-card/30">
        <SectionHeading
          eyebrow={t('geo.whereToPlay')}
          title={content.whereToPlayHeading}
          description={content.whereToPlaySub}
        />
        <WhereToPlay category="crash" />
        <AffiliateDisclosure className="mt-6" />
      </Section>

      <Section>
        <SectionHeading title={t('rg.title')} />
        <ResponsibleGamingNotice />
      </Section>
    </div>
  )
}
