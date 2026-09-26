'use client'
import Image from 'next/image'
import { ArrowRight, Play } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { originalsDiscoveryCopy } from '@/lib/originals/discovery'
import { powerCopy } from '@/lib/originals/power-copy'
import { RAIO, RAIO_POSTER } from '@/lib/originals/raio/definition'
import { BRASIL21, BRASIL21_POSTER } from '@/lib/originals/brasil21/definition'
import styles from './originals-discovery.module.css'
export function PowerFeature({kind,surface}:{kind:'raio'|'brasil21';surface:'home'|'hub'|'category'}){
  const {locale}=useCountry(),copy=powerCopy(locale),shared=originalsDiscoveryCopy(locale),raio=kind==='raio',game=raio?RAIO:BRASIL21,Heading=surface==='hub'?'h2':'h3'
  return <article className={styles.card} data-original-card={game.slug} data-surface={surface}>
    <LocaleLink href={`/play/${game.slug}`} prefetch={false} className={styles.posterLink} aria-label={`${shared.playFree}: ${game.title[locale]}`}><Image src={raio?RAIO_POSTER:BRASIL21_POSTER} alt={game.title[locale]} fill sizes="(max-width:767px) 100vw,700px" className={styles.poster}/><span className={styles.playIcon}><Play size={26}/></span></LocaleLink>
    <div className={styles.cardBody}><div className={styles.labels}><span className={styles.badge}>{shared.freePlay}</span><span>{copy.category} · {shared.newBadge}</span></div><Heading className={styles.gameTitle}>{game.title[locale]}</Heading><p className={styles.description}>{raio?copy.raioDescription:copy.brasilDescription}</p><p className={styles.credits}>{shared.virtualCredits}</p><LocaleLink href={`/play/${game.slug}`} prefetch={false} className={styles.playButton} data-play-free><Play size={18}/>{shared.playFree}<ArrowRight size={18}/></LocaleLink><p className={styles.cardNote}>{shared.noDeposits} · {shared.noValue}</p></div>
  </article>
}
