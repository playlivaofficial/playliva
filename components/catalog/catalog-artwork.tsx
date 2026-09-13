import Image from 'next/image'
import { Grid2X2, Layers3, Orbit, Dices } from 'lucide-react'
import type { CatalogSummary } from '@/lib/catalog/types'
import styles from './catalog.module.css'

/** Neutral covers are typographic reference covers, never simulated provider art. */
export function CatalogArtwork({ game, hero = false }: { game: CatalogSummary; hero?: boolean }) {
  if (game.image) return <Image src={game.image} alt={`${game.title} — ${game.provider}`} fill sizes={hero ? '(max-width: 639px) 160px, 360px' : '(max-width: 359px) 88px, (max-width: 639px) 50vw, 300px'} className="object-cover" />
  const Icon = game.category === 'slots' ? Grid2X2 : game.category === 'live-casino' ? Layers3 : game.category === 'crash' ? Orbit : Dices
  return <div className={styles.cover} data-category={game.category} role="img" aria-label={`${game.title}. ${game.artworkLabel}`} data-artwork-status="fallback">
    <span className={styles.coverBrand}>PL / {game.categoryLabel}</span>
    <Icon aria-hidden="true" size={hero ? 40 : 28} />
    <span className={styles.coverTitle}>{game.title}</span>
    <small>{game.provider}</small>
  </div>
}
