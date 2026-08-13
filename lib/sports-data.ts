import type { CountryCode } from './types'
import type {
  Bookmaker,
  BestOdds,
  League,
  Match,
  MatchOdds,
  MatchOddsWithBookmaker,
  Sport,
  SportSlug,
} from './sports-types'

/**
 * Mock sports odds-comparison data.
 *
 * Everything in this file is placeholder/demo data (fixtures, odds,
 * bookmakers) kept separate from UI components so it can be swapped for a
 * real odds provider later without touching a single component. Bookmaker
 * names are intentionally fictional — PlayLiva has no real, approved
 * sportsbook affiliate partnerships wired into this vertical yet.
 */

// ---------------------------------------------------------------------------
// Sports
// ---------------------------------------------------------------------------

export const SPORTS: Sport[] = [
  { slug: 'football', hasDraw: true },
  { slug: 'basketball', hasDraw: false },
  { slug: 'tennis', hasDraw: false },
]

export function getSport(slug: string): Sport | undefined {
  return SPORTS.find((s) => s.slug === slug)
}

// ---------------------------------------------------------------------------
// Leagues
// ---------------------------------------------------------------------------

export const LEAGUES: League[] = [
  {
    id: 'lg-brasileirao',
    slug: 'brasileirao',
    sport: 'football',
    name: 'Brasileirão',
    country: 'BR',
    priorityFor: ['BR', 'PT'],
  },
  {
    id: 'lg-liga-mx',
    slug: 'liga-mx',
    sport: 'football',
    name: 'Liga MX',
    country: 'MX',
    priorityFor: ['MX'],
  },
  {
    id: 'lg-champions-league',
    slug: 'champions-league',
    sport: 'football',
    name: 'Champions League',
    country: 'INTL',
    priorityFor: ['BR', 'MX', 'PT', 'CO', 'PE', 'AR', 'EC', 'CL'],
  },
  {
    id: 'lg-la-liga',
    slug: 'la-liga',
    sport: 'football',
    name: 'La Liga',
    country: 'INTL',
    priorityFor: ['MX', 'BR'],
  },
  {
    id: 'lg-nba',
    slug: 'nba',
    sport: 'basketball',
    name: 'NBA',
    country: 'INTL',
    priorityFor: ['BR', 'MX'],
  },
  {
    id: 'lg-atp-tour',
    slug: 'atp-tour',
    sport: 'tennis',
    name: 'ATP Tour',
    country: 'INTL',
    priorityFor: ['BR', 'MX'],
  },
]

export function getLeaguesForSport(sport: SportSlug): League[] {
  return LEAGUES.filter((l) => l.sport === sport)
}

export function getLeague(sport: SportSlug, slug: string): League | undefined {
  return LEAGUES.find((l) => l.sport === sport && l.slug === slug)
}

export function getLeagueById(id: string): League | undefined {
  return LEAGUES.find((l) => l.id === id)
}

/**
 * Explicit editorial league ordering per launch market. This is a curated
 * display order for GEO relevance — NOT live popularity data. Local top-flight
 * competitions lead, followed by the Champions League and major European
 * leagues; the other market's domestic league is de-prioritized (kept, not
 * removed). Markets without an entry fall back to their `priorityFor` data.
 */
const EDITORIAL_LEAGUE_ORDER: Partial<Record<CountryCode, string[]>> = {
  BR: [
    'lg-brasileirao',
    'lg-champions-league',
    'lg-la-liga',
    'lg-liga-mx',
    'lg-nba',
    'lg-atp-tour',
  ],
  MX: [
    'lg-liga-mx',
    'lg-champions-league',
    'lg-la-liga',
    'lg-brasileirao',
    'lg-nba',
    'lg-atp-tour',
  ],
}

/**
 * Editorial league ordering for a given market. Interface preparation only —
 * does not imply full odds coverage exists yet for every league listed.
 */
export function getPriorityLeaguesForCountry(
  country: CountryCode,
  sport?: SportSlug,
): League[] {
  const pool = sport ? getLeaguesForSport(sport) : LEAGUES
  const order = EDITORIAL_LEAGUE_ORDER[country]
  return [...pool].sort((a, b) => {
    const aRank = order ? order.indexOf(a.id) : a.priorityFor.indexOf(country)
    const bRank = order ? order.indexOf(b.id) : b.priorityFor.indexOf(country)
    return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank)
  })
}

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

