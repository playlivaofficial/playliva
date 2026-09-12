export const CONSENT_STORAGE_KEY = 'playliva.cookie-consent'
export const ANALYTICS_COOKIE = 'playliva_analytics'
export const CONSENT_EVENT = 'playliva:consent'
export const PREFERENCES_EVENT = 'playliva:preferences'

export interface Consent {
  necessary: true
  analytics: boolean
  marketing: boolean
}

// Session fallback also makes a rejection effective when storage is unavailable.
let sessionValue: string | null | undefined

export function parseConsent(raw: string | null): Consent | null {
  try {
    const value = raw ? JSON.parse(raw) : null
    return value?.necessary === true && typeof value.analytics === 'boolean' &&
      typeof value.marketing === 'boolean' ? value : null
  } catch {
    return null
  }
}

export function consentSnapshot(): string | null {
  if (typeof window === 'undefined') return null
  if (sessionValue !== undefined) return sessionValue
  try { return window.localStorage.getItem(CONSENT_STORAGE_KEY) } catch { return null }
}

export function hasAnalyticsConsent(): boolean {
  return parseConsent(consentSnapshot())?.analytics === true
}

export function syncConsentCookie(): void {
  try {
    document.cookie = `${ANALYTICS_COOKIE}=${hasAnalyticsConsent() ? 'granted' : 'denied'}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  } catch { /* Keep the in-memory choice effective when cookies are blocked. */ }
}

export function saveConsent(consent: Consent): void {
  sessionValue = JSON.stringify(consent)
  try { window.localStorage.setItem(CONSENT_STORAGE_KEY, sessionValue) } catch { /* session only */ }
  syncConsentCookie()
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function subscribeConsent(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== CONSENT_STORAGE_KEY) return
    sessionValue = event.newValue
    syncConsentCookie()
    listener()
  }
  window.addEventListener(CONSENT_EVENT, listener)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new Event(PREFERENCES_EVENT))
}
