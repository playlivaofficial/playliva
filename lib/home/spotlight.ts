import { RAIO, RAIO_POSTER } from '@/lib/originals/raio/definition'
import { BRASIL21, BRASIL21_POSTER } from '@/lib/originals/brasil21/definition'
import { powerCopy } from '@/lib/originals/power-copy'
import type { Locale } from '@/lib/types'
import { THREE_GAMES, gamePoster } from '@/lib/originals/three-game-definitions'
import { ISLAND_CRASH } from '@/lib/originals/crash/definition'
import { CAPYBARA_GOLD } from '@/lib/originals/capybara/definition'
import { LIVA_BLACKJACK } from '@/lib/originals/blackjack/definition'
import { LIVA_ROULETTE } from '@/lib/originals/roulette/config'
import { LIVA_MINES } from '@/lib/originals/mines/config'
import { EMBAIXADINHA, EMBAIXADINHA_POSTER } from '@/lib/originals/embaixadinha/definition'
import { GOLACO, GOLACO_POSTER } from '@/lib/originals/golaco/definition'
import { FOOTBALL_CARDS } from '@/lib/originals/football-cards'
import { ISLAND_CRASH_PLAY_PATH, ISLAND_CRASH_POSTER, originalsDiscoveryCopy } from '@/lib/originals/discovery'
import { capybaraCopy } from '@/lib/originals/capybara/copy'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import { rouletteCopy } from '@/lib/originals/roulette/copy'
import { minesCopy } from '@/lib/originals/mines/copy'
import { productCopy } from '@/lib/product-discovery'

/**
 * Canonical homepage "In the spotlight" catalog.
 *
 * Discovery metadata only: posters, localized labels and the localized play
 * path. Never import an engine, wallet or renderer here. The carousel renders
 * whatever this list contains, in this order, and derives its `01 / N`
 * indicator from its length — adding an Original means adding an entry, not
 * editing the component. Order mirrors the Play hub.
 */
export interface SpotlightGame {
  /** Explicitly disabled entries are excluded from social generation. */
  enabled?: boolean
  /** Original id, e.g. `island-crash`; also the `data-spotlight-game` hook. */
  id: string
  /** Route under `/[locale]/play/`. */
  slug: string
  playPath: string
  title: Record<Locale, string>
  category: Record<Locale, string>
  poster: string
  posterAlt: Record<Locale, string>
  /** Poster art already carries its own headline (e.g. Capybara Gold). */
  posterHasTitle?: boolean
}

const locales: Locale[] = ['en', 'pt-BR', 'es-MX']
const byLocale = <T,>(pick: (locale: Locale) => T): Record<Locale, T> =>
  Object.fromEntries(locales.map((locale) => [locale, pick(locale)])) as Record<Locale, T>

export const SPOTLIGHT_GAMES: readonly SpotlightGame[] = [
  ...THREE_GAMES.map(game=>({id:game.id,slug:game.slug,playPath:`/play/${game.slug}`,title:game.title,category:byLocale(locale=>game.category==='crash'?'Crash':game.category==='slots'?'Slots':locale==='pt-BR'?'Jogos instantâneos':locale==='es-MX'?'Juegos instantáneos':'Instant Games'),poster:gamePoster(game.slug),posterAlt:game.title,posterHasTitle:true})),
  {
    id: ISLAND_CRASH.id, slug: ISLAND_CRASH.slug, playPath: ISLAND_CRASH_PLAY_PATH,
    title: byLocale(() => 'Island Crash'),
    category: byLocale((locale) => originalsDiscoveryCopy(locale).category),
    poster: ISLAND_CRASH_POSTER,
    posterAlt: byLocale((locale) => originalsDiscoveryCopy(locale).posterAlt),
  },
  {
    id: EMBAIXADINHA.id, slug: EMBAIXADINHA.slug, playPath: `/play/${EMBAIXADINHA.slug}`,
    title: byLocale((locale) => EMBAIXADINHA.title[locale]),
    category: byLocale((locale) => FOOTBALL_CARDS.embaixadinha[locale].category),
    poster: EMBAIXADINHA_POSTER,
    posterAlt: byLocale((locale) => FOOTBALL_CARDS.embaixadinha[locale].posterAlt),
  },
  {
    id: CAPYBARA_GOLD.id, slug: CAPYBARA_GOLD.slug, playPath: `/play/${CAPYBARA_GOLD.slug}`,
    title: byLocale((locale) => CAPYBARA_GOLD.title[locale]),
    category: byLocale((locale) => capybaraCopy(locale).category),
    poster: '/originals/capybara-gold/river.webp',
    posterAlt: byLocale((locale) => capybaraCopy(locale).posterAlt),
  },
  {
    id: GOLACO.id, slug: GOLACO.slug, playPath: `/play/${GOLACO.slug}`,
    title: byLocale((locale) => GOLACO.title[locale]),
    category: byLocale((locale) => FOOTBALL_CARDS.golaco[locale].category),
    poster: GOLACO_POSTER,
    posterAlt: byLocale((locale) => FOOTBALL_CARDS.golaco[locale].posterAlt),
    posterHasTitle: true,
  },
  {
    id: LIVA_BLACKJACK.id, slug: LIVA_BLACKJACK.slug, playPath: `/play/${LIVA_BLACKJACK.slug}`,
    title: byLocale((locale) => LIVA_BLACKJACK.title[locale]),
    category: byLocale((locale) => blackjackCopy(locale).category),
    poster: '/originals/blackjack/table-poster.svg',
    posterAlt: byLocale((locale) => blackjackCopy(locale).posterAlt),
  },
  {
    id: LIVA_ROULETTE.id, slug: LIVA_ROULETTE.slug, playPath: `/play/${LIVA_ROULETTE.slug}`,
    title: byLocale((locale) => LIVA_ROULETTE.title[locale]),
    category: byLocale((locale) => rouletteCopy(locale).category),
    poster: '/originals/roulette/orbit-poster.svg',
    posterAlt: byLocale((locale) => rouletteCopy(locale).posterAlt),
  },
  {
    id: LIVA_MINES.id, slug: LIVA_MINES.slug, playPath: `/play/${LIVA_MINES.slug}`,
    title: byLocale((locale) => LIVA_MINES.title[locale]),
    category: byLocale((locale) => minesCopy(locale).category),
    poster: '/originals/mines/jungle-poster.svg',
    posterAlt: byLocale((locale) => minesCopy(locale).posterAlt),
  },
  ...([{game:RAIO,poster:RAIO_POSTER}, {game:BRASIL21,poster:BRASIL21_POSTER}]).map(({game,poster}) => ({
    id:game.id, slug:game.slug, playPath:'/play/'+game.slug, title:game.title, category:byLocale(locale=>powerCopy(locale).category), poster, posterAlt:byLocale(locale=>`${game.title[locale]} — ${powerCopy(locale).category}`), posterHasTitle:true,
  })),
]

/** `01 / 05` style indicator: zero-padded to two digits, index is 1-based. */
export function spotlightIndicator(index: number, total: number): string {
  const pad = (value: number) => String(Math.max(0, value)).padStart(2, '0')
  return `${pad(index)} / ${pad(total)}`
}

export const spotlightPlayLabel = (locale: Locale) => productCopy(locale).play
