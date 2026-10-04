import { contentLocale } from '@/lib/locale'
import Image from 'next/image'
import { LocaleLink } from '@/components/locale-link'
import { THREE_GAMES, gamePoster } from '@/lib/originals/three-game-definitions'
import { threeDescription } from '@/lib/originals/three-game-copy'
import { originalLegacyNames } from '@/lib/originals/legacy-names'
import { normalizeSearch } from '@/lib/catalog/query'
import { productCopy } from '@/lib/product-discovery'
import type { Locale } from '@/lib/types'

export function matchingThreeGames(query: string, category: string, provider: string, locale: Locale) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean)
  return THREE_GAMES.filter(game => provider === 'all' && (category === 'all' || category === game.category) && words.every(word => normalizeSearch(`${game.title[contentLocale(locale)]} ${(originalLegacyNames[game.slug] ?? []).join(' ')} PlayLiva Original ${threeDescription(game.slug, locale)} ${game.category}`).includes(word)))
}

/** Playable Originals stay distinct from the provider reference catalog. */
export function ThreeGameSearch({ games, locale }: { games: ReturnType<typeof matchingThreeGames>; locale: Locale }) {
  const copy = productCopy(locale)
  if (!games.length) return null
  return <section className="my-6 space-y-3" data-catalog-originals>
    <h2 className="font-display text-xl font-bold">{locale === 'pt-BR' ? 'Novos PlayLiva Originals' : locale.startsWith('es-') ? 'Nuevos PlayLiva Originals' : 'New PlayLiva Originals'}</h2>
    <p className="text-sm text-muted-foreground">{copy.freeNote}</p>
    <div className="grid gap-3 sm:grid-cols-3">{games.map(game => <LocaleLink key={game.slug} href={`/play/${game.slug}`} prefetch={false} className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary" data-original-search={game.slug}>
      <Image src={gamePoster(game.slug)} alt={game.title[contentLocale(locale)]} width={1200} height={630} sizes="(max-width:640px) 100vw, 400px" className="aspect-[1200/630] w-full object-cover"/>
      <div className="space-y-2 p-4"><h3 className="font-bold">{game.title[contentLocale(locale)]}</h3><p className="text-sm text-muted-foreground">{threeDescription(game.slug, locale)}</p><span className="inline-flex min-h-11 items-center font-semibold text-primary">{copy.play} →</span></div>
    </LocaleLink>)}</div>
  </section>
}
