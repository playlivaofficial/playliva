// Synthetic, process-local promotion data. Never imported by application code or followed over the network.
import commercial from '../../lib/commercial/server.ts'
import data from '../../lib/data.ts'
import promotion from '../../lib/affiliates/promotion.ts'
import { registration } from './commercial.mjs'

export function commercialFixture(geo = 'MX', patch = {}) {
  const currency = { MX: 'MXN', CO: 'COP', PE: 'PEN' }[geo]
  const locales = ['en', 'pt-BR', 'es-MX', 'es-CO', 'es-PE']
  const verifiedAt = new Date(Date.now() - 86_400_000).toISOString()
  const reviewBy = new Date(Date.now() + 7 * 86_400_000).toISOString()
  const copy = { headline: `Oferta de prueba ${geo}`, condition: `Condiciones verificadas de prueba en ${currency}.`, cta: `Visitar Test Partner ${geo}` }
  return commercial.snapshotFromRegistry(geo, [registration(geo, {
    slug: `test-partner-${geo.toLowerCase()}`, brand: { MX: 'Betsson', CO: 'Betsson', PE: 'Inkabet' }[geo],
    legal: { status: 'verified', source: 'https://partner.test/legal', verifiedAt, reviewBy,
      statement: `Información comercial de prueba ${geo}`, responsibleGambling: 'Solo personas adultas.' },
    verifiedGames: data.GAMES.map(game => game.id),
    offer: {
      id: `test-promo-${geo.toLowerCase()}`, approved: true, active: true,
      copy: Object.fromEntries(locales.map(locale => [locale, copy])),
      placements: [...Object.values(promotion.BANNER_SURFACES).map(item => item.placement), ...Object.values(promotion.PROMO_PLACEMENTS)],
      cadence: { cycleMultiple: 3, delayMs: 10 }, validFrom: verifiedAt, validUntil: reviewBy, verifiedTerms: [copy.condition],
      offer: { id: `test-offer-${geo.toLowerCase()}`, title: copy.headline, description: copy.condition, category: 'welcome',
        active: true, featured: true, status: 'verified', terms: copy.condition,
        source: 'https://partner.test/terms', termsUrl: 'https://partner.test/terms', lastVerifiedAt: verifiedAt,
        complianceReview: { market: geo, status: 'reviewed-permitted', legalSource: 'https://partner.test/legal', verifiedAt, reviewBy },
        ctaLabel: Object.fromEntries(locales.map(locale => [locale, copy.cta])) },
    }, ...patch,
  })])
}
