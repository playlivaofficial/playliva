'use client'

import { useEffect, useRef } from 'react'
import { BRAZIL_AD_RULES, BRAZIL_AUTHORIZATIONS, hasCurrentBrazilEvidence, requiredWarningHeight } from '@/lib/compliance/brazil'

/** Place once inside the complete promotional block marked data-betting-ad. */
export function BrazilAdWarning({ operatorId, expiresAt }: { operatorId: string; expiresAt?: number }) {
  const warningRef = useRef<HTMLDivElement>(null)
  const evidence = BRAZIL_AUTHORIZATIONS[operatorId]
  useEffect(() => {
    const warning = warningRef.current
    const ad = warning?.closest<HTMLElement>('[data-betting-ad]')
    if (!warning || !ad) return
    const check = () => {
      ad.dataset.evidenceState = hasCurrentBrazilEvidence(evidence) &&
        (expiresAt === undefined || Date.now() < expiresAt) ? 'current' : 'expired'
      const box = ad.getBoundingClientRect()
      const band = warning.getBoundingClientRect()
      const height = `${requiredWarningHeight(box.width, box.height, band.width, band.height)}px`
      if (warning.style.minHeight !== height) warning.style.minHeight = height
    }
    check()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(check)
    observer?.observe(ad)
    // Recheck cached HTML on hydration, resize, tab restore, and at the exact review deadline.
    const delay = evidence ? Math.min(Date.parse(`${evidence.reviewBy}T00:00:00Z`), expiresAt ?? Infinity) - Date.now() : 0
    const timer = window.setTimeout(check, Math.max(0, Math.min(delay, 2_147_483_647)))
    const interval = window.setInterval(check, 60_000)
    window.addEventListener('resize', check)
    window.addEventListener('pageshow', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      observer?.disconnect()
      window.clearTimeout(timer)
      window.clearInterval(interval)
      window.removeEventListener('resize', check)
      window.removeEventListener('pageshow', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [evidence, expiresAt])

  return <div className="br-ad-compliance" lang="pt-BR">
    {evidence && <p className="br-ad-identity">
      {evidence.legalEntity} · CNPJ {evidence.cnpj} · <a href={evidence.source} target="_blank" rel="noopener noreferrer">{evidence.authorization}</a>
    </p>}
    <div ref={warningRef} className="br-ad-warning" data-brazil-ad-warning="" data-minimum-area="0.10">
      <strong className="br-ad-age">{BRAZIL_AD_RULES.age}</strong>
      <p>{BRAZIL_AD_RULES.warnings[0]}</p>
    </div>
  </div>
}
