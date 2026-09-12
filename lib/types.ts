export type CountryCode =
  | 'BR'
  | 'PT'
  | 'MX'
  | 'CO'
  | 'PE'
  | 'AR'
  | 'EC'
  | 'CL'

/**
 * Language is a concept independent from GEO/market. `PT`/`ES` describe a
 * market's *default* language (used only to seed the initial language
 * choice); `EN` is never a market default today but is always selectable by
 * the visitor regardless of their GEO.
 */
export type LanguageCode = 'PT' | 'ES' | 'EN'

/**
 * BCP-47 locales the interface can render in. Locale tracks the visitor's
 * LANGUAGE choice — it must never be inferred from, or used to change, GEO.
 */
export type Locale = 'pt-BR' | 'es-MX' | 'en'

export type CategorySlug = 'crash' | 'slots' | 'live-casino' | 'table-games' | 'instant-games'
/** Legacy commercial records may retain Sports; it is not a discovery category. */
export type OperatorCategorySlug = CategorySlug | 'sports'

export interface Country {
  code: CountryCode
  name: string
  flag: string
  language: LanguageCode
  /** BCP-47 locale that this market defaults to. */
  locale: Locale
  /** Only markets flagged for launch appear in public selectors. */
  enabledForLaunch: boolean
}

export interface Category {
  slug: CategorySlug
  name: string
  description: string
  cta: string
}

/**
 * Provenance of a game's artwork.
 *   - 'official'  — supplied directly by the game provider.
 *   - 'approved'  — from official provider/press media, or an approved
 *                   operator/affiliate creative kit supplied to PlayLiva.
 *   - 'pending'   — no authorized asset on file yet. Never rendered as real
 *                   artwork; the neutral PlayLiva fallback is shown instead.
 *   - 'placeholder' — explicitly a non-real placeholder (should behave
 *                   identically to 'pending' for rendering purposes).
 */
export type GameAssetStatus = 'official' | 'approved' | 'pending' | 'placeholder'

/**
 * Rights clearance for a game's artwork, independent from `assetStatus`.
 * Real artwork is only ever safe to publish when status is
 * `official`/`approved` AND rights are `approved` — see `hasApprovedArtwork`
 * in `lib/game-artwork.ts`, the single source of truth for this check.
 */
export type GameAssetRightsStatus = 'approved' | 'permission-required' | 'unknown'

export interface Game {
  id: string
  slug: string
  title: string
  category: CategorySlug
  /** Existing verified commercial classification, independent of discovery taxonomy. */
  affiliateCategory?: CategorySlug
  provider: string
  /**
   * Path to the game's artwork, or `null` when no authorized asset exists
   * yet. Never populate this with AI-generated, imitation, or unlicensed
   * artwork of a real game — see `assetStatus`/`assetRightsStatus`. Always
   * render through `<GameArtwork>` (`components/game-artwork.tsx`), never
   * directly, so the approval gate is enforced everywhere.
   */
  image: string | null
  /** Descriptive alt text, e.g. "Crazy Time by Evolution". Required once a real image is set. */
  imageAlt?: string
  /** Free-text provenance note for editorial/audit purposes (not rendered). */
  imageSource?: string
  assetStatus: GameAssetStatus
  assetRightsStatus: GameAssetRightsStatus
  /** Longer editorial description used on detail pages. */
  description: string
  /** Compact one-liner used on cards and meta descriptions. */
  shortDescription: string
  tag: 'Popular' | 'Trending' | 'New'
  featured: boolean
  popular: boolean
  new: boolean
  /** Editorial gameplay descriptors (e.g. "Multiplier", "Cash-out"). */
  mechanics: string[]
  gameType: string
  deviceSupport: string[]
  countries: CountryCode[]
  /** Related games surfaced in "Similar games" and "Games like" sections. */
  relatedGameIds: string[]
  /** Games this title is commonly compared against. */
  comparisonGameIds: string[]
  /**
   * Editorial ordering for "Popular in your market". Lower number = higher.
   * Only markets with an explicit rank are treated as curated.
   */
  popularityByCountry?: Partial<Record<CountryCode, number>>
}

/** Reusable, data-driven game-vs-game comparison. */
export interface Comparison {
  slug: string
  gameAId: string
  gameBId: string
  intro: string
  similarities: string[]
  differences: string[]
  editorialSummary: string
  /** Markets this comparison is most relevant for (editorial). */
  countries?: CountryCode[]
}

/** Editorial "Best X" collection, e.g. Best Crash Games in Brazil. */
export interface GameList {
  slug: string
  title: string
  country: CountryCode
  category: CategorySlug
  gameIds: string[]
  intro: string
  editorialContent: string
  seoTitle: string
  seoDescription: string
}

