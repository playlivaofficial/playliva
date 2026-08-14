import type {
  Category,
  CategorySlug,
  Comparison,
  Country,
  CountryCode,
  Game,
  GameList,
  Locale,
  MarketContent,
  Offer,
  Operator,
} from './types'

// Localized market display names. Keyed by LANGUAGE (locale), never by GEO —
// e.g. an English-speaking visitor physically in Brazil still sees "Brazil".
const COUNTRY_NAMES: Record<CountryCode, Record<Locale, string>> = {
  BR: { 'pt-BR': 'Brasil', 'es-MX': 'Brasil', en: 'Brazil' },
  MX: { 'pt-BR': 'México', 'es-MX': 'México', en: 'Mexico' },
  PT: { 'pt-BR': 'Portugal', 'es-MX': 'Portugal', en: 'Portugal' },
  CO: { 'pt-BR': 'Colômbia', 'es-MX': 'Colombia', en: 'Colombia' },
  PE: { 'pt-BR': 'Peru', 'es-MX': 'Perú', en: 'Peru' },
  AR: { 'pt-BR': 'Argentina', 'es-MX': 'Argentina', en: 'Argentina' },
  EC: { 'pt-BR': 'Equador', 'es-MX': 'Ecuador', en: 'Ecuador' },
  CL: { 'pt-BR': 'Chile', 'es-MX': 'Chile', en: 'Chile' },
}

/**
 * Full market catalogue. Only markets with `enabledForLaunch: true` are
 * exposed in public selectors; the rest stay in the data model so they can
 * be switched on later without re-architecting.
 */
export const COUNTRIES: Country[] = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷', language: 'PT', locale: 'pt-BR', enabledForLaunch: true },
  { code: 'MX', name: 'México', flag: '🇲🇽', language: 'ES', locale: 'es-MX', enabledForLaunch: true },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', language: 'PT', locale: 'pt-BR', enabledForLaunch: false },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', language: 'ES', locale: 'es-MX', enabledForLaunch: false },
  { code: 'PE', name: 'Perú', flag: '🇵🇪', language: 'ES', locale: 'es-MX', enabledForLaunch: false },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', language: 'ES', locale: 'es-MX', enabledForLaunch: false },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', language: 'ES', locale: 'es-MX', enabledForLaunch: false },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', language: 'ES', locale: 'es-MX', enabledForLaunch: false },
]

/** Markets shown in public country selectors (Brazil + Mexico for launch). */
export const PUBLIC_COUNTRIES: Country[] = COUNTRIES.filter(
  (c) => c.enabledForLaunch,
)

export const DEFAULT_COUNTRY: CountryCode = 'BR'

/** Priority launch markets — richer content and internal linking. */
export const LAUNCH_MARKETS: CountryCode[] = ['BR', 'MX']

export function getCountry(code: CountryCode): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]
}

/** Language-aware market display name (GEO name, rendered in the current UI language). */
export function getCountryName(code: CountryCode, locale: Locale): string {
  return COUNTRY_NAMES[code]?.[locale] ?? getCountry(code).name
}

const LANGUAGE_TO_LOCALE: Record<'PT' | 'ES' | 'EN', Locale> = {
  PT: 'pt-BR',
  ES: 'es-MX',
  EN: 'en',
}

/**
 * Sensible DEFAULT language for a given GEO/market, used only to seed the
 * visitor's language on first visit. This is a one-time hint — once a
 * visitor manually picks a language (or one is restored from storage) this
 * function is never consulted again, and changing GEO afterwards must not
 * call this to override an existing language choice.
 */
export function getDefaultLocaleForCountry(code: CountryCode): Locale {
  return LANGUAGE_TO_LOCALE[getCountry(code).language] ?? 'en'
}

/**
 * Narrow a list of market codes to the ones that are publicly live for launch
 * (Brazil + Mexico). Future GEOs stay in the data model for later activation
 * but must never surface on public pages as if they were active markets.
 */
export function getPublicMarkets(codes: CountryCode[]): CountryCode[] {
  const live = new Set(PUBLIC_COUNTRIES.map((c) => c.code))
  return codes.filter((code) => live.has(code))
}

export const CATEGORIES: Category[] = [
  {
    slug: 'crash',
    name: 'Crash',
    description: 'Fast-paced multiplier games and popular crash titles.',
    cta: 'Explore Crash',
  },
  {
    slug: 'slots',
    name: 'Slots',
    description: 'Discover popular slots and new releases.',
    cta: 'Explore Slots',
  },
  {
    slug: 'live-casino',
    name: 'Live Casino',
    description: 'Explore live dealer tables and casino experiences.',
    cta: 'Explore Live',
  },
  {
    slug: 'sports',
    name: 'Sports',
    description: 'Find sportsbooks and betting options available in your market.',
    cta: 'Explore Sports',
  },
]

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

const ALL: CountryCode[] = ['BR', 'PT', 'MX', 'CO', 'PE', 'AR', 'EC']

