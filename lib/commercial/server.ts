// Server entry point only. Never import this module from a client component.
import { GEO_CONFIG, isCommercialGeo } from '../geo'
import { isCategorySlug, isOfferEligible } from '../data'
import type { Operator, Offer } from '../types'
import { commercialReference, isCommercialKey, parseCommercialReference } from './references'
import { emptyCommercialSnapshot, type CommercialSnapshot, type OperatorRegistration } from './types'
import { hasMatchingCurrencyCopy } from './currency'

function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.every(item => typeof item === 'string') }
function localizedStrings(value: unknown): boolean {
  return value === undefined || (object(value) && Object.entries(value).every(([key, text]) => ['en', 'pt-BR', 'es-MX', 'es-CO', 'es-PE'].includes(key) && typeof text === 'string'))
}
function https(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      !/(^|\.)(localhost|example\.(com|org|net))$/.test(url.hostname) && !/^[\d.:\[\]]+$/.test(url.hostname)
  } catch { return false }
}

/** Review evidence is an eligibility gate, not just optional disclosure text.
 * Recheck it whenever resolving a private destination so old page props cannot
 * keep a withdrawn or expired record usable. */
function hasCurrentLegalReview(legal: unknown, now: number): boolean {
  return object(legal) && legal.status === 'verified' && https(legal.source) &&
    typeof legal.verifiedAt === 'string' && typeof legal.reviewBy === 'string' &&
    Date.parse(legal.verifiedAt) <= now && Date.parse(legal.reviewBy) > now
}

/** Malformed or ambiguous records fail closed independently of valid records.
 * Missing configuration deliberately has no publishable default. */
export function parseOperatorRegistry(source: string = process.env.PLAYLIVA_COMMERCIAL_REGISTRY ?? '[]', now = Date.now()): OperatorRegistration[] {
  try {
    const input: unknown = JSON.parse(source)
    if (!Array.isArray(input) || input.length > 100) return []
    const records = input.filter((item): item is OperatorRegistration => {
      if (!object(item) || !isCommercialGeo(item.geo) || !isCommercialKey(item.id) || !isCommercialKey(item.slug) ||
        !isCommercialKey(item.campaignKey) || typeof item.brand !== 'string' || !item.brand.trim() ||
        item.approved !== true || item.active !== true || !https(item.affiliateUrl) ||
        item.currency !== GEO_CONFIG[item.geo].currency || !strings(item.productTypes) ||
        !item.productTypes.length || !item.productTypes.every(isCategorySlug) ||
        !object(item.legal) || !hasCurrentLegalReview(item.legal, now) ||
        !object(item.assets) || typeof item.assets.logo !== 'string' || !/^\/(?!\/)[a-zA-Z0-9/_\-.]+$/.test(item.assets.logo) ||
        typeof item.assets.alt !== 'string' || !item.assets.alt.trim() || !Number.isFinite(item.priority)) return false
      if (item.verifiedGames !== undefined && !strings(item.verifiedGames)) return false
      if (item.trackingTemplate !== undefined && typeof item.trackingTemplate !== 'string') return false
      if (item.analyticsTrackingTemplate !== undefined && typeof item.analyticsTrackingTemplate !== 'string') return false
      if (item.campaignId !== undefined && typeof item.campaignId !== 'string') return false
      if (!localizedStrings(item.ctaText)) return false
      if (['source', 'verifiedAt', 'reviewBy', 'statement', 'responsibleGambling', 'disclosure'].some(key => item.legal && (item.legal as Record<string, unknown>)[key] !== undefined && typeof (item.legal as Record<string, unknown>)[key] !== 'string')) return false
      return true
    })
    return records.filter(record => input.filter(other => object(other) && other.geo === record.geo &&
      (other.id === record.id || other.slug === record.slug || other.campaignKey === record.campaignKey ||
        (object(other.offer) && record.offer &&
          ((isCommercialKey(record.offer.id) && other.offer.id === record.offer.id) ||
            (object(other.offer.offer) && isCommercialKey(record.offer.offer?.id) && other.offer.offer.id === record.offer.offer.id))))).length === 1)
  } catch { return [] }
}

