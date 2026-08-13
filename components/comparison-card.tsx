'use client'

import { LocaleLink } from '@/components/locale-link'
import { ArrowRight } from 'lucide-react'
import type { Comparison, Game } from '@/lib/types'
import { getGameById } from '@/lib/data'
import { getComparisonContent } from '@/lib/content'
import { useTranslation } from '@/components/country-context'
import { GameArtwork } from '@/components/game-artwork'

export function ComparisonCard({ comparison }: { comparison: Comparison }) {
  const { t, locale } = useTranslation()
  const a = getGameById(comparison.gameAId)
  const b = getGameById(comparison.gameBId)
  if (!a || !b) return null

  const content = getComparisonContent(comparison, locale)

  return (
    <LocaleLink
      href={`/compare/${comparison.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:glow-primary"
    >
      <div className="flex items-center gap-3">
        <GameThumb game={a} />
        <span className="font-display text-sm font-bold text-primary">VS</span>
        <GameThumb game={b} />
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-foreground">
        {a.title} vs {b.title}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {content.intro}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        {t('cta.compare')}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </LocaleLink>
  )
}

function GameThumb({ game }: { game: Game }) {
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border">
      <GameArtwork game={game} sizes="64px" compact />
    </div>
  )
}
