// Synthetic configuration used only by tests. Never imported by application code.
export function registration(geo = 'MX', overrides = {}) {
  return {
    id: `test-${geo.toLowerCase()}`, slug: 'test-partner', brand: 'Test partner', geo,
    productTypes: ['crash', 'slots', 'table-games', 'live-casino', 'instant-games'],
    approved: true, active: true, affiliateUrl: `https://partner.test/${geo.toLowerCase()}`,
    campaignKey: `test-${geo.toLowerCase()}-campaign`, campaignId: 'private-test-id',
    trackingTemplate: 'campaign={campaignId}&market={geo}', analyticsTrackingTemplate: 'placement={placement}',
    currency: { MX: 'MXN', CO: 'COP', PE: 'PEN' }[geo], priority: 1,
    assets: { logo: '/placeholder.svg', alt: 'Test partner' }, legal: { status: 'unknown' },
    verifiedGames: ['g1'], ...overrides,
  }
}