export const GAMES: Game[] = [
  {
    id: 'g1',
    slug: 'aviator',
    title: 'Aviator',
    category: 'crash',
    provider: 'Spribe',
    // No authorized Spribe asset on file yet — shows the PlayLiva fallback
    // per the game-artwork governance rule until one is supplied.
    image: null,
    imageAlt: 'Aviator by Spribe',
    imageSource: 'Pending — awaiting an approved Spribe asset.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description:
      'A multiplier climbs until the plane flies away. Cash out before it does.',
    shortDescription: 'Cash out before the plane flies away.',
    tag: 'Trending',
    featured: true,
    popular: true,
    new: false,
    mechanics: ['Rising multiplier', 'Manual cash-out', 'Auto cash-out', 'Dual bets'],
    gameType: 'Crash / multiplier',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g2', 'g3', 'g4', 'g10'],
    comparisonGameIds: ['g2', 'g3'],
    popularityByCountry: { BR: 1, MX: 1, CO: 2, PE: 2, AR: 1, EC: 2, PT: 1 },
  },
  {
    id: 'g2',
    slug: 'jetx',
    title: 'JetX',
    category: 'crash',
    provider: 'SmartSoft',
    image: null,
    imageAlt: 'JetX by SmartSoft',
    imageSource: 'Pending — awaiting an approved SmartSoft asset.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'A rising jet-fighter multiplier game with a loyal following.',
    shortDescription: 'A rising jet-fighter multiplier game.',
    tag: 'Popular',
    featured: true,
    popular: true,
    new: false,
    mechanics: ['Rising multiplier', 'Manual cash-out', 'Dual bets'],
    gameType: 'Crash / multiplier',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g1', 'g3', 'g10'],
    comparisonGameIds: ['g1', 'g3'],
    popularityByCountry: { BR: 2, MX: 3, CO: 3, AR: 2, PT: 2 },
  },
  {
    id: 'g3',
    slug: 'spaceman',
    title: 'Spaceman',
    category: 'crash',
    provider: 'Pragmatic Play',
    image: null,
    imageAlt: 'Spaceman by Pragmatic Play',
    imageSource: 'Pending — awaiting an approved Pragmatic Play asset.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'A cosmic multiplier journey with a simple cash-out mechanic.',
    shortDescription: 'A cosmic multiplier with simple cash-out.',
    tag: 'Popular',
    featured: true,
    popular: true,
    new: false,
    mechanics: ['Rising multiplier', 'Partial cash-out', 'Auto cash-out'],
    gameType: 'Crash / multiplier',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g1', 'g2', 'g10'],
    comparisonGameIds: ['g1', 'g2'],
    popularityByCountry: { BR: 3, MX: 2, PE: 1, EC: 1 },
  },
  {
    id: 'g4',
    slug: 'mines',
    title: 'Mines',
    category: 'crash',
    provider: 'Spribe',
    image: null,
    imageAlt: 'Mines by Spribe',
    imageSource: 'Pending — awaiting an approved Spribe asset.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'Reveal safe tiles and avoid the mines to grow your multiplier.',
    shortDescription: 'Reveal safe tiles, avoid the mines.',
    tag: 'Trending',
    featured: true,
    popular: true,
    new: false,
    mechanics: ['Grid reveal', 'Risk selection', 'Manual cash-out'],
    gameType: 'Grid / instant',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g10', 'g1', 'g2'],
    comparisonGameIds: ['g10'],
    popularityByCountry: { BR: 4, MX: 4 },
  },
  {
    id: 'g5',
    slug: 'gates-of-olympus',
    title: 'Gates of Olympus',
    category: 'slots',
    provider: 'Pragmatic Play',
    image: null,
    imageAlt: 'Gates of Olympus by Pragmatic Play',
    imageSource: 'Pending — awaiting an approved Pragmatic Play asset. Must match the original Gates of Olympus title exactly, not a sequel/variant such as Gates of Olympus 1000.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'A high-volatility slot themed around the god of thunder.',
    shortDescription: 'High-volatility pay-anywhere slot.',
    tag: 'Popular',
    featured: true,
    popular: true,
    new: false,
    mechanics: ['Pay anywhere', 'Multipliers', 'Free spins', 'Tumble'],
    gameType: 'Video slot',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g6', 'g11'],
    comparisonGameIds: ['g6'],
    popularityByCountry: { BR: 1, MX: 1 },
  },
  {
    id: 'g6',
    slug: 'sweet-bonanza',
    title: 'Sweet Bonanza',
    category: 'slots',
    provider: 'Pragmatic Play',
    image: null,
    imageAlt: 'Sweet Bonanza by Pragmatic Play',
    imageSource: 'Pending — awaiting an approved Pragmatic Play asset. Must match the original Sweet Bonanza title exactly, not a sequel/variant such as Sweet Bonanza 1000.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'A colourful cluster-pays slot with a candy theme.',
    shortDescription: 'Candy-themed cluster-pays slot.',
    tag: 'Popular',
    featured: true,
    popular: true,
    new: false,
    mechanics: ['Cluster pays', 'Multipliers', 'Free spins', 'Tumble'],
    gameType: 'Video slot',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g5', 'g11'],
    comparisonGameIds: ['g5'],
    popularityByCountry: { BR: 2, MX: 2 },
  },
  {
    id: 'g7',
    slug: 'lightning-roulette',
    title: 'Lightning Roulette',
    category: 'live-casino',
    provider: 'Evolution',
    image: null,
    imageAlt: 'Lightning Roulette by Evolution',
    imageSource: 'Pending — awaiting an approved Evolution asset for the actual Lightning Roulette product (not generic roulette photography).',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'Live roulette with electrifying random multipliers each round.',
    shortDescription: 'Live roulette with random multipliers.',
    tag: 'Trending',
    featured: false,
    popular: true,
    new: false,
    mechanics: ['Live dealer', 'Random multipliers', 'Straight-up bets'],
    gameType: 'Live roulette',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g8', 'g12'],
    comparisonGameIds: ['g8'],
    popularityByCountry: { BR: 1, MX: 1 },
  },
  {
    id: 'g8',
    slug: 'crazy-time',
    title: 'Crazy Time',
    category: 'live-casino',
    provider: 'Evolution',
    image: null,
    imageAlt: 'Crazy Time by Evolution',
    imageSource: 'Pending — awaiting an approved Evolution asset for the actual Crazy Time product (not generic wheel/game-show photography).',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'A live game-show experience with bonus rounds and hosts.',
    shortDescription: 'Live game-show with bonus rounds.',
    tag: 'Popular',
    featured: false,
    popular: true,
    new: false,
    mechanics: ['Live host', 'Money wheel', 'Bonus rounds'],
    gameType: 'Live game show',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g7', 'g12'],
    comparisonGameIds: ['g7'],
    popularityByCountry: { BR: 2, MX: 2 },
  },
  {
    id: 'g10',
    slug: 'plinko',
    title: 'Plinko',
    category: 'crash',
    provider: 'Spribe',
    image: null,
    imageAlt: 'Plinko by Spribe',
    imageSource: 'Pending — awaiting an approved Spribe asset.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'Drop the ball and watch it bounce toward a multiplier.',
    shortDescription: 'Drop the ball, chase the multiplier.',
    tag: 'New',
    featured: false,
    popular: false,
    new: true,
    mechanics: ['Ball drop', 'Risk selection', 'Rows selection'],
    gameType: 'Instant / arcade',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g4', 'g1', 'g2'],
    comparisonGameIds: ['g4'],
    popularityByCountry: { BR: 5, MX: 5 },
  },
  {
    id: 'g11',
    slug: 'big-bass-bonanza',
    title: 'Big Bass Bonanza',
    category: 'slots',
    provider: 'Pragmatic Play',
    image: null,
    imageAlt: 'Big Bass Bonanza by Pragmatic Play',
    imageSource: 'Pending — awaiting an approved Pragmatic Play asset.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'A fishing-themed slot with free-spin collection mechanics.',
    shortDescription: 'Fishing-themed free-spin slot.',
    tag: 'Popular',
    featured: false,
    popular: true,
    new: false,
    mechanics: ['Free spins', 'Money collect', 'Multipliers'],
    gameType: 'Video slot',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g5', 'g6'],
    comparisonGameIds: [],
    popularityByCountry: { BR: 3, MX: 3 },
  },
  {
    id: 'g12',
    slug: 'blackjack-live',
    title: 'Blackjack Live',
    category: 'live-casino',
    provider: 'Evolution',
    image: null,
    imageAlt: 'Blackjack Live by Evolution',
    imageSource:
      'Pending — this record is a generic Blackjack category entry, not a verified specific Evolution product/variant. Do not treat it as an official title; keep it on the PlayLiva fallback until the exact product is selected and an approved asset is supplied.',
    assetStatus: 'pending',
    assetRightsStatus: 'unknown',
    description: 'Classic live-dealer blackjack tables in multiple limits.',
    shortDescription: 'Classic live-dealer blackjack tables.',
    tag: 'New',
    featured: false,
    popular: false,
    new: true,
    mechanics: ['Live dealer', 'Multiple limits', 'Side bets'],
    gameType: 'Live table',
    deviceSupport: ['Desktop', 'Mobile', 'Tablet'],
    countries: ALL,
    relatedGameIds: ['g7', 'g8'],
    comparisonGameIds: [],
    popularityByCountry: { BR: 3, MX: 3 },
  },
]

