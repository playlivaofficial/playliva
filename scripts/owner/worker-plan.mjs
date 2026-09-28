export const JOBS_PER_WORKER = 3

/** Allocate only actual queued jobs, after daily reconciliation. */
export function workerPlan(count) {
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid queued job count.')
  const workers = Math.max(1, Math.ceil(count / JOBS_PER_WORKER))
  if (workers > 256) throw new Error('Social queue exceeds the bounded workflow matrix limit.')
  return { hasJobs: count > 0, slots: Array.from({ length: workers }, (_, index) => index), expectedJobs: count }
}
