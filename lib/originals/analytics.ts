import { track } from '../tracking'
import type { CategorySlug, CountryCode, Locale } from '../types'
import { localeToSegment } from '../locale'
import { isDemoIdentifier } from './session'

export type FreePlayEvent = 'demo_table_action' | 'demo_table_feature' | 'demo_table_result' | 'free_play_open' | 'demo_round_start' | 'demo_round_complete' |
  'demo_balance_reset' | 'play_real_view' | 'play_real_click' |
  'demo_cashout' | 'demo_crash' | 'demo_slot_win' | 'demo_bonus_trigger' | 'demo_free_spin_start' |
  'demo_bonus_complete' | 'demo_streak_increase' | 'demo_sound_toggle'
const FREE_PLAY_EVENTS: readonly FreePlayEvent[] = ['free_play_open', 'demo_round_start', 'demo_round_complete',
  'demo_table_action', 'demo_table_feature', 'demo_table_result', 'demo_balance_reset', 'play_real_view', 'play_real_click', 'demo_cashout', 'demo_crash', 'demo_slot_win',
  'demo_bonus_trigger', 'demo_free_spin_start', 'demo_bonus_complete', 'demo_streak_increase', 'demo_sound_toggle']
export interface FreePlayEventContext {
  originalId: string
  originalSlug: string
  category: CategorySlug
  country: CountryCode
  locale: Locale
  roundId?: string
  operatorSlug?: string
  /** Coarse gameplay labels only; never balances, stakes or free text. */
  multiplierBucket?: string
  winTier?: string
  spinsAwarded?: string
  streakLevel?: string
  soundState?: string
}
/** Explicit fields only: no balance/history, persistent guest identifier, query string or arbitrary payload. */
export function trackFreePlay(event: FreePlayEvent, context: FreePlayEventContext): void {
  if (!FREE_PLAY_EVENTS.includes(event) ||
    !isDemoIdentifier(context.originalId) || !isDemoIdentifier(context.originalSlug) ||
    (context.roundId !== undefined && !isDemoIdentifier(context.roundId)) ||
    (context.operatorSlug !== undefined && !isDemoIdentifier(context.operatorSlug))) return
  track(event, {
    originalId: context.originalId, pageSlug: context.originalSlug, pageType: 'play',
    category: context.category, country: context.country, language: context.locale,
    roundId: context.roundId, operatorSlug: context.operatorSlug,
    multiplierBucket: context.multiplierBucket, winTier: context.winTier, spinsAwarded: context.spinsAwarded,
    streakLevel: context.streakLevel, soundState: context.soundState,
    url: `/${localeToSegment(context.locale)}/play/${context.originalSlug}`,
  })
}

/** Coarse multiplier label for analytics (hundredths in): "1-2x", "2-5x", "5-10x", "10-25x", "25x-plus". */
export function multiplierBucket(multiplier: number): string {
  const x = multiplier / 100
  return x < 2 ? '1-2x' : x < 5 ? '2-5x' : x < 10 ? '5-10x' : x < 25 ? '10-25x' : '25x-plus'
}
