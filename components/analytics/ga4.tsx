'use client'

import { useEffect } from 'react'
import { connectGoogleAnalytics } from '@/lib/google-analytics'

/**
 * Google Analytics 4 (gtag.js) loader.
 *
 * Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set — never
 * fabricate a measurement ID. Add the real "G-XXXXXXXXXX" ID from the GA4
 * property (Admin → Data Streams → Web) as that env var to enable this.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  useEffect(() => connectGoogleAnalytics(measurementId), [measurementId])
  return null
}
