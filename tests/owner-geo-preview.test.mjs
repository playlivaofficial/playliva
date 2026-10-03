import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { scryptSync } from 'node:crypto'
import { NextRequest } from 'next/server.js'
import auth from '../lib/owner/server/auth.ts'
import store from '../lib/owner/server/store.ts'
import geo from '../lib/owner/server/geo-preview.ts'
import real from '../lib/visitor-market.ts'
import endpoint from '../app/api/owner/geo-preview/route.ts'
import outbound from '../app/go/route.ts'
import { testDestinations } from './fixtures/affiliate-destinations.mjs'

test('owner GEO authorization, isolation, redirects, reset, expiry and revocation', async () => {
  const saved = { ...process.env }
  process.env.OWNER_LOCAL_ENABLED = '1'
  process.env.OWNER_DATA_DIR = await mkdtemp(resolve(tmpdir(), 'playliva-geo-'))
  for (const key of ['VERCEL', 'OWNER_DATABASE_URL', 'OWNER_REDIS_REST_URL']) delete process.env[key]
  const password = 'isolated-preview-test-password', salt = 'abcdef0123456789abcdef0123456789'
  process.env.OWNER_PASSWORD_HASH = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
  process.env.PLAYLIVA_AFFILIATE_DESTINATIONS = JSON.stringify(testDestinations)
  const origin = 'http://localhost:3000'
  const headers = token => new Headers({ 'x-vercel-ip-country': 'GE', ...(token ? { cookie: `${auth.ownerCookie()}=${token}` } : {}) })
  const request = (token, country, extra = {}, query = '') => new Request(origin + '/api/owner/geo-preview' + query, {
    method: 'POST', headers: { ...Object.fromEntries(headers(token)), origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', ...extra }, body: JSON.stringify({ country }),
  })
  const go = h => outbound.GET(new NextRequest(origin + '/go?operator=betsson-group-affiliates&country=CO&language=pt-BR&placement=homepage_banner', { headers: h }))
  try {
    assert.equal((await endpoint.GET(new Request(origin, { headers: headers() }))).status, 401)
    assert.equal((await endpoint.POST(request(undefined, 'CO'))).status, 401)
    const token = await auth.login(password), other = await auth.login(password), h = headers(token)
    assert.deepEqual(await geo.ownerGeoStatus(h), { authorized: true, previewGeo: null, realCountry: 'GE' })
    for (const extra of [{ origin: 'https://evil.invalid' }, { origin: '' }, { 'sec-fetch-site': 'cross-site' }]) assert.equal((await endpoint.POST(request(token, 'CO', extra))).status, 403)
    for (const country of ['BR', 'GE', 'ES', 'PT', 'ZA', '', 'real', true, {}, ['CO']]) assert.equal((await endpoint.POST(request(token, country))).status, 400)
    assert.equal((await endpoint.POST(request(token, 'CO', {}, '?geo=CO'))).status, 403)
    assert.equal((await endpoint.POST(request(token, 'x'.repeat(200)))).status, 413)
    const before = (await store.readOwnerState()).sessions[auth.hashToken(token)].expiresAt
    const response = await endpoint.POST(request(token, 'CO'))
    assert.equal(response.status, 200)
    assert.match(response.headers.get('cache-control'), /private, no-store/)
    assert.equal(response.headers.get('vary'), 'Cookie')
    assert.equal(response.headers.get('set-cookie'), null, 'no new public cookie or longer credential lifetime')
    assert.equal((await store.readOwnerState()).sessions[auth.hashToken(token)].expiresAt, before)
    // A deprecated preview value in an old durable session cannot reactivate BR.
    await store.updateOwnerState(state => { state.sessions[auth.hashToken(token)].previewGeo = 'BR' })
    assert.equal((await geo.ownerGeoStatus(h)).previewGeo, null)
    await geo.setOwnerPreviewGeo(token, 'CO')
    assert.equal(await geo.commercialMarket(h), 'CO')
    assert.equal(real.visitorMarket(h), null, 'real visitor GEO remains Georgia')
    assert.equal(await geo.commercialMarket(headers(other)), null, 'other owner browser session is isolated')
    assert.ok((await go(h)).headers.get('location').startsWith(origin), 'no campaign is invented for an owner preview')
    const forged = headers(); forged.set('cookie', 'commercialGeo=CO; previewGeo=CO'); forged.set('x-owner-preview', 'CO')
    assert.equal(await geo.commercialMarket(forged), null)
    assert.ok((await go(forged)).headers.get('location').startsWith(origin))
    const duplicate = headers(token); duplicate.append('cookie', `; ${auth.ownerCookie()}=${token}`)
    assert.equal(await geo.commercialMarket(duplicate), null)
    assert.equal(await geo.commercialMarket(headers(token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'))), null)
    for (const country of ['MX', 'CO', 'PE']) {
      assert.equal((await endpoint.POST(request(token, country))).status, 200)
      assert.equal(await geo.commercialMarket(h), country)
    }
    assert.ok((await go(h)).headers.get('location').startsWith(origin))
    assert.equal((await endpoint.POST(request(token, null))).status, 200)
    assert.equal(await geo.commercialMarket(h), null)
    assert.ok((await go(h)).headers.get('location').startsWith(origin))
    for (const value of ['BR', 'MX', 'CO', 'PE', 'GE', 'US', '']) {
      const publicHeaders = new Headers({ 'x-vercel-ip-country': value })
      assert.equal(await geo.commercialMarket(publicHeaders), real.visitorMarket(publicHeaders))
    }
    await geo.setOwnerPreviewGeo(token, 'CO')
    await store.updateOwnerState(state => { state.sessions[auth.hashToken(token)].expiresAt = Date.now() - 1 })
    assert.equal(await geo.commercialMarket(h), null)
    assert.equal((await endpoint.POST(request(token, 'CO'))).status, 401)
    await geo.setOwnerPreviewGeo(other, 'CO')
    await Promise.all([geo.setOwnerPreviewGeo(other, 'MX'), auth.revokeSession(other)])
    assert.equal(await geo.commercialMarket(headers(other)), null)
    const rotated = await auth.login(password)
    await geo.setOwnerPreviewGeo(rotated, 'CO')
    process.env.OWNER_PASSWORD_HASH += '0'
    assert.equal(await geo.commercialMarket(headers(rotated)), null)
    delete process.env.OWNER_PASSWORD_HASH
    assert.equal(await geo.commercialMarket(headers(rotated)), null)
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]
    Object.assign(process.env, saved)
  }
})
