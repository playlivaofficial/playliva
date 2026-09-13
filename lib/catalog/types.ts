import type { CategorySlug, Locale } from '@/lib/types'

export type ProviderId = 'pragmatic-play' | 'play-n-go' | 'evolution' | 'smartsoft' | 'spribe'
export type Localized<T> = Record<Locale, T>
export interface ReferenceCopy {
  summary: string
  overview: string
  howItWorks: string
  features: string[]
}
export interface ReferenceGame {
  id: string
  slug: string
  title: string
  providerId: ProviderId
  category: CategorySlug
  tags: string[]
  content: Localized<ReferenceCopy>
  sources: string[]
  verifiedAt: string
  artwork: {
    status: 'fallback'
    source: 'playliva-neutral'
    sourceUrl: null
    rightsStatus: 'pending-rights'
    verifiedAt: string
  }
  // Documentary evidence only; deliberately NOT affiliate eligibility inputs.
  availability: { status: 'unverified'; market: 'BR'; operatorEvidence: never[] }
  relatedSlugs: string[]
}

/** Small single-language payload passed across the server/client boundary. */
export interface CatalogSummary {
  id: string
  slug: string
  title: string
  provider: string
  providerId: string
  category: CategorySlug
  categoryLabel: string
  summary: string
  image: string | null
  artworkLabel: string
  reference: boolean
  searchText: string
}