export function getGame(slug: string): Game | undefined {
  return GAMES.find((g) => g.slug === slug)
}

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id)
}

export function getGamesByIds(ids: string[]): Game[] {
  return ids.map((id) => getGameById(id)).filter((g): g is Game => Boolean(g))
}

/** Related games for a title, filtered to those available in a market. */
export function getRelatedGames(
  game: Game,
  country?: CountryCode,
  limit = 4,
): Game[] {
  let list = getGamesByIds(game.relatedGameIds)
  // Backfill with same-category games if editorial list is short.
  if (list.length < limit) {
    const extra = GAMES.filter(
      (g) =>
        g.category === game.category &&
        g.id !== game.id &&
        !game.relatedGameIds.includes(g.id),
    )
    list = [...list, ...extra]
  }
  if (country) list = list.filter((g) => g.countries.includes(country))
  return list.slice(0, limit)
}

/** Editorially ordered popular games for a market, optional category. */
export function getPopularGamesForCountry(
  country: CountryCode,
  category?: string,
  limit = 6,
): Game[] {
  return GAMES.filter(
    (g) =>
      g.countries.includes(country) &&
      (category ? g.category === category : true) &&
      g.popularityByCountry?.[country] !== undefined,
  )
    .sort(
      (a, b) =>
        (a.popularityByCountry?.[country] ?? 99) -
        (b.popularityByCountry?.[country] ?? 99),
    )
    .slice(0, limit)
}

