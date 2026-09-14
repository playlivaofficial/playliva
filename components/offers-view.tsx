'use client'

import { useMemo } from 'react'
import { useCountry } from '@/components/country-context'
import { getPublicOffers, getCountryName } from '@/lib/data'
import { Section, SectionHeading } from '@/components/section'
import { OfferCard } from '@/components/offer-card'
import { CountrySelector } from '@/components/geo-selectors'
import { AffiliateDisclosureLine } from '@/components/notices'
import type { Offer } from '@/lib/types'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'

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
        ['crash', 'slots', 'live-casino', 'table-games', 'instant-games'].includes(o.category as string),
      ),
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
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="page-hero-with-sponsor">
            <div className="page-hero-title" data-page-hero-title="">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                {t('nav.offers')}
              </p>
              <h1 className="max-w-3xl text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t('offers.heroTitle', { market: countryName })}
              </h1>
            </div>
            <div
              className="page-hero-sponsor"
              data-offers-sponsored=""
              data-page-hero-sponsor=""
              data-sponsor-slot="offers"
            >
              <p className="mb-2 text-sm font-semibold text-primary">
                {t('affiliate.sponsoredPartner')}
              </p>
              <BetssonSponsoredBanner surface="offers" layout="compact-header" cta="visit" />
            </div>
            <div className="page-hero-lede">
              <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {t('offers.heroSub')}
              </p>
              <div className="mt-8 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {t('offers.showingFor')}
                </span>
                <CountrySelector />
              </div>
            </div>
          </div>
        </div>
      </section>

      {offers.length === 0 ? (
        <Section>
          <div data-offers-verified>
          <SectionHeading title={t('affiliate.verifiedOffers')} />
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-base font-medium text-foreground">
              {t('offers.emptyTitle', { market: countryName })}
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              {t('offers.emptyBody')}
            </p>
          </div>
          </div>
        </Section>
      ) : (
        <div data-offers-verified>
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


          {newPlayer.length > 0 && (
            <Section className="border-t border-border bg-card/30">
              <SectionHeading title={t('offers.newPlayer')} />
              <OfferGrid offers={newPlayer} />
            </Section>
          )}
        </div>
      )}

      <Section className="border-t border-border">
        <AffiliateDisclosureLine />
      </Section>
    </div>
  )
}
