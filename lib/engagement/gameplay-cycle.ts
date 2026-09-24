/**
 * One canonical "completed gameplay cycle" for every PlayLiva Original.
 *
 * Every engine already reports whether a cycle is in flight through the
 * shared shell's `roundActive` prop; this observer turns the true → false
 * edge of that flag into a monotonically increasing cycle count. The mapping
 * per Original (all defined by the game itself, never inferred here):
 *
 *   Island Crash      one fully settled flight: phase back to `ready` after fall/impact/reset
 *   Liva Ginga  one juggle: phase back to `ready` after the dropped-ball beat
 *   Liva Capybara Gold one settled spin (a triggered bonus stays one cycle until it summarises)
 *   Liva Golaço        one settled spin (a Final de Ouro bonus stays one cycle until it summarises)
 *   Liva Blackjack    one hand after final settlement: phase back to `ready`
 *   Liva Roulette     one spin after the result window: phase back to `betting`
 *   Liva Mines        one cashed-out or lost board: phase back to `ready`
 *
 * Idle observations (false → false) never count, so mounting, resizing or
 * re-rendering cannot fabricate a cycle. A cycle that ends in an engine error
 * still releases the round and therefore counts as finished.
 */
export interface GameplayCycleObserver {
  /** Feed the shell's `roundActive` on every render. Returns the cycle number when one just completed. */
  observe(roundActive: boolean): number | null
  readonly completed: number
  readonly active: boolean
}

export function createGameplayCycleObserver(onComplete?: (cycle: number) => void): GameplayCycleObserver {
  let previous = false
  let completed = 0
  let active = false
  return {
    observe(roundActive) {
      active = roundActive
      let finished: number | null = null
      if (!roundActive && previous) {
        completed += 1
        finished = completed
        onComplete?.(completed)
      }
      previous = roundActive
      return finished
    },
    get completed() { return completed },
    get active() { return active },
  }
}

/** True when `cycle` is a valid milestone for `every` (3, 6, 9 … for `every = 3`). */
export function isCycleMilestone(cycle: number, every: number): boolean {
  return Number.isInteger(cycle) && Number.isInteger(every) && every > 0 && cycle > 0 && cycle % every === 0
}