/* ------------------------------------------------------------------ */
/* Comparisons                                                         */
/* ------------------------------------------------------------------ */

export const COMPARISONS: Comparison[] = [
  {
    slug: 'aviator-vs-jetx',
    gameAId: 'g1',
    gameBId: 'g2',
    intro:
      'Aviator and JetX are two of the most recognised crash games in Latin America and Portugal. Both share the same core loop — a multiplier that rises until it crashes — but they differ in pacing, presentation and feel.',
    similarities: [
      'Rising-multiplier crash format',
      'Manual and dual-bet options',
      'Simple, fast rounds',
      'Widely available across launch markets',
    ],
    differences: [
      'Aviator uses a plane theme; JetX uses a jet-fighter theme',
      'JetX rounds can feel slightly slower between takeoffs',
      'Different providers (Spribe vs SmartSoft) mean different lobbies',
    ],
    editorialSummary:
      'Players who want the most widely available crash game often start with Aviator. Those who enjoy a slightly different rhythm and visual style may prefer JetX. Neither is objectively "better" — the right one depends on the pace and look you enjoy.',
    countries: ['BR', 'MX', 'CO', 'AR', 'PT'],
  },
  {
    slug: 'aviator-vs-spaceman',
    gameAId: 'g1',
    gameBId: 'g3',
    intro:
      'Aviator and Spaceman both offer a rising-multiplier experience, but Spaceman adds a partial cash-out mechanic that changes how you manage a round.',
    similarities: [
      'Rising-multiplier crash format',
      'Auto cash-out support',
      'Fast, repeatable rounds',
    ],
    differences: [
      'Spaceman supports partial cash-outs mid-round',
      'Aviator has a larger community and social feed in many lobbies',
      'Different providers (Spribe vs Pragmatic Play)',
    ],
    editorialSummary:
      'If you like fine-grained control over cashing out, Spaceman may suit you. If you prefer the most established crash community, Aviator is the common starting point.',
    countries: ['BR', 'MX', 'PE', 'EC'],
  },
  {
    slug: 'jetx-vs-spaceman',
    gameAId: 'g2',
    gameBId: 'g3',
    intro:
      'JetX and Spaceman are popular Aviator alternatives. Both keep the crash core but bring their own theme and pacing.',
    similarities: [
      'Rising-multiplier crash format',
      'Dual-bet support',
      'Mobile-first design',
    ],
    differences: [
      'Spaceman offers partial cash-out; JetX does not',
      'Different visual themes (jet vs astronaut)',
      'Different providers (SmartSoft vs Pragmatic Play)',
    ],
    editorialSummary:
      'Both are solid picks for players exploring beyond Aviator. Choose based on the theme you enjoy and whether partial cash-out matters to you.',
    countries: ['BR', 'MX'],
  },
  {
    slug: 'gates-of-olympus-vs-sweet-bonanza',
    gameAId: 'g5',
    gameBId: 'g6',
    intro:
      'Gates of Olympus and Sweet Bonanza are both Pragmatic Play slots that share several mechanics, which makes them a natural pair for players comparing options within the same provider lineup.',
    similarities: [
      'Both are Pragmatic Play video slots',
      'Both use a tumble mechanic',
      'Both feature multiplier symbols',
      'Both offer a free-spins mode',
    ],
    differences: [
      'Gates of Olympus pays anywhere on the grid; Sweet Bonanza pays via clusters',
      'Gates of Olympus uses a mythological theme; Sweet Bonanza uses a candy theme',
      'Different visual identity and symbol design',
    ],
    editorialSummary:
      'Players who enjoy the tumble-and-multiplier feel of Gates of Olympus but want a different theme and payout structure often try Sweet Bonanza next. Neither is objectively better — the choice comes down to theme preference and whether you prefer pay-anywhere or cluster-based wins.',
    countries: ['BR', 'MX'],
  },
  {
    slug: 'crazy-time-vs-lightning-roulette',
    gameAId: 'g8',
    gameBId: 'g7',
    intro:
      'Crazy Time and Lightning Roulette are both Evolution live-casino titles, but they take a very different approach to the live format — one built around a game-show wheel, the other around a roulette table with random multipliers.',
    similarities: [
      'Both are Evolution live-casino titles',
      'Both feature a live host/dealer',
      'Both include a random multiplier element',
      'Both are designed for quick, repeatable rounds',
    ],
    differences: [
      'Crazy Time is a game-show format built around a money wheel and bonus rounds; Lightning Roulette is a straight-up roulette table',
      'Crazy Time bets are on wheel segments and bonus games; Lightning Roulette bets are straight-up numbers with random multipliers',
      'Different formats overall — game show vs table game',
    ],
    editorialSummary:
      'Players who enjoy the interactive, presenter-led pace of Crazy Time may also like the electrified rounds of Lightning Roulette, but the two are built on different formats — a game show versus a roulette table. Neither is objectively better — the choice comes down to whether you prefer a wheel-and-bonus format or a classic roulette table with a multiplier twist.',
    countries: ['BR', 'MX'],
  },
]

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug)
}

export function getComparisonsForGame(gameId: string): Comparison[] {
  return COMPARISONS.filter(
    (c) => c.gameAId === gameId || c.gameBId === gameId,
  )
}

