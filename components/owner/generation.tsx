import type { GrowthData } from '@/lib/owner/server/overview'
import { ActionForm } from './actions'
import styles from './owner.module.css'

export function GenerationPanel({ data }: { data: GrowthData }) {
  const { automation } = data
  return <section className={styles.panel} aria-label="Video production status"><header className={styles.panelHeader}><div><h2>Automatic video generation is disabled.</h2><p>Expected automatic videos per day: 0. No batches, retries or rendering are scheduled.</p></div></header>
    <p className={styles.inlineNote}>Historical videos, reviews and pinned records are preserved. Open a video to check its private preview or download on demand.</p>
    <details><summary>Historical batches and jobs</summary><div className={styles.tableScroll}><table><thead><tr><th>Batch</th><th>Recorded state</th><th>Jobs completed</th><th>Failed</th></tr></thead><tbody>{automation.batches.map(batch => <tr key={batch.id}><td>{batch.id}</td><td>{batch.state}</td><td>{batch.completed} / {batch.expected}</td><td>{batch.failed}</td></tr>)}</tbody></table></div><p className={styles.inlineNote}>These are historical states. Pending or failed jobs will not execute.</p></details>
  </section>
}
export function GeneratedActions({ id, data }: { id: string; data: GrowthData }) {
  const job = data.automation.jobs.find(row => row.id === id), creative = data.social.data.find(row => row.id === id)
  if (!job) return null
  return <div className={styles.notice}><div><strong>{job.angle} · {job.batchId}</strong><p>{creative?.availability}{job.error ? ` · ${job.error}` : ''}</p>
    {creative?.availability === 'READY' && <><a className={styles.primary} href={`/api/owner/media/${id}/video?download=1`}>Download MP4</a><ActionForm endpoint={`/api/owner/pin/${id}`}><input type="hidden" name="pinned" value={job.pinned ? 'no' : 'yes'} /><button type="submit">{job.pinned ? 'Pinned — unpin' : 'Keep / pin'}</button></ActionForm></>}
  </div></div>
}
