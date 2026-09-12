import { track } from '../tracking'
import type { CategorySlug, CountryCode, Locale } from '../types'
import { localeToSegment } from '../locale'
import { isDemoIdentifier } from './session'

export type FreePlayEvent = 'free_play_open' | 'demo_round_start' | 'demo_round_complete' |
  'demo_balance_reset' | 'play_real_view' | 'play_real_click'
export interface FreePlayEventContext {
  originalId: string
  originalSlug: string
  category: CategorySlug
  country: CountryCode
  locale: Locale
  roundId?: string
  operatorSlug?: string
}
/** Explicit fields only: no balance/history, persistent guest identifier, query string or arbitrary payload. */
export function trackFreePlay(event: FreePlayEvent, context: FreePlayEventContext): void {
  if (!['free_play_open', 'demo_round_start', 'demo_round_complete', 'demo_balance_reset',
    'play_real_view', 'play_real_click'].includes(event) ||
    !isDemoIdentifier(context.originalId) || !isDemoIdentifier(context.originalSlug) ||
    (context.roundId !== undefined && !isDemoIdentifier(context.roundId)) ||
    (context.operatorSlug !== undefined && !isDemoIdentifier(context.operatorSlug))) return
  track(event, {
    originalId: context.originalId, pageSlug: context.originalSlug, pageType: 'play',
    category: context.category, country: context.country, language: context.locale,
    roundId: context.roundId, operatorSlug: context.operatorSlug,
    url: `/${localeToSegment(context.locale)}/play/${context.originalSlug}`,
  })
}
