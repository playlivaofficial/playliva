// Synthetic configuration used only by tests. Never imported by application code.
export function registration(geo = 'MX', overrides = {}) {
  const now = Date.now(), day = 86_400_000
  return {
    id: `test-${geo.toLowerCase()}`, slug: 'test-partner', brand: { MX: 'Betsson', CO: 'Betsson', PE: 'Inkabet' }[geo] ?? 'Test partner', geo,
    productTypes: ['crash', 'slots', 'table-games', 'live-casino', 'instant-games'],
    approved: true, active: true, affiliateUrl: `https://partner.test/${geo.toLowerCase()}`,
    campaignKey: `test-${geo.toLowerCase()}-campaign`, campaignId: 'private-test-id',
    trackingTemplate: 'campaign={campaignId}&market={geo}', analyticsTrackingTemplate: 'placement={placement}',
    currency: { MX: 'MXN', CO: 'COP', PE: 'PEN' }[geo], priority: 1,
    assets: { logo: '/placeholder.svg', alt: 'Test partner' },
    legal: { status: 'verified', source: 'https://partner.test/legal',
      verifiedAt: new Date(now - day).toISOString(), reviewBy: new Date(now + 7 * day).toISOString() },
    verifiedGames: ['g1'], ...overrides,
  }
}
