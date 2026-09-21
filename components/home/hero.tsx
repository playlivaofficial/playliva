'use client'

import { ArrowUpRight, ArrowRight, Play } from 'lucide-react'
import { LocaleLink } from '@/components/locale-link'
import { useCountry } from '@/components/country-context'
import { BetssonHomeBanner } from '@/components/affiliates/betsson-home-banner'
import { productCopy } from '@/lib/product-discovery'
import styles from '@/components/product-design.module.css'
import { SpotlightCarousel } from './spotlight-carousel'

export function Hero() {
  const { locale } = useCountry()
  const copy = productCopy(locale)
  return <section className={styles.hero} data-discovery-hero>
    <div className={styles.heroInner}>
      <div>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1>{copy.heroLead}{' '}<span>{copy.heroAccent}</span></h1>
        <p className={styles.heroDescription}>{copy.heroDescription}</p>
        <div className={styles.heroActions}>
          <LocaleLink href="/play" className={styles.primaryAction} data-hero-play-free><Play size={18} aria-hidden="true" fill="currentColor" />{copy.play}<ArrowRight size={18} aria-hidden="true" /></LocaleLink>
          <LocaleLink href="/games" className={styles.secondaryAction} data-hero-explore>{copy.explore}<ArrowUpRight size={18} aria-hidden="true" /></LocaleLink>
        </div>
        <p className={styles.heroNote}>{copy.freeNote}</p>
        <div className={styles.heroSponsor} data-hero-sponsor="" data-sponsor-slot="home-hero">
          <BetssonHomeBanner />
        </div>
      </div>
      <SpotlightCarousel />
    </div>
  </section>
}
