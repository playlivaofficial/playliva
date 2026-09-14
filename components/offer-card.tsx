import { Gift } from 'lucide-react'
import type { Offer } from '@/lib/types'
import { getOperatorById, getCountry, getCountryName, isOfferEligible } from '@/lib/data'
import { getCategoryName } from '@/lib/content'
import { AffiliateButton } from '@/components/affiliate-button'
import { useTranslation } from '@/components/country-context'
import { BrazilAdWarning } from '@/components/affiliates/brazil-ad-warning'
import { AffiliateDisclosureLine } from '@/components/notices'

export function OfferCard({ offer }: { offer: Offer }) {
  const { t, locale } = useTranslation()
  const operator = getOperatorById(offer.operatorId)
  const country = getCountry(offer.country)
  // GEO name is language-aware (not GEO-aware) — an offer for MX must say
  // "Mexico" in English, "México" in Português/Español, never mixed with
  // the visitor's own selected GEO.
  const countryName = getCountryName(offer.country, locale)
  if (!isOfferEligible(offer, offer.country)) return null
  const categoryLabel =
    offer.category === 'welcome'
      ? t('label.welcomeCategory')
      : getCategoryName(offer.category, locale)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:glow-primary"
      data-betting-ad={offer.country === 'BR' ? '' : undefined} data-evidence-state="pending">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Gift className="size-4 text-primary" />
          {operator?.name ?? 'Partner'}
        </span>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
          {categoryLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-foreground">
          {offer.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {offer.description}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden="true">{country.flag}</span>
          {countryName}
        </p>
        <AffiliateButton
          offerId={offer.id}
          operatorId={offer.operatorId}
          country={offer.country}
          category={offer.category === 'welcome' ? undefined : offer.category}
          pageType="offers"
          ctaLocation="offer_card"
          size="lg"
          className="mt-5 w-full"
        >
          {t('cta.getOffer')}
        </AffiliateButton>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {offer.terms}
        </p>
        <AffiliateDisclosureLine />
        {offer.country === 'BR' && <BrazilAdWarning operatorId={offer.operatorId} expiresAt={Math.min(
          Date.parse(offer.validUntil ?? ''), Date.parse(offer.complianceReview?.reviewBy ?? ''),
          Date.parse(offer.lastVerifiedAt ?? '') + 30 * 86_400_000,
        )} />}
      </div>
    </div>
  )
}