/** Comparisons where both games share the given category. */
export function getComparisonsForCategory(
  category: CategorySlug,
): Comparison[] {
  return COMPARISONS.filter((c) => {
    const a = getGameById(c.gameAId)
    const b = getGameById(c.gameBId)
    return a?.category === category && b?.category === category
  })
}

/** All comparisons (used for static param generation). */
export function getAllComparisons(): Comparison[] {
  return COMPARISONS
}

/* ------------------------------------------------------------------ */
/* Editorial "Best X in GEO" lists                                     */
/* ------------------------------------------------------------------ */

export const GAME_LISTS: GameList[] = [
  {
    slug: 'best-crash-games-brazil',
    title: 'Best Crash Games in Brazil',
    country: 'BR',
    category: 'crash',
    gameIds: ['g1', 'g2', 'g3', 'g4'],
    intro:
      'Crash games are among the most-played titles in Brazil. This editorial selection highlights the crash games Brazilian players discover most often, with a short explanation of what makes each one distinct.',
    editorialContent:
      'Rankings reflect PlayLiva editorial judgement based on availability, popularity and gameplay variety in the Brazilian market. They are not a prediction of outcomes and do not represent a guarantee of any result.',
    seoTitle: 'Best Crash Games in Brazil',
    seoDescription:
      'Discover the best crash games in Brazil, how each one plays and where to play them responsibly.',
  },
  {
    slug: 'best-crash-games-mexico',
    title: 'Best Crash Games in Mexico',
    country: 'MX',
    category: 'crash',
    gameIds: ['g1', 'g3', 'g2', 'g4'],
    intro:
      'Crash games have a strong following in Mexico. This selection covers the crash titles Mexican players explore most, with clear notes on how they differ.',
    editorialContent:
      'Rankings reflect PlayLiva editorial judgement based on availability, popularity and gameplay variety in the Mexican market. They are not a prediction of outcomes.',
    seoTitle: 'Best Crash Games in Mexico',
    seoDescription:
      'Discover the best crash games in Mexico, how each one plays and where to play them responsibly.',
  },
  {
    slug: 'best-slots-brazil',
    title: 'Best Slots in Brazil',
    country: 'BR',
    category: 'slots',
    gameIds: ['g5', 'g6', 'g11'],
    intro:
      'Slots remain a core category for Brazilian players. These are the slot titles most commonly discovered through PlayLiva in Brazil.',
    editorialContent:
      'Rankings reflect PlayLiva editorial judgement based on availability and popularity in Brazil. Volatility and features vary by title; play responsibly.',
    seoTitle: 'Best Slots in Brazil',
    seoDescription:
      'Discover popular slots in Brazil, their key features and where to play them responsibly.',
  },
  {
    slug: 'best-slots-mexico',
    title: 'Best Slots in Mexico',
    country: 'MX',
    category: 'slots',
    gameIds: ['g5', 'g6', 'g11'],
    intro:
      'Slots are a favourite among Mexican players. This selection highlights popular slot titles and what makes each one worth exploring.',
    editorialContent:
      'Rankings reflect PlayLiva editorial judgement based on availability and popularity in Mexico. Volatility and features vary by title; play responsibly.',
    seoTitle: 'Best Slots in Mexico',
    seoDescription:
      'Discover popular slots in Mexico, their key features and where to play them responsibly.',
  },
]

export function getGameList(slug: string): GameList | undefined {
  return GAME_LISTS.find((l) => l.slug === slug)
}

export function getGameListsForCountry(country: CountryCode): GameList[] {
  return GAME_LISTS.filter((l) => l.country === country)
}

export function getGameListByCategoryCountry(
  category: string,
  country: CountryCode,
): GameList | undefined {
  return GAME_LISTS.find(
    (l) => l.category === category && l.country === country,
  )
}

/* ------------------------------------------------------------------ */
/* Localized market content                                            */
/* ------------------------------------------------------------------ */

export const MARKET_CONTENT: Partial<Record<CountryCode, MarketContent>> = {
  BR: {
    country: 'BR',
    heroLine: 'Descubra jogos populares e onde jogar no Brasil.',
    crashIntro:
      'Os jogos de crash estão entre os mais procurados no Brasil, com títulos como Aviator liderando a descoberta.',
  },
  MX: {
    country: 'MX',
    heroLine: 'Descubre juegos populares y dónde jugar en México.',
    crashIntro:
      'Los juegos de crash tienen una fuerte presencia en México, con títulos como Aviator entre los más explorados.',
  },
}

export function getMarketContent(
  country: CountryCode,
): MarketContent | undefined {
  return MARKET_CONTENT[country]
}

/* ------------------------------------------------------------------ */
/* Operators                                                           */
/* ------------------------------------------------------------------ */

