'use client'

import { LocaleLink } from '@/components/locale-link'
import { ArrowUpRight } from 'lucide-react'
import type { Game } from '@/lib/types'
import { useCountry } from '@/components/country-context'
import { getCategoryContent, getGameContent } from '@/lib/content'
import { GameArtwork } from '@/components/game-artwork'
import { discoveryCategory } from '@/lib/product-discovery'
import styles from '@/components/product-design.module.css'

export function GameCard({ game }: { game: Game }) {
  const { t, locale } = useCountry()
  const category = getCategoryContent(discoveryCategory(game), locale)
  const content = getGameContent(game, locale)
  return <LocaleLink href={`/games/${game.slug}`} className={styles.gameCard} data-provider-card={game.slug}>
    <div className={styles.gameArt}>
      <GameArtwork game={game} sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 400px" />
    </div>
    <div className={styles.gameBody}>
      <small>{game.provider} · {category.name}</small>
      <h3>{game.title}</h3>
      <p>{content.shortDescription}</p>
      <span className={styles.gameLink}>{t('cta.viewGame')}<ArrowUpRight size={16} aria-hidden="true" /></span>
    </div>
  </LocaleLink>
}
