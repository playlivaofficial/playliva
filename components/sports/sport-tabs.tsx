'use client'

import { LocaleLink } from '@/components/locale-link'
import { CircleDot, Disc, Goal } from 'lucide-react'
import { SPORTS } from '@/lib/sports-data'
import type { SportSlug } from '@/lib/sports-types'
import { useTranslation } from '@/components/country-context'
import { cn } from '@/lib/utils'

const SPORT_ICONS: Record<SportSlug, typeof Goal> = {
  football: Goal,
  basketball: CircleDot,
  tennis: Disc,
}

/**
 * Renders as navigation links to `/sports/[sport]` by default. Pass
 * `onSelect` to instead drive local tab state (e.g. filtering an in-page
 * section) without navigating.
 */
export function SportTabs({
  active,
  onSelect,
}: {
  active: SportSlug
  onSelect?: (sport: SportSlug) => void
}) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('sports.filterSport')} className="flex flex-wrap gap-2">
      {SPORTS.map((sport) => {
        const Icon = SPORT_ICONS[sport.slug]
        const isActive = sport.slug === active
        const className = cn(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'border-primary bg-primary/15 text-foreground'
            : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
        )
        const content = (
          <>
            <Icon className="size-4" aria-hidden />
            {t(`sports.sport.${sport.slug}`)}
          </>
        )

        if (onSelect) {
          return (
            <button
              key={sport.slug}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(sport.slug)}
              className={className}
            >
              {content}
            </button>
          )
        }

        return (
          <LocaleLink
            key={sport.slug}
            href={`/sports/${sport.slug}`}
            aria-current={isActive ? 'page' : undefined}
            className={className}
          >
            {content}
          </LocaleLink>
        )
      })}
    </nav>
  )
}
