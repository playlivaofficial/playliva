'use client'

import { useEffect, useRef } from 'react'
import type { SlotAudio } from '@/lib/originals/capybara/audio'
import type { SlotSnapshot } from '@/lib/originals/capybara/engine'
import { winTier } from './capybara-cabinet'

const suns = (reel: readonly string[]) => reel.filter(symbol => symbol === 'scatter').length

/** Maps engine snapshot transitions to cues. Each engine event plays once; a
 * snapshot that skipped ahead (throttled tab) only plays what is still new. */
export function useSlotSound(round: SlotSnapshot, audio: SlotAudio | null, haptics: boolean) {
  const seen = useRef({ spinAt: -1, stopped: 0, anticipation: false, result: '', series: '', multiplier: 1, retriggered: 0 })
  useEffect(() => {
    const last = seen.current, vibrate = (pattern: number | number[]) => {
      if (haptics && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
    }
    if (round.seriesId !== last.series) Object.assign(last, { series: round.seriesId ?? '', multiplier: 1 })
    if (round.phase === 'spinning' && round.spinAt !== last.spinAt) {
      Object.assign(last, { spinAt: round.spinAt, stopped: 0, anticipation: false, retriggered: 0 })
      audio?.spinStart(round.free); vibrate(10)
    }
    if (round.spinAt === last.spinAt && round.stopped > last.stopped) {
      for (let reel = last.stopped; reel < round.stopped; reel++) {
        audio?.reelStop(reel, { suns: suns(round.grid[reel]), sunsSoFar: round.grid.slice(0, reel + 1).reduce((n, r) => n + suns(r), 0),
          wild: round.grid[reel].includes('wild'), last: reel === round.grid.length - 1 })
      }
      last.stopped = round.stopped
    }
    if (round.phase === 'spinning' && round.anticipation && !last.anticipation) { last.anticipation = true; audio?.anticipation(round.revealAt) }
    if (round.free && round.bonusMultiplier > last.multiplier) { audio?.multiplierUp(round.bonusMultiplier); vibrate([8, 20, 8]) }
    last.multiplier = round.bonusMultiplier
    if (round.free && round.retriggered > last.retriggered) audio?.retrigger()
    last.retriggered = round.retriggered
    const result = round.result
    if (result && round.phase !== 'spinning' && result.id !== last.result) {
      last.result = result.id
      if (round.phase === 'bonus-intro') { audio?.bonusTrigger(result.evaluation.scatters); vibrate([15, 30, 15]) }
      else if (round.phase === 'bonus-summary') { audio?.bonusEnd(round.bonusTotal >= round.stake * 10); vibrate([12, 25, 12]) }
      else if (result.evaluation.payout > 0) audio?.win(winTier(result.evaluation.payout, round.stake))
    }
  }, [round, audio, haptics])
}
