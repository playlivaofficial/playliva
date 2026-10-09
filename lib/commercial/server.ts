// Server entry point only. Never import this module from a client component.
import { GEO_CONFIG, isCommercialGeo } from '../geo'
import { isCategorySlug, isOfferEligible } from '../data'
import type { Operator, Offer } from '../types'
import { commercialReference, isCommercialKey, parseCommercialReference } from './references'
import { emptyCommercialSnapshot, type CommercialSnapshot, type OperatorRegistration } from './types'
import { hasMatchingCurrencyCopy } from './currency'
import { EXPECTED_OPERATORS, isPrimaryBrand } from './operators'

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

/** Deprecated `PLAYLIVA_AFFILIATE_DESTINATIONS` maps legacy keys to issued
 * destinations. A registry record may reference one by `destinationKey` instead
 * of repeating the URL. Only keys scoped to the record's own active GEO resolve
 * (`<operator>-<geo>[-<campaign>]`), so retired Brazil keys or another
 * country's link can never activate. The map alone activates nothing. */
const LEGACY_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export function legacyKeyGeo(key: string): string | null {
  if (!LEGACY_KEY.test(key) || key.length > 80) return null
  const segment = key.split('-').slice(1).find(part => /^[a-z]{2}$/.test(part))
  return segment ? segment.toUpperCase() : null
}
function parseLegacyDestinations(source: string): Record<string, unknown> | null {
  try { const value: unknown = JSON.parse(source); return object(value) ? value : null } catch { return null }
}
function legacyDestination(geo: unknown, key: unknown, destinations: Record<string, unknown> | null): string | undefined {
  if (!destinations || !isCommercialGeo(geo) || typeof key !== 'string' || legacyKeyGeo(key) !== geo || !Object.hasOwn(destinations, key)) return undefined
  const value = destinations[key]
  return https(value) && !/(^|\.)bet\.br$/.test(new URL(value).hostname) ? value : undefined
}

type RegistryIssue = 'identity_invalid' | 'not_approved_or_inactive' | 'destination_missing' | 'destination_invalid' |
  'currency_mismatch' | 'product_types_invalid' | 'legal_review_missing' | 'legal_review_not_current' | 'logo_invalid' |
  'priority_invalid' | 'optional_field_invalid' | 'duplicate_identity'

/** Every reason a raw record is withheld. An empty list means publishable. */
function registrationIssues(item: unknown, now: number): RegistryIssue[] {
  if (!object(item) || !isCommercialGeo(item.geo)) return ['identity_invalid']
  const issues: RegistryIssue[] = []
  if (!isCommercialKey(item.id) || !isCommercialKey(item.slug) || !isCommercialKey(item.campaignKey) || typeof item.brand !== 'string' || !item.brand.trim()) issues.push('identity_invalid')
  if (item.approved !== true || item.active !== true) issues.push('not_approved_or_inactive')
  if (item.affiliateUrl === undefined) issues.push('destination_missing')
  else if (!https(item.affiliateUrl)) issues.push('destination_invalid')
  if (item.currency !== GEO_CONFIG[item.geo].currency) issues.push('currency_mismatch')
  if (!strings(item.productTypes) || !item.productTypes.length || !item.productTypes.every(isCategorySlug)) issues.push('product_types_invalid')
  if (!object(item.legal) || item.legal.status !== 'verified' || !https(item.legal.source) || typeof item.legal.verifiedAt !== 'string' || typeof item.legal.reviewBy !== 'string') issues.push('legal_review_missing')
  else if (!hasCurrentLegalReview(item.legal, now)) issues.push('legal_review_not_current')
  if (!object(item.assets) || typeof item.assets.logo !== 'string' || !/^\/(?!\/)[a-zA-Z0-9/_\-.]+$/.test(item.assets.logo) ||
    typeof item.assets.alt !== 'string' || !item.assets.alt.trim()) issues.push('logo_invalid')
  if (!Number.isFinite(item.priority)) issues.push('priority_invalid')
  if ((item.verifiedGames !== undefined && !strings(item.verifiedGames)) ||
    (item.trackingTemplate !== undefined && typeof item.trackingTemplate !== 'string') ||
    (item.analyticsTrackingTemplate !== undefined && typeof item.analyticsTrackingTemplate !== 'string') ||
    (item.campaignId !== undefined && typeof item.campaignId !== 'string') || !localizedStrings(item.ctaText) ||
    (item.offers !== undefined && (!Array.isArray(item.offers) || item.offers.length > 20)) ||
    ['source', 'verifiedAt', 'reviewBy', 'statement', 'responsibleGambling', 'disclosure'].some(key => object(item.legal) && item.legal[key] !== undefined && typeof item.legal[key] !== 'string')) issues.push('optional_field_invalid')
  return issues
}

