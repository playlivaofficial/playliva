/**
 * Inbound traffic attribution for direct social landings.
 *
 * Social posts (TikTok, Instagram Reels, YouTube Shorts) link straight to an
 * Original gameplay route with UTM parameters. Those parameters are captured
 * for the active visit and attached to consented promo/affiliate events,
 * so a landing on `/pt-br/play/crash?utm_source=tiktok` keeps its source all
 * the way to the outbound affiliate click without forcing traffic through the
 * homepage.
 *
 * Only short campaign identifiers are kept. Values are allow-listed by
 * character class and length, never free text, and nothing here is forwarded
 * to a partner destination — partner attribution stays on the `/go` resolver.
 */

export const ATTRIBUTION_STORAGE_KEY = 'playliva.attribution'
export const ATTRIBUTION_IDLE_MS = 30 * 60 * 1000
let lastLocation: string | undefined

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
export type UtmKey = (typeof UTM_KEYS)[number]

export interface Attribution {
  /** Normalized source: the UTM source, else a known referrer host class, else `direct`. */
  trafficSource: string
  utm: Partial<Record<UtmKey, string>>
}

const VALUE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/

const KNOWN_REFERRERS: readonly [RegExp, string][] = [
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)(facebook\.com|fb\.com)$/, 'facebook'],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, 'x'],
  [/(^|\.)(google\.[a-z.]+)$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)(telegram\.org|t\.me)$/, 'telegram'],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, 'whatsapp'],
]

export function sanitizeAttributionValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().toLowerCase()
  return VALUE_PATTERN.test(trimmed) ? trimmed : undefined
}

/** Classify a referrer by host only; the path/query of the referrer is never read. */
export function classifyReferrer(referrer: string | null | undefined, ownHost?: string): string | undefined {
  if (!referrer) return undefined
  try {
    const host = new URL(referrer).hostname.toLowerCase()
    if (!host || (ownHost && host === ownHost.toLowerCase())) return undefined
    for (const [pattern, name] of KNOWN_REFERRERS) if (pattern.test(host)) return name
    return 'referral'
  } catch {
    return undefined
  }
}

/** Pure: derive attribution from a query string and referrer. */
export function parseAttribution(search: string, referrer?: string | null, ownHost?: string): Attribution | null {
  const params = new URLSearchParams(search)
  const utm: Partial<Record<UtmKey, string>> = {}
  for (const key of UTM_KEYS) {
    const value = sanitizeAttributionValue(params.get(key))
    if (value) utm[key] = value
  }
  const trafficSource = utm.utm_source ?? classifyReferrer(referrer, ownHost)
  if (!trafficSource && Object.keys(utm).length === 0) return null
  return { trafficSource: trafficSource ?? 'direct', utm }
}

function decode(raw: string | null): Attribution | null {
  if (!raw || raw.length > 1024) return null
  try {
    const value = JSON.parse(raw)
    const trafficSource = sanitizeAttributionValue(value?.trafficSource)
    if (!trafficSource || typeof value.utm !== 'object' || value.utm === null ||
      !Number.isFinite(value.touchedAt) || Date.now() - value.touchedAt > ATTRIBUTION_IDLE_MS || value.touchedAt > Date.now()) return null
    const utm: Partial<Record<UtmKey, string>> = {}
    for (const key of UTM_KEYS) {
      const item = sanitizeAttributionValue(value.utm[key])
      if (item) utm[key] = item
    }
    return { trafficSource, utm }
  } catch {
    return null
  }
}

/**
 * Preserve attribution across internal navigation for 30 minutes of inactivity.
 * A new explicit campaign landing replaces the prior campaign. An unchanged
 * address cannot revive an expired campaign in a tab left open overnight.
 */
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  let stored: Attribution | null = null
  try { stored = decode(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) } catch { /* storage unavailable */ }
  const changed = lastLocation !== window.location.href
  const landing = changed ? parseAttribution(window.location.search, lastLocation === undefined ? document.referrer : null, window.location.hostname) : null
  lastLocation = window.location.href
  const next = landing ?? stored ?? { trafficSource: 'direct', utm: {} }
  try { window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify({ ...next, touchedAt: Date.now() })) } catch { /* session only */ }
  return next
}

/** Read the preserved attribution without touching the current URL. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { trafficSource: 'direct', utm: {} }
  try {
    return captureAttribution() ?? { trafficSource: 'direct', utm: {} }
  } catch {
    return { trafficSource: 'direct', utm: {} }
  }
}

export function clearAttribution() {
  try { window.sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY) } catch { /* unavailable */ }
  lastLocation = undefined
}

/** Flatten for the analytics allow-list: `utm_source` becomes `utmSource`, etc. */
export function attributionPayload(attribution: Attribution = getAttribution()) {
  return {
    trafficSource: attribution.trafficSource,
    utmSource: attribution.utm.utm_source,
    utmMedium: attribution.utm.utm_medium,
    utmCampaign: attribution.utm.utm_campaign,
    utmContent: attribution.utm.utm_content,
    utmTerm: attribution.utm.utm_term,
  }
}
