import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import postcss from 'postcss'

const css = postcss.parse(await readFile(new URL('../components/originals/crash/crash-game.module.css', import.meta.url), 'utf8'))
function rules(selector, width) {
  const result = {}
  css.walkRules(selector, rule => {
    if (rule.parent.type === 'atrule') {
      const limit = rule.parent.params.match(/^\(max-width: (\d+)px\)$/)
      if (!limit || width > Number(limit[1])) return
    }
    rule.walkDecls(declaration => { result[declaration.prop] = declaration.value })
  })
  return result
}
function pixels(value, width) {
  if (value.startsWith('clamp(')) {
    const [, min, vw, max] = value.match(/clamp\((\d+)px, ([\d.]+)vw, (\d+)px\)/)
    return Math.min(Number(max), Math.max(Number(min), width * Number(vw) / 100))
  }
  return Number.parseFloat(value)
}

for (const [width, height, ceiling] of [[320, 720, 75], [360, 800, 75], [390, 844, 83], [1280, 800, 90], [1920, 1080, 90]]) {
  test(`HUD stays in the upper sky strip at ${width}×${height}, with a readable multiplier`, () => {
    const hud = rules('.hud', width), phase = rules('.phase', width), multiplier = rules('.multiplier', width)
    const top = pixels(hud.top, width)
    const phaseHeight = pixels(phase['font-size'], width) * Number(phase['line-height']) + 2 * Number.parseFloat(phase.padding)
    const multiplierSize = pixels(multiplier['font-size'], width)
    const bottom = top + phaseHeight + multiplierSize * Number(multiplier['line-height'])
    assert.ok(top >= 4 && bottom <= ceiling, `HUD bottom ${bottom}px must be within ${ceiling}px`)
    assert.ok(multiplierSize >= (width <= 360 ? 58 : 64))
    assert.equal(hud.display, 'flex')
    assert.equal(hud['align-items'], 'center')
    assert.equal(hud['text-align'], 'center')
    assert.equal(hud['inset-inline'], '10px')
    assert.equal(hud['pointer-events'], 'none')
    assert.equal(multiplier['white-space'], 'nowrap')
    assert.equal(multiplier['font-variant-numeric'], 'tabular-nums')
    if (width <= 700) {
      const brand = rules('.sceneBrand', width)
      assert.equal(brand.top, 'auto', 'corner brand must not overlap the centered localized status')
      assert.equal(brand.bottom, '12px')
      assert.equal(brand.right, '12px')
      assert.equal(rules('.viewport', width).height, width <= 360 ? '260px' : '320px')
      assert.equal(rules('.action', width)['min-height'], '60px')
    }
  })
}
