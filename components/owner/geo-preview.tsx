'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { OwnerGeoStatus, PreviewGeo } from '@/lib/owner/server/geo-preview'

export function OwnerGeoPreview({ status }: { status: OwnerGeoStatus }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  // Revalidate retained tabs after reset, logout, expiry, or another tab's change.
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const response = await fetch('/api/owner/geo-preview', { cache: 'no-store' })
        if (response.status === 401) { window.location.reload(); return }
        if (!response.ok) return
        const next: OwnerGeoStatus = await response.json()
        if (next.previewGeo !== status.previewGeo) window.location.reload()
      } catch { /* The server still rechecks every outbound request. */ }
    }
    const timer = window.setInterval(check, 60000)
    window.addEventListener('focus', check)
    window.addEventListener('pageshow', check)
    document.addEventListener('visibilitychange', check)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', check); window.removeEventListener('pageshow', check); document.removeEventListener('visibilitychange', check) }
  }, [status.previewGeo])

  async function change(country: PreviewGeo) {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/owner/geo-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ country }) })
      if (!response.ok) { setError('Could not change preview. Check your owner session and try again.'); return }
      // A full navigation clears retained layouts, market preferences in memory,
      // and popup timers. The browser's saved editorial preference is untouched.
      window.location.reload()
    } catch { setError('Connection interrupted. Refresh to check the current preview.') }
    finally { setBusy(false) }
  }

  if (!status.authorized) return null
  return <section aria-label="Owner GEO preview" data-owner-geo-preview={status.previewGeo || undefined} className="flex flex-wrap items-center gap-3 border-b border-amber-400/40 bg-slate-950 px-4 py-3 text-sm text-white" lang="en">
    <strong>Owner · GEO: {status.previewGeo ? `${status.previewGeo} preview` : 'Real GEO'}</strong>
    <span>Real country: {status.realCountry ?? 'Unknown'}</span>
    <label>Preview GEO <select aria-label="Preview GEO" className="ml-2 rounded border border-slate-500 bg-slate-900 p-1 text-white" value={status.previewGeo ?? 'real'} disabled={busy} onChange={event => void change(event.target.value === 'real' ? null : event.target.value as PreviewGeo)}>
      <option value="real">Default / Real GEO</option><option value="BR">Brazil (BR)</option><option value="MX">Mexico (MX)</option>
    </select></label>
    {status.previewGeo && <button className="underline" disabled={busy} onClick={() => void change(null)}>Reset to Real GEO</button>}
    <Link className="underline" href="/pt-br" prefetch={false}>Open PlayLiva</Link><Link className="underline" href="/owner/growth" prefetch={false}>Owner workspace</Link>
    {busy && <span role="status">Updating…</span>}{error && <span role="alert">{error}</span>}
  </section>
}
