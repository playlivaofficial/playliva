'use client'

import { LocaleLink } from '@/components/locale-link'
import { ArrowUpRight } from 'lucide-react'
import type { Game } from '@/lib/types'
import { useCountry } from '@/components/country-context'
import { getCategoryContent, getGameContent } from '@/lib/content'
import { GameArtwork } from '@/components/game-artwork'
import { cn } from '@/lib/utils'

const TAG_STYLES: Record<Game['tag'], string> = {
  Popular: 'bg-primary/15 text-primary',
  Trending: 'bg-primary/15 text-primary',
  New: 'bg-secondary text-secondary-foreground',
}

const TAG_KEY: Record<Game['tag'], string> = {
  Popular: 'label.popular',
  Trending: 'label.trending',
  New: 'label.new',
}

export function GameCard({ game }: { game: Game }) {
  const { t, locale } = useCountry()
  const category = getCategoryContent(game.category, locale)
  const content = getGameContent(game, locale)
  return (
    <LocaleLink
      href={`/games/${game.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:glow-primary"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <GameArtwork
          game={game}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm',
            TAG_STYLES[game.tag],
          )}
        >
          {t(TAG_KEY[game.tag])}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold text-foreground">
            {game.title}
          </h3>
          <span className="text-xs font-medium text-muted-foreground">
            {category.name}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {content.shortDescription}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {t('cta.viewGame')}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </LocaleLink>
  )
}
