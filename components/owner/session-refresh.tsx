'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/** Active owner use renews the session; unattended hidden tabs do not keep it alive. */
export function OwnerSessionRefresh() {
  const pathname = usePathname(), router = useRouter()
  const lastCheck = useRef(0), pending = useRef(false)
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== 'visible' || pending.current || Date.now() - lastCheck.current < 60 * 60 * 1000) return
      pending.current = true
      lastCheck.current = Date.now()
      try {
        const response = await fetch('/api/owner/session', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: '{}' })
        await response.json()
        if (response.status === 401) { router.replace('/owner/login'); router.refresh() }
        else if (!response.ok) lastCheck.current = Date.now() - 55 * 60 * 1000
      } catch { lastCheck.current = Date.now() - 55 * 60 * 1000 }
      finally { pending.current = false }
    }
    const active = () => { void refresh() }
    active()
    window.addEventListener('focus', active)
    document.addEventListener('visibilitychange', active)
    for (const event of ['pointerdown', 'keydown', 'scroll']) document.addEventListener(event, active, { passive: true })
    return () => {
      window.removeEventListener('focus', active)
      document.removeEventListener('visibilitychange', active)
      for (const event of ['pointerdown', 'keydown', 'scroll']) document.removeEventListener(event, active)
    }
  }, [pathname, router])
  return null
}
