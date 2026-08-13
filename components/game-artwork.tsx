'use client'

import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import type { Game } from '@/lib/types'
import { hasApprovedArtwork } from '@/lib/game-artwork'
import { useTranslation } from '@/components/country-context'
import { getCategoryName } from '@/lib/content'
import { cn } from '@/lib/utils'

/**
 * Single centralized surface for every game image on PlayLiva — game
 * cards, hero art, comparison thumbnails, "Where to Play", "Best of" lists,
 * and any future game listing. No component should render `game.image`
 * directly; always render through `<GameArtwork>` instead.
 *
 * PERMANENT ASSET RULE: real artwork only renders when
 * `hasApprovedArtwork(game)` is true (an authorized, rights-cleared asset
 * on file). Every other case — no asset, `pending`/`placeholder` status, or
 * unresolved rights — shows the neutral PlayLiva fallback (game name,
 * provider, category) instead. Never substitute AI-generated or unlicensed
 * artwork for a real game; a new game with no approved asset yet is
 * expected to show the fallback until one is supplied.
 */
export function GameArtwork({
  game,
  fill = true,
  priority = false,
  sizes,
  className,
  /** Use in small thumbnails (e.g. ~64px) where the full fallback (name,
   * provider, category) would not fit — shows only an icon + short title. */
  compact = false,
}: {
  game: Game
  fill?: boolean
  priority?: boolean
  sizes?: string
  className?: string
  compact?: boolean
}) {
  const { locale } = useTranslation()

  if (hasApprovedArtwork(game)) {
    return (
      <Image
        src={game.image as string}
        alt={game.imageAlt || `${game.title} by ${game.provider}`}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={cn('object-cover', className)}
      />
    )
  }

  const categoryLabel = getCategoryName(game.category, locale)

  return (
    <div
      role="img"
      aria-label={`${game.title} — ${game.provider}, ${categoryLabel}. Artwork pending approval.`}
      className={cn(
        'flex flex-col items-center justify-center gap-2 bg-background text-center',
        compact ? 'gap-1 px-1.5' : 'px-4',
        fill && 'absolute inset-0',
        className,
      )}
    >
      <ImageOff
        className={cn('text-primary/50', compact ? 'size-3.5' : 'size-5')}
        aria-hidden="true"
      />
      {compact ? (
        <span className="line-clamp-2 text-[10px] font-bold uppercase leading-tight text-foreground">
          {game.title}
        </span>
      ) : (
        <>
          <span className="text-balance font-display text-lg font-bold uppercase tracking-wide text-foreground">
            {game.title}
          </span>
          <span className="text-xs font-semibold text-primary">{game.provider}</span>
          <span className="text-xs text-muted-foreground">{categoryLabel}</span>
        </>
      )}
    </div>
  )
}
