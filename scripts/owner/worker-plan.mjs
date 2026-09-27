export const JOBS_PER_WORKER = 3

/** Each sequential cloud job gets a small bounded share of the durable queue. */
export function workerPlan(automation, mode, expectedBatchSize, now, isDue) {
  if (!['due', 'canary', 'arm', 'retry', 'cleanup-dry-run'].includes(mode)) throw new Error('Unsupported worker mode.')
  const jobs = Object.values(automation.jobs)
  let count = 0
  if (mode === 'canary') {
    const batch = automation.batches.find(row => row.kind === 'canary')
    count = batch ? jobs.filter(row => row.batchId === batch.id && row.state === 'queued').length : 1
  } else if (mode === 'due' || mode === 'retry') {
    count = jobs.filter(row => row.state === 'queued' || (mode === 'retry' && row.state === 'failed' && row.attempts < 3)).length
    const active = automation.batches.some(row => row.kind === 'scheduled' && ['queued', 'running', 'partial', 'failed'].includes(row.state))
    if (!active && isDue(automation, now)) count += expectedBatchSize
  }
  const workers = Math.max(1, Math.ceil(count / JOBS_PER_WORKER))
  if (workers > 256) throw new Error('Social queue exceeds the bounded workflow matrix limit.')
  return { hasJobs: count > 0, slots: Array.from({ length: workers }, (_, index) => index), expectedJobs: count }
}
