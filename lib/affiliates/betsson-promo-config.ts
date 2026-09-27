/**
 * Central Betsson Brazil promotional campaign configuration.
 *
 * ONE record describes the current official Betsson BR campaign for every
 * PlayLiva surface (Originals header, Originals engagement offer, discovery
 * game offer card, Offers page). Pages never repeat headline, CTA, creative,
 * dates or destinations; replacing the campaign means editing this file.
 *
 * Every promotional string here must be official Betsson campaign wording as
 * inspected in the Betsson Group Affiliates portal. Nothing is paraphrased or
 * strengthened: no deposit, wagering, spin value, eligible game, expiry or
 * registration claim is added unless it is listed in `verifiedTerms`.
 *
 * This module is intentionally dependency-free (types only) so that
 * `lib/data.ts` can derive the public Offer record from it without an import
 * cycle. Resolvers that need operator/GEO data live in `./betsson-promo.ts`.
 */

import type { CountryCode, Locale } from '../types'

export const BETSSON_PROMO_PLACEMENTS = {
  originalsHeader: 'originals_header',
  originalsEngagement: 'originals_engagement_offer',
  discoveryGame: 'discovery_game_offer',
  offersPage: 'offers_page',
} as const

export type BetssonPromoPlacement = (typeof BETSSON_PROMO_PLACEMENTS)[keyof typeof BETSSON_PROMO_PLACEMENTS]

/** Funnel surface family, reported on every promo analytics event. */
export type BetssonPromoSurface = 'originals' | 'discovery' | 'offers'

export interface BetssonPromoCreative {
  id: string
  kind: 'logo' | 'banner'
  /** Served from `public/`; never a hot-linked partner URL. */
  assetPath: string
  width: number
  height: number
  alt: Record<Locale, string>
  /** UI locales allowed to render this artwork. Portuguese promo art never renders on EN / ES-MX. */
  languages: readonly Locale[]
  /** Where the file came from, for the audit trail. */
  source: string
  verifiedAt: string
}

export interface BetssonPromoConfig {
  enabled: boolean
  promoId: string
  brand: 'betsson'
  operatorId: string
  operatorSlug: string
  /** Selected market gate. Locale and market are independent. */
  market: CountryCode
  /** Official campaign name as listed in the affiliate portal. */
  campaignName: string
  /** Exact official headline. Rendered verbatim with `lang="pt-BR"`. */
  headline: string
  /** Optional official secondary line; omitted when nothing official exists. */
  subheadline?: string
  /** Official CTA in the campaign language; other locales use the localized "Play at {name}" key. */
  ctaLabel: string
  /**
   * Partner-issued tracked link on the licensed `betsson.bet.br` domain.
   * Exposed to visitors only through `/go`; components never render it.
   */
  affiliateUrl: string
  /** Public campaign landing page, for reference/terms access. */
  landingPageUrl: string
  /** Official terms page for the campaign. */
  termsUrl: string
  creative: BetssonPromoCreative
  /** Language-neutral fallback mark for locales that may not render the promo artwork. */
  logo: BetssonPromoCreative
  validFrom: string
  /** Publication expiry. Also the offer evidence deadline: the campaign must be re-verified before it. */
  validUntil: string
  placements: readonly BetssonPromoPlacement[]
  /** Engagement offer on Originals: one offer per milestone cycle, recurring. */
  frequencyCap: { scope: 'milestone'; max: number }
  engagement: {
    /** Offer after every N-th completed gameplay cycle (3 → cycles 3, 6, 9 …). */
    cycleMultiple: number
    /** Settle time after the cycle boundary before opening, so the reset animation finishes. */
    delayMs: number
    /**
     * Full offer wording for the gameplay popup only. Compact placements keep
     * the short `headline`; this is the single place that states the verified
     * R$20 selected-games condition.
     */
    copy: Record<Locale, { headline: string; condition: string; cta: string }>
  }
  /** Only conditions that were read on the official campaign material. */
  verifiedTerms: readonly string[]
  /** Provenance of wording, link and creative. */
  source: string
  verifiedAt: string
}

export const BETSSON_PROMO_ID = 'betsson-br-casino-100-giros' as const

/** Public offer id used on the Offers page and by `/go?offer=`. */
export const BETSSON_PROMO_OFFER_ID = 'of-br-betsson-100-giros' as const