export const OPERATORS: Operator[] = [
  {
    id: 'op1',
    slug: 'operator-nova',
    name: 'Nova Play',
    logo: '/operators/nova.png',
    countries: ['BR', 'PT'],
    categories: ['crash', 'slots', 'live-casino'],
    paymentMethods: ['Pix', 'Cards', 'Bank transfer'],
    gameTypes: ['Crash', 'Slots', 'Live Casino'],
    active: true,
    verified: true,
    featured: true,
    isMock: true,
    affiliateStatus: 'pending',
    affiliateUrl: {
      BR: 'https://example.com/aff/nova?geo=br',
      PT: 'https://example.com/aff/nova?geo=pt',
    },
  },
  {
    id: 'op2',
    slug: 'operator-vortex',
    name: 'Vortex Bet',
    logo: '/operators/vortex.png',
    countries: ['MX', 'CO', 'PE'],
    categories: ['sports', 'crash', 'slots'],
    paymentMethods: ['SPEI', 'Cards', 'Vouchers'],
    gameTypes: ['Sports', 'Crash', 'Slots'],
    active: true,
    verified: true,
    featured: true,
    isMock: true,
    affiliateStatus: 'pending',
    affiliateUrl: {
      MX: 'https://example.com/aff/vortex?geo=mx',
      CO: 'https://example.com/aff/vortex?geo=co',
      PE: 'https://example.com/aff/vortex?geo=pe',
    },
  },
  {
    id: 'op3',
    slug: 'operator-lumen',
    name: 'Lumen Casino',
    logo: '/operators/lumen.png',
    countries: ['BR', 'AR', 'EC'],
    categories: ['slots', 'live-casino'],
    paymentMethods: ['Pix', 'Cards', 'Crypto'],
    gameTypes: ['Slots', 'Live Casino'],
    active: true,
    verified: true,
    featured: true,
    isMock: true,
    affiliateStatus: 'pending',
    affiliateUrl: {
      BR: 'https://example.com/aff/lumen?geo=br',
      AR: 'https://example.com/aff/lumen?geo=ar',
      EC: 'https://example.com/aff/lumen?geo=ec',
    },
  },
  {
    id: 'op4',
    slug: 'operator-strike',
    name: 'Strike Sports',
    logo: '/operators/strike.png',
    countries: ['MX', 'PE', 'CO'],
    categories: ['sports'],
    paymentMethods: ['SPEI', 'Cards'],
    gameTypes: ['Sports'],
    active: true,
    verified: true,
    featured: false,
    isMock: true,
    affiliateStatus: 'pending',
    affiliateUrl: {
      MX: 'https://example.com/aff/strike?geo=mx',
      PE: 'https://example.com/aff/strike?geo=pe',
      CO: 'https://example.com/aff/strike?geo=co',
    },
  },
  {
    id: 'op5',
    slug: 'operator-orbit',
    name: 'Orbit Games',
    logo: '/operators/orbit.png',
    countries: ['BR', 'PT', 'AR'],
    categories: ['crash', 'slots', 'sports'],
    paymentMethods: ['Pix', 'Cards', 'Bank transfer'],
    gameTypes: ['Crash', 'Slots', 'Sports'],
    active: true,
    verified: true,
    featured: false,
    isMock: true,
    affiliateStatus: 'pending',
    affiliateUrl: {
      BR: 'https://example.com/aff/orbit?geo=br',
      PT: 'https://example.com/aff/orbit?geo=pt',
      AR: 'https://example.com/aff/orbit?geo=ar',
    },
  },

  /* ------------------------------------------------------------------ */
  /* Real partners currently in onboarding.                              */
  /*                                                                      */
  /* These are real companies — NOT development placeholders — so         */
  /* `isMock` is false. They are not yet approved affiliate partners:     */
  /* no real account, tracking link, commission terms or verified game/  */
  /* offer data exists yet, so every affiliate-data field below is left   */
  /* empty/undefined rather than fabricated. `affiliateStatus: 'pending'` */
  /* keeps them fully excluded from every public monetized surface       */
  /* (Where to Play, Offers, operator CTAs, directory, sitemap) via       */
  /* `isOperatorRecommendable` / `getPublicOperators`. Flip to `approved` */
  /* and fill in `affiliateUrl` / `trackingTemplate` / `commissionModel`  */
  /* / `verifiedGames` / `lastVerifiedAt` once the real partnership is    */
  /* confirmed — no other file needs to change.                          */
  /* ------------------------------------------------------------------ */
  {
    /* ------------------------------------------------------------------ */
    /* Betsson — first approved/verified real affiliate partner.           */
    /* Approved for BR only; MX is explicitly NOT supported for this       */
    /* partner and must never be added to `countries` here. Game           */
    /* availability is a separate concern from affiliate approval — only   */
    /* Aviator (g1) has an explicit, manually-verified availability record  */
    /* below, so no other game may show Betsson as an operator yet.        */
    /* ------------------------------------------------------------------ */
    id: 'op-betsson',
    slug: 'betsson-group-affiliates',
    name: 'Betsson',
    logo: '/operators/pending-verification.png',
    countries: ['BR'],
    categories: ['crash', 'live-casino'],
    paymentMethods: [],
    gameTypes: [],
    active: true,
    verified: true,
    featured: false,
    isMock: false,
    affiliateStatus: 'approved',
    lastVerifiedAt: '2026-08-14',
    affiliateUrl: {
      BR: 'https://record.betsson.bet.br/_DtXajoX9_riEp6ygYOshWmNd7ZgqdRLk/1/',
    },
    categoryAffiliateUrl: {
      crash: {
        BR: 'https://record.betsson.bet.br/_DtXajoX9_riSXGwDxSNOy2Nd7ZgqdRLk/1/',
      },
      'live-casino': {
        BR: 'https://record.betsson.bet.br/_DtXajoX9_rgmwo_GmoYHy2Nd7ZgqdRLk/1/',
      },
    },
    verifiedGames: {
      BR: ['g1'],
    },
  },
  {
    id: 'op-betano',
    slug: 'betano',
    name: 'Betano',
    logo: '/operators/pending-verification.png',
    countries: ['MX'],
    categories: [],
    paymentMethods: [],
    gameTypes: [],
    active: true,
    verified: false,
    featured: false,
    isMock: false,
    affiliateStatus: 'pending',
    affiliateUrl: {},
  },
  {
    id: 'op-kto',
    slug: 'kto',
    name: 'KTO',
    logo: '/operators/pending-verification.png',
    countries: ['BR'],
    categories: [],
    paymentMethods: [],
    gameTypes: [],
    active: true,
    verified: false,
    featured: false,
    isMock: false,
    affiliateStatus: 'pending',
    affiliateUrl: {},
  },
  {
    id: 'op-codere',
    slug: 'codere',
    name: 'Codere',
    logo: '/operators/pending-verification.png',
    countries: ['MX'],
    categories: [],
    paymentMethods: [],
    gameTypes: [],
    active: true,
    verified: false,
    featured: false,
    isMock: false,
    affiliateStatus: 'pending',
    affiliateUrl: {},
  },
]

