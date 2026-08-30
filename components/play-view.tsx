'use client'

import { LocaleLink } from '@/components/locale-link'
import { Rocket, Dices, Radio, Trophy, Zap } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { getCountryName } from '@/lib/data'
import { Section, SectionHeading } from '@/components/section'
import { FeaturedOperators } from '@/components/featured-operators'
import { CountrySelector } from '@/components/geo-selectors'
import { AffiliateDisclosureLine, ResponsibleNotice } from '@/components/notices'
import { Button } from '@/components/ui/button'
import type { CategorySlug } from '@/lib/types'

const QUICK: { slug: CategorySlug; key: string; icon: typeof Zap }[] = [
  { slug: 'crash', key: 'nav.crash', icon: Zap },
  { slug: 'slots', key: 'nav.slots', icon: Dices },
  { slug: 'live-casino', key: 'nav.live', icon: Radio },
  { slug: 'sports', key: 'nav.sports', icon: Trophy },
]

export function PlayView() {
  const { countryCode, locale, t } = useCountry()
  const countryName = getCountryName(countryCode, locale)

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-72 max-w-3xl rounded-full bg-primary/25 blur-[110px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Rocket className="size-4" />
            {t('game.discoveryEyebrow')}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t('play.heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t('play.heroSub')}
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-3">
            {QUICK.map(({ slug, key, icon: Icon }) => (
              <LocaleLink
                key={slug}
                href={`/${slug}`}
                className="group flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:glow-primary"
              >
                <Icon className="size-5 text-primary transition-transform group-hover:scale-110" />
                {t(key)}
              </LocaleLink>
            ))}
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow={t('geo.marketLabel')}
          title={t('play.recommendedFor', { market: countryName })}
          description={t('play.recommendedSub')}
          action={<CountrySelector />}
        />
        <FeaturedOperators />
        <div className="mt-8 flex flex-col justify-center gap-4 rounded-xl border border-border bg-card p-5">
          <ResponsibleNotice />
          <Button
            variant="outline"
            render={<LocaleLink href="/responsible-gaming" />}
          >
            {t('rg.title')}
          </Button>
        </div>
        <AffiliateDisclosureLine className="mt-4" />
      </Section>
    </div>
  )
}
