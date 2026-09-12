'use client'

import { useSyncExternalStore } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { consentSnapshot, hasAnalyticsConsent, parseConsent, subscribeConsent } from '@/lib/consent'
import { GoogleAnalytics } from './ga4'

const serverSnapshot = () => null

export function ConsentedAnalytics() {
  const raw = useSyncExternalStore(subscribeConsent, consentSnapshot, serverSnapshot)
  const allowed = parseConsent(raw)?.analytics === true
  return (
    <>
      <GoogleAnalytics />
      {allowed && <Analytics beforeSend={(event) => hasAnalyticsConsent() ? event : null} />}
    </>
  )
}
