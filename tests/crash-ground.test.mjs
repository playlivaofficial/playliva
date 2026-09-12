import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { untexturedModel, stageRig } from '../scripts/crash-rig.mjs'
import motionModule from '../lib/originals/crash/presentation.ts'

test('short and long landing poses stay within 0.015 world units of the sand', async () => {
  const rig = stageRig(await untexturedModel('castaway'), [0, 0, 0], 1, 'crash')
  const mesh = rig.scene.getObjectByProperty('type', 'SkinnedMesh')
  for (let milliseconds = 450; milliseconds <= 950; milliseconds += 5) {
    const seconds = milliseconds / 1000
    rig.at(seconds); mesh.skeleton.update()
    let lower = Infinity
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      lower = Math.min(lower, mesh.getVertexPosition(i, new Vector3()).applyMatrix4(mesh.matrixWorld).y)
    }
    assert.ok(Math.abs(lower - motionModule.crashGroundAt(seconds)) * motionModule.CHARACTER_SCALE < .015, `${milliseconds}ms landing offset`)
  }
})