const campaignsOf = (record: Record<string, unknown>) =>
  [record.offer, ...(Array.isArray(record.offers) ? record.offers : [])].filter(object)
const campaignIds = (record: Record<string, unknown>) => campaignsOf(record).flatMap(campaign =>
  [isCommercialKey(campaign.id) ? `c:${campaign.id}` : null, object(campaign.offer) && isCommercialKey(campaign.offer.id) ? `o:${campaign.offer.id}` : null])
  .filter((id): id is string => id !== null)

/** Identity, campaign and offer IDs must be unique per GEO, including across an operator's own campaigns. */
function isDuplicate(record: Record<string, unknown>, input: unknown[]): boolean {
  const own = campaignIds(record)
  if (new Set(own).size !== own.length) return true
  return input.filter(other => object(other) && other.geo === record.geo &&
    (other.id === record.id || other.slug === record.slug || other.campaignKey === record.campaignKey ||
      campaignIds(other).some(id => own.includes(id)))).length !== 1
}

function readRegistryInput(source: string, destinationsSource: string): unknown[] | null {
  try {
    const input: unknown = JSON.parse(source)
    if (!Array.isArray(input) || input.length > 100) return null
    const destinations = parseLegacyDestinations(destinationsSource)
    // Resolve a GEO-scoped legacy key only when no explicit destination is set.
    return input.map(item => object(item) && item.affiliateUrl === undefined && item.destinationKey !== undefined
      ? { ...item, affiliateUrl: legacyDestination(item.geo, item.destinationKey, destinations) } : item)
  } catch { return null }
}

/** Malformed or ambiguous records fail closed independently of valid records.
 * Missing configuration deliberately has no publishable default. */
export function parseOperatorRegistry(source: string = process.env.PLAYLIVA_COMMERCIAL_REGISTRY ?? '[]', now = Date.now(),
  destinationsSource: string = process.env.PLAYLIVA_AFFILIATE_DESTINATIONS ?? '{}'): OperatorRegistration[] {
  const input = readRegistryInput(source, destinationsSource)
  if (!input) return []
  return input.filter((item): item is OperatorRegistration =>
    registrationIssues(item, now).length === 0 && !isDuplicate(item as unknown as Record<string, unknown>, input))
}

export type CommercialDiagnostics = ReturnType<typeof diagnoseCommercialConfiguration>

/** Owner-only, secret-free explanation of why each active GEO is or is not
 * publishing. Reports variable state, key names' GEO scope and issue codes;
 * never destinations, campaign IDs or tracking values. Missing configuration
 * is reported as missing configuration, never as absent authorization. */
