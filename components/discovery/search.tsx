'use client'
import {useCountry} from '@/components/country-context'
import {LocaleLink} from '@/components/locale-link'
import {discoveryCopy} from '@/lib/discovery/copy'
import {track} from '@/lib/tracking'
export function DiscoverySearch(){const {locale}=useCountry(),c=discoveryCopy(locale)
 return <div className="my-6 min-w-0" data-discovery-search-entry><form action={`/${locale.toLowerCase()}/games`} method="get" className="flex flex-wrap gap-2" onSubmit={()=>track('discovery_search',{placement:'discovery_entry'})}><label className="min-w-0 flex-1"><span className="sr-only">{c.search}</span><input type="search" name="q" maxLength={100} placeholder={c.search} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground"/></label><button className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground">{c.submit}</button></form><nav aria-label={c.navigation} className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary"><LocaleLink href="/games">{c.explore}</LocaleLink><LocaleLink href="/providers">{c.providers}</LocaleLink><LocaleLink href="/instant-games">{locale==='pt-BR'?'Jogos instantâneos':locale.startsWith('es-')?'Juegos instantáneos':'Instant Games'}</LocaleLink></nav></div>}
