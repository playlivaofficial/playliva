'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { captureAttribution, clearAttribution } from '@/lib/attribution'
import { hasAnalyticsConsent, subscribeConsent } from '@/lib/consent'
import { track } from '@/lib/tracking'

/** Consent-aware page/content counts for document loads and SPA navigation. */
export function AttributionCapture() {
  const pathname = usePathname(), search = useSearchParams()
  const last = useRef('')
  useEffect(() => {
    const run = () => {
      if (!hasAnalyticsConsent()) { clearAttribution(); return }
      captureAttribution()
      // Query/facet edits do not fabricate another page or content view.
      if (last.current === pathname) return
      last.current = pathname
      track('page_view')
      track('content_view')
    }
    run()
    return subscribeConsent(run)
  }, [pathname, search])
  return null
}
