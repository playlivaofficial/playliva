'use client'

import Image from 'next/image'
import { LocaleLink } from '@/components/locale-link'
import { Check, ShieldCheck } from 'lucide-react'
import type { CountryCode, Operator } from '@/lib/types'
import { getCountryName } from '@/lib/data'
import { getCategoryName } from '@/lib/content'
import { AffiliateButton } from '@/components/affiliate-button'
import { useTranslation } from '@/components/country-context'
import type { PageType } from '@/lib/tracking'

export function OperatorCard({
  operator,
  country,
  pageType = 'operator',
  pageSlug,
  ctaLocation = 'operator_card',
}: {
  operator: Operator
  country: CountryCode
  /** Context of the page this card is rendered on, for accurate attribution. */
  pageType?: PageType
  /** Editorial slug of the current page (e.g. game slug), for tracking only. */
  pageSlug?: string
  ctaLocation?: string
}) {
  const { t, locale } = useTranslation()
  const hasAffiliate = Boolean(operator.affiliateUrl[country])
  const countryName = getCountryName(country, locale)

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          <Image
            src={operator.logo || '/placeholder.svg'}
            alt={`${operator.name} logo`}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <LocaleLink
              href={`/operators/${operator.slug}`}
              className="truncate font-display text-base font-bold text-foreground hover:text-primary"
            >
              {operator.name}
            </LocaleLink>
            {operator.verified && (
              <ShieldCheck
                className="size-4 shrink-0 text-primary"
                aria-label={t('label.verified')}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('geo.availableIn', { country: countryName })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {operator.categories.map((c) => (
          <span
            key={c}
            className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
          >
            {getCategoryName(c, locale)}
          </span>
        ))}
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <dt className="sr-only">{t('label.payments')}</dt>
            <dd className="text-muted-foreground">
              {operator.paymentMethods.join(' · ')}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <dt className="sr-only">{t('label.gameType')}</dt>
            <dd className="text-muted-foreground">
              {operator.gameTypes.join(' · ')}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex items-center gap-2">
        {hasAffiliate ? (
          <AffiliateButton
            operatorSlug={operator.slug}
            operatorId={operator.id}
            country={country}
            pageType={pageType}
            pageSlug={pageSlug}
            ctaLocation={ctaLocation}
            size="lg"
            className="flex-1"
          >
            {t('cta.viewOffer')}
          </AffiliateButton>
        ) : (
          <LocaleLink
            href={`/operators/${operator.slug}`}
            className="flex-1 rounded-lg bg-secondary px-3 py-2 text-center text-sm font-medium text-secondary-foreground"
          >
            {t('cta.viewDetails')}
          </LocaleLink>
        )}
      </div>
    </div>
  )
}
