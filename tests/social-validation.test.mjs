import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeMotionCadence } from '../scripts/social/validation-cadence.mjs'

const phases = [{ phase: 'flying', time: 1 }, { phase: 'falling', time: 7 }, { phase: 'impact', time: 7.7 }]
const motion = Array.from({ length: 450 }, (_, frame) => ({ frame, time: frame / 25, meanAbsoluteDifference: frame < 200 ? 1 : 0 }))

test('motion QC accepts continuous flight/fall and ignores intended static end cards', () => {
  assert.equal(summarizeMotionCadence(motion, phases).passed, true)
})
test('motion QC rejects periodic freeze frames in flight and fall', () => {
  const duplicates = motion.map(row => ({ ...row, meanAbsoluteDifference: row.frame % 6 === 0 ? 0 : row.meanAbsoluteDifference }))
  assert.equal(summarizeMotionCadence(duplicates, phases).passed, false)
  const frozenFall = motion.map(row => ({ ...row, meanAbsoluteDifference: row.time > 7 ? 0 : row.meanAbsoluteDifference }))
  assert.equal(summarizeMotionCadence(frozenFall, phases).passed, false)
})
test('motion QC rejects a clip without enough actual flight or fall motion', () => {
  assert.equal(summarizeMotionCadence(motion, [{ phase: 'ready', time: 0 }]).passed, false)
  assert.equal(summarizeMotionCadence(motion, [{ phase: 'flying', time: 1 }, { phase: 'impact', time: 2 }]).passed, false)
})
