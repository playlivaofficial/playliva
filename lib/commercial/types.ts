import type { Locale, Offer, Operator, CategorySlug } from '../types'
import type { CommercialGeo, CommercialCurrency } from '../geo'

/** Only server-validated, publishable data crosses into the public UI. */
export interface CommercialSnapshot {
  geo: CommercialGeo | null
  currency: CommercialCurrency | null
  operators: Operator[]
  offers: Offer[]
  campaigns: CommercialCampaign[]
}
export interface CommercialCampaign {
  id: string
  operatorId: string
  geo: CommercialGeo
  approved: boolean
  active: boolean
  currency: CommercialCurrency
  offer: Offer
  copy: Partial<Record<Locale, { headline: string; condition: string; cta: string }>>
  placements: readonly string[]
  cadence: { cycleMultiple: number; delayMs: number }
  validFrom: string
  validUntil: string
  verifiedTerms: readonly string[]
}
export function emptyCommercialSnapshot(geo: CommercialGeo | null = null): CommercialSnapshot {
  return { geo, currency: geo === 'MX' ? 'MXN' : geo === 'CO' ? 'COP' : geo === 'PE' ? 'PEN' : null, operators: [], offers: [], campaigns: [] }
}

/** Private production configuration. URLs and partner-issued IDs never become
 * page props; a public opaque campaign key identifies a configured destination. */
export interface OperatorRegistration {
  id: string
  slug: string
  brand: string
  geo: CommercialGeo
  productTypes: CategorySlug[]
  approved: boolean
  active: boolean
  affiliateUrl: string
  /** Optional GEO-scoped key into `PLAYLIVA_AFFILIATE_DESTINATIONS`, used only when `affiliateUrl` is omitted. */
  destinationKey?: string
  campaignKey: string
  campaignId?: string
  trackingTemplate?: string
  analyticsTrackingTemplate?: string
  currency: CommercialCurrency
  priority: number
  assets: { logo: string; alt: string }
  ctaText?: Partial<Record<Locale, string>>
  legal: { status: 'unknown' | 'verified' | 'blocked'; source?: string; verifiedAt?: string; reviewBy?: string; statement?: string; responsibleGambling?: string; disclosure?: string }
  verifiedGames?: string[]
  offer?: Omit<CommercialCampaign, 'operatorId' | 'geo' | 'currency'>
  /** Further verified campaigns for the same operator and GEO (max 20). An
   * entry may carry its own opaque campaign key and partner-issued destination,
   * so a casino and a sportsbook welcome offer never share one tracked link;
   * without destination fields it uses the operator's own destination. */
  offers?: CommercialOfferRegistration[]
}

export type CommercialOfferRegistration = Omit<CommercialCampaign, 'operatorId' | 'geo' | 'currency'> & {
  campaignKey?: string
  affiliateUrl?: string
  /** GEO-scoped key into `PLAYLIVA_AFFILIATE_DESTINATIONS`, used only when `affiliateUrl` is omitted. */
  destinationKey?: string
  campaignId?: string
}
