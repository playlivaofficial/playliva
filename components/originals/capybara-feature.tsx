'use client'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import { capybaraCopy } from '@/lib/originals/capybara/copy'
import styles from './originals-discovery.module.css'
import { GolacoFeature } from './football-features'

/** Discovery art only: no slot engine/wallet/animation imports or prefetch. */
export function CapybaraFeature({ surface }: { surface: 'home' | 'hub' | 'category' }) {
  const { locale } = useCountry(), copy = capybaraCopy(locale), shared = originalsDiscoveryCopy(locale)
  const Heading = surface === 'hub' ? 'h2' : 'h3'
  return <article className={`${styles.card} ${styles.capybaraCard}`} data-original-card="capybara-gold" data-surface={surface}>
    <LocaleLink href="/play/capybara-gold" prefetch={false} className={`${styles.posterLink} ${styles.capybaraPoster}`} aria-label={`${shared.playFree}: Liva Capybara Gold`}>
      <Image src="/originals/capybara-gold/river.webp" alt="" fill sizes="(max-width: 767px) 100vw, 700px" className={styles.poster} />
      <Image src="/originals/capybara-gold/mascot.webp" alt={copy.posterAlt} width={384} height={384} className={styles.capybaraMascot} />
      <span className={styles.posterMark} aria-hidden="true">PlayLiva Originals</span>
      <span className={styles.capybaraTitle} aria-hidden="true">CAPYBARA<br /><b>GOLD</b></span>
      <span className={styles.playIcon} aria-hidden="true"><Play size={26} fill="currentColor" /></span>
    </LocaleLink>
    <div className={styles.cardBody}>
      <div className={styles.labels}><span className={styles.badge}>{shared.freePlay}</span><span>{copy.category} · {shared.demoGames}</span></div>
      <Heading className={styles.gameTitle}>Liva Capybara Gold</Heading>
      <p className={styles.description}>{copy.discovery}</p><p className={styles.credits}>{shared.virtualCredits}</p>
      <LocaleLink href="/play/capybara-gold" prefetch={false} className={styles.playButton} data-play-free><Play size={18} fill="currentColor" aria-hidden="true" />{shared.playFree}<ArrowRight size={18} aria-hidden="true" /></LocaleLink>
      <p className={styles.cardNote}>{shared.noDeposits} · {shared.noValue}</p>
    </div>
  </article>
}
export function CapybaraDiscoverySection() {
  const { locale } = useCountry(), copy = capybaraCopy(locale), shared = originalsDiscoveryCopy(locale)
  return <section className={styles.section} aria-labelledby="originals-slots-title" data-originals-section="slots">
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{shared.originals}</p><h2 id="originals-slots-title">{copy.categoryTitle}</h2><p className={styles.sectionDescription}>{copy.categoryDescription}</p></div>
      <LocaleLink href="/play" className={styles.hubLink}>{shared.hubLink}<ArrowRight size={17} aria-hidden="true" /></LocaleLink></div>
    <CapybaraFeature surface="category" />
    <GolacoFeature surface="category" />
  </section>
}