export function getOperator(slug: string): Operator | undefined {
  return OPERATORS.find((o) => o.slug === slug)
}

export function getOperatorById(id: string): Operator | undefined {
  return OPERATORS.find((o) => o.id === id)
}

/**
 * Whether an operator may be shown to public visitors as a real, commercial
 * recommendation. Requires `affiliateStatus === 'approved'` — the single
 * source of truth for affiliate readiness — plus an active, non-mock record
 * with a real destination URL for the market. Every operator today is either
 * a development placeholder (`isMock: true`) or a real partner still
 * `pending` onboarding, so this returns false for every market until a real
 * partner is explicitly approved with real data. This gate prevents
 * fabricated licences, bonuses and affiliate clicks from reaching
 * production.
 */
export function isOperatorRecommendable(
  operator: Operator,
  country: CountryCode,
  category?: CategorySlug,
): boolean {
  const base =
    operator.active &&
    operator.verified &&
    operator.affiliateStatus === 'approved' &&
    !operator.isMock &&
    operator.countries.includes(country) &&
    Boolean(operator.affiliateUrl[country])
  if (!base) return false
  return category ? operator.categories.includes(category) : true
}

/**
 * All operators approved for public listing (directory, sitemap). Gated on
 * the same `affiliateStatus === 'approved'` rule as commercial CTAs — a real,
 * non-mock operator that is merely `pending` onboarding (e.g. the partners
 * currently being activated) must not leak into the public directory,
 * sitemap, or search index ahead of approval.
 */
export function getPublicOperators(): Operator[] {
  return OPERATORS.filter(
    (o) => !o.isMock && o.affiliateStatus === 'approved',
  )
}

/** Recommendable operators in a market (commercial CTAs allowed). */
export function getOperatorsForCountry(country: CountryCode): Operator[] {
  return OPERATORS.filter((o) => isOperatorRecommendable(o, country))
}

/**
 * Explicit, manually-verified game availability at an operator in a GEO.
 * This is the ONLY source of truth for "this operator offers this game in
 * this market" — never inferred from `categories`/`gameTypes`.
 */
export function isGameVerifiedAtOperator(
  operator: Operator,
  gameId: string,
  country: CountryCode,
): boolean {
  return Boolean(operator.verifiedGames?.[country]?.includes(gameId))
}

/**
 * Recommendable operators in a market with an explicit, verified game
 * availability record for this title. Category match alone is never
 * sufficient — availability must be confirmed per operator/game/GEO before
 * it renders on Where to Play, game detail, or comparison surfaces.
 */
export function getOperatorsForGame(
  game: Game,
  country: CountryCode,
): Operator[] {
  return OPERATORS.filter(
    (o) =>
      isOperatorRecommendable(o, country, game.category) &&
      isGameVerifiedAtOperator(o, game.id, country),
  )
}

/**
 * Games with an explicit, verified availability record at this operator in
 * this market. Never inferred from the operator's category list.
 */
export function getGamesForOperator(
  operator: Operator,
  country: CountryCode,
): Game[] {
  const verifiedIds = new Set(operator.verifiedGames?.[country] ?? [])
  if (verifiedIds.size === 0) return []
  return GAMES.filter(
    (g) => g.countries.includes(country) && verifiedIds.has(g.id),
  )
}

/**
 * Single, named entry point for "may this operator appear in a monetized
 * CTA right now, for this exact context". Every affiliate CTA surface
 * (game detail, games-like, where-to-play, comparisons, best-games,
 * operator cards) must call this — or the equivalent list helpers above,
 * which apply the same rule — rather than re-implementing the approval
 * check inline. It composes the existing rules instead of duplicating
 * them:
 *
 *  - `isOperatorRecommendable`: active, verified, `affiliateStatus ===
 *    'approved'`, non-mock, GEO supported, and a real `affiliateUrl` for
 *    that GEO.
 *  - `isGameVerifiedAtOperator`: an explicit verified-availability record
 *    for `gameId` in that GEO (only checked when a `gameId` is supplied).
 *
 * Sports betting is intentionally out of scope here — this project's sports
 * surface does not (yet) route through approved `Operator` records, so it
 * is left untouched. The `sport` parameter is accepted for interface
 * parity with the spec and reserved for when a verified sports-availability
 * record is introduced; it never grants eligibility on its own today.
 */
