'use client'

import { LocaleLink } from '@/components/locale-link'
import { ArrowRight } from 'lucide-react'
import type { Comparison, Game } from '@/lib/types'
import { getGameById } from '@/lib/data'
import { getComparisonContent } from '@/lib/content'
import { useTranslation } from '@/components/country-context'
import { GameArtwork } from '@/components/game-artwork'
import styles from '@/components/editorial-design.module.css'

export function ComparisonCard({ comparison }: { comparison: Comparison }) {
  const { t, locale } = useTranslation()
  const a = getGameById(comparison.gameAId)
  const b = getGameById(comparison.gameBId)
  if (!a || !b) return null

  const content = getComparisonContent(comparison, locale)

  return (
    <LocaleLink
      href={`/compare/${comparison.slug}`}
      className={styles.comparisonCard}
      data-comparison-card={comparison.slug}
    >
      <div className={styles.versusArt}>
        <GameThumb game={a} />
        <span aria-hidden="true">VS</span>
        <GameThumb game={b} />
      </div>
      <div className={styles.comparisonBody}>
      <small>{t('compare.eyebrow')}</small>
      <h3>
        {a.title} vs {b.title}
      </h3>
      <p>
        {content.intro}
      </p>
      <span>
        {t('cta.compare')}
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
      </div>
    </LocaleLink>
  )
}

function GameThumb({ game }: { game: Game }) {
  return (
    <div className={styles.comparisonThumb}>
      <GameArtwork game={game} sizes="(max-width: 639px) 45vw, 192px" compact />
    </div>
  )
}
