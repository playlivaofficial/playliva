// Server projection: full editorial copy never crosses the directory client boundary.
import { catalogSummaries, getReferenceGame } from '@/lib/catalog'
import { GAMES } from '@/lib/data'
import { getGameContent, getCategoryName } from '@/lib/content'
import { SPOTLIGHT_GAMES } from '@/lib/home/spotlight'
import { normalizeSearch } from '@/lib/catalog/query'
import type { CatalogSummary } from '@/lib/catalog/types'
import type { CategorySlug, Locale } from '@/lib/types'

export interface DiscoveryEntry extends CatalogSummary { kind: 'provider' | 'original'; href: string; aliases: string[]; format: string }
const originalCategories: Record<string, CategorySlug> = {
  crash: 'crash', 'liva-ginga': 'crash', 'skuptu-levanta': 'crash',
  'capybara-gold': 'slots', golaco: 'slots', 'carnaval-gold': 'slots',
  blackjack: 'table-games', roulette: 'table-games', 'liva-raio': 'table-games', 'liva-21-brasil': 'table-games',
  mines: 'instant-games', 'samba-drop': 'instant-games',
}
export const originalCategory = (slug: string) => originalCategories[slug]
export function gameFormat(slug: string, category: CategorySlug) {
  if (/blackjack|21-brasil/.test(slug)) return 'blackjack'
  if (/roulette|liva-raio/.test(slug)) return 'roulette'
  if (slug === 'plinko' || slug === 'samba-drop') return 'plinko'
  if (slug === 'mines') return 'mines'
  if (slug === 'spribe-dice') return 'dice'
  if (slug === 'spribe-keno') return 'keno'
  return category
}
export function discoveryEntries(locale: Locale): DiscoveryEntry[] {
  const real = catalogSummaries(locale).map(game => ({ ...game, kind: 'provider' as const, href: `/games/${game.slug}`,
    aliases: game.slug === 'book-of-dead' ? ['Book of Dead'] : game.providerId === 'play-n-go' ? ['Play n GO', 'Playngo'] : [], format: gameFormat(game.slug, game.category) }))
  const originals = SPOTLIGHT_GAMES.map(game => {
    const slug=game.playPath.split('/').at(-1)!,category=originalCategory(slug),categoryLabel=getCategoryName(category,locale)
    const title=game.title[locale],summary=locale==='pt-BR'?'Jogue grátis com créditos virtuais, sem depósitos ou valor monetário.':locale==='es-MX'?'Juega gratis con créditos virtuales, sin depósitos ni valor monetario.':'Play free with virtual credits, no deposits or monetary value.'
    return {id:game.id,slug,title,provider:'PlayLiva Original',providerId:'playliva',category,categoryLabel,summary,image:game.poster,artworkLabel:'',reference:false,kind:'original' as const,href:game.playPath,
      aliases:[title.replace(/^Liva /,''),...(slug==='roulette'?['Golden Orbit']:slug==='mines'?['Jungle Gold']:slug==='crash'?['PlayLiva Island Crash']:[])],format:gameFormat(slug,category),searchText:normalizeSearch([title,'PlayLiva Original',category,categoryLabel].join(' '))}
  })
  return [...real,...originals]
}
export function entityContent(slug: string, locale: Locale) {
  const reference=getReferenceGame(slug)
  if(reference){const c=reference.content[locale];return {overview:c.overview,mechanics:c.howItWorks,features:c.features,sources:reference.sources}}
  const game=GAMES.find(g=>g.slug===slug)
  if(!game)return null
  const c=getGameContent(game,locale)
  return {overview:c.whatIsIt||c.about||c.description,mechanics:c.howItWorks?.join(' ')||c.description,features:c.mechanics,sources:[] as string[]}
}
/** Same format first, then category/provider. No popularity or availability inference. */
export function relatedDiscovery(entry: DiscoveryEntry, entries: DiscoveryEntry[], kind: DiscoveryEntry['kind'], limit=3) {
  return entries.filter(g=>g.href!==entry.href&&g.kind===kind&&(g.format===entry.format||g.category===entry.category||entry.category==='live-casino'&&g.category==='table-games'))
    .sort((a,b)=>(Number(b.format===entry.format)*4+Number(b.providerId===entry.providerId))-(Number(a.format===entry.format)*4+Number(a.providerId===entry.providerId))||a.title.localeCompare(b.title)).slice(0,limit)
}
