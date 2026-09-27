'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { hasAnalyticsConsent, subscribeConsent } from '@/lib/consent'

/** One visible exposure per placement/route, including consent granted later. */
export function useCommercialImpression(ref: RefObject<HTMLElement | null>, identity: string, record: () => void) {
  const seen = useRef('')
  useEffect(() => {
    const node = ref.current
    if (!node || seen.current === identity || typeof IntersectionObserver === 'undefined') return
    let visible = false
    const attempt = () => {
      if (!visible || !hasAnalyticsConsent() || seen.current === identity) return
      seen.current = identity
      record()
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.5)
      attempt()
    }, { threshold: 0.5 })
    observer.observe(node)
    const unsubscribe = subscribeConsent(attempt)
    return () => { observer.disconnect(); unsubscribe() }
  }, [ref, identity, record])
}
