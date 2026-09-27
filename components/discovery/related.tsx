import {discoveryEntries,relatedDiscovery} from '@/lib/discovery/catalog'
import {discoveryCopy} from '@/lib/discovery/copy'
import {CatalogCard} from '@/components/catalog/catalog-card'
import {LocaleLink} from '@/components/locale-link'
import {Section,SectionHeading} from '@/components/section'
import {catalogLocale} from '@/lib/catalog/metadata'
import {ENTITY_SOURCES} from '@/lib/discovery/entity-copy'
import {getReferenceGame} from '@/lib/catalog'
import {DiscoveryEvents} from './events'
export function CrossDiscovery({slug,segment,original=false}:{slug:string;segment:string;original?:boolean}){
 const locale=catalogLocale(segment),entries=discoveryEntries(locale),entry=entries.find(g=>g.slug===slug&&g.kind===(original?'original':'provider')),c=discoveryCopy(locale)
 if(!entry)return null
 const real=relatedDiscovery(entry,entries,'provider'),own=relatedDiscovery(entry,entries,'original')
 const sameProvider=original?[]:entries.filter(g=>g.kind==='provider'&&g.providerId===entry.providerId&&g.slug!==slug&&!real.some(r=>r.slug===g.slug)).slice(0,3)
 return <DiscoveryEvents surface={original?'original':'entity'}><div data-cross-discovery={slug}>
  {[{title:c.similar,items:real},{title:c.sameProvider,items:sameProvider},{title:c.own,items:original?[]:own}].filter(group=>group.items.length).map(group=><Section key={group.title} className="border-t border-border"><SectionHeading title={group.title} description={c.crossNote}/><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{group.items.map(game=><CatalogCard key={game.href} game={game} readLabel={game.kind==='original'?c.play:c.view}/>)}</div></Section>)}
  {!original&&!getReferenceGame(slug)&&ENTITY_SOURCES[slug]&&<Section className="pt-0 text-sm text-muted-foreground"><a href={ENTITY_SOURCES[slug]} rel="noopener noreferrer" target="_blank" className="text-primary underline">{locale==='pt-BR'?'Documentação do provedor':locale==='es-MX'?'Documentación del proveedor':'Provider documentation'}: {entry.title}</a></Section>}
  <Section className="pt-0"><nav aria-label={c.navigation} className="flex flex-wrap gap-5 text-primary"><LocaleLink href={`/${entry.category}`}>{entry.categoryLabel}</LocaleLink>{!original&&<LocaleLink href={`/providers/${entry.providerId}`}>{entry.provider}</LocaleLink>}<LocaleLink href="/games">{c.explore}</LocaleLink></nav></Section>
 </div></DiscoveryEvents>
}
