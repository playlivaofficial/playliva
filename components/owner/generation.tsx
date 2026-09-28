import Link from 'next/link'
import type { GrowthData } from '@/lib/owner/server/overview'
import { ActionForm } from './actions'
import styles from './owner.module.css'

export function GenerationPanel({ data }: { data: GrowthData }) {
  const { daily, automation } = data
  return <section className={styles.panel} aria-label="Today’s production"><header className={styles.panelHeader}><div><h2>Today’s production</h2><p>{daily.date} · {daily.timezone} · one real PT-BR video per eligible game</p></div><strong>{daily.ready} / {daily.expected} videos ready today</strong></header>
    <div className={styles.miniMetrics}><div className={styles.metric}><span>Eligible games</span><strong>{daily.expected}</strong><small>Live authoritative Originals catalog</small></div><div className={styles.metric}><span>Verified ready today</span><strong>{daily.ready}</strong><small>Real private preview and download checked</small></div><div className={styles.metric}><span>Needs attention</span><strong>{daily.expected - daily.ready}</strong><small>Missing, queued, rendering or failed</small></div></div>
    <div className={styles.tableScroll}><table><thead><tr><th>Game</th><th>Status</th><th>Duration / size</th><th>Action</th></tr></thead><tbody>{daily.items.map(item => <tr key={item.id}><td>{item.title}</td><td>{item.status}<small>{item.error}</small></td><td>{item.status === 'READY' ? `${item.duration}s · ${(item.bytes / 1000000).toFixed(2)} MB` : 'Not yet verified'}</td><td>{item.status === 'READY' && item.creativeId ? <><Link prefetch={false} href={`/owner/growth/social?creative=${item.creativeId}&period=all`}>Preview</Link> · <a href={`/api/owner/media/${item.creativeId}/video?download=1`}>Download MP4</a></> : <span>Pending recovery</span>}</td></tr>)}</tbody></table></div>
    <p className={styles.inlineNote}>Daily at 09:00 Tbilisi. Reruns reuse the same game/date slot and preserve finished videos. Previous daily videos remain available. No social-platform upload or publication.</p>
    <ActionForm endpoint="/api/owner/generation/batch" confirm="Queue only missing or failed daily slots? Existing READY videos will be preserved. Nothing will be published."><input type="hidden" name="confirmed" value="yes" /><button disabled={!automation.armed || !data.privateMedia} type="submit">Queue / recover today’s missing videos</button><small>Queued work runs at the next cloud worker wake-up or operator dispatch.</small></ActionForm>
    <details><summary>Render queue and previous batches</summary><div className={styles.tableScroll}><table><thead><tr><th>Batch</th><th>Render state</th><th>Jobs completed</th><th>Failed</th><th>Action</th></tr></thead><tbody>{automation.batches.map(batch => <tr key={batch.id}><td>{batch.id}</td><td>{batch.state}</td><td>{batch.completed} / {batch.expected}</td><td>{batch.failed}</td><td><ActionForm endpoint={`/api/owner/generation/retry/${batch.id}`}><button disabled={!batch.failed} type="submit">Retry failed slots</button></ActionForm></td></tr>)}</tbody></table></div><p className={styles.inlineNote}>Render completion is not proof of available media. Only verified READY videos count in the library.</p></details>
  </section>
}
export function GeneratedActions({ id, data }: { id: string; data: GrowthData }) {
  const job = data.automation.jobs.find(row => row.id === id), creative = data.social.data.find(row => row.id === id)
  if (!job) return null
  return <div className={styles.notice}><div><strong>{job.angle} · {job.batchId}</strong><p>{creative?.availability}{job.error ? ` · ${job.error}` : ''}</p>
    {creative?.availability === 'READY' && <><a className={styles.primary} href={`/api/owner/media/${id}/video?download=1`}>Download MP4</a><ActionForm endpoint={`/api/owner/pin/${id}`}><input type="hidden" name="pinned" value={job.pinned ? 'no' : 'yes'} /><button type="submit">{job.pinned ? 'Pinned — unpin' : 'Keep / pin'}</button></ActionForm></>}
  </div></div>
}
