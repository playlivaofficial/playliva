'use client'

import Image from 'next/image'
import { LocaleLink } from '@/components/locale-link'
import { Check, ShieldCheck } from 'lucide-react'
import type { CategorySlug, CountryCode, Operator } from '@/lib/types'
import { getCountryName, isAffiliateEligible } from '@/lib/data'
import { getCategoryName } from '@/lib/content'
import { AffiliateButton } from '@/components/affiliate-button'
import { useTranslation } from '@/components/country-context'
import type { PageType } from '@/lib/tracking'
import { BrazilAdWarning } from '@/components/affiliates/brazil-ad-warning'
import { AffiliateDisclosureLine } from '@/components/notices'

export function OperatorCard({
  operator,
  country,
  category,
  pageType = 'operator',
  pageSlug,
  gameSlug,
  ctaLocation = 'operator_card',
}: {
  operator: Operator
  country: CountryCode
  /** Editorial category context of the page this card is rendered on (e.g. "crash", "live-casino"), used to resolve a category-specific affiliate destination. */
  category?: CategorySlug
  /** Context of the page this card is rendered on, for accurate attribution. */
  pageType?: PageType
  /** Editorial slug of the current page (e.g. game slug), for tracking only. */
  pageSlug?: string
  gameSlug?: string
  ctaLocation?: string
}) {
  const { t, locale } = useTranslation()
  const hasAffiliate = isAffiliateEligible(operator, country, {
    category, pageType, pageSlug, gameSlug, placement: ctaLocation,
  })
  const countryName = getCountryName(country, locale)

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
      data-betting-ad={hasAffiliate && country === 'BR' ? '' : undefined} data-evidence-state="pending">
      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          <Image
            src={operator.logo || '/placeholder.svg'}
            alt={`${operator.name} logo`}
            fill
            sizes="48px"
            className="object-contain"
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

      {(operator.paymentMethods.length > 0 || operator.gameTypes.length > 0) && (
        <dl className="mt-4 space-y-2 text-sm">
          {operator.paymentMethods.length > 0 && (
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <dt className="sr-only">{t('label.payments')}</dt>
                <dd className="text-muted-foreground">
                  {operator.paymentMethods.join(' · ')}
                </dd>
              </div>
            </div>
          )}
          {operator.gameTypes.length > 0 && (
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <dt className="sr-only">{t('label.gameType')}</dt>
                <dd className="text-muted-foreground">
                  {operator.gameTypes.join(' · ')}
                </dd>
              </div>
            </div>
          )}
        </dl>
      )}

      <div className="mt-5 flex items-center gap-2">
        {hasAffiliate ? (
          <AffiliateButton
            operatorSlug={operator.slug}
            operatorId={operator.id}
            country={country}
            category={category}
            pageType={pageType}
            pageSlug={pageSlug}
            gameSlug={gameSlug}
            ctaLocation={ctaLocation}
            size="lg"
            className="flex-1"
          >
            {t('cta.visitOperator')}
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
      {hasAffiliate && <AffiliateDisclosureLine />}
      {hasAffiliate && country === 'BR' && <BrazilAdWarning operatorId={operator.id} />}
    </div>
  )
}
