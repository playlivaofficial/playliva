'use client'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import { LIVA_BLACKJACK } from '@/lib/originals/blackjack/definition'
import styles from './originals-discovery.module.css'

/** Original vector poster only. No game code or hidden-card imports. */
export function BlackjackFeature({ surface }: { surface: 'home' | 'hub' | 'category' }) {
  const { locale } = useCountry(), copy = blackjackCopy(locale), shared = originalsDiscoveryCopy(locale)
  const Heading = surface === 'hub' ? 'h2' : 'h3', title = LIVA_BLACKJACK.title[locale]
  return <article className={styles.card} data-original-card="blackjack" data-surface={surface}>
    <LocaleLink href="/play/blackjack" prefetch={false} className={styles.posterLink} aria-label={`${shared.playFree}: ${title}`}>
      <Image src="/originals/blackjack/table-poster.svg" alt={copy.posterAlt} fill sizes="(max-width:767px) 100vw,700px" className={styles.poster} />
      <span className={styles.playIcon} aria-hidden="true"><Play size={26} fill="currentColor" /></span>
    </LocaleLink>
    <div className={styles.cardBody}>
      <div className={styles.labels}><span className={styles.badge}>{shared.freePlay}</span><span>{copy.category} · {shared.demoGames}</span></div>
      <Heading className={styles.gameTitle}>{title}</Heading><p className={styles.description}>{copy.discovery}</p><p className={styles.credits}>{shared.virtualCredits}</p>
      <LocaleLink href="/play/blackjack" prefetch={false} className={styles.playButton} data-play-free><Play size={18} fill="currentColor" aria-hidden="true" />{shared.playFree}<ArrowRight size={18} aria-hidden="true" /></LocaleLink>
      <p className={styles.cardNote}>{shared.noDeposits} · {shared.noValue}</p>
    </div>
  </article>
}
export function BlackjackDiscoverySection() {
  const { locale } = useCountry(), copy = blackjackCopy(locale), shared = originalsDiscoveryCopy(locale)
  return <section className={styles.section} aria-labelledby="originals-blackjack-title" data-originals-section="table-games">
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{shared.originals}</p><h2 id="originals-blackjack-title">{copy.categoryTitle}</h2><p className={styles.sectionDescription}>{copy.categoryDescription}</p></div>
      <LocaleLink href="/play" className={styles.hubLink}>{shared.hubLink}<ArrowRight size={17} aria-hidden="true" /></LocaleLink></div>
    <BlackjackFeature surface="category" />
  </section>
}
