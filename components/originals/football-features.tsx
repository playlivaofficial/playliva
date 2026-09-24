'use client'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import { FOOTBALL_CARDS } from '@/lib/originals/football-cards'
import { EMBAIXADINHA, EMBAIXADINHA_POSTER } from '@/lib/originals/embaixadinha/definition'
import { GOLACO, GOLACO_POSTER } from '@/lib/originals/golaco/definition'
import type { OriginalGameDefinition } from '@/lib/originals/definition'
import styles from './originals-discovery.module.css'

type Surface = 'home' | 'hub' | 'category'
/** Discovery art and links only: never imports an engine, renderer, wallet, audio or full game copy. */
function FootballCard({ game, poster, posterAlt, category, description, cardId, surface }: {
  game: OriginalGameDefinition; poster: string; posterAlt: string; category: string; description: string; cardId: string; surface: Surface
}) {
  const { locale } = useCountry(), shared = originalsDiscoveryCopy(locale)
  const Heading = surface === 'hub' ? 'h2' : 'h3', title = game.title[locale], href = `/play/${game.slug}`
  return <article className={styles.card} data-original-card={cardId} data-surface={surface}>
    <LocaleLink href={href} prefetch={false} className={styles.posterLink} aria-label={`${shared.playFree}: ${title}`}>
      <Image src={poster} alt={posterAlt} fill sizes="(max-width: 767px) 100vw, 700px" className={styles.poster} />
      <span className={styles.posterMark} aria-hidden="true">PlayLiva Originals</span>
      <span className={styles.playIcon} aria-hidden="true"><Play size={26} fill="currentColor" /></span>
    </LocaleLink>
    <div className={styles.cardBody}>
      <div className={styles.labels}><span className={styles.badge}>{shared.newBadge}</span><span className={styles.badge}>{shared.freePlay}</span><span>{category} · {shared.demoGames}</span></div>
      <Heading className={styles.gameTitle}>{title}</Heading>
      <p className={styles.description}>{description}</p><p className={styles.credits}>{shared.virtualCredits}</p>
      <LocaleLink href={href} prefetch={false} className={styles.playButton} data-play-free><Play size={18} fill="currentColor" aria-hidden="true" />{shared.playFree}<ArrowRight size={18} aria-hidden="true" /></LocaleLink>
      <p className={styles.cardNote}>{shared.noDeposits} · {shared.noValue}</p>
    </div>
  </article>
}

export function EmbaixadinhaFeature({ surface }: { surface: Surface }) {
  const { locale } = useCountry(), copy = FOOTBALL_CARDS.embaixadinha[locale]
  return <FootballCard game={EMBAIXADINHA} poster={EMBAIXADINHA_POSTER} posterAlt={copy.posterAlt} category={copy.category}
    description={copy.discovery} cardId="liva-ginga" surface={surface} />
}

export function GolacoFeature({ surface }: { surface: Surface }) {
  const { locale } = useCountry(), copy = FOOTBALL_CARDS.golaco[locale]
  return <FootballCard game={GOLACO} poster={GOLACO_POSTER} posterAlt={copy.posterAlt} category={copy.category}
    description={copy.discovery} cardId="golaco" surface={surface} />
}
