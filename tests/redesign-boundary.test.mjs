import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Release-specific protection requested for the visual redesign. Deliberate
// future changes to this infrastructure require a separately reviewed baseline.
// M11 authorized sitemap additions only. The Betsson affiliate UI pass updates
// Originals play-real helpers/CTA hashes; remaining protected files stay put.
test('redesign: protected outbound infrastructure remains unchanged except authorized Betsson play-real files', async () => {
  const expected = JSON.parse(await readFile(new URL('./fixtures/redesign-protected.json', import.meta.url), 'utf8'))
  for (const [path, hash] of Object.entries(expected)) {
    const source = (await readFile(new URL('../' + path, import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
    assert.equal(createHash('sha256').update(source).digest('hex'), hash, path)
  }
})