export function snapshotFromRegistry(geo: unknown, registrations: OperatorRegistration[], now = Date.now()): CommercialSnapshot {
  const result = emptyCommercialSnapshot(isCommercialGeo(geo) ? geo : null)
  if (!isCommercialGeo(geo)) return result
  // Validate injected fixtures as well as production input; no alternate permissive path.
  const records = parseOperatorRegistry(JSON.stringify(registrations), now).filter(item => item.geo === geo)
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
  for (const record of records) {
    const legal = record.legal
    const operator: Operator = {
      id: record.id, slug: record.slug, name: record.brand, logo: record.assets.logo,
      countries: [geo], categories: record.productTypes, paymentMethods: [], gameTypes: [],
      approved: true, active: true, verified: true, featured: false, isMock: false,
      affiliateStatus: 'approved', destinationReady: true, currency: record.currency,
      priority: record.priority, campaignKey: record.campaignKey,
      affiliateUrl: { [geo]: commercialReference(geo, record.id, record.campaignKey) },
      verifiedGames: { [geo]: record.verifiedGames ?? [] }, verifiedOffers: [],
      ctaText: record.ctaText,
      commercialLegal: { status: 'verified', statement: legal.statement,
        responsibleGambling: legal.responsibleGambling, disclosure: legal.disclosure },
    }
    result.operators.push(operator)
    const campaign = record.offer
    if (!campaign || !isCommercialKey(campaign.id) || campaign.approved !== true || campaign.active !== true ||
      typeof campaign.validFrom !== 'string' || typeof campaign.validUntil !== 'string' ||
      !(Date.parse(campaign.validFrom) <= now && Date.parse(campaign.validUntil) > now) ||
      !strings(campaign.placements) || !strings(campaign.verifiedTerms) || !campaign.verifiedTerms.length ||
      !object(campaign.cadence) || !Number.isInteger(campaign.cadence.cycleMultiple) || campaign.cadence.cycleMultiple < 1 ||
      !Number.isFinite(campaign.cadence.delayMs) || campaign.cadence.delayMs < 0 || !object(campaign.copy) || !object(campaign.offer)) continue
    const configured = campaign.offer
    const review = configured.complianceReview
    if (!['title', 'description', 'terms', 'source', 'lastVerifiedAt'].every(key => typeof configured[key as keyof Offer] === 'string') ||
      configured.status !== 'verified' || !object(review) || review.status !== 'reviewed-permitted' || review.market !== geo ||
      !(['legalSource', 'verifiedAt', 'reviewBy'] as const).every(key => typeof review[key] === 'string') ||
      (configured.category !== 'welcome' && !isCategorySlug(configured.category)) || !localizedStrings(configured.ctaLabel) ||
      !Object.entries(campaign.copy).every(([locale, copy]) => ['en', 'pt-BR', 'es-MX', 'es-CO', 'es-PE'].includes(locale) && object(copy) &&
        (['headline', 'condition', 'cta'] as const).every(key => typeof copy[key] === 'string' && copy[key].trim()))) continue
    if ((configured.currency && configured.currency !== record.currency) || !hasMatchingCurrencyCopy(
      [configured.title, configured.description, configured.terms, ...campaign.verifiedTerms,
        ...Object.values(campaign.copy).flatMap(copy => copy ? [copy.headline, copy.condition, copy.cta] : [])].join(' '), record.currency)) continue
    // Explicit allow-list: never spread private partner configuration into public props.
    const offer: Offer = {
      id: configured.id, operatorId: record.id, country: geo, title: configured.title,
      currency: record.currency,
      description: configured.description, category: configured.category, terms: configured.terms,
      affiliateUrl: commercialReference(geo, record.id, record.campaignKey), active: true, featured: !!configured.featured,
      status: configured.status, validFrom: campaign.validFrom, validUntil: campaign.validUntil,
      source: configured.source, termsUrl: https(configured.termsUrl) ? configured.termsUrl : undefined,
      promoId: campaign.id, brand: record.slug, ctaLabel: configured.ctaLabel,
      lastVerifiedAt: configured.lastVerifiedAt,
      complianceReview: { market: geo, status: 'reviewed-permitted', legalSource: review.legalSource,
        verifiedAt: review.verifiedAt, reviewBy: review.reviewBy },
    }
    const creative = configured.creative
    if (creative && isCommercialKey(creative.id) && /^\/(?!\/)[a-zA-Z0-9/_\-.]+$/.test(creative.assetPath) &&
      Number.isFinite(creative.width) && creative.width > 0 && Number.isFinite(creative.height) && creative.height > 0 &&
      object(creative.alt) && localizedStrings(creative.alt) && strings(creative.languages) && creative.languages.every(locale => ['en', 'pt-BR', 'es-MX', 'es-CO', 'es-PE'].includes(locale))) {
      offer.creative = { id: creative.id, assetPath: creative.assetPath, width: creative.width, height: creative.height,
        alt: creative.alt, languages: creative.languages }
    }
    if (!isCommercialKey(offer.id)) continue
    operator.verifiedOffers = [offer.id]
    if (!isOfferEligible(offer, geo, {}, result.operators, now)) { operator.verifiedOffers = []; continue }
    result.offers.push(offer)
    const copy = Object.fromEntries(Object.entries(campaign.copy).map(([locale, value]) =>
      [locale, { headline: value!.headline, condition: value!.condition, cta: value!.cta }]))
    result.campaigns.push({ id: campaign.id, operatorId: record.id, geo, currency: record.currency,
      approved: true, active: true, offer, copy, placements: [...campaign.placements],
      cadence: { cycleMultiple: campaign.cadence.cycleMultiple, delayMs: campaign.cadence.delayMs },
      validFrom: campaign.validFrom, validUntil: campaign.validUntil, verifiedTerms: [...campaign.verifiedTerms] })
  }
  return result
}

export function commercialSnapshot(geo: unknown): CommercialSnapshot { return snapshotFromRegistry(geo, parseOperatorRegistry()) }

/** Resolve only a currently approved reference in its exact GEO. Raw URLs and
 * legacy Brazil campaign references are never redirect capabilities. */
export function privateCommercialDestination(reference: string, context: Record<string, string | undefined> = {}, analyticsAllowed = false): string | null {
  const ref = parseCommercialReference(reference)
  if (!ref) return null
  const record = parseOperatorRegistry().find(item => item.geo === ref.geo && item.id === ref.operatorId && item.campaignKey === ref.campaignKey)
  if (!record) return null
  const url = new URL(record.affiliateUrl)
  const tokens = { ...context, geo: ref.geo, campaignId: record.campaignId ?? '' }
  for (const template of [record.trackingTemplate, analyticsAllowed ? record.analyticsTrackingTemplate : undefined]) {
    if (!template) continue
    const filled = template.replace(/\{([a-zA-Z]+)\}/g, (_, key: string) => encodeURIComponent(tokens[key as keyof typeof tokens] ?? ''))
    new URLSearchParams(filled).forEach((value, key) => url.searchParams.append(key, value))
  }
  return url.toString()
}
