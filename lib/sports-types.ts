import type { CountryCode } from './types'

/** Initial sport catalog. Keep this list small; expand once real data lands. */
export type SportSlug = 'football' | 'basketball' | 'tennis'

export interface Sport {
  slug: SportSlug
  /** Whether this sport's markets include a draw (e.g. football 1X2). */
  hasDraw: boolean
}

/**
 * A competition/league. `country` is the league's home market, used only for
 * editorial grouping — not a claim of licensing or availability.
 */
export interface League {
  id: string
  slug: string
  sport: SportSlug
  name: string
  country: CountryCode | 'INTL'
  /**
   * Public markets where this league is editorially prioritized on landing
   * surfaces. Interface preparation only — not a coverage guarantee.
   */
  priorityFor: CountryCode[]
}

export type MatchStatus = 'upcoming'

/** A single upcoming fixture. Mock data only — no live odds/API yet. */
export interface Match {
  id: string
  slug: string
  leagueId: string
  sport: SportSlug
  homeTeam: string
  awayTeam: string
  /** ISO 8601 kickoff time. */
  startTime: string
  venue?: string
  status: MatchStatus
}

/** Placeholder bookmaker. Never a real, approved affiliate partner yet. */
export interface Bookmaker {
  id: string
  name: string
  /** Local placeholder logo path. */
  logo: string
  /**
   * Placeholder destination. Structured so it can be swapped for a real
   * tracked affiliate URL later without touching any UI component.
   */
  affiliateUrl: string
  /**
   * Affiliate partnership lifecycle, mirroring the Operator model. All rows
   * today are `pending` mock placeholders — odds shown against them must
   * stay labeled as demonstration data until a row is flipped to `approved`
   * with a real `affiliateUrl`/`trackingTemplate` wired through `/go`.
   */
  affiliateStatus: 'pending' | 'approved' | 'paused' | 'rejected'
  /** Whether this row represents real demo/mock data (true) vs a real partner (false). */
  isMock: boolean
  /** ISO date of last verification (internal). */
  lastVerifiedAt?: string
}

export interface TotalGoalsMarket {
  line: number
  over: number
  under: number
}

export interface BothTeamsToScoreMarket {
  yes: number
  no: number
}

export interface DoubleChanceMarket {
  homeOrDraw: number
  drawOrAway: number
  homeOrAway: number
}

/** One bookmaker's quoted odds for one match. */
export interface MatchOdds {
  matchId: string
  bookmakerId: string
  homeOdds: number
  /** Omitted for sports with no draw market (basketball, tennis). */
  drawOdds?: number
  awayOdds: number
  totalGoals?: TotalGoalsMarket
  bothTeamsToScore?: BothTeamsToScoreMarket
  doubleChance?: DoubleChanceMarket
}

/** Convenience shape used once odds are joined with their bookmaker. */
export interface MatchOddsWithBookmaker extends MatchOdds {
  bookmaker: Bookmaker
}

/** The best (highest) price found per market across all compared books. */
export interface BestOdds {
  home: number
  draw?: number
  away: number
}
