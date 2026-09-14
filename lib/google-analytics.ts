import { hasAnalyticsConsent, subscribeConsent, syncConsentCookie } from './consent'
import { analyticsPath } from './tracking'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    [key: `ga-disable-${string}`]: boolean | undefined
  }
}

/** Basic opt-in: no Google script or requests before analytics consent. */
export function connectGoogleAnalytics(measurementId: string | undefined): () => void {
  if (!measurementId) return () => {}
  const disableKey: `ga-disable-${string}` = `ga-disable-${measurementId}`
  let enabled = false
  let configured = false
  const update = () => {
    const allowed = hasAnalyticsConsent()
    window[disableKey] = !allowed
    syncConsentCookie()
    if (!allowed) {
      if (enabled) {
        // Disable hits before updating an already-loaded tag. Removing a script
        // alone cannot disable handlers that it has installed.
        window.dataLayer?.splice(0)
        window.dataLayer?.push(['consent', 'update', {
          analytics_storage: 'denied', ad_storage: 'denied',
          ad_user_data: 'denied', ad_personalization: 'denied',
        }])
        document.getElementById('playliva-ga4')?.remove()
        // Expire GA cookies available to this origin (host-only and parent domains).
        try {
          for (const part of document.cookie.split(';')) {
            const name = part.trim().split('=')[0]
            if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue
            document.cookie = `${name}=; Max-Age=0; Path=/`
            const labels = location.hostname.split('.')
            for (let i = 0; i < labels.length - 1; i++) {
              document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${labels.slice(i).join('.')}`
            }
          }
        } catch { /* Cookie access may be disabled; the opt-out flag still blocks hits. */ }
      }
      enabled = false
      return
    }
    if (enabled) return
    enabled = true
    window.dataLayer = window.dataLayer ?? []
    window.gtag = (...args: unknown[]) => {
      if (hasAnalyticsConsent()) window.dataLayer?.push(args)
    }
    if (!configured) {
      window.gtag('consent', 'default', {
        analytics_storage: 'denied', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      })
      configured = true
    }
    window.gtag('consent', 'update', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
    })
    window.gtag('js', new Date())
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: `${location.origin}${analyticsPath(location.pathname) ?? '/'}`,
      page_referrer: '',
    })
    if (!document.getElementById('playliva-ga4')) {
      const script = document.createElement('script')
      script.id = 'playliva-ga4'
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
      document.head.appendChild(script)
    }
  }
  update()
  return subscribeConsent(update)
}
