'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'
import { hasAnalyticsConsent, subscribeConsent } from '@/lib/consent'

/**
 * Preserve inbound UTM / referrer attribution for the session so a direct
 * social landing on an Original keeps its source through to the affiliate
 * click. Runs only with analytics consent, mirroring the tracking layer, and
 * re-runs when consent is granted later on the same landing page.
 */
export function AttributionCapture() {
  useEffect(() => {
    const run = () => { if (hasAnalyticsConsent()) captureAttribution() }
    run()
    return subscribeConsent(run)
  }, [])
  return null
}