export function diagnoseCommercialConfiguration(now = Date.now(), env: Record<string, string | undefined> = process.env) {
  const registrySource = env.PLAYLIVA_COMMERCIAL_REGISTRY, destinationsSource = env.PLAYLIVA_AFFILIATE_DESTINATIONS
  const input = registrySource === undefined ? [] : readRegistryInput(registrySource, destinationsSource ?? '{}')
  const destinations = destinationsSource === undefined ? null : parseLegacyDestinations(destinationsSource)
  const legacyKeys = Object.keys(destinations ?? {})
  const legacyByGeo = (geo: string) => legacyKeys.filter(key => legacyKeyGeo(key) === geo).length
  const published = parseOperatorRegistry(registrySource ?? '[]', now, destinationsSource ?? '{}')
  return {
    registry: registrySource === undefined ? 'missing' as const : input ? 'configured' as const : 'invalid' as const,
    legacyDestinations: destinationsSource === undefined ? 'missing' as const : destinations ? 'configured' as const : 'invalid' as const,
    retiredLegacyKeys: legacyKeys.filter(key => legacyKeyGeo(key) === 'BR').length,
    unscopedLegacyKeys: legacyKeys.filter(key => { const geo = legacyKeyGeo(key); return !geo || (geo !== 'BR' && !isCommercialGeo(geo)) }).length,
    geos: EXPECTED_OPERATORS.map(expected => {
      const records = (input ?? []).filter(item => object(item) && item.geo === expected.geo) as Record<string, unknown>[]
      const live = published.filter(item => item.geo === expected.geo)
      const issues = new Set<string>()
      if (!records.length) issues.add('no_registry_record')
      for (const record of records) {
        for (const issue of registrationIssues(record, now)) issues.add(issue)
        if (record.destinationKey !== undefined && record.affiliateUrl === undefined) issues.add('legacy_destination_unresolved')
        if (isDuplicate(record, input ?? [])) issues.add('duplicate_identity')
      }
      if (live.length && !live.some(item => item.brand.trim().toLowerCase() === expected.brand.toLowerCase())) issues.add('expected_operator_not_published')
      return { ...expected, records: records.length, published: live.length, legacyKeys: legacyByGeo(expected.geo),
        issues: [...issues] }
    }),
  }
}

export function snapshotFromRegistry(geo: unknown, registrations: OperatorRegistration[], now = Date.now()): CommercialSnapshot {
  const result = emptyCommercialSnapshot(isCommercialGeo(geo) ? geo : null)
  if (!isCommercialGeo(geo)) return result
  // Validate injected fixtures as well as production input; no alternate permissive path.
  // The owner-confirmed primary brand leads every GEO list; priority orders the rest.
  const records = parseOperatorRegistry(JSON.stringify(registrations), now).filter(item => item.geo === geo)
    .sort((a, b) => Number(isPrimaryBrand(geo, b.brand)) - Number(isPrimaryBrand(geo, a.brand)) || a.priority - b.priority || a.id.localeCompare(b.id))
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
      ctaText: record.ctaText, sponsor: isPrimaryBrand(geo, record.brand),
      commercialLegal: { status: 'verified', reviewBy: legal.reviewBy!, statement: legal.statement,
        responsibleGambling: legal.responsibleGambling, disclosure: legal.disclosure },
    }
    result.operators.push(operator)
    // `offer` stays supported; `offers` lists further campaigns from the same dashboard.
    for (const campaign of [record.offer, ...(record.offers ?? [])]) {
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
      operator.verifiedOffers = [...operator.verifiedOffers!, offer.id]
      if (!isOfferEligible(offer, geo, {}, result.operators, now)) { operator.verifiedOffers = operator.verifiedOffers.filter(id => id !== offer.id); continue }
      result.offers.push(offer)
      const copy = Object.fromEntries(Object.entries(campaign.copy).map(([locale, value]) =>
        [locale, { headline: value!.headline, condition: value!.condition, cta: value!.cta }]))
      result.campaigns.push({ id: campaign.id, operatorId: record.id, geo, currency: record.currency,
        approved: true, active: true, offer, copy, placements: [...campaign.placements],
        cadence: { cycleMultiple: campaign.cadence.cycleMultiple, delayMs: campaign.cadence.delayMs },
        validFrom: campaign.validFrom, validUntil: campaign.validUntil, verifiedTerms: [...campaign.verifiedTerms] })
    }
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
