import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

async function filesIn(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) result.push(...await filesIn(path)); else result.push(path)
  }
  return result
}
const privatePattern = /(?:social\/output\/|social\/\.tmp\/|\.youtube-oauth\/|\/\.env(?:\.|$))/
const traces = (await filesIn('.next/server/app')).filter(file => file.endsWith('.nft.json'))
for (const file of traces) {
  const trace = JSON.parse(await readFile(file, 'utf8'))
  assert.ok(!trace.files.some(path => privatePattern.test(path.replaceAll('\\', '/'))), 'Private runtime files must not appear in any deployment trace')
}
const clients = (await filesIn('.next/static/chunks')).filter(file => file.endsWith('.js'))
let clientBytes = 0
for (const file of clients) {
  const text = await readFile(file, 'utf8'); clientBytes += (await stat(file)).size
  for (const value of ['OWNER_PASSWORD_HASH', 'OWNER_DATABASE_URL', 'BLOB_READ_WRITE_TOKEN', 'OWNER_REDIS_REST_TOKEN', 'OWNER_YOUTUBE_REFRESH_TOKEN', 'OWNER_SEARCH_REFRESH_TOKEN', 'local-access.txt', 'qa-fixture']) assert.ok(!text.includes(value), `Server-only boundary failed for ${value}`)
}
const changes = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean)
const allowedTracked = new Set(['README.md', 'app/robots.ts', 'middleware.ts', 'next.config.mjs', 'package.json', 'pnpm-lock.yaml', 'scripts/social/secret-scan.mjs'])
assert.ok(changes.every(path => allowedTracked.has(path)), `Unrelated tracked file changed: ${changes.filter(path => !allowedTracked.has(path)).join(', ')}`)
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split(/\r?\n/)
assert.ok(!tracked.some(path => /social\/output\/|\.youtube-oauth\//.test(path)))
console.log(JSON.stringify({ deploymentTracesChecked: traces.length, clientChunksChecked: clients.length, totalClientAssetBytes: clientBytes, privateRuntimeFilesBundled: 0, ownerSecretNamesInClient: 0, publicGameAndLocaleFilesChanged: 0 }))
