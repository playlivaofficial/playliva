import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Release-specific protection requested for the visual redesign. Deliberate
// future changes to this infrastructure require a separately reviewed baseline.
test('redesign: protected outbound, eligibility, attribution, consent and SEO infrastructure matches M9', async () => {
  const expected = JSON.parse(await readFile(new URL('./fixtures/redesign-protected.json', import.meta.url), 'utf8'))
  for (const [path, hash] of Object.entries(expected)) {
    const source = (await readFile(new URL('../' + path, import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
    assert.equal(createHash('sha256').update(source).digest('hex'), hash, path)
  }
})
