'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { LocaleLink } from '@/components/locale-link'
import {
  ArrowLeft,
  CreditCard,
  Gamepad2,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { useCountry } from '@/components/country-context'
import {
  getCountryName,
  getGamesForOperator,
  getOffers,
} from '@/lib/data'
import { getCategoryName } from '@/lib/content'
import { Section, SectionHeading } from '@/components/section'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { AffiliateButton } from '@/components/affiliate-button'
import { GameCard } from '@/components/game-card'
import { OfferCard } from '@/components/offer-card'
import { ResponsibleNotice } from '@/components/notices'
import { track } from '@/lib/tracking'
import type { Operator } from '@/lib/types'

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Globe
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-4 last:border-b-0">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 text-sm text-foreground">{children}</div>
      </div>
    </div>
  )
}

export function OperatorProfileView({ operator }: { operator: Operator }) {
  const { countryCode, locale, t } = useCountry()

  // Prefer the selected country if the operator serves it, else its first market.
  const activeCountry = operator.countries.includes(countryCode)
    ? countryCode
    : operator.countries[0]
  const activeCountryName = getCountryName(activeCountry, locale)
  // A temporarily paused partner keeps its config/links but must not receive
  // outbound traffic, so its CTA is suppressed in favor of a neutral note.
  // Only a paused operator is affected here — every other operator behaves
  // exactly as before (CTA shown whenever a market affiliate URL exists).
  const isPaused = operator.affiliateStatus === 'paused'
  const showAffiliateCta =
    Boolean(operator.affiliateUrl[activeCountry]) && !isPaused

  const relatedOffers = operator.countries
    .flatMap((c) => getOffers(c))
    .filter(
      (o) =>
        o.operatorId === operator.id &&
        o.active &&
        o.status === 'verified',
    )

  const games = getGamesForOperator(operator, activeCountry).slice(0, 8)

  useEffect(() => {
    track('operator_view', {
      operatorId: operator.id,
      operatorSlug: operator.slug,
      country: activeCountry,
      pageType: 'operator',
    })
  }, [operator.id, operator.slug, activeCountry])

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-3xl rounded-full bg-primary/20 blur-[100px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: t('nav.home'), href: '/' },
              { label: t('nav.operators'), href: '/operators' },
              { label: operator.name },
            ]}
          />
          <LocaleLink
            href="/operators"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t('operators.backToAll')}
          </LocaleLink>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary">
              <Image
                src={operator.logo || '/placeholder.svg'}
                alt={`${operator.name} logo`}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {operator.name}
                </h1>
                {operator.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                    <ShieldCheck className="size-3.5" />
                    {t('operators.verifiedBadge')}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {operator.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {getCategoryName(c, locale)}
                  </span>
                ))}
              </div>
            </div>
            {showAffiliateCta ? (
              <AffiliateButton
                operatorSlug={operator.slug}
                operatorId={operator.id}
                country={activeCountry}
                pageType="operator"
                ctaLocation="operator_hero"
                size="lg"
                className="sm:self-center"
              >
                {t('cta.visitOperator')}
              </AffiliateButton>
            ) : isPaused ? (
              <span className="inline-flex items-center rounded-full border border-border bg-secondary/40 px-4 py-2 text-sm font-medium text-muted-foreground sm:self-center">
                {t('operators.temporarilyUnavailable')}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold text-foreground">
                {t('operators.detailsTitle')}
              </h2>
              <div className="mt-2">
                <InfoRow icon={Globe} label={t('operators.countryAvailability')}>
                  {operator.countries
                    .map((c) => getCountryName(c, locale))
                    .join(', ')}
                </InfoRow>
                <InfoRow icon={Gamepad2} label={t('operators.gameTypesLabel')}>
                  {operator.gameTypes.join(' · ')}
                </InfoRow>
                <InfoRow icon={CreditCard} label={t('operators.paymentMethods')}>
                  {operator.paymentMethods.join(' · ')}
                </InfoRow>
              </div>
            </div>

            {games.length > 0 && (
              <div className="mt-8">
                <SectionHeading
                  title={t('operators.gamesHere')}
                  description={t('operators.gamesHereDetail', {
                    operator: operator.name,
                    market: activeCountryName,
                  })}
                  className="mb-4"
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {games.map((g) => (
                    <GameCard key={g.id} game={g} />
                  ))}
                </div>
              </div>
            )}

            {relatedOffers.length > 0 && (
              <div className="mt-8">
                <SectionHeading title={t('operators.offersTitle')} className="mb-4" />
                <div className="grid gap-5 sm:grid-cols-2">
                  {relatedOffers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-base font-bold text-foreground">
                {t('operators.termsTitle')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t('operators.termsPlaceholder')}
              </p>
              {showAffiliateCta ? (
                <AffiliateButton
                  operatorSlug={operator.slug}
                  operatorId={operator.id}
                  country={activeCountry}
                  pageType="operator"
                  ctaLocation="operator_terms"
                  size="lg"
                  className="mt-4 w-full"
                >
                  {t('cta.visitOperator')}
                </AffiliateButton>
              ) : isPaused ? (
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  {t('operators.temporarilyUnavailable')}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('notice.affiliate')}
              </p>
              <ResponsibleNotice className="mt-4" />
            </div>
          </aside>
        </div>
      </Section>
    </div>
  )
}
