'use client'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { RIO_DRIFT_PATH, RIO_DRIFT_POSTER } from '@/lib/originals/rio-drift/definition'
import { driftCopy } from '@/lib/originals/rio-drift/copy'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import styles from '../originals-discovery.module.css'

export function DriftFeature({ surface }: { surface: 'hub' | 'category' }) {
  const { locale } = useCountry(), c = driftCopy(locale), shared = originalsDiscoveryCopy(locale), Heading = surface === 'hub' ? 'h2' : 'h3'
  return <article className={styles.card} data-original-card="rio-drift" data-surface={surface}>
    <LocaleLink href={RIO_DRIFT_PATH} prefetch={false} className={styles.posterLink} aria-label={`${c.start}: Rio Drift`}><Image src={RIO_DRIFT_POSTER} alt="Rio Drift" fill sizes="(max-width:767px) 100vw,700px" className={styles.poster} /><span className={styles.playIcon}><Play size={26} /></span></LocaleLink>
    <div className={styles.cardBody}><div className={styles.labels}><span className={styles.badge}>{shared.freePlay}</span><span>{c.racing}</span></div><Heading className={styles.gameTitle}>Rio Drift</Heading><p className={styles.description}>{c.description}</p><p className={styles.credits}>{c.actionHint}</p><LocaleLink href={RIO_DRIFT_PATH} prefetch={false} className={styles.playButton}><Play size={18} />{c.start}<ArrowRight size={18} /></LocaleLink><LocaleLink href="/arcade" className={styles.cardNote}>{c.category} →</LocaleLink></div>
  </article>
}
