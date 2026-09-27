import Link from 'next/link'
import { LayoutDashboard, Clapperboard, Search, MousePointer2, NotebookPen, LockKeyhole, ExternalLink } from 'lucide-react'
import { ActionForm } from './actions'
import { OwnerSessionRefresh } from './session-refresh'
import styles from './owner.module.css'
const links = [ ['Overview', '', LayoutDashboard], ['Social', '/social', Clapperboard], ['SEO', '/seo', Search], ['Affiliate', '/affiliate', MousePointer2], ['Content', '/content', NotebookPen] ] as const
export function OwnerShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell} lang="en"><OwnerSessionRefresh /><a className={styles.skip} href="#owner-main">Skip to content</a><aside className={styles.sidebar}>
    <Link className={styles.brand} href="/owner/growth"><span className={styles.brandMark}>P</span><span>PlayLiva<small>OWNER WORKSPACE</small></span></Link>
    <div className={styles.navLabel}>GROWTH CONTROL</div><nav aria-label="Owner navigation">{links.map(([label, path, Icon]) => <Link key={label} href={`/owner/growth${path}`} prefetch={false}><Icon size={18} aria-hidden="true" />{label}</Link>)}</nav>
    <div className={styles.sidebarBottom}><span><LockKeyhole size={15} /> Private workspace</span><Link href="/pt-br" prefetch={false}>Open PlayLiva <ExternalLink size={14} /></Link><ActionForm endpoint="/api/owner/logout"><button type="submit">Sign out</button></ActionForm></div>
  </aside><div className={styles.workspace}><header className={styles.topbar}><span>PlayLiva <span className={styles.muted}>/ Growth</span></span><span className={styles.ownerBadge}><span /> Owner access</span></header><main id="owner-main" className={styles.main}>{children}</main><footer className={styles.footer}>Private operations · Review, upload and publishing remain separate.</footer></div></div>
}
