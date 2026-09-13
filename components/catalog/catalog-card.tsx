import { LocaleLink } from '@/components/locale-link'
import { ArrowUpRight } from 'lucide-react'
import type { CatalogSummary } from '@/lib/catalog/types'
import { CatalogArtwork } from './catalog-artwork'
import styles from '@/components/product-design.module.css'

export function CatalogCard({ game, readLabel }: { game: CatalogSummary; readLabel: string }) {
  return <LocaleLink href={`/games/${game.slug}`} className={styles.gameCard} data-provider-card={game.slug} data-reference-card={game.reference || undefined}>
    <div className={styles.gameArt}><CatalogArtwork game={game} /></div>
    <div className={styles.gameBody}>
      <small>{game.provider} · {game.categoryLabel}</small><h3>{game.title}</h3><p>{game.summary}</p>
      <span className={styles.gameLink}>{readLabel}<ArrowUpRight size={16} aria-hidden="true" /></span>
    </div>
  </LocaleLink>
}
