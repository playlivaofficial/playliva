import Link from 'next/link'
import type { GrowthData } from '@/lib/owner/server/overview'
import { ActionForm } from './actions'
import styles from './owner.module.css'

const time = (value?: string | null) => value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tbilisi' }).format(new Date(value)) : 'Not scheduled'
export function GenerationPanel({ data }: { data: GrowthData }) {
  const auto = data.automation, jobs = auto.jobs
  return <section className={styles.panel} aria-label="Social automation"><header className={styles.panelHeader}><div><h2>Social generation</h2><p>Universal PT-BR masters · review, keep and download · no automatic publication</p></div><span className={styles.badge}>{auto.armed ? 'Armed' : 'Canary required'}</span></header>
    <div className={styles.miniMetrics}>
      <div className={styles.metric}><span>Next generation · Tbilisi</span><strong style={{ fontSize: '1.1rem' }}>{time(auto.nextDueAt)}</strong><small>09:00 · every 72 hours</small></div>
      <div className={styles.metric}><span>Expected batch</span><strong>{data.catalog.length * 3}</strong><small>{data.catalog.length} games × 3 different angles</small></div>
      <div className={styles.metric}><span>Private masters available</span><strong>{jobs.filter(job => job.mediaStatus === 'available').length}</strong><small>{jobs.filter(job => job.pinned).length} pinned · {jobs.filter(job => job.state === 'failed').length} failed jobs</small></div>
      <div className={styles.metric}><span>Media storage</span><strong style={{ fontSize: '1.1rem' }}>{data.privateMedia ? 'Private Blob configured' : 'Not connected'}</strong><small>Latest two completed batches + pinned masters</small></div>
    </div>
    <p className={styles.inlineNote}>Scheduler last seen: {time(auto.lastSchedulerAt)}. Worker last seen: {time(auto.lastWorkerAt)}. The cloud worker runs independently of this dashboard and the owner computer.</p>
    <ActionForm endpoint="/api/owner/generation/batch" confirm={`Queue ${data.catalog.length * 3} new masters for every current game? This uses render compute and private storage. An existing batch will be reused. Nothing will be published.`}><input type="hidden" name="confirmed" value="yes" /><button disabled={!auto.armed || !data.privateMedia} type="submit">Generate batch now</button><small>Queues work for the next cloud worker wake-up.</small></ActionForm>
    {auto.batches.length ? <div className={styles.tableScroll}><table><thead><tr><th>Batch</th><th>State</th><th>Completed / expected</th><th>Failed</th><th>Pinned</th><th>Reviewed</th><th>Action</th></tr></thead><tbody>{auto.batches.map(batch => <tr key={batch.id}><td><Link href={`/owner/growth/social?batch=${batch.id}&period=all`}>{batch.id}</Link><small>{time(batch.createdAt)}</small></td><td>{batch.state}</td><td>{batch.completed} / {batch.expected}</td><td>{batch.failed}</td><td>{jobs.filter(job => job.batchId === batch.id && job.pinned).length}</td><td>{data.social.data.filter(creative => creative.id.startsWith(`${batch.id}-`) && ['approved', 'rejected'].includes(creative.reviewStatus)).length}</td><td><ActionForm endpoint={`/api/owner/generation/retry/${batch.id}`}><button disabled={!batch.failed} type="submit">Retry failed jobs</button></ActionForm></td></tr>)}</tbody></table></div> : <p className={styles.inlineNote}>No generated batches yet. The historical 50 records remain unchanged.</p>}
  </section>
}
export function GeneratedActions({ id, data }: { id: string; data: GrowthData }) {
  const job = data.automation.jobs.find(row => row.id === id)
  if (!job) return null
  return <div className={styles.notice}><div><strong>{job.angle} · {job.batchId}</strong><p>{job.mediaStatus === 'purged' ? 'Media expired / purged. Metadata and review history are retained.' : job.mediaStatus === 'purging' ? 'Retention cleanup is in progress.' : job.mediaStatus === 'available' ? 'Private master ready for preview and download.' : 'Master is not available yet.'}{job.error ? ` ${job.error}` : ''}</p>
    {job.mediaStatus === 'available' && <><a className={styles.primary} href={`/api/owner/media/${id}/video?download=1`}>Download MP4</a><ActionForm endpoint={`/api/owner/pin/${id}`}><input type="hidden" name="pinned" value={job.pinned ? 'no' : 'yes'} /><button type="submit">{job.pinned ? 'Pinned — unpin' : 'Keep / pin'}</button><small>Approval and permanent retention are separate.</small></ActionForm></>}
  </div></div>
}
