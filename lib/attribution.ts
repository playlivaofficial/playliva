/**
 * Inbound traffic attribution for direct social landings.
 *
 * Social posts (TikTok, Instagram Reels, YouTube Shorts) link straight to an
 * Original gameplay route with UTM parameters. Those parameters are captured
 * once per browser session and attached to consented promo/affiliate events,
 * so a landing on `/pt-br/play/crash?utm_source=tiktok` keeps its source all
 * the way to the outbound affiliate click without forcing traffic through the
 * homepage.
 *
 * Only short campaign identifiers are kept. Values are allow-listed by
 * character class and length, never free text, and nothing here is forwarded
 * to a partner destination — partner attribution stays on the `/go` resolver.
 */

export const ATTRIBUTION_STORAGE_KEY = 'playliva.attribution'

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
    if (!trafficSource || typeof value.utm !== 'object' || value.utm === null) return null
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
 * Capture the landing attribution once per browser session. The first
 * navigation with UTMs or an external referrer wins; later in-app navigation
 * never overwrites it. Safe to call repeatedly.
 */
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null
  let stored: Attribution | null = null
  try { stored = decode(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) } catch { /* storage unavailable */ }
  const landing = parseAttribution(window.location.search, document.referrer, window.location.hostname)
  // Only an explicit UTM landing may replace a stored referrer-only classification.
  const next = !stored || (landing && Object.keys(landing.utm).length > 0 && Object.keys(stored.utm).length === 0)
    ? landing ?? stored
    : stored
  if (next && next !== stored) {
    try { window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next)) } catch { /* session only */ }
  }
  return next ?? { trafficSource: 'direct', utm: {} }
}

/** Read the preserved attribution without touching the current URL. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return { trafficSource: 'direct', utm: {} }
  try {
    return decode(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)) ?? captureAttribution() ?? { trafficSource: 'direct', utm: {} }
  } catch {
    return { trafficSource: 'direct', utm: {} }
  }
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
