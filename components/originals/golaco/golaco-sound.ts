'use client'

import { useEffect, useRef } from 'react'
import type { GolacoAudio } from '@/lib/originals/golaco/audio'
import type { GolacoSnapshot } from '@/lib/originals/golaco/engine'
import type { GolacoSymbol } from '@/lib/originals/golaco/config'
import { winTier } from './golaco-cabinet'

const count = (reel: readonly GolacoSymbol[], symbol: GolacoSymbol) => reel.filter(value => value === symbol).length

/** Maps engine snapshot transitions to cues; each engine event plays once. */
export function useGolacoSound(round: GolacoSnapshot, audio: GolacoAudio | null, haptics: boolean) {
  const seen = useRef({ spinAt: -1, stopped: 0, anticipation: false, result: '', series: '', streak: 1, retriggered: 0 })
  useEffect(() => {
    const last = seen.current, vibrate = (pattern: number | number[]) => {
      if (haptics && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
    }
    if (round.seriesId !== last.series) Object.assign(last, { series: round.seriesId ?? '', streak: 1 })
    if (round.phase === 'spinning' && round.spinAt !== last.spinAt) {
      Object.assign(last, { spinAt: round.spinAt, stopped: 0, anticipation: false, retriggered: 0 })
      audio?.spinStart(round.free); vibrate(10)
    }
    if (round.spinAt === last.spinAt && round.stopped > last.stopped) {
      for (let reel = last.stopped; reel < round.stopped; reel++) {
        audio?.reelStop(reel, { trophies: count(round.grid[reel], 'taca'), trophiesSoFar: round.grid.slice(0, reel + 1).reduce((n, r) => n + count(r, 'taca'), 0),
          goals: count(round.grid[reel], 'gol'), wild: round.grid[reel].includes('camisa'), last: reel === round.grid.length - 1 })
      }
      last.stopped = round.stopped
    }
    if (round.phase === 'spinning' && round.anticipation && !last.anticipation) { last.anticipation = true; audio?.anticipation(round.revealAt) }
    if (round.free && round.streak > last.streak) { audio?.streakUp(round.streak); vibrate([10, 30, 10]) }
    last.streak = round.streak
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
