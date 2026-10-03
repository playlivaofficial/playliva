'use client'

import { useEffect, useReducer } from 'react'

/** Re-render at a campaign deadline even when a player leaves an idle tab open. */
export function useCampaignExpiry(expiresAt: number | undefined): void {
  const [, refresh] = useReducer((value: number) => value + 1, 0)
  useEffect(() => {
    if (expiresAt === undefined || !Number.isFinite(expiresAt)) return () => {}
    let timer: number, disposed = false
    const schedule = () => { timer = window.setTimeout(() => {
      refresh()
      if (!disposed && Date.now() < expiresAt) schedule()
    }, Math.max(0, Math.min(expiresAt - Date.now(), 2_147_483_647))) }
    schedule()
    const check = () => { if (Date.now() >= expiresAt) refresh() }
    window.addEventListener('pageshow', check)
    document.addEventListener('visibilitychange', check)
    return () => { disposed = true; window.clearTimeout(timer); window.removeEventListener('pageshow', check); document.removeEventListener('visibilitychange', check) }
  }, [expiresAt])
}
