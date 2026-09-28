/** The CLI has awaited all media writes, state commits and scratch cleanup.
 * Flush its final report and exit even if a third-party renderer left a handle.
 * Otherwise a finished worker can retain the workflow's daily concurrency lock.
 */
export function finishWorker(report, exitCode) {
  process.stdout.write(`${JSON.stringify(report)}\n`, () => process.exit(exitCode))
}
