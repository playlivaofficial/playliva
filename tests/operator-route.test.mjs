import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React from 'react'
import { registration } from './fixtures/commercial.mjs'

const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = {}' }
  return next(url, context)
} })
const imported = await import('../app/[locale]/operators/[slug]/page.tsx')
const page = imported.generateMetadata ? imported : imported.default
hooks.deregister()
const params = (locale, slug = 'test-partner') => ({ params: Promise.resolve({ locale, slug }) })
const notFound = error => error.digest === 'NEXT_HTTP_ERROR_FALLBACK;404'

test('operator routes remain dynamic with an empty approval registry and return pending/missing 404s', async () => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  try {
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = '[]'
    assert.equal(page.dynamic, 'force-dynamic', 'request-dependent operator routes must not attempt empty-inventory static generation')
    for (const locale of ['en', 'pt-br', 'es-mx', 'es-co', 'es-pe']) {
      await assert.rejects(() => page.default(params(locale, 'missing-operator')), notFound)
      assert.equal((await page.generateMetadata(params(locale, 'missing-operator'))).robots.index, false)
    }
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([registration('MX', { approved: false })])
    await assert.rejects(() => page.default(params('es-mx')), notFound)
    assert.equal((await page.generateMetadata(params('es-mx'))).robots.index, false)
  } finally {
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
  }
})

test('operator approval and revocation are read at request time in the exact locale market', async () => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY, previousReact = globalThis.React
  globalThis.React = React
  try {
    for (const geo of ['MX', 'CO', 'PE']) {
      const locale = `es-${geo.toLowerCase()}`
      process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([registration(geo)])
      const rendered = await page.default(params(locale))
      assert.equal(rendered.props.operator.id, `test-${geo.toLowerCase()}`)
      assert.deepEqual(rendered.props.operator.countries, [geo])
      const metadata = await page.generateMetadata(params(locale))
      assert.equal(metadata.robots.index, true)
      assert.equal(metadata.alternates.canonical, `https://www.playliva.com/${locale}/operators/test-partner`)
      for (const other of ['MX', 'CO', 'PE'].filter(value => value !== geo)) {
        await assert.rejects(() => page.default(params(`es-${other.toLowerCase()}`)), notFound)
      }
      process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([registration(geo, { active: false })])
      await assert.rejects(() => page.default(params(locale)), notFound)
      assert.equal((await page.generateMetadata(params(locale))).robots.index, false)
    }
  } finally {
    if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY
    else process.env.PLAYLIVA_COMMERCIAL_REGISTRY = previous
    if (previousReact === undefined) delete globalThis.React
    else globalThis.React = previousReact
  }
})
