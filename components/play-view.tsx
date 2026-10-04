'use client'

import { DiscoverySearch } from '@/components/discovery/search'

import { ArrowRight, Check } from 'lucide-react'
import { ThreeGameFeature } from '@/components/originals/three-game-feature'
import { AviaFeature } from '@/components/originals/avia-feature'
import { DriftFeature } from '@/components/originals/rio-drift/feature'
import { useState } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { useCountry } from '@/components/country-context'
import { IslandCrashFeature } from '@/components/originals/island-crash-feature'
import { CapybaraFeature } from '@/components/originals/capybara-feature'
import { BlackjackFeature } from '@/components/originals/blackjack-feature'
import { RouletteFeature } from '@/components/originals/roulette-feature'
import { PowerFeature } from '@/components/originals/power-feature'
import { MinesFeature } from '@/components/originals/mines-feature'
import { EmbaixadinhaFeature, GolacoFeature } from '@/components/originals/football-features'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import { featuredGeo, orderFeaturedOriginals } from '@/lib/originals/featured'
import styles from '@/components/originals/originals-discovery.module.css'
import { productCopy } from '@/lib/product-discovery'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'

export function PlayView() {
  const { locale, countryCode } = useCountry()
  const copy = originalsDiscoveryCopy(locale)
  const product = productCopy(locale)
  const [filter, setFilter] = useState('all')
  const games = orderFeaturedOriginals([
    { id: 'island-crash', group: 'crash', card: <IslandCrashFeature surface="hub" /> },
    { id: 'liva-embaixadinha', group: 'crash', card: <EmbaixadinhaFeature surface="hub" /> },
    { id: 'liva-capybara-gold', group: 'slots', card: <CapybaraFeature surface="hub" /> },
    { id: 'samba-drop', group: 'instant', card: <ThreeGameFeature kind="samba-drop" surface="hub" /> },
    { id: 'skuptu-levanta', group: 'crash', card: <ThreeGameFeature kind="skuptu-levanta" surface="hub" /> },
    { id: 'liva-golaco', group: 'slots', card: <GolacoFeature surface="hub" /> },
    { id: 'carnaval-gold', group: 'slots', card: <ThreeGameFeature kind="carnaval-gold" surface="hub" /> },
    { id: 'liva-blackjack', group: 'cards', card: <BlackjackFeature surface="hub" /> },
    { id: 'liva-roulette', group: 'cards', card: <RouletteFeature surface="hub" /> },
    { id: 'liva-mines', group: 'instant', card: <MinesFeature surface="hub" /> },
    { id: 'liva-raio', group: 'cards', card: <PowerFeature kind="raio" surface="hub" /> },
    { id: 'liva-21-brasil', group: 'cards', card: <PowerFeature kind="brasil21" surface="hub" /> },
    { id: 'avia-de-janeiro', group: 'crash', card: <AviaFeature surface="hub" /> },
    { id: 'rio-drift', group: 'crash', card: <DriftFeature surface="hub" /> },
  ], countryCode)
  const groups = [
    { id: 'all', label: product.all }, { id: 'crash', label: product.crash },
    { id: 'slots', label: product.slots }, { id: 'cards', label: product.cards },
    { id: 'instant', label: product.instant },
  ]
  const count = games.filter(game => filter === 'all' || game.group === filter).length
  return (
    <div className={styles.hub} data-play-hub data-featured-geo={featuredGeo(countryCode)}>
      <header className={styles.hubIntro}>
        <div className={styles.hubCopyTitle}>
          <p className={styles.eyebrow}>{copy.originals} · {product.hubEyebrow}</p>
          <h1 className={styles.hubTitle}>{product.hubTitle}</h1>
        </div>
        <div className={styles.hubSponsor} data-hub-sponsor="" data-sponsor-slot="play-hub">
          <BetssonSponsoredBanner surface="play" layout="compact-header" />
        </div>
        <div className={styles.hubCopyLede}>
          <p className={styles.hubDescription}>{product.hubSub}</p>
          <ul className={styles.trust}>
            {[copy.noDeposits, copy.noWithdrawals, copy.noValue].map(label => (
              <li key={label}><Check size={16} aria-hidden="true" />{label}</li>
            ))}
          </ul>
        </div>
      </header>
      <DiscoverySearch />
      <div className={styles.filters} role="group" aria-label={product.all}>
        {groups.map(group => <button type="button" key={group.id} aria-pressed={filter === group.id} onClick={() => setFilter(group.id)}>{group.label}</button>)}
      </div>
      <p className={styles.available} role="status">{product.resultCount.replace('{count}', String(count))}</p>
      <div className={styles.hubGrid} data-filter={filter}>
        {games.map(game => <div key={game.id} data-featured-original={game.id} hidden={filter !== 'all' && filter !== game.group}>{game.card}</div>)}
      </div>
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
