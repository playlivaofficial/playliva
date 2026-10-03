'use client'

import { useCountry } from '@/components/country-context'
import { getOperatorsForCountry, getCountryName } from '@/lib/data'
import { OperatorCard } from '@/components/operator-card'

export function FeaturedOperators({ limit }: { limit?: number }) {
  const { marketCode, locale, t, commercial } = useCountry()
  const operators = marketCode ? getOperatorsForCountry(marketCode, commercial.operators) : []
  const shown = limit ? operators.slice(0, limit) : operators
  const countryName = marketCode ? getCountryName(marketCode, locale) : t('geo.marketLabel')

  if (shown.length === 0 || !marketCode) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <p className="text-base font-medium text-foreground">
          {t('geo.offersReviewing', { market: countryName })}
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {t('geo.offersReviewingBody')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((operator) => (
        <OperatorCard
          key={operator.id}
          operator={operator}
          country={marketCode}
        />
      ))}
    </div>
  )
}
