'use client'

import { useMemo, useState } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, Info } from 'lucide-react'
import {
  getLeagueById,
  getMatchesForSport,
  getPriorityLeaguesForCountry,
} from '@/lib/sports-data'
import type { SportSlug } from '@/lib/sports-types'
import { useCountry } from '@/components/country-context'
import { PageHero } from '@/components/page-hero'
import { Section, SectionHeading } from '@/components/section'
import { SportTabs } from '@/components/sports/sport-tabs'
import { MatchCard } from '@/components/sports/match-card'
import { AffiliateDisclosure, ResponsibleGamingNotice } from '@/components/notices'

export function SportsLandingView() {
  const { t, countryCode } = useCountry()
  const [activeSport, setActiveSport] = useState<SportSlug>('football')

  const featuredMatches = useMemo(() => {
    const priorityOrder = getPriorityLeaguesForCountry(countryCode, activeSport).map(
      (l) => l.id,
    )
    return getMatchesForSport(activeSport)
      .slice()
      .sort((a, b) => {
        const rankA = priorityOrder.indexOf(a.leagueId)
        const rankB = priorityOrder.indexOf(b.leagueId)
        return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB)
      })
      .slice(0, 6)
  }, [activeSport, countryCode])

  return (
    <div>
      <PageHero
        eyebrow={t('sports.eyebrow')}
        title={t('sports.pageTitle')}
        description={t('sports.pageSub')}
      />

      <div className="border-b border-border bg-secondary/20">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-pretty leading-relaxed">{t('sports.demoNotice')}</p>
        </div>
      </div>

      <Section>
        <SportTabs active={activeSport} onSelect={setActiveSport} />
      </Section>

      <Section className="pt-0">
        <SectionHeading
          eyebrow={t('sports.compareOdds')}
          title={t('sports.featuredTitle')}
          description={t('sports.featuredSub')}
          action={
            <LocaleLink
              href={`/sports/${activeSport}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              {t(`sports.sport.${activeSport}`)}
              <ArrowRight className="size-4" />
            </LocaleLink>
          }
        />
        {featuredMatches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredMatches.map((match) => {
              const league = getLeagueById(match.leagueId)
              if (!league) return null
              return <MatchCard key={match.id} match={match} league={league} />
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">{t('sports.noMatches')}</p>
        )}
      </Section>

      <Section className="border-t border-border bg-card/30">
        <div className="grid gap-4 md:grid-cols-2">
          <AffiliateDisclosure />
          <ResponsibleGamingNotice />
        </div>
      </Section>
    </div>
  )
}
