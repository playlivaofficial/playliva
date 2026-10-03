import Image from 'next/image'
import { Gift } from 'lucide-react'
import type { Offer } from '@/lib/types'
import { getCountry, getCountryName, isOfferEligible } from '@/lib/data'
import { getCategoryName } from '@/lib/content'
import { AffiliateButton } from '@/components/affiliate-button'
import { buildGoHref } from '@/lib/affiliate'
import { useCountry } from '@/components/country-context'
import { CommercialAdDisclosure } from '@/components/affiliates/commercial-ad-disclosure'
import { AffiliateDisclosureLine } from '@/components/notices'
import { useCampaignExpiry } from '@/components/affiliates/use-campaign-expiry'

export function OfferCard({ offer }: { offer: Offer }) {
  const { t, locale, marketCode, commercial } = useCountry()
  const operator = commercial.operators.find(item => item.id === offer.operatorId)
  useCampaignExpiry(Math.min(Date.parse(offer.validUntil ?? ''), Date.parse(offer.complianceReview?.reviewBy ?? ''),
    Date.parse(offer.lastVerifiedAt ?? '') + 30 * 86_400_000))
  const country = getCountry(offer.country)
  // GEO name is language-aware (not GEO-aware) — an offer for MX must say
  // "Mexico" in English, "México" in Português/Español, never mixed with
  // the visitor's own selected GEO.
  const countryName = getCountryName(offer.country, locale)
  if (!marketCode || marketCode !== offer.country || commercial.geo !== marketCode ||
    !commercial.offers.some(item => item.id === offer.id) ||
    !isOfferEligible(offer, marketCode, {}, commercial.operators)) return null
  const categoryLabel =
    offer.category === 'welcome'
      ? t('label.welcomeCategory')
      : getCategoryName(offer.category, locale)
  // Campaign artwork is locale-gated: Portuguese promo art never renders on EN / ES-MX.
  const creative = offer.creative?.languages.includes(locale) ? offer.creative : undefined
  const campaign = Boolean(offer.promoId)
  // Terms live on the official campaign landing page, reached through the same tracked redirect.
  const termsHref = offer.termsUrl ? buildGoHref({ offer: offer.id, operator: operator?.slug, country: offer.country, language: locale, page: 'offers', placement: 'offers_page_terms', cta: 'offers_page_terms' }) : undefined

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:glow-primary"
      data-commercial-ad=""
      data-offer-id={offer.id} data-promo-id={offer.promoId}>
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {operator?.logo && campaign ? (
            <span className="relative size-6 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
              <Image src={operator.logo} alt="" fill sizes="24px" className="object-contain" />
            </span>
          ) : (
            <Gift className="size-4 text-primary" />
          )}
          {operator?.name ?? 'Partner'}
        </span>
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
          {categoryLabel}
        </span>
      </div>
      {creative && (
        <div className="relative w-full overflow-hidden border-b border-border bg-secondary/40"
          style={{ aspectRatio: `${creative.width} / ${creative.height}` }}>
          <Image src={creative.assetPath} alt={creative.alt[locale] ?? operator?.name ?? offer.title} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 400px" className="object-cover" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className={`font-display font-bold text-foreground ${campaign ? 'text-2xl leading-tight' : 'text-lg'}`}
          lang={locale}>
          {offer.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {offer.description || (campaign ? t('promo.offerBoundary') : '')}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden="true">{country.flag}</span>
          {countryName}
        </p>
        <AffiliateButton
          offerId={offer.id}
          operatorSlug={operator?.slug}
          operatorId={offer.operatorId}
          country={offer.country}
          category={offer.category === 'welcome' ? undefined : offer.category}
          pageType="offers"
          ctaLocation={campaign ? 'offers_page' : 'offer_card'}
          promo={offer.promoId ? { promoId: offer.promoId, brand: offer.brand, surface: 'offers' } : undefined}
          size="lg"
          className="mt-5 w-full min-h-11 whitespace-normal"
        >
          {offer.ctaLabel?.[locale] ?? t('cta.getOffer')}
        </AffiliateButton>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {offer.terms}
          {termsHref && (
            <>
              {' · '}
              <a href={termsHref} target="_blank" rel="sponsored noopener noreferrer" className="underline underline-offset-2 hover:text-foreground" data-promo-terms="">
                {t('promo.terms')}
              </a>
            </>
          )}
        </p>
        <AffiliateDisclosureLine />
        <CommercialAdDisclosure operatorId={offer.operatorId} />
      </div>
    </div>
  )
}
