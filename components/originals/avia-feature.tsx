'use client'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { AVIA_PATH, AVIA_POSTER } from '@/lib/originals/avia/definition'
import { aviaCopy } from '@/lib/originals/avia/copy'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import styles from './originals-discovery.module.css'

export function AviaFeature({ surface }: { surface: 'hub' | 'category' }) {
  const { locale } = useCountry(), c = originalsDiscoveryCopy(locale), Heading = surface === 'hub' ? 'h2' : 'h3'
  return <article className={styles.card} data-original-card="avia-de-janeiro" data-surface={surface}>
    <LocaleLink href={AVIA_PATH} prefetch={false} className={styles.posterLink} aria-label={`${c.playFree}: Liva Skyline`}><Image src={AVIA_POSTER} alt="Liva Skyline" fill sizes="(max-width:767px) 100vw,700px" className={styles.poster} /><span className={styles.playIcon}><Play size={26} /></span></LocaleLink>
    <div className={styles.cardBody}><div className={styles.labels}><span className={styles.badge}>{c.freePlay}</span><span>Crash</span></div><Heading className={styles.gameTitle}>Liva Skyline</Heading><p className={styles.description}>{aviaCopy(locale).description}</p><p className={styles.credits}>{c.virtualCredits}</p><LocaleLink href={AVIA_PATH} prefetch={false} className={styles.playButton}><Play size={18} />{c.playFree}<ArrowRight size={18} /></LocaleLink><p className={styles.cardNote}>{c.noDeposits} · {c.noValue}</p></div>
  </article>
}
