// Vercel secrets remain inside the deployment. Local/GitHub builds require no database.
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { provisionAviaDatabase } from './avia-storage-setup.mjs'

export async function aviaBuildPreflight(env, provision = provisionAviaDatabase) {
  if (!env.VERCEL) return false
  if (!env.OWNER_DATABASE_URL) throw Error('Avia requires its existing durable database in Vercel.')
  await provision(env.OWNER_DATABASE_URL)
  return true
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    if (await aviaBuildPreflight(process.env)) console.log('Avia isolated storage preflight passed.')
  } catch {
    console.error('Avia storage preflight failed. Deployment stopped; no credentials are printed.')
    process.exitCode = 1
  }
}
