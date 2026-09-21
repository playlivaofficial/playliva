'use client'

import { useCountry } from '@/components/country-context'
import { getCountryName, getOperatorsForCountry } from '@/lib/data'
import { WhereToPlayOperatorCard } from '@/components/where-to-play-operator-card'
import type { CategorySlug } from '@/lib/types'

export function WhereToPlay({ category }: { category?: CategorySlug }) {
  const { marketCode: countryCode, t, locale } = useCountry()
  const marketName = countryCode ? getCountryName(countryCode, locale) : t('geo.marketLabel')
  const operators = (countryCode ? getOperatorsForCountry(countryCode) : []).filter((o) =>
    category ? o.categories.includes(category) : true,
  )

  if (operators.length === 0 || !countryCode) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <p className="text-base font-medium text-foreground">
          {t('geo.offersReviewing', { market: marketName })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('geo.offersReviewingBody')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {operators.map((operator) => (
        <WhereToPlayOperatorCard
          key={operator.id}
          operator={operator}
          country={countryCode}
          category={category}
        />
      ))}
    </div>
  )
}
