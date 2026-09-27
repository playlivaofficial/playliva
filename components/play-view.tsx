'use client'

import { DiscoverySearch } from '@/components/discovery/search'

import { ArrowRight, Check } from 'lucide-react'
import { ThreeGameFeature } from '@/components/originals/three-game-feature'
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
import styles from '@/components/originals/originals-discovery.module.css'
import { productCopy } from '@/lib/product-discovery'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'

export function PlayView() {
  const { locale } = useCountry()
  const copy = originalsDiscoveryCopy(locale)
  const product = productCopy(locale)
  const [filter, setFilter] = useState('all')
  const groups = [
    { id: 'all', label: product.all, count: 12 }, { id: 'crash', label: product.crash, count: 3 },
    { id: 'slots', label: product.slots, count: 3 }, { id: 'cards', label: product.cards, count: 4 },
    { id: 'instant', label: product.instant, count: 2 },
  ]
  return (
    <div className={styles.hub} data-play-hub>
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
      <p className={styles.available} role="status">{product.resultCount.replace('{count}', String(groups.find(group => group.id === filter)?.count ?? 9))}</p>
      <div className={styles.hubGrid} data-filter={filter}>
        <div hidden={filter !== 'all' && filter !== 'instant'}><ThreeGameFeature kind="samba-drop" surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'crash'}><ThreeGameFeature kind="skuptu-levanta" surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'slots'}><ThreeGameFeature kind="carnaval-gold" surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'crash'}><IslandCrashFeature surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'crash'}><EmbaixadinhaFeature surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'slots'}><CapybaraFeature surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'slots'}><GolacoFeature surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'cards'}><BlackjackFeature surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'cards'}><RouletteFeature surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'instant'}><MinesFeature surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'cards'}><PowerFeature kind="raio" surface="hub" /></div>
        <div hidden={filter !== 'all' && filter !== 'cards'}><PowerFeature kind="brasil21" surface="hub" /></div>
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