export const BETSSON_PROMO_LOGO: BetssonPromoCreative = {
  id: 'betsson-operator-logo',
  kind: 'logo',
  assetPath: '/operators/betsson.png',
  width: 447,
  height: 447,
  alt: { en: 'Betsson', 'pt-BR': 'Betsson', 'es-MX': 'Betsson' },
  languages: ['en', 'pt-BR', 'es-MX'],
  source: 'Approved Betsson operator logo already on file in the PlayLiva repository.',
  verifiedAt: '2026-08-14',
}

export const BETSSON_PROMO: BetssonPromoConfig = {
  enabled: true,
  promoId: BETSSON_PROMO_ID,
  brand: 'betsson',
  operatorId: 'op-betsson',
  operatorSlug: 'betsson-group-affiliates',
  market: 'BR',
  campaignName: 'Betsson BR | Ganhe 100 Giros!',
  headline: 'Ganhe 100 Giros!',
  ctaLabel: 'Jogar na Betsson',
  // Media Gallery › Direct Links › "Betsson BR | Ganhe 100 Giros!" (setup 13853), Casino / Brazilian.
  affiliateUrl: 'playliva-affiliate:betsson-br-promo',
  // Official campaign landing page behind that tracked link (geo-restricted to Brazil).
  landingPageUrl: 'https://ofertas.betsson.bet.br/100giros-tigre-sortudo',
  // No separate terms document is published in the affiliate portal; the landing page is the official terms access point.
  termsUrl: 'https://ofertas.betsson.bet.br/100giros-tigre-sortudo',
  creative: BETSSON_PROMO_LOGO,
  logo: BETSSON_PROMO_LOGO,
  validFrom: '2026-09-21',
  validUntil: '2026-10-14',
  placements: [
    BETSSON_PROMO_PLACEMENTS.originalsHeader,
    BETSSON_PROMO_PLACEMENTS.originalsEngagement,
    BETSSON_PROMO_PLACEMENTS.discoveryGame,
    BETSSON_PROMO_PLACEMENTS.offersPage,
  ],
  frequencyCap: { scope: 'milestone', max: 1 },
  engagement: {
    cycleMultiple: 3,
    delayMs: 650,
    copy: {
      'pt-BR': {
        headline: 'Ganhe 100 Giros!',
        condition: 'Aposte R$20 em jogos selecionados e ganhe 100 giros no Tigre Sortudo.',
        cta: 'Jogar na Betsson',
      },
      en: {
        headline: 'Get 100 Spins!',
        condition: 'Bet R$20 on selected games and get 100 spins on Tigre Sortudo.',
        cta: 'Play at Betsson',
      },
      'es-MX': {
        headline: '¡Consigue 100 giros!',
        condition: 'Apuesta R$20 en juegos seleccionados y consigue 100 giros en Tigre Sortudo.',
        cta: 'Jugar en Betsson',
      },
    },
  },
  // The landing page could not be read from outside Brazil (302 to ge.betsson.com), so no
  // deposit, wagering, spin-value, eligible-game, expiry or registration condition is claimed.
  verifiedTerms: [],
  source: 'Betsson Group Affiliates Media Gallery (mediastore.affiliates.betssongroupaffiliates.com), inspected 2026-09-21 while signed in: Direct Link "Betsson BR | Ganhe 100 Giros!" (Casino, Brazilian, setup 13853) and banner set "Studio_66626 - Betsson BR Casino Banners - BR" (media 209842–209856, HTML5 Bannerflow creatives reading "GANHE 100 GIROS" / "APOSTE E GANHE"). The HTML5 creatives are third-party script embeds with no static file and their key art is provider game artwork, so PlayLiva renders a native card with the approved Betsson logo and the verbatim headline instead.',
  verifiedAt: '2026-09-21',
}

export function isBetssonPromoLive(config: BetssonPromoConfig = BETSSON_PROMO, now = Date.now()): boolean {
  if (!config.enabled || !Number.isFinite(now)) return false
  const from = Date.parse(`${config.validFrom}T00:00:00Z`)
  const until = Date.parse(`${config.validUntil}T00:00:00Z`)
  return Number.isFinite(from) && Number.isFinite(until) && from <= now && now < until && until > from
}

export function betssonPromoSurface(placement: BetssonPromoPlacement): BetssonPromoSurface {
  return placement === BETSSON_PROMO_PLACEMENTS.offersPage ? 'offers'
    : placement === BETSSON_PROMO_PLACEMENTS.discoveryGame ? 'discovery'
    : 'originals'
}
