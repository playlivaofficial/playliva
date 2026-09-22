import { createServer } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import youtube from '../../lib/social/youtube.ts'

const root = resolve(import.meta.dirname, '../..')
const clientPath = process.env.YOUTUBE_OAUTH_CLIENT_FILE
if (!clientPath) throw new Error('Set YOUTUBE_OAUTH_CLIENT_FILE to an ignored Google OAuth desktop-client JSON file')
const raw = JSON.parse(await readFile(resolve(root, clientPath), 'utf8'))
const client = raw.installed ?? raw.web
if (!client?.client_id || !client?.client_secret) throw new Error('OAuth client JSON is missing client_id/client_secret')
const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI ?? 'http://127.0.0.1:53682'
const redirect = new URL(redirectUri)
if (redirect.protocol !== 'http:' || redirect.hostname !== '127.0.0.1' || !redirect.port || redirect.pathname !== '/') {
  throw new Error('YOUTUBE_OAUTH_REDIRECT_URI must be a loopback URI like http://127.0.0.1:53682')
}
const state = randomBytes(24).toString('hex')
const codeVerifier = randomBytes(64).toString('base64url')
const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
for (const [key, value] of Object.entries({ client_id: client.client_id, redirect_uri: redirectUri, response_type: 'code',
  scope: youtube.YOUTUBE_OAUTH_SCOPES, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'false', state,
  code_challenge: codeChallenge, code_challenge_method: 'S256' })) auth.searchParams.set(key, value)
console.log(`Open this official Google authorization URL after action-time approval:\n${auth}`)

const result = await new Promise((success, failure) => {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, redirectUri)
      if (url.pathname !== redirect.pathname) { response.writeHead(404).end(); return }
      if (url.searchParams.get('state') !== state) throw new Error('OAuth state mismatch')
      const code = url.searchParams.get('code')
      if (!code) throw new Error(url.searchParams.get('error') ?? 'Authorization code missing')
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: client.client_id, client_secret: client.client_secret, redirect_uri: redirectUri,
          grant_type: 'authorization_code', code_verifier: codeVerifier }) })
      if (!tokenResponse.ok) throw new Error(`OAuth token exchange failed (${tokenResponse.status})`)
      const token = await tokenResponse.json()
      if (!token.access_token || !token.refresh_token) throw new Error('OAuth response is missing an access or refresh token')
      const channelResponse = await fetch(youtube.YOUTUBE_CHANNEL_ENDPOINT, { headers: { Authorization: `Bearer ${token.access_token}` } })
      if (!channelResponse.ok) throw new Error(`Could not verify the authorized YouTube channel (${channelResponse.status}): ${(await channelResponse.text()).slice(0, 300)}`)
      const channel = youtube.authorizedChannel(await channelResponse.json())
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(`PlayLiva YouTube authorization completed for ${channel.title}. You may close this tab.`)
      server.close(); success(token)
    } catch (error) { response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Authorization failed. Return to the terminal.'); server.close(); failure(error) }
  })
  server.listen(Number(redirect.port), '127.0.0.1')
})
const tokenPath = resolve(root, '.youtube-oauth/token.json')
await mkdir(resolve(root, '.youtube-oauth'), { recursive: true })
await writeFile(tokenPath, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 })
try { await chmod(tokenPath, 0o600) } catch { /* Windows ACLs are managed outside Node mode bits. */ }
console.log('Authorization stored in ignored .youtube-oauth/token.json. No token was printed.')
