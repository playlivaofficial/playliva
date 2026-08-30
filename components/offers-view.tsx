'use client'

import { useMemo } from 'react'
import { useCountry } from '@/components/country-context'
import { getPublicOffers, getCountryName } from '@/lib/data'
import { Section, SectionHeading } from '@/components/section'
import { OfferCard } from '@/components/offer-card'
import { CountrySelector } from '@/components/geo-selectors'
import { AffiliateDisclosureLine } from '@/components/notices'
import type { Offer } from '@/lib/types'

function OfferGrid({ offers }: { offers: Offer[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}

export function OffersView() {
  const { countryCode, locale, t } = useCountry()
  // Verified-only: empty until real approved offers exist for this market.
  const offers = getPublicOffers(countryCode)
  const countryName = getCountryName(countryCode, locale)

  const featured = useMemo(() => offers.filter((o) => o.featured), [offers])
  const casino = useMemo(
    () =>
      offers.filter((o) =>
        ['slots', 'live-casino'].includes(o.category as string),
      ),
    [offers],
  )
  const sports = useMemo(
    () => offers.filter((o) => o.category === 'sports'),
    [offers],
  )
  const newPlayer = useMemo(
    () => offers.filter((o) => o.category === 'welcome'),
    [offers],
  )

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-grid">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-3xl rounded-full bg-primary/20 blur-[100px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {t('nav.offers')}
          </p>
          <h1 className="max-w-3xl text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t('offers.heroTitle', { market: countryName })}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {t('offers.heroSub')}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {t('offers.showingFor')}
            </span>
            <CountrySelector />
          </div>
        </div>
      </section>

      {offers.length === 0 ? (
        <Section>
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-base font-medium text-foreground">
              {t('offers.emptyTitle', { market: countryName })}
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              {t('offers.emptyBody')}
            </p>
          </div>
        </Section>
      ) : (
        <>
          {featured.length > 0 && (
            <Section>
              <SectionHeading
                eyebrow={t('offers.highlighted')}
                title={t('offers.featured')}
                description={t('offers.featuredSub', { market: countryName })}
              />
              <OfferGrid offers={featured} />
            </Section>
          )}

          {casino.length > 0 && (
            <Section className="border-t border-border bg-card/30">
              <SectionHeading title={t('offers.casino')} />
              <OfferGrid offers={casino} />
            </Section>
          )}

          {sports.length > 0 && (
            <Section className="border-t border-border">
              <SectionHeading title={t('offers.sports')} />
              <OfferGrid offers={sports} />
            </Section>
          )}

          {newPlayer.length > 0 && (
            <Section className="border-t border-border bg-card/30">
              <SectionHeading title={t('offers.newPlayer')} />
              <OfferGrid offers={newPlayer} />
            </Section>
          )}
        </>
      )}

      <Section className="border-t border-border">
        <AffiliateDisclosureLine />
      </Section>
    </div>
  )
}
