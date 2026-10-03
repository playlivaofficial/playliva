import {discoveryEntries} from '@/lib/discovery/catalog'
import {queryDirectory,type DirectoryParams} from '@/lib/discovery/query'
import {discoveryCopy} from '@/lib/discovery/copy'
import {catalogCopy} from '@/lib/catalog/copy'
import {CatalogCard} from '@/components/catalog/catalog-card'
import {LocaleLink} from '@/components/locale-link'
import {JsonLd} from '@/components/json-ld'
import {discoveryListSchema} from '@/lib/discovery/schema'
import {DiscoveryEvents} from './events'
import type {Locale} from '@/lib/types'
import styles from '@/components/catalog/catalog.module.css'
export function GameDirectory({locale,segment,params}:{locale:Locale;segment:string;params:DirectoryParams}){
 const entries=discoveryEntries(locale),result=queryDirectory(entries,params),c=discoveryCopy(locale),labels=catalogCopy(locale)
 const categories=[...new Map(entries.map(g=>[g.category,g.categoryLabel])).entries()],providers=[...new Map(entries.map(g=>[g.providerId,g.provider])).entries()].sort((a,b)=>a[1].localeCompare(b[1]))
 const instantFormats:Record<string,string>={plinko:'Plinko',mines:locale==='en'?'Mines':'Minas',dice:locale==='en'?'Dice':'Dados',keno:'Keno',racing:locale==='pt-BR'?'Corrida · habilidade':locale==='es-MX'?'Carreras · habilidad':'Racing · skill'}
 const formats=[...new Map(entries.map(g=>[g.format,instantFormats[g.format]??(g.format==='blackjack'?c.blackjack:g.format==='roulette'?c.roulette:g.categoryLabel)])).entries()]
 const hidden=Object.entries(params).filter(([key,value])=>key!=='page'&&value)
 return <DiscoveryEvents surface="directory"><div data-game-directory>
  <p className="mb-5 max-w-3xl text-muted-foreground">{c.intro}</p>
  <form action={`/${segment}/games`} method="get" className={styles.tools} data-discovery-search>
   <label className={styles.search}>{labels.search}<input className="rounded-md border border-border bg-background px-3 py-3 text-foreground" type="search" name="q" maxLength={100} defaultValue={params.q} /></label>
   <label>{labels.category}<select name="category" defaultValue={params.category||''}><option value="">{labels.all}</option>{categories.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <label>{labels.provider}<select name="provider" defaultValue={params.provider||''}><option value="">{labels.allProviders}</option>{providers.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <label>{c.kind}<select name="kind" defaultValue={params.kind||''}><option value="">{c.all}</option><option value="provider">{c.provider}</option><option value="original">{c.original}</option></select></label>
   <label>{c.format}<select name="format" defaultValue={params.format||''}><option value="">{c.any}</option>{formats.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <button className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground" type="submit">{c.submit}</button>
  </form>
  <div className={styles.resultLine}><p role="status">{result.total} {labels.results} · {params.q?c.relevance:labels.sort}</p><LocaleLink href="/games">{labels.clear}</LocaleLink><LocaleLink href="/providers">{c.providers} →</LocaleLink></div>
  {result.items.length?<div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-directory-results>{result.items.map(game=><CatalogCard key={game.href} game={game} readLabel={game.kind==='original'?c.play:c.view}/>)}</div>:<p className={styles.empty}>{labels.empty}</p>}
  {result.pages>1&&<form action={`/${segment}/games`} method="get" className={styles.pagination} aria-label={labels.page}>{hidden.map(([key,value])=><input key={key} type="hidden" name={key} value={value}/>)}<button name="page" value={result.page-1} disabled={result.page===1}>{labels.previous}</button><span>{labels.page} {result.page} {labels.of} {result.pages}</span><button name="page" value={result.page+1} disabled={result.page===result.pages}>{labels.next}</button></form>}
  <details className="mt-8 rounded-xl border border-border p-5"><summary className="cursor-pointer font-semibold">{c.original} · {entries.filter(g=>g.kind==='original').length}</summary><p className="my-3 text-sm text-muted-foreground">{c.crossNote}</p><div className="flex flex-wrap gap-x-6 gap-y-3 text-primary">{entries.filter(g=>g.kind==='original').map(g=><LocaleLink key={g.href} href={g.href} prefetch={false}>{g.title}</LocaleLink>)}</div></details>
  <JsonLd data={discoveryListSchema(result.items,segment)}/>
 </div></DiscoveryEvents>
}
