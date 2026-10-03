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
// and sitemap.ts (trust routes and truthful dates). The Betsson BR campaign funnel
// rebases data.ts (central verified offer), tracking.ts (funnel events/attribution
// allow-list), affiliate-button.tsx (promo payload) and where-to-play.tsx (campaign
// card wrapper); the recurring gameplay-offer milestone rebases tracking.ts again
// (cycle/exposure allow-list fields); the football Originals rebase it once more
// (free-play gameplay events and coarse label fields only) and add their two
// /play routes to app/sitemap.ts. All other hashes stay intact;
// SEO P0 rebases only the approved market-safe rendering, metadata, sitemap
// and empty transactional-page gates represented by the updated hashes below.
// m12-hardening tests verify the added behavior. No engine snapshot is rebased.
// Approved Liva Ginga migration rebases only the sitemap slug in this fixture.
// Raio / Brasil21 rebase only the additive table-event allowlist and six localized sitemap entries.
// SEO Discovery V2 rebases only tracking.ts (three consented discovery event names)
// and sitemap.ts (shared quality policy, same 313 canonical URLs). Routing,
// commercial records, consent filtering and all engine hashes stay protected.
// Revenue Readiness authorizes tracking.ts (consented collection/context),
// affiliate-button.tsx (complete attribution and consent-aware impressions), and
// app/go/route.ts (trusted request GEO and private destination resolution),
// Owner GEO preview authorizes app/go/route.ts (authenticated session GEO)
// and tracking.ts (exclude owner preview telemetry); other snapshots remain fixed.
// data.ts (public campaign references instead of private IDs), affiliate.ts
// (resolver contract comment). Approved destinations, engines and SEO stay fixed.
// Rio Drift adds one consented best-score event/coarse label and six sitemap URLs.
// Only tracking.ts, sitemap.ts and play-real.ts's arcade exclusion are rebased;
// commercial records, partner destinations and existing category eligibility remain frozen.
// MX/CO/PE migration explicitly authorizes these commercial/routing/SEO adapters.
// Their new snapshot is paired with positive activation, strict GEO suppression,
// privacy, expiry and localized inventory tests; consent and engines stay fixed.
test('GEO migration: reviewed outbound, SEO and privacy infrastructure snapshot', async () => {
  const expected = JSON.parse(await readFile(new URL('./fixtures/redesign-protected.json', import.meta.url), 'utf8'))
  for (const [path, hash] of Object.entries(expected)) {
    const source = (await readFile(new URL('../' + path, import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
    assert.equal(createHash('sha256').update(source).digest('hex'), hash, path)
  }
})
