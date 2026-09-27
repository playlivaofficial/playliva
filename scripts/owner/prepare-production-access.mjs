import { randomBytes, scryptSync } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const folder = resolve('social/output/owner-growth/production-setup')
await mkdir(folder, { recursive: true })
const password = randomBytes(30).toString('base64url'), salt = randomBytes(16).toString('hex')
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
// Exclusive creation prevents a retry from rotating a live owner's password.
await writeFile(resolve(folder, 'owner-access.txt'), `PlayLiva production owner credential\nPassword: ${password}\nStore this in your password manager. Never commit or share this file.\n`, { flag: 'wx', mode: 0o600 })
await writeFile(resolve(folder, 'owner-env.json'), JSON.stringify({ OWNER_PASSWORD_HASH: passwordHash, OWNER_ORIGIN: 'https://www.playliva.com' }), { flag: 'wx', mode: 0o600 })
console.log('Production credential prepared in the ignored production-setup folder. No secret was printed or deployed.')
