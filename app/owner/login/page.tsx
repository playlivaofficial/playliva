import { authReady } from '@/lib/owner/server/auth'
import { ActionForm } from '@/components/owner/actions'
import styles from '@/components/owner/owner.module.css'
export default async function OwnerLogin() {
  const ready = await authReady()
  return <main className={styles.login} lang="en"><section><div className={styles.brandMark}>P</div><p className={styles.eyebrow}>PLAYLIVA · OWNER WORKSPACE</p><h1>Welcome back.</h1><p>Sign in to your private growth control room.</p>{ready ? <ActionForm endpoint="/api/owner/login"><label>Owner password<input name="password" type="password" autoComplete="current-password" required maxLength={512} /></label><button className={styles.primary} type="submit">Sign in securely</button></ActionForm> : <div className={styles.notice}><strong>Owner access is not configured.</strong><p>A server credential and persistent session store are required. No owner data is accessible.</p></div>}<small>Private access · 30-day sessions, renewed during active use. Sign out to end this session immediately.</small></section></main>
}
