import {discoveryEntries,relatedDiscovery,entityContent} from '@/lib/discovery/catalog'
import {discoveryCopy} from '@/lib/discovery/copy'
import {catalogCopy} from '@/lib/catalog/copy'
import {catalogLocale} from '@/lib/catalog/metadata'
import {Section,SectionHeading} from '@/components/section'
import {LocaleLink} from '@/components/locale-link'
export function AlternativeFormats({slug,segment}:{slug:string;segment:string}){
 const locale=catalogLocale(segment),entries=discoveryEntries(locale),entry=entries.find(g=>g.kind==='provider'&&g.slug===slug),c=discoveryCopy(locale),labels=catalogCopy(locale)
 if(!entry)return null
 const alternatives=relatedDiscovery(entry,entries,'provider')
 return <Section className="border-t border-border" data-alternative-formats><SectionHeading title={c.similar} description={labels.similarIntro}/><div className="grid gap-5 md:grid-cols-3">{alternatives.map(game=><article key={game.href} className="rounded-xl border border-border p-5"><h2 className="text-lg font-semibold"><LocaleLink href={game.href} className="text-primary">{game.title} →</LocaleLink></h2><p className="mt-3 text-sm text-muted-foreground">{game.provider} · {game.categoryLabel}</p><p className="mt-3 leading-relaxed text-muted-foreground">{entityContent(game.slug,locale)?.mechanics}</p><p className="mt-3 text-sm text-muted-foreground">{locale==='pt-BR'?`A ligação com ${entry.title} é o formato ${entry.categoryLabel.toLowerCase()}; as regras acima mostram a mecânica desta alternativa.`:locale==='es-MX'?`La relación con ${entry.title} es el formato ${entry.categoryLabel.toLowerCase()}; las reglas anteriores describen la mecánica de esta alternativa.`:`The connection with ${entry.title} is the ${entry.categoryLabel.toLowerCase()} format; the rules above describe this alternative’s mechanics.`}</p></article>)}</div></Section>
}
