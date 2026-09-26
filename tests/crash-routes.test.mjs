import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import copyModule from '../lib/originals/crash/copy.ts'
import definitionModule from '../lib/originals/crash/definition.ts'
import seoModule from '../lib/seo.ts'
import localeModule from '../lib/locale.ts'
import sitemapModule from '../app/sitemap.ts'
const { crashCopy, parseAutoInput } = copyModule
const { ISLAND_CRASH } = definitionModule
const { LOCALE_SEGMENTS, segmentToLocale } = localeModule

test('Crash has complete original copy and reciprocal canonical/hreflang for all locales', () => {
  for (const segment of LOCALE_SEGMENTS) {
    const locale = segmentToLocale(segment), copy = crashCopy(locale)
    assert.deepEqual(Object.keys(copy), Object.keys(crashCopy('en')))
    assert.deepEqual(Object.keys(copy.errors), Object.keys(crashCopy('en').errors))
    assert.doesNotMatch(JSON.stringify(copy), /JetX|Aviator|SmartSoft|SPRIBE|Robinson Crusoe|\bFriday\b/i)
    const metadata = seoModule.pageMetadata({ title: ISLAND_CRASH.title[locale], description: copy.description, path: '/play/crash', localeSegment: segment })
    assert.ok(metadata.alternates.canonical.endsWith(`/${segment}/play/crash`))
    for (const alternate of LOCALE_SEGMENTS) assert.ok(metadata.alternates.languages[alternate].endsWith(`/${alternate}/play/crash`))
    assert.ok(metadata.alternates.languages['x-default'].endsWith('/pt-br/play/crash'))
  }
})
test('only the twelve implemented Originals subroutes enter the sitemap', () => {
  const urls = sitemapModule.default().map(entry => new URL(entry.url).pathname).filter(path => /\/play\//.test(path))
  assert.deepEqual(urls.sort(), ['en', 'es-mx', 'pt-br'].flatMap(locale => ['blackjack', 'capybara-gold', 'carnaval-gold', 'crash', 'golaco', 'liva-21-brasil', 'liva-ginga', 'liva-raio', 'mines', 'roulette', 'samba-drop', 'skuptu-levanta'].map(slug => `/${locale}/play/${slug}`)))
})
test('manual auto cashout input supports localized decimals without silently rounding', () => {
  assert.equal(parseAutoInput('2.47'), 247)
  assert.equal(parseAutoInput('2,47'), 247)
  assert.equal(parseAutoInput('2.4'), 240)
  for (const value of ['2.471', '-1', 'NaN', '1e2', '2,4.7', '']) assert.ok(Number.isNaN(parseAutoInput(value)))
})
test('renderer imports and character URLs stay inside the Crash integration', async () => {
  const game = await readFile(new URL('../components/originals/crash/crash-game.tsx', import.meta.url), 'utf8')
  assert.match(game, /import\('\.\/island-scene'\)/)
  assert.match(game, /<DemoSessionProvider>/)
  assert.match(game, /<PlayGameShell/)
  assert.match(game, /<Image src=\{ISLAND_CRASH_POSTER\}[^>]*priority/)
  assert.match(game, /<CrashAction round=\{round\} locale=\{locale\} loaded=\{load === 'ready'\}/)
  const action = await readFile(new URL('../components/originals/crash/crash-action.tsx', import.meta.url), 'utf8')
  assert.match(action, /disabled=\{round.phase !== 'ready' \|\| !loaded\}/)
  for (const path of ['app/layout.tsx', 'app/[locale]/layout.tsx', 'components/play-view.tsx']) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /island-scene|from .three[\x27\x22/]|originals\/crash/)
  }
})
test('the route-only action surface is never covered by the fixed mobile nav', async () => {
  const source = await readFile(new URL('../components/mobile-bottom-nav.tsx', import.meta.url), 'utf8')
  assert.match(source, /activePath === ['"]\/play\/crash['"]\) return null/)
  assert.doesNotMatch(source, /activePath\.startsWith\(['"]\/play['"]\).*return null/s)
})
