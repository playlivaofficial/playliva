import { randomBytes, scryptSync } from 'node:crypto'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

if (process.env.VERCEL) throw new Error('Local setup cannot run on Vercel.')
const directory = resolve(process.env.OWNER_DATA_DIR || 'social/output/owner-growth')
await mkdir(directory, { recursive: true })
const auth = resolve(directory, 'auth.json')
try { await access(auth); console.log('Local owner credentials already exist; preserved.'); process.exit(0) } catch {}
const password = randomBytes(24).toString('base64url'), salt = randomBytes(16).toString('hex')
await writeFile(auth, JSON.stringify({ passwordHash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}` }), { mode: 0o600, flag: 'wx' })
await writeFile(resolve(directory, 'local-access.txt'), `Local PlayLiva owner review\nPassword: ${password}\n\nStart with OWNER_LOCAL_ENABLED=1, bound to 127.0.0.1.\nThis file is ignored by Git. Never upload it.\n`, { mode: 0o600, flag: 'wx' })
console.log('Created local owner credentials in ignored social/output/owner-growth/local-access.txt. No secret printed.')
