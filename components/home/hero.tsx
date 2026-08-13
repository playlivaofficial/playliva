'use client'

import { LocaleLink } from '@/components/locale-link'
import { Play, TrendingUp, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrustLine } from '@/components/notices'
import { useCountry } from '@/components/country-context'

export function Hero() {
  const { t, countryName } = useCountry()
  return (
    <section className="relative overflow-hidden bg-grid">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 size-[28rem] rounded-full bg-primary/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-40 size-[24rem] rounded-full bg-primary/10 blur-[120px]"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-24">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            {t('geo.marketLabel')}: {countryName}
          </span>
          <h1 className="mt-5 text-balance font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {t('hero.titleLead')}{' '}
            <span className="text-primary text-glow">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            {t('hero.subtitle')}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<LocaleLink href="/games" />} className="h-12 px-6 text-base">
              <Play className="size-4" />
              {t('cta.exploreGames')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<LocaleLink href="/#game-types" />}
              className="h-12 px-6 text-base"
            >
              {t('cta.browseCategories')}
            </Button>
          </div>
          <TrustLine className="mt-6" />
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}

function HeroVisual() {
  const { t } = useCountry()
  return (
    <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
      {/* Central discovery card */}
      <div className="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card/80 p-5 backdrop-blur-xl glow-primary">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t('label.trending')}
          </span>
          <TrendingUp className="size-4 text-primary" />
        </div>
        <div className="mt-4 space-y-3">
          {[
            { name: 'Aviator', cat: t('nav.crash') },
            { name: 'Gates of Olympus', cat: t('nav.slots') },
            { name: 'Crazy Time', cat: t('nav.liveCasino') },
          ].map((g) => (
            <div key={g.name} className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <Play className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {g.name}
                </p>
                <p className="text-xs text-muted-foreground">{g.cat}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating discovery chip (honest, load-bearing) */}
      <div
        className="absolute bottom-8 left-0 animate-float rounded-2xl border border-border bg-card/80 px-4 py-3 backdrop-blur-xl"
        style={{ animationDelay: '1.5s' }}
      >
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t('hero.chipTitle')}
            </p>
            <p className="text-xs text-muted-foreground">{t('hero.chipSub')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
