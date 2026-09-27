import { readLocalText } from './local-files'
import { resolve } from 'node:path'
import { localEnabled } from './store'
export async function googleCredentials(provider: 'youtube' | 'search') {
  if (provider === 'search') {
    const clientId = process.env.OWNER_SEARCH_CLIENT_ID, clientSecret = process.env.OWNER_SEARCH_CLIENT_SECRET, refreshToken = process.env.OWNER_SEARCH_REFRESH_TOKEN
    return clientId && clientSecret && refreshToken ? { clientId, clientSecret, refreshToken } : null
  }
  if (process.env.OWNER_YOUTUBE_CLIENT_ID && process.env.OWNER_YOUTUBE_CLIENT_SECRET && process.env.OWNER_YOUTUBE_REFRESH_TOKEN) return { clientId: process.env.OWNER_YOUTUBE_CLIENT_ID, clientSecret: process.env.OWNER_YOUTUBE_CLIENT_SECRET, refreshToken: process.env.OWNER_YOUTUBE_REFRESH_TOKEN }
  if (!localEnabled()) return null
  try {
    const raw = JSON.parse(await readLocalText(resolve(process.env.YOUTUBE_OAUTH_CLIENT_FILE || '.youtube-oauth/client_secret.json')))
    const client = raw.installed ?? raw.web, token = JSON.parse(await readLocalText(resolve(process.env.YOUTUBE_OAUTH_TOKEN_FILE || '.youtube-oauth/token.json')))
    return client?.client_id && client?.client_secret && token.refresh_token ? { clientId: client.client_id as string, clientSecret: client.client_secret as string, refreshToken: token.refresh_token as string } : null
  } catch { return null }
}
export async function googleAccessToken(provider: 'youtube' | 'search') {
  const config = await googleCredentials(provider)
  if (!config) throw new Error('Google integration is not connected.')
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, refresh_token: config.refreshToken, grant_type: 'refresh_token' }), cache: 'no-store', signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Google authorization is unavailable or expired.')
  const body = await response.json()
  if (typeof body.access_token !== 'string') throw new Error('Google authorization is unavailable.')
  return body.access_token as string
}
export async function googleRead(url: string, token: string, body?: unknown) {
  const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error('Google data is unavailable. Check authorization and API access.')
  return response.json()
}
