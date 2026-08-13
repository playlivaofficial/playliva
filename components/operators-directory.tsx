'use client'

import { useMemo, useState } from 'react'
import { PUBLIC_COUNTRIES, getPublicOperators, getCountryName } from '@/lib/data'
import { useCountry } from '@/components/country-context'
import { OperatorCard } from '@/components/operator-card'
import { AffiliateDisclosure } from '@/components/notices'
import { cn } from '@/lib/utils'
import type { CategorySlug, CountryCode } from '@/lib/types'

type Filter = 'all' | 'casino' | 'sports' | 'crash'

function matchesFilter(categories: CategorySlug[], filter: Filter) {
  if (filter === 'all') return true
  if (filter === 'sports') return categories.includes('sports')
  if (filter === 'crash') return categories.includes('crash')
  return categories.includes('slots') || categories.includes('live-casino')
}

export function OperatorsDirectory() {
  const { locale, t } = useCountry()
  const [filter, setFilter] = useState<Filter>('all')
  const [countryFilter, setCountryFilter] = useState<CountryCode | 'all'>('all')

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('operators.filterAll') },
    { key: 'casino', label: t('operators.filterCasino') },
    { key: 'sports', label: t('operators.filterSports') },
    { key: 'crash', label: t('operators.filterCrash') },
  ]

  // Only non-mock, verified operators reach the public directory.
  const publicOperators = getPublicOperators()

  const operators = useMemo(() => {
    return publicOperators
      .filter((o) => matchesFilter(o.categories, filter))
      .filter((o) =>
        countryFilter === 'all' ? true : o.countries.includes(countryFilter),
      )
  }, [publicOperators, filter, countryFilter])

  const cardCountry = (o: (typeof publicOperators)[number]): CountryCode =>
    countryFilter !== 'all' && o.countries.includes(countryFilter)
      ? countryFilter
      : o.countries[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('operators.filterLabel')}
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f.key
                  ? 'border-primary bg-primary/15 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="sr-only sm:not-sr-only">{t('geo.country')}</span>
          <select
            value={countryFilter}
            onChange={(e) =>
              setCountryFilter(e.target.value as CountryCode | 'all')
            }
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">{t('operators.allCountries')}</option>
            {PUBLIC_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {getCountryName(c.code, locale)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {operators.length > 0 ? (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {t('operators.count', { count: String(operators.length) })}
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {operators.map((operator) => (
              <OperatorCard
                key={operator.id}
                operator={operator}
                country={cardCountry(operator)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
          <p className="text-base font-medium text-foreground">
            {t('operators.emptyTitle')}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            {t('operators.emptyBody')}
          </p>
        </div>
      )}

      <AffiliateDisclosure className="mt-8" />
    </div>
  )
}
