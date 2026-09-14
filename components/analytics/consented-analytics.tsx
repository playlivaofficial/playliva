'use client'

import { useSyncExternalStore } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { consentSnapshot, hasAnalyticsConsent, parseConsent, subscribeConsent } from '@/lib/consent'
import { GoogleAnalytics } from './ga4'
import { analyticsPath } from '@/lib/tracking'

const serverSnapshot = () => null

export function ConsentedAnalytics() {
  const raw = useSyncExternalStore(subscribeConsent, consentSnapshot, serverSnapshot)
  const allowed = parseConsent(raw)?.analytics === true
  return (
    <>
      <GoogleAnalytics />
      {allowed && <Analytics beforeSend={(event) => {
        if (!hasAnalyticsConsent()) return null
        try {
          const url = new URL(event.url)
          const path = analyticsPath(url.pathname)
          return path && url.origin === window.location.origin ? { ...event, url: `${url.origin}${path}` } : null
        } catch { return null }
      }} />}
    </>
  )
}