export function canShowAffiliateCTA(params: {
  operator: Operator
  geo: CountryCode
  gameSlug?: string
  /** Reserved — sports availability is not yet wired to approved operators. */
  sport?: string
}): boolean {
  const { operator, geo, gameSlug } = params
  if (!isOperatorRecommendable(operator, geo)) return false
  if (!gameSlug) return true
  const game = getGame(gameSlug)
  if (!game) return false
  return isGameVerifiedAtOperator(operator, game.id, geo)
}

/* ------------------------------------------------------------------ */
/* Offers                                                              */
/* ------------------------------------------------------------------ */

/** Offers separated by GEO. Chile intentionally has no live offers. */
export const offersByCountry: Record<CountryCode, Offer[]> = {
  BR: [
    {
      id: 'of-br-1',
      operatorId: 'op1',
      country: 'BR',
      title: 'Example Welcome Offer',
      description: 'Placeholder welcome package for new players in Brazil.',
      category: 'welcome',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/nova?geo=br',
      active: true,
      featured: true,
      status: 'pending',
    },
    {
      id: 'of-br-2',
      operatorId: 'op3',
      country: 'BR',
      title: 'Example Casino Offer',
      description: 'Placeholder casino promotion available in Brazil.',
      category: 'live-casino',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/lumen?geo=br',
      active: true,
      featured: false,
      status: 'pending',
    },
  ],
  PT: [
    {
      id: 'of-pt-1',
      operatorId: 'op1',
      country: 'PT',
      title: 'Example Welcome Offer',
      description: 'Placeholder welcome package for new players in Portugal.',
      category: 'welcome',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/nova?geo=pt',
      active: true,
      featured: true,
      status: 'pending',
    },
  ],
  MX: [
    {
      id: 'of-mx-1',
      operatorId: 'op2',
      country: 'MX',
      title: 'Example Sports Offer',
      description: 'Placeholder sportsbook promotion available in Mexico.',
      category: 'sports',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/vortex?geo=mx',
      active: true,
      featured: true,
      status: 'pending',
    },
    {
      id: 'of-mx-2',
      operatorId: 'op4',
      country: 'MX',
      title: 'Example New Player Offer',
      description: 'Placeholder new-player promotion available in Mexico.',
      category: 'welcome',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/strike?geo=mx',
      active: true,
      featured: false,
      status: 'pending',
    },
  ],
  CO: [
    {
      id: 'of-co-1',
      operatorId: 'op2',
      country: 'CO',
      title: 'Example Casino Offer',
      description: 'Placeholder casino promotion available in Colombia.',
      category: 'slots',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/vortex?geo=co',
      active: true,
      featured: true,
      status: 'pending',
    },
  ],
  PE: [
    {
      id: 'of-pe-1',
      operatorId: 'op2',
      country: 'PE',
      title: 'Example Welcome Offer',
      description: 'Placeholder welcome package for new players in Peru.',
      category: 'welcome',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/vortex?geo=pe',
      active: true,
      featured: true,
      status: 'pending',
    },
  ],
  AR: [
    {
      id: 'of-ar-1',
      operatorId: 'op5',
      country: 'AR',
      title: 'Example Casino Offer',
      description: 'Placeholder casino promotion available in Argentina.',
      category: 'slots',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/orbit?geo=ar',
      active: true,
      featured: true,
      status: 'pending',
    },
  ],
  EC: [
    {
      id: 'of-ec-1',
      operatorId: 'op3',
      country: 'EC',
      title: 'Example Welcome Offer',
      description: 'Placeholder welcome package for new players in Ecuador.',
      category: 'welcome',
      terms: 'Terms apply • 18+',
      affiliateUrl: 'https://example.com/aff/lumen?geo=ec',
      active: true,
      featured: true,
      status: 'pending',
    },
  ],
  // Chile intentionally empty — offers under review, no unverified operators shown.
  CL: [],
}

/** Raw offers (internal / development). */
export function getOffers(country: CountryCode): Offer[] {
  return offersByCountry[country] ?? []
}

/**
 * Public offers — gated per-offer on `status === 'verified'`. Every demo
 * offer above is `status: 'pending'` (placeholder data), so this returns
 * empty for every market until a real, explicitly verified offer from an
 * approved partner is added. Public offer surfaces render a polished
 * "under review" empty state instead.
 *
 * Defense in depth: when the linked operator declares an explicit
 * `verifiedOffers` allow-list, the offer id must also appear there. This
 * mirrors `verifiedGames` — availability/verification is never inferred
 * from one record alone when a cross-check list exists. Operators that
 * don't define `verifiedOffers` are unaffected (the offer's own `status`
 * remains the sole gate).
 */
export function getPublicOffers(country: CountryCode): Offer[] {
  return (offersByCountry[country] ?? []).filter((o) => {
    if (!o.active || o.status !== 'verified') return false
    const operator = getOperatorById(o.operatorId)
    if (operator?.verifiedOffers && !operator.verifiedOffers.includes(o.id)) {
      return false
    }
    return true
  })
}
