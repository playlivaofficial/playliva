import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

// Release-specific protection requested for the visual redesign. Deliberate
// future changes to this infrastructure require a separately reviewed baseline.
// M11 authorized sitemap additions only. The catalog artwork pass updates the
// Blackjack Live image fields in lib/data.ts; remaining protected files stay put.
// M12 deliberately rebases only data.ts (restrictive evidence gates), tracking.ts
// (privacy allowlist), Original CTA/operator card (warnings, no placement change)
// and sitemap.ts (trust routes and truthful dates). All other hashes stay intact;
// m12-hardening tests verify the added behavior. No engine snapshot is rebased.
test('redesign: protected outbound infrastructure remains unchanged except authorized Betsson play-real files', async () => {
  const expected = JSON.parse(await readFile(new URL('./fixtures/redesign-protected.json', import.meta.url), 'utf8'))
  for (const [path, hash] of Object.entries(expected)) {
    const source = (await readFile(new URL('../' + path, import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
    assert.equal(createHash('sha256').update(source).digest('hex'), hash, path)
  }
})
