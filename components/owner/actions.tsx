'use client'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import styles from './owner.module.css'

export function ActionForm({ endpoint, children, confirm }: { endpoint: string; children: ReactNode; confirm?: string }) {
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false)
  const router = useRouter()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (confirm && !window.confirm(confirm)) return
    const form = event.currentTarget, data = Object.fromEntries(new FormData(form))
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    if (submitter?.name) data[submitter.name] = submitter.value
    setBusy(true); setMessage(''); setFailed(false)
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const result = await response.json()
      setMessage(result.error || result.message); setFailed(!response.ok)
      if (response.ok) { if (result.redirect) window.location.assign(result.redirect); else router.refresh() }
    } catch { setFailed(true); setMessage('Connection interrupted. Refresh to check the saved state before retrying.') }
    finally { setBusy(false) }
  }
  return <form onSubmit={submit} className={styles.actionForm}><fieldset disabled={busy}>{children}</fieldset>{busy && <p role="status">Saving…</p>}{message && <p role={failed ? 'alert' : 'status'} className={failed ? styles.error : styles.success}>{message}</p>}</form>
}
export function VideoPreview({ id, thumbnail }: { id: string; thumbnail: boolean }) {
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false)
  if (failed) return <p role="alert">Media became unavailable. The metadata and review history are preserved.</p>
  return open ? <video className={styles.video} controls playsInline preload="metadata" poster={thumbnail ? `/api/owner/media/${id}/thumbnail` : undefined} src={`/api/owner/media/${id}/video`} onError={() => setFailed(true)} /> : <button className={styles.primary} type="button" onClick={() => setOpen(true)}>Load video preview</button>
}
