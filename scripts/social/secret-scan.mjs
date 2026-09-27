import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'

const forbiddenNames = /(^|\/)(client_secret[^/]*\.json|token\.json|credentials\.json|\.youtube-oauth\/)/i
const secretPatterns = [
  /vercel_blob_rw_[A-Za-z0-9]+_[A-Za-z0-9]{20,}/,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]{8,}@[a-z0-9.-]+\.neon\.tech/i,
  /GOCSPX-[A-Za-z0-9_-]{20,}/,
  /ya29\.[A-Za-z0-9_-]{20,}/,
  /1\/\/[A-Za-z0-9_-]{30,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /"(?:client_secret|refresh_token|access_token)"\s*:\s*"(?!<|\$\{|YOUR_|REDACTED)[^"\s]{8,}"/i,
]
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean)
const failures = []
for (const file of files) {
  const normalized = file.replaceAll('\\', '/')
  if (forbiddenNames.test(normalized)) failures.push(`${file}: forbidden credential filename`)
  if (/\.(?:glb|png|jpe?g|webp|avif|ico|woff2?|mp4)$/i.test(file)) continue
  const source = await readFile(file, 'utf8').catch(() => '')
  for (const pattern of secretPatterns) if (pattern.test(source)) failures.push(`${file}: matches secret pattern ${pattern}`)
}
if (process.argv.includes('--history')) {
  const history = execFileSync('git', ['log', '-p', '--all', '--format='], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
  for (const pattern of secretPatterns) if (pattern.test(history)) failures.push(`git history: matches secret pattern ${pattern}`)
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1) }
console.log(`Secret scan passed (${files.length} tracked and untracked repository files${process.argv.includes('--history') ? ' plus git history' : ''}).`)