/** Build an ISO kickoff time N days from now at a fixed local hour. */
function kickoff(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const MATCHES: Match[] = [
  {
    id: 'm-real-madrid-barcelona',
    slug: 'real-madrid-vs-barcelona',
    leagueId: 'lg-la-liga',
    sport: 'football',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    startTime: kickoff(2, 17, 0),
    venue: 'Santiago Bernabéu',
    status: 'upcoming',
  },
  {
    id: 'm-flamengo-palmeiras',
    slug: 'flamengo-vs-palmeiras',
    leagueId: 'lg-brasileirao',
    sport: 'football',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    startTime: kickoff(0, 21, 30),
    venue: 'Maracanã',
    status: 'upcoming',
  },
  {
    id: 'm-america-chivas',
    slug: 'america-vs-chivas',
    leagueId: 'lg-liga-mx',
    sport: 'football',
    homeTeam: 'América',
    awayTeam: 'Chivas',
    startTime: kickoff(1, 20, 0),
    venue: 'Estadio Azteca',
    status: 'upcoming',
  },
  {
    id: 'm-city-bayern',
    slug: 'manchester-city-vs-bayern-munich',
    leagueId: 'lg-champions-league',
    sport: 'football',
    homeTeam: 'Manchester City',
    awayTeam: 'Bayern Munich',
    startTime: kickoff(3, 16, 0),
    venue: 'Etihad Stadium',
    status: 'upcoming',
  },
  {
    id: 'm-corinthians-sao-paulo',
    slug: 'corinthians-vs-sao-paulo',
    leagueId: 'lg-brasileirao',
    sport: 'football',
    homeTeam: 'Corinthians',
    awayTeam: 'São Paulo',
    startTime: kickoff(4, 19, 0),
    venue: 'Neo Química Arena',
    status: 'upcoming',
  },
  {
    id: 'm-cruz-azul-tigres',
    slug: 'cruz-azul-vs-tigres',
    leagueId: 'lg-liga-mx',
    sport: 'football',
    homeTeam: 'Cruz Azul',
    awayTeam: 'Tigres UANL',
    startTime: kickoff(2, 21, 0),
    venue: 'Estadio Ciudad de los Deportes',
    status: 'upcoming',
  },
  {
    id: 'm-lakers-celtics',
    slug: 'lakers-vs-celtics',
    leagueId: 'lg-nba',
    sport: 'basketball',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Boston Celtics',
    startTime: kickoff(1, 22, 30),
    venue: 'Crypton.com Arena',
    status: 'upcoming',
  },
  {
    id: 'm-warriors-nuggets',
    slug: 'warriors-vs-nuggets',
    leagueId: 'lg-nba',
    sport: 'basketball',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Denver Nuggets',
    startTime: kickoff(3, 23, 0),
    status: 'upcoming',
  },
  {
    id: 'm-alcaraz-djokovic',
    slug: 'alcaraz-vs-djokovic',
    leagueId: 'lg-atp-tour',
    sport: 'tennis',
    homeTeam: 'Carlos Alcaraz',
    awayTeam: 'Novak Djokovic',
    startTime: kickoff(2, 15, 0),
    status: 'upcoming',
  },
  {
    id: 'm-sinner-medvedev',
    slug: 'sinner-vs-medvedev',
    leagueId: 'lg-atp-tour',
    sport: 'tennis',
    homeTeam: 'Jannik Sinner',
    awayTeam: 'Daniil Medvedev',
    startTime: kickoff(4, 14, 0),
    status: 'upcoming',
  },
]

export function getMatchesForLeague(leagueId: string): Match[] {
  return MATCHES.filter((m) => m.leagueId === leagueId).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )
}

export function getMatchesForSport(sport: SportSlug): Match[] {
  return MATCHES.filter((m) => m.sport === sport).sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )
}

export function getMatch(slug: string): Match | undefined {
  return MATCHES.find((m) => m.slug === slug)
}

export function getUpcomingMatches(limit?: number): Match[] {
  const sorted = [...MATCHES].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  )
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

export type DateFilterValue = 'today' | 'tomorrow' | 'upcoming'

/** Bucket matches by kickoff date relative to now, for the date filter UI. */
export function filterMatchesByDate(
  matches: Match[],
  filter: DateFilterValue | 'all',
): Match[] {
  if (filter === 'all') return matches
  const now = new Date()
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const today = startOfDay(now)
  const tomorrow = today + 24 * 60 * 60 * 1000
  const dayAfterTomorrow = tomorrow + 24 * 60 * 60 * 1000

  return matches.filter((m) => {
    const t = new Date(m.startTime).getTime()
    if (filter === 'today') return t >= today && t < tomorrow
    if (filter === 'tomorrow') return t >= tomorrow && t < dayAfterTomorrow
    return t >= dayAfterTomorrow
  })
}

// ---------------------------------------------------------------------------
// Bookmakers & odds
// ---------------------------------------------------------------------------

 export const BOOKMAKERS: Bookmaker[] = [
 { id: 'bk-vantix', name: 'Vantix', logo: '/bookmakers/vantix.png', affiliateUrl: '#', affiliateStatus: 'pending', isMock: true },
 { id: 'bk-oddsplay', name: 'OddsPlay', logo: '/bookmakers/oddsplay.png', affiliateUrl: '#', affiliateStatus: 'pending', isMock: true },
 { id: 'bk-betrix', name: 'Betrix', logo: '/bookmakers/betrix.png', affiliateUrl: '#', affiliateStatus: 'pending', isMock: true },
]

