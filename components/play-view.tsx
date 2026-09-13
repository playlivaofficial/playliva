'use client'

import { ArrowRight, Check } from 'lucide-react'
import { LocaleLink } from '@/components/locale-link'
import { useCountry } from '@/components/country-context'
import { IslandCrashFeature } from '@/components/originals/island-crash-feature'
import { CapybaraFeature } from '@/components/originals/capybara-feature'
import { BlackjackFeature } from '@/components/originals/blackjack-feature'
import { RouletteFeature } from '@/components/originals/roulette-feature'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import styles from '@/components/originals/originals-discovery.module.css'

export function PlayView() {
  const { locale } = useCountry()
  const copy = originalsDiscoveryCopy(locale)
  return (
    <div className={styles.hub} data-play-hub>
      <header className={styles.hubIntro}>
        <p className={styles.eyebrow}>{copy.originals} · {copy.demoGames}</p>
        <h1 className={styles.hubTitle}>{copy.hubTitle}</h1>
        <p className={styles.hubDescription}>{copy.hubDescription}</p>
        <ul className={styles.trust}>
          {[copy.noDeposits, copy.noWithdrawals, copy.noValue].map(label => (
            <li key={label}><Check size={16} aria-hidden="true" />{label}</li>
          ))}
        </ul>
      </header>
      <p className={styles.available}>{copy.available}</p>
      <IslandCrashFeature surface="hub" />
      <CapybaraFeature surface="hub" />
      <BlackjackFeature surface="hub" />
      <RouletteFeature surface="hub" />
      <p className={styles.hubDisclaimer}>{copy.disclaimer}</p>
      <section className={styles.keepDiscovering}>
        <h2>{copy.discoverTitle}</h2>
        <p>{copy.discoverDescription}</p>
        <LocaleLink href="/games" className={styles.hubLink}>
          {copy.discoverLink}<ArrowRight size={16} aria-hidden="true" />
        </LocaleLink>
      </section>
    </div>
  )
}
