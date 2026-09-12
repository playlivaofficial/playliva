'use client'

import { LocaleLink } from '@/components/locale-link'
import { ArrowRight, Rocket, Cherry, Spade, Dices, Zap, Trophy } from 'lucide-react'
import type { CategorySlug } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useCountry } from '@/components/country-context'
import { getCategoryContent } from '@/lib/content'

// Sports is a network link, not an internal game category or affiliate approval.
type CardSlug = CategorySlug | 'sports'

const ICONS: Record<CardSlug, typeof Rocket> = {
  crash: Rocket,
  slots: Cherry,
  'live-casino': Spade,
  'table-games': Dices,
  'instant-games': Zap,
  sports: Trophy,
}

const HREFS: Record<CardSlug, string> = {
  crash: '/crash',
  slots: '/slots',
  'live-casino': '/live-casino',
  'table-games': '/table-games',
  'instant-games': '/instant-games',
  sports: 'https://livasports.com',
}

export function CategoryCard({
  slug,
  className,
}: {
  slug: CardSlug
  className?: string
  // Raw props from the data object are accepted but ignored; copy is localized.
  name?: string
  description?: string
  cta?: string
}) {
  const { locale } = useCountry()
  const { name, description, cta } = getCategoryContent(slug, locale)
  const Icon = ICONS[slug]
  return (
    <LocaleLink
      href={HREFS[slug]}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:glow-primary',
        className,
      )}
    >
      <div
        className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0"
        aria-hidden="true"
      />
      <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-5 font-display text-xl font-bold text-foreground">
        {name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </LocaleLink>
  )
}
