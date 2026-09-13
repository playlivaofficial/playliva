import type { CategorySlug, Locale } from '@/lib/types'

export type ProviderId = 'pragmatic-play' | 'play-n-go' | 'evolution' | 'smartsoft' | 'spribe'
export type Localized<T> = Record<Locale, T>
export interface ReferenceCopy {
  summary: string
  overview: string
  howItWorks: string
  features: string[]
}
export type ArtworkSource =
  | 'playliva-neutral'
  | 'pragmatic-play-official'
  | 'playngo-official'
  | 'evolution-official'
  | 'smartsoft-official'
  | 'catalog-softswiss'

export interface FallbackArtwork {
  status: 'fallback'
  source: 'playliva-neutral'
  sourceUrl: null
  rightsStatus: 'pending-rights'
  verifiedAt: string
}

export interface SourcedArtwork {
  status: 'official' | 'approved'
  source: Exclude<ArtworkSource, 'playliva-neutral'>
  sourceUrl: string
  rightsStatus: 'approved'
  verifiedAt: string
  assetPath: string
  width: number
  height: number
}

export type CatalogArtworkRecord = FallbackArtwork | SourcedArtwork

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
  artwork: CatalogArtworkRecord
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
