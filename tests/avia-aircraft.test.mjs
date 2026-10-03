import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import motion from '../components/originals/avia/aircraft-motion.ts'

const pose = motion.aircraftPresentation
const numbers = view => view.transform.match(/-?\d+(?:\.\d+)?/g).map(Number)

test('aircraft launch starts at its boarding pose and moves forward smoothly', () => {
  assert.equal(pose('betting', 0, 100).transform, pose('flying', 0, 100).transform)
  let lastX = -Infinity
  for (let elapsed = 0; elapsed <= 2400; elapsed += 16) {
    const [x, y, bank, scale] = numbers(pose('flying', elapsed, 100))
    assert.ok(x >= lastX); lastX = x
    assert.ok(y >= -3.45 && y <= 0)
    assert.ok(Math.abs(bank) < 3)
    assert.equal(scale, 1)
  }
  const at = numbers(pose('flying', 1200, 100))
  const next = numbers(pose('flying', 1216, 100))
  assert.ok(next[0] - at[0] < .1)
})

test('speed sensation is bounded on long/high-multiplier flights', () => {
  for (const elapsed of [2400, 10000, 1000000]) {
    const view = pose('flying', elapsed, 100000000)
    const [x, y, bank, scale] = numbers(view)
    assert.ok(x <= 5.5 && x >= 3)
    assert.ok(y >= -4.45 && y <= -2.55)
    assert.ok(Math.abs(bank) < 3)
    assert.ok(scale <= 1.025)
    assert.ok(view.trail <= .5 && view.trailLength <= 1.7)
  }
})

test('departure starts at the last flight pose, fades once, and removes exhaust', () => {
  const flying = pose('flying', 8200, 164)
  assert.equal(pose('result', 8200, 164, 0).transform, flying.transform)
  for (const elapsed of [0, 100, 400, 650, 1000]) {
    const view = pose('result', 8200, 164, elapsed)
    assert.equal(view.trail, 0)
    assert.ok(view.opacity >= 0 && view.opacity <= 1)
  }
  assert.equal(pose('result', 8200, 164, 650).opacity, 0)
})

test('reduced motion has no bank, scale, exhaust or departure translation', () => {
  for (const phase of ['betting', 'flying', 'result']) {
    const view = pose(phase, 40000, 4000, 400, true)
    const [x, y, bank, scale] = numbers(view)
    assert.equal(x, 0); assert.equal(bank, 0); assert.equal(scale, 1)
    assert.equal(y, phase === 'flying' ? -3 : 0)
    assert.equal(view.trail, 0)
  }
})

test('selected C master is preserved exactly and runtime artwork has transparent margins', async () => {
  const master = await readFile('assets-source/avia-de-janeiro/aircraft-ipanema.png')
  assert.equal(createHash('sha256').update(master).digest('hex'), '7bf27f0a2e7d39410c896a9e5e9eb7110250aa562cdc2d764fa182d887f2b864')
  const { data, info } = await sharp('public/originals/avia-de-janeiro/aircraft-ipanema.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  assert.equal(info.width, 1536); assert.equal(info.height, 1024)
  for (const [x, y] of [[0, 0], [1535, 0], [0, 1023], [1535, 1023], [768, 0], [768, 1023]]) {
    assert.equal(data[(y * info.width + x) * info.channels + 3], 0)
  }
})
