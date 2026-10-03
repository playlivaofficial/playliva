'use client'

import Image from 'next/image'
import { ThreeGameFeature } from './three-game-feature'
import { AviaFeature } from './avia-feature'
import { ArrowRight, Gamepad2, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { ISLAND_CRASH_PLAY_PATH, ISLAND_CRASH_POSTER, originalsDiscoveryCopy } from '@/lib/originals/discovery'
import styles from './originals-discovery.module.css'
import { CapybaraFeature } from './capybara-feature'
import { BlackjackFeature } from './blackjack-feature'
import { RouletteFeature } from './roulette-feature'
import { MinesFeature } from './mines-feature'
import { EmbaixadinhaFeature, GolacoFeature } from './football-features'
import { productCopy } from '@/lib/product-discovery'

/** A poster and ordinary links only; the game runtime stays on /play/crash. */
export function IslandCrashFeature({ surface }: { surface: 'home' | 'hub' | 'category' }) {
  const { locale } = useCountry()
  const copy = originalsDiscoveryCopy(locale)
  const Heading = surface === 'hub' ? 'h2' : 'h3'
  return (
    <article className={styles.card} data-original-card="island-crash" data-surface={surface}>
      <LocaleLink href={ISLAND_CRASH_PLAY_PATH} prefetch={false} className={styles.posterLink} aria-label={`${copy.playFree}: ${copy.title}`}>
        <Image src={ISLAND_CRASH_POSTER} alt={copy.posterAlt} fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 58vw, 700px"
          priority={surface === 'hub'} className={styles.poster} />
        <span className={styles.posterMark} aria-hidden="true"><Gamepad2 size={18} /> {copy.originals}</span>
        <span className={styles.playIcon} aria-hidden="true"><Play size={26} fill="currentColor" /></span>
      </LocaleLink>
      <div className={styles.cardBody}>
        <div className={styles.labels}><span className={styles.badge}>{copy.freePlay}</span><span>{copy.category} · {copy.demoGames}</span></div>
        <Heading className={styles.gameTitle}>{copy.title}</Heading>
        <p className={styles.description}>{copy.description}</p>
        <p className={styles.credits}>{copy.virtualCredits}</p>
        <LocaleLink href={ISLAND_CRASH_PLAY_PATH} prefetch={false} className={styles.playButton} data-play-free>
          <Play size={18} fill="currentColor" aria-hidden="true" />{copy.playFree}<ArrowRight size={18} aria-hidden="true" />
        </LocaleLink>
        <p className={styles.cardNote}>{copy.noDeposits} · {copy.noValue}</p>
      </div>
    </article>
  )
}

export function OriginalsDiscoverySection({ surface }: { surface: 'home' | 'category' }) {
  const { locale } = useCountry()
  const copy = originalsDiscoveryCopy(locale)
  const product = productCopy(locale)
  return (
    <section className={styles.section} aria-labelledby={`originals-${surface}-title`} data-originals-section={surface}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>{copy.originals}</p>
          <h2 id={`originals-${surface}-title`}>{surface === 'home' ? product.homeOriginals : copy.categoryTitle}</h2>
          <p className={styles.sectionDescription}>{surface === 'home' ? product.homeOriginalsSub : copy.categoryDescription}</p>
        </div>
        <LocaleLink href="/play" className={styles.hubLink}>{copy.hubLink}<ArrowRight size={17} aria-hidden="true" /></LocaleLink>
      </div>
      <div className={surface === 'home' ? styles.homeGrid : undefined}>
      {surface === 'category' && <AviaFeature surface="category" />}
      <IslandCrashFeature surface={surface} />
      <EmbaixadinhaFeature surface={surface} />
      <ThreeGameFeature kind="skuptu-levanta" surface={surface} />
      {surface === 'home' && <CapybaraFeature surface="home" />}
      {surface === 'home' && <GolacoFeature surface="home" />}
      {surface === 'home' && <BlackjackFeature surface="home" />}
      {surface === 'home' && <RouletteFeature surface="home" />}
      {surface === 'home' && <MinesFeature surface="home" />}
      </div>
    </section>
  )
}
