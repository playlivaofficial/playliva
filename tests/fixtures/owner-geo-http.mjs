import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { randomBytes, scryptSync } from 'node:crypto'
import { JSDOM } from 'jsdom'

export async function ownerGeoHttpFixture() {
  const password = randomBytes(24).toString('hex'), salt = randomBytes(16).toString('hex')
  const env = { OWNER_LOCAL_ENABLED: '1', OWNER_DATA_DIR: await mkdtemp(resolve(tmpdir(), 'playliva-geo-http-')),
    OWNER_PASSWORD_HASH: `${salt}:${scryptSync(password, salt, 64).toString('hex')}`, VERCEL: '', OWNER_DATABASE_URL: '', OWNER_REDIS_REST_URL: '', OWNER_REDIS_REST_TOKEN: '' }
  return { env, async verify(base) {
    let cookie = ''
    const post = (path, body, session = cookie) => fetch(base + path, { method: 'POST', headers: { origin: base, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', cookie: session, 'x-vercel-ip-country': 'GE' }, body: JSON.stringify(body) })
    const status = () => fetch(base + '/api/owner/geo-preview', { headers: { cookie, 'x-vercel-ip-country': 'GE' } })
    assert.equal((await status()).status, 401)
    assert.equal((await post('/api/owner/geo-preview', { country: 'BR' })).status, 401)
    const login = await post('/api/owner/login', { password })
    assert.equal(login.status, 200)
    assert.match(login.headers.get('set-cookie'), /HttpOnly/i)
    cookie = login.headers.get('set-cookie').split(';')[0]
    assert.deepEqual(await (await status()).json(), { authorized: true, previewGeo: null, realCountry: 'GE' })
    const checkPage = async (path, session, eligible, ownerExpected) => {
      const response = await fetch(base + path, { headers: { cookie: session, 'x-vercel-ip-country': 'GE' } })
      assert.equal(response.status, 200, path)
      assert.match(response.headers.get('cache-control'), /private|no-store/, path)
      const dom = new JSDOM(await response.text()), doc = dom.window.document
      assert.equal(Boolean(doc.querySelector('a[href^="/go?"]')), eligible, path)
      assert.equal(Boolean(doc.querySelector('[aria-label="Owner GEO preview"]')), ownerExpected, path)
      dom.window.close()
    }
    await checkPage('/pt-br', cookie, false, true)
    assert.equal((await post('/api/owner/geo-preview', { country: 'BR' })).status, 200)
    for (const path of ['/pt-br', '/pt-br/offers', '/pt-br/play/crash', '/en/play/mines', '/pt-br/games/aviator', '/pt-br/where-to-play/aviator']) await checkPage(path, cookie, true, true)
    // The exact same URL fetched anonymously after owner rendering cannot inherit preview.
    await checkPage('/pt-br', '', false, false)
    await checkPage('/pt-br/offers?geo=BR&preview=BR', 'previewGeo=BR', false, false)
    const redirect = () => fetch(base + '/go?operator=betsson-group-affiliates&country=BR&language=pt-BR&placement=homepage_banner', { headers: { cookie, 'x-vercel-ip-country': 'GE' }, redirect: 'manual' })
    assert.match((await redirect()).headers.get('location'), /betsson\.bet\.br/)
    assert.equal((await post('/api/events', {}, cookie + '; playliva_analytics=granted')).status, 204)
    assert.equal((await post('/api/owner/geo-preview', { country: 'MX' })).status, 200)
    await checkPage('/pt-br/offers', cookie, false, true)
    assert.equal((await post('/api/owner/geo-preview', { country: null })).status, 200)
    await checkPage('/pt-br/play/crash', cookie, false, true)
    assert.doesNotMatch((await redirect()).headers.get('location'), /betsson\.bet\.br/)
    await post('/api/owner/geo-preview', { country: 'BR' })
    assert.equal((await post('/api/owner/logout', {})).status, 200)
    assert.equal((await status()).status, 401)
    await checkPage('/pt-br', cookie, false, false)
    console.log('Owner GEO HTTP checks passed: login, BR/MX/reset, public isolation, redirects, QA events and logout.')
  } }
}
