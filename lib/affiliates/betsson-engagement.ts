/**
 * Recurring milestone trigger for the Originals engagement offer.
 *
 *   cycles 1, 2 → nothing · cycle 3 settles → offer · cycles 4, 5 → nothing ·
 *   cycle 6 settles → offer · 9, 12, 15 …
 *
 * Built on the shared gameplay-cycle observer, so every engine feeds the
 * same counter through the shell's `roundActive` flag. Rules:
 *
 *   - the offer opens only after the milestone cycle has fully settled, plus a
 *     short settle delay; a new cycle starting during that delay cancels it;
 *   - exactly one offer per milestone; dismissing never resets the counter and
 *     never suppresses the next milestone;
 *   - starting a cycle while the offer is open closes it;
 *   - no session cap: the cadence is intentionally recurring.
 */

import { createGameplayCycleObserver, isCycleMilestone } from '../engagement/gameplay-cycle'

export interface EngagementMilestone {
  /** Completed gameplay cycles at the moment the offer opened (3, 6, 9 …). */
  completedCycleNumber: number
  /** The configured cadence (3). */
  triggerMultiple: number
  /** Ordinal of this exposure in the current play session (1, 2, 3 …). */
  exposureNumber: number
}

export interface EngagementTriggerOptions {
  /** Offer after every `cycleMultiple`-th completed cycle. */
  cycleMultiple: number
  /** Settle time after the cycle boundary before opening. */
  delayMs: number
  open: (milestone: EngagementMilestone) => void
  /** Called when a new cycle starts while the offer is open. */
  close: () => void
  /** Continuous games wait at the settled boundary until this existing offer is dismissed. */
  hold?: (held: boolean) => void
  schedule?: (fn: () => void, ms: number) => number
  cancel?: (id: number) => void
}

export function createEngagementTrigger(options: EngagementTriggerOptions) {
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms) as unknown as number)
  const cancel = options.cancel ?? ((id) => clearTimeout(id))
  const cycles = createGameplayCycleObserver()
  let opened = false
  let pending: number | null = null
  let exposures = 0
  /** Last milestone that produced (or is about to produce) an offer, so it never fires twice. */
  let servedMilestone = 0
  const clear = () => { if (pending !== null) { cancel(pending); pending = null } }
  return {
    get completedRounds() { return cycles.completed },
    get exposures() { return exposures },
    get isOpen() { return opened },
    observe(roundActive: boolean) {
      const finished = cycles.observe(roundActive)
      if (roundActive) {
        clear()
        options.hold?.(false)
        if (opened) { opened = false; options.close() }
        return
      }
      if (finished === null || !isCycleMilestone(finished, options.cycleMultiple) || finished <= servedMilestone) return
      servedMilestone = finished
      options.hold?.(true)
      pending = schedule(() => {
        pending = null
        if (cycles.active || opened) return
        opened = true
        exposures += 1
        options.open({ completedCycleNumber: finished, triggerMultiple: options.cycleMultiple, exposureNumber: exposures })
      }, options.delayMs)
    },
    dismiss() { clear(); opened = false; options.hold?.(false) },
    dispose() { clear(); options.hold?.(false) },
  }
}
