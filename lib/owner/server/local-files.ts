import { readFile, realpath, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'

function assertLocal() {
  if (process.env.OWNER_LOCAL_ENABLED !== '1' || process.env.VERCEL) throw new Error('Local owner files are disabled.')
}
/** These runtime attachments are explicitly NOT deployment dependencies.
 * Tracing them would package private credentials and generated media. The
 * bundler directives implement that boundary; deployment trace tests enforce it.
 * Hosted adapters use server credentials and durable storage instead.
 */
export function readLocalText(path: string) {
  assertLocal()
  return readFile(/* turbopackIgnore: true */ path, 'utf8')
}
export function realLocalPath(path: string) {
  assertLocal()
  return realpath(/* turbopackIgnore: true */ path)
}
export function localFileStat(path: string) {
  assertLocal()
  return stat(/* turbopackIgnore: true */ path)
}
export function localMediaStream(path: string, start: number, end: number) {
  assertLocal()
  return createReadStream(/* turbopackIgnore: true */ path, { start, end })
}
