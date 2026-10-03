import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import copyModule from '../lib/originals/mines/copy.ts'
import configModule from '../lib/originals/mines/config.ts'
import referralModule from '../lib/originals/play-real.ts'
import dataModule from '../lib/data.ts'
import seoModule from '../lib/seo.ts'
import sitemapModule from '../app/sitemap.ts'
const source = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
test('Mines integration: complete locale copy, canonical/hreflang, three URLs and no unverified category referral', () => {
  for (const [locale, segment] of [['en','en'],['pt-BR','pt-br'],['es-MX','es-mx']]) {
    const copy = copyModule.minesCopy(locale)
    assert.deepEqual(Object.keys(copy),Object.keys(copyModule.minesCopy('en')))
    assert.ok(Object.values(copy).every(s=>s.trim().length>0))
    for(const key of ['start','count','stake','cash','safe','mine','cashed_out','mine_hit','again','how','loading']) if(locale!=='en') assert.notEqual(copy[key],copyModule.minesCopy('en')[key])
    assert.doesNotMatch(copy.description,/Stake|Spribe|Betsson|certified|provably fair/i)
    const meta=seoModule.pageMetadata({title:configModule.LIVA_MINES.title[locale],description:copy.description,path:'/play/mines',localeSegment:segment})
    assert.ok(meta.alternates.canonical.endsWith(`/${segment}/play/mines`))
    for(const s of ['en','pt-br','es-mx']) assert.ok(meta.alternates.languages[s].endsWith(`/${s}/play/mines`))
    assert.ok(meta.alternates.languages['x-default'].endsWith('/en/play/mines'))
    for(const geo of ['BR','MX','PT','unknown']) assert.deepEqual(referralModule.getPlayRealOptions(geo,configModule.LIVA_MINES.category,locale),[])
  }
  assert.equal(sitemapModule.default().filter(e=>e.url.endsWith('/play/mines')).length,3)
  assert.ok(dataModule.GAMES.every(g=>g.id!==configModule.LIVA_MINES.id), 'Original is never registered as a provider game; existing provider Mines is preserved')
})
test('Mines integration: lightweight discovery in three surfaces, owned art and no heavy/public outcome engine', async () => {
  assert.match(await source('components/play-view.tsx'),/MinesFeature surface="hub"/)
  assert.match(await source('components/originals/island-crash-feature.tsx'),/surface === 'home' && <MinesFeature surface="home"/)
  assert.match(await source('components/category-page-view.tsx'),/slug === 'instant-games' && <MinesDiscoverySection/)
  assert.match(await source('components/mobile-bottom-nav.tsx'),/activePath === '\/play\/mines'\) return null/)
  assert.doesNotMatch(await source('components/originals/mines-feature.tsx'),/import .*engine|import .*mines-game|import .*simulation/)
  assert.match(await source('components/originals/mines/mines-entry.tsx'),/dynamic\(\(\) => import\('\.\/mines-game'\)/)
  assert.doesNotMatch(await source('components/originals/mines/mines-game.tsx'),/wallet\.(credit|debit)|Math\.random|simulation|URLSearchParams|searchParams|three/)
  assert.doesNotMatch(await source('components/originals/mines/mines-board.tsx'),/generateMines|minesPayout|wallet|onComplete|Math\.random|three/)
  assert.match(await source('components/originals/mines/mines.module.css'),/prefers-reduced-motion/)
  const art=new URL('../public/originals/mines/jungle-poster.svg',import.meta.url)
  assert.ok((await stat(art)).size<12000)
  assert.doesNotMatch(await readFile(art,'utf8'),/https?:\/\/(?!www\.w3\.org)|<image|<script/)
})