function getBookmaker(id: string): Bookmaker {
  const bookmaker = BOOKMAKERS.find((b) => b.id === id)
  if (!bookmaker) throw new Error(`Unknown bookmaker id: ${id}`)
  return bookmaker
}

export const MATCH_ODDS: MatchOdds[] = [
  // Real Madrid vs Barcelona
  {
    matchId: 'm-real-madrid-barcelona',
    bookmakerId: 'bk-vantix',
    homeOdds: 2.1,
    drawOdds: 3.4,
    awayOdds: 3.2,
    totalGoals: { line: 2.5, over: 1.85, under: 1.95 },
    bothTeamsToScore: { yes: 1.72, no: 2.05 },
    doubleChance: { homeOrDraw: 1.32, drawOrAway: 1.68, homeOrAway: 1.28 },
  },
  {
    matchId: 'm-real-madrid-barcelona',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 2.18,
    drawOdds: 3.3,
    awayOdds: 3.35,
    totalGoals: { line: 2.5, over: 1.9, under: 1.9 },
    bothTeamsToScore: { yes: 1.75, no: 2.0 },
    doubleChance: { homeOrDraw: 1.3, drawOrAway: 1.65, homeOrAway: 1.3 },
  },
  {
    matchId: 'm-real-madrid-barcelona',
    bookmakerId: 'bk-betrix',
    homeOdds: 2.12,
    drawOdds: 3.5,
    awayOdds: 3.25,
    totalGoals: { line: 2.5, over: 1.88, under: 1.92 },
    bothTeamsToScore: { yes: 1.7, no: 2.08 },
    doubleChance: { homeOrDraw: 1.33, drawOrAway: 1.7, homeOrAway: 1.27 },
  },

  // Flamengo vs Palmeiras
  {
    matchId: 'm-flamengo-palmeiras',
    bookmakerId: 'bk-vantix',
    homeOdds: 2.35,
    drawOdds: 3.1,
    awayOdds: 3.0,
    totalGoals: { line: 2.5, over: 2.0, under: 1.8 },
    bothTeamsToScore: { yes: 1.8, no: 1.95 },
    doubleChance: { homeOrDraw: 1.35, drawOrAway: 1.55, homeOrAway: 1.35 },
  },
  {
    matchId: 'm-flamengo-palmeiras',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 2.4,
    drawOdds: 3.05,
    awayOdds: 3.1,
    totalGoals: { line: 2.5, over: 1.95, under: 1.85 },
    bothTeamsToScore: { yes: 1.82, no: 1.92 },
    doubleChance: { homeOrDraw: 1.34, drawOrAway: 1.58, homeOrAway: 1.36 },
  },
  {
    matchId: 'm-flamengo-palmeiras',
    bookmakerId: 'bk-betrix',
    homeOdds: 2.3,
    drawOdds: 3.15,
    awayOdds: 3.05,
    totalGoals: { line: 2.5, over: 1.98, under: 1.82 },
    bothTeamsToScore: { yes: 1.78, no: 1.98 },
    doubleChance: { homeOrDraw: 1.36, drawOrAway: 1.56, homeOrAway: 1.33 },
  },

  // América vs Chivas
  {
    matchId: 'm-america-chivas',
    bookmakerId: 'bk-vantix',
    homeOdds: 1.95,
    drawOdds: 3.3,
    awayOdds: 3.9,
    totalGoals: { line: 2.5, over: 2.05, under: 1.75 },
    bothTeamsToScore: { yes: 1.9, no: 1.85 },
  },
  {
    matchId: 'm-america-chivas',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 2.0,
    drawOdds: 3.25,
    awayOdds: 3.8,
    totalGoals: { line: 2.5, over: 2.1, under: 1.72 },
    bothTeamsToScore: { yes: 1.92, no: 1.82 },
  },
  {
    matchId: 'm-america-chivas',
    bookmakerId: 'bk-betrix',
    homeOdds: 1.92,
    drawOdds: 3.4,
    awayOdds: 3.95,
    totalGoals: { line: 2.5, over: 2.0, under: 1.78 },
    bothTeamsToScore: { yes: 1.88, no: 1.88 },
  },

  // Manchester City vs Bayern Munich
  {
    matchId: 'm-city-bayern',
    bookmakerId: 'bk-vantix',
    homeOdds: 2.2,
    drawOdds: 3.6,
    awayOdds: 3.0,
    totalGoals: { line: 2.5, over: 1.75, under: 2.05 },
  },
  {
    matchId: 'm-city-bayern',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 2.25,
    drawOdds: 3.5,
    awayOdds: 3.1,
    totalGoals: { line: 2.5, over: 1.8, under: 2.0 },
  },
  {
    matchId: 'm-city-bayern',
    bookmakerId: 'bk-betrix',
    homeOdds: 2.15,
    drawOdds: 3.55,
    awayOdds: 3.15,
    totalGoals: { line: 2.5, over: 1.78, under: 2.02 },
  },

  // Corinthians vs São Paulo
  {
    matchId: 'm-corinthians-sao-paulo',
    bookmakerId: 'bk-vantix',
    homeOdds: 2.5,
    drawOdds: 3.0,
    awayOdds: 2.9,
  },
  {
    matchId: 'm-corinthians-sao-paulo',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 2.55,
    drawOdds: 2.95,
    awayOdds: 2.95,
  },
  {
    matchId: 'm-corinthians-sao-paulo',
    bookmakerId: 'bk-betrix',
    homeOdds: 2.45,
    drawOdds: 3.05,
    awayOdds: 3.0,
  },

  // Cruz Azul vs Tigres
  {
    matchId: 'm-cruz-azul-tigres',
    bookmakerId: 'bk-vantix',
    homeOdds: 2.05,
    drawOdds: 3.2,
    awayOdds: 3.5,
  },
  {
    matchId: 'm-cruz-azul-tigres',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 2.1,
    drawOdds: 3.15,
    awayOdds: 3.45,
  },
  {
    matchId: 'm-cruz-azul-tigres',
    bookmakerId: 'bk-betrix',
    homeOdds: 2.0,
    drawOdds: 3.25,
    awayOdds: 3.55,
  },

  // Lakers vs Celtics (no draw market)
  {
    matchId: 'm-lakers-celtics',
    bookmakerId: 'bk-vantix',
    homeOdds: 1.85,
    awayOdds: 1.95,
  },
  {
    matchId: 'm-lakers-celtics',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 1.9,
    awayOdds: 1.9,
  },
  {
    matchId: 'm-lakers-celtics',
    bookmakerId: 'bk-betrix',
    homeOdds: 1.82,
    awayOdds: 2.0,
  },

  // Warriors vs Nuggets
  {
    matchId: 'm-warriors-nuggets',
    bookmakerId: 'bk-vantix',
    homeOdds: 2.05,
    awayOdds: 1.78,
  },
  {
    matchId: 'm-warriors-nuggets',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 2.1,
    awayOdds: 1.75,
  },
  {
    matchId: 'm-warriors-nuggets',
    bookmakerId: 'bk-betrix',
    homeOdds: 2.0,
    awayOdds: 1.8,
  },

  // Alcaraz vs Djokovic
  {
    matchId: 'm-alcaraz-djokovic',
    bookmakerId: 'bk-vantix',
    homeOdds: 1.7,
    awayOdds: 2.15,
  },
  {
    matchId: 'm-alcaraz-djokovic',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 1.75,
    awayOdds: 2.1,
  },
  {
    matchId: 'm-alcaraz-djokovic',
    bookmakerId: 'bk-betrix',
    homeOdds: 1.68,
    awayOdds: 2.2,
  },

  // Sinner vs Medvedev
  {
    matchId: 'm-sinner-medvedev',
    bookmakerId: 'bk-vantix',
    homeOdds: 1.6,
    awayOdds: 2.35,
  },
  {
    matchId: 'm-sinner-medvedev',
    bookmakerId: 'bk-oddsplay',
    homeOdds: 1.65,
    awayOdds: 2.3,
  },
  {
    matchId: 'm-sinner-medvedev',
    bookmakerId: 'bk-betrix',
    homeOdds: 1.58,
    awayOdds: 2.4,
  },
]

export function getOddsForMatch(matchId: string): MatchOddsWithBookmaker[] {
  return MATCH_ODDS.filter((o) => o.matchId === matchId).map((o) => ({
    ...o,
    bookmaker: getBookmaker(o.bookmakerId),
  }))
}

/** Highest quoted price per market across all compared bookmakers. */
export function getBestOdds(odds: MatchOdds[]): BestOdds {
  const home = Math.max(...odds.map((o) => o.homeOdds))
  const away = Math.max(...odds.map((o) => o.awayOdds))
  const draws = odds.map((o) => o.drawOdds).filter((v): v is number => v != null)
  const draw = draws.length > 0 ? Math.max(...draws) : undefined
  return { home, draw, away }
}

/** Number of distinct bookmakers quoting odds for a match. */
export function getBookmakerCountForMatch(matchId: string): number {
  return new Set(MATCH_ODDS.filter((o) => o.matchId === matchId).map((o) => o.bookmakerId))
    .size
}