/** Localized editorial snippets keyed by market. */
export interface MarketContent {
  country: CountryCode
  heroLine: string
  crashIntro: string
}

/**
 * Affiliate-partnership lifecycle for an operator. Only `approved` may ever
 * surface in monetized CTA areas (Where to Play, Offers, operator CTAs).
 * `pending` covers partners currently in onboarding — their real accounts
 * and tracking links have not landed yet, so they must stay invisible to
 * public visitors until flipped to `approved` with real data attached.
 */
export type AffiliateStatus = 'pending' | 'approved' | 'paused' | 'rejected'

/** Only `verified` offers may render publicly. */
export type OfferStatus = 'pending' | 'verified' | 'expired' | 'rejected'

export interface Operator {
  id: string
  slug: string
  name: string
  logo: string
  /** Markets this operator is being (or could be) activated for. Spec: `supportedGeos`. */
  countries: CountryCode[]
  /** Verticals this operator offers. Spec: `supportedProducts`. */
  categories: OperatorCategorySlug[]
  paymentMethods: string[]
  gameTypes: string[]
  /** Whether this operator record is enabled in the system at all (independent of affiliate readiness). Spec: `status`. */
  active: boolean
  verified: boolean
  featured: boolean
  /**
   * Development placeholder data. Mock operators are NEVER shown to public
   * visitors as real recommendations or given commercial CTAs, regardless of
   * `affiliateStatus`.
   */
  isMock: boolean
  /**
   * Affiliate partnership lifecycle. Only `approved` operators may appear in
   * monetized CTA areas — this is the single source of truth for that gate.
   */
  affiliateStatus: AffiliateStatus
  /** ISO date of last editorial/affiliate verification (internal). */
  lastVerifiedAt?: string
  /** Free-text commercial arrangement, e.g. "CPA", "RevShare", "Hybrid". Editorial/internal only. */
  commissionModel?: string
  /**
   * Real destination URL per GEO. Never rendered as visible text — always
   * resolved server-side through `/go`. Empty/undefined until the real
   * affiliate account and link are issued; never fabricate a value here.
   */
  affiliateUrl: Partial<Record<CountryCode, string>>
  /**
   * Optional per-category destination override, keyed by category then GEO.
   * When a CTA carries an explicit `category` context (e.g. a crash-game
   * page, a "best crash games" hub, a live-casino category page) and a
   * matching entry exists here for the current GEO, it is used instead of
   * the generic `affiliateUrl`. Falls back to `affiliateUrl` whenever no
   * category is set, no entry exists for it, or the GEO is missing —
   * undefined until the affiliate program issues real category-specific
   * tracking links.
   */
  categoryAffiliateUrl?: Partial<Record<OperatorCategorySlug, Partial<Record<CountryCode, string>>>>
  /**
   * Functional partner attribution appended at redirect time regardless of
   * analytics consent, keyed by GEO. Supports tokens: {geo} {language} {pageType}
   * {pageSlug} {gameSlug} {matchSlug} {placement}. Undefined until the real
   * tracking parameters are supplied by the affiliate program.
   */
  trackingTemplate?: Partial<Record<CountryCode, string>>
  /**
   * Optional measurement only; appended exclusively with analytics consent.
   * Supports the same tokens as trackingTemplate. Never put required partner
   * affiliate/campaign IDs or destination parameters here, or reuse their keys.
   */
  analyticsTrackingTemplate?: Partial<Record<CountryCode, string>>
  /**
   * Explicit, manually-verified game availability per GEO. This is the only
   * source of truth for "this operator offers this game in this market" —
   * availability must never be inferred from `categories`/`gameTypes`.
   */
  verifiedGames?: Partial<Record<CountryCode, string[]>>
  /** Offer ids explicitly linked and verified for this operator. */
  verifiedOffers?: string[]
}

export interface Offer {
  id: string
  operatorId: string
  country: CountryCode
  title: string
  description: string
  category: OperatorCategorySlug | 'welcome'
  terms: string
  affiliateUrl: string
  /** Internal enable/disable toggle, independent of verification. */
  active: boolean
  featured: boolean
  /** Only `verified` offers render publicly — required, explicit verification. */
  status: OfferStatus
  validFrom?: string
  validUntil?: string
  /** Where this offer's data came from, e.g. "Betsson Affiliates portal". */
  source?: string
  /** ISO date this offer's terms/link were last checked against the operator. */
  lastVerifiedAt?: string
}
