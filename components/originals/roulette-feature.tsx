'use client'
import Image from 'next/image'
import { PowerFeature } from './power-feature'
import { ArrowRight, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import { rouletteCopy } from '@/lib/originals/roulette/copy'
import { LIVA_ROULETTE } from '@/lib/originals/roulette/config'
import styles from './originals-discovery.module.css'

/** Small original SVG and links only; no renderer or settlement imports. */
export function RouletteFeature({ surface }: { surface: 'home' | 'hub' | 'category' }) {
  const { locale } = useCountry(), copy = rouletteCopy(locale), shared = originalsDiscoveryCopy(locale)
  const Heading = surface === 'hub' ? 'h2' : 'h3', title = LIVA_ROULETTE.title[locale]
  return <article className={styles.card} data-original-card="roulette" data-surface={surface}>
    <LocaleLink href="/play/roulette" prefetch={false} className={styles.posterLink} aria-label={`${shared.playFree}: ${title}`}>
      <Image src="/originals/roulette/orbit-poster.svg" alt={copy.posterAlt} fill sizes="(max-width:767px) 100vw,700px" className={styles.poster}/>
      <span className={styles.playIcon} aria-hidden="true"><Play size={26} fill="currentColor"/></span>
    </LocaleLink>
    <div className={styles.cardBody}>
      <div className={styles.labels}><span className={styles.badge}>{shared.freePlay}</span><span>{copy.category} · {shared.demoGames}</span></div>
      <Heading className={styles.gameTitle}>{title}</Heading><p className={styles.description}>{copy.discovery}</p><p className={styles.credits}>{shared.virtualCredits}</p>
      <LocaleLink href="/play/roulette" prefetch={false} className={styles.playButton} data-play-free><Play size={18} fill="currentColor" aria-hidden="true"/>{shared.playFree}<ArrowRight size={18} aria-hidden="true"/></LocaleLink>
      <p className={styles.cardNote}>{shared.noDeposits} · {shared.noValue}</p>
    </div>
  </article>
}
export function RouletteDiscoverySection({ liveContext = false }: { liveContext?: boolean }) {
  const { locale } = useCountry(), copy = rouletteCopy(locale), shared = originalsDiscoveryCopy(locale)
  const id = `originals-roulette-${liveContext ? 'live-context' : 'table'}`
  return <section className={styles.section} aria-labelledby={id} data-originals-roulette={liveContext ? 'live-context' : 'table-games'}>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{shared.originals}</p><h2 id={id}>{liveContext ? copy.liveTitle : copy.categoryTitle}</h2><p className={styles.sectionDescription}>{liveContext ? copy.liveDescription : copy.categoryDescription}</p></div>
      <LocaleLink href="/play" className={styles.hubLink}>{shared.hubLink}<ArrowRight size={17} aria-hidden="true"/></LocaleLink></div>
    <RouletteFeature surface="category"/><PowerFeature kind="raio" surface="category"/>
  </section>
}
