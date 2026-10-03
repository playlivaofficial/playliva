'use client'

import { contentLocale } from '@/lib/locale'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react'
import Image from 'next/image'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { LocaleLink } from '@/components/locale-link'
import { useCountry } from '@/components/country-context'
import { UTM_KEYS } from '@/lib/attribution'
import { productCopy } from '@/lib/product-discovery'
import { SPOTLIGHT_GAMES, spotlightIndicator, type SpotlightGame } from '@/lib/home/spotlight'
import styles from './spotlight-carousel.module.css'

const noopSubscribe = () => () => {}
const readSearch = () => window.location.search
const serverSearch = () => ''

/** Pointer travel beyond this is a drag, so the pending click must not navigate. */
const DRAG_THRESHOLD_PX = 8

/** Forward inbound campaign parameters so a social landing keeps its source on the game route. */
function withCampaignParams(path: string, search: string): string {
  const params = new URLSearchParams(search)
  const kept = new URLSearchParams()
  for (const key of UTM_KEYS) { const value = params.get(key); if (value) kept.set(key, value) }
  const query = kept.toString()
  return query ? `${path}?${query}` : path
}

/**
 * Homepage "In the spotlight": one slide per eligible Original from the
 * central catalog. Native horizontal scroll-snap handles finger swipes and
 * trackpads; mouse users get drag-to-scroll plus previous/next controls and
 * arrow keys. Each slide is a direct link to that game, so tapping the card,
 * the Play label or the arrow opens the exact game in the current locale.
 */
export function SpotlightCarousel({ games = SPOTLIGHT_GAMES }: { games?: readonly SpotlightGame[] }) {
  const { locale } = useCountry()
  const copy = productCopy(locale)
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  // Landing query string, read once on the client (empty during SSR so markup matches).
  const search = useSyncExternalStore(noopSubscribe, readSearch, serverSearch)
  const drag = useRef<{ x: number; scrollLeft: number; moved: boolean; pointerId: number } | null>(null)
  const suppressClick = useRef<number | null>(null)
  const total = games.length

  // Live indicator: the slide nearest the scroll position wins.
  useEffect(() => {
    const node = track.current
    if (!node) return
    // Scroll events are already coalesced by the browser; the state update is a cheap integer compare.
    const onScroll = () => {
      const width = node.clientWidth || 1
      setIndex(Math.min(total - 1, Math.max(0, Math.round(node.scrollLeft / width))))
    }
    node.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      node.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [total])

  const goTo = useCallback((target: number) => {
    const node = track.current
    if (!node || total === 0) return
    const next = ((target % total) + total) % total
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    node.scrollTo({ left: next * node.clientWidth, behavior: reduced ? 'auto' : 'smooth' })
    setIndex(next)
  }, [total])

  // Mouse drag-to-scroll. Touch keeps native scrolling (no pointer capture).
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !track.current) return
    drag.current = { x: event.clientX, scrollLeft: track.current.scrollLeft, moved: false, pointerId: event.pointerId }
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    const node = track.current
    if (!state || !node || event.pointerId !== state.pointerId) return
    const delta = event.clientX - state.x
    if (!state.moved && Math.abs(delta) < DRAG_THRESHOLD_PX) return
    if (!state.moved) { state.moved = true; node.setPointerCapture?.(event.pointerId); node.style.scrollSnapType = 'none' }
    node.scrollLeft = state.scrollLeft - delta
  }
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current
    const node = track.current
    if (!state || !node || event.pointerId !== state.pointerId) return
    drag.current = null
    if (state.moved) {
      // Swallow only the click that this drag produces; fall back to a short window if none follows.
      if (suppressClick.current !== null) window.clearTimeout(suppressClick.current)
      suppressClick.current = window.setTimeout(() => { suppressClick.current = null }, 400)
      if (node.hasPointerCapture?.(event.pointerId)) node.releasePointerCapture(event.pointerId)
      node.style.scrollSnapType = ''
      goTo(Math.round(node.scrollLeft / (node.clientWidth || 1)))
    }
  }
  const onClickCapture = (event: React.MouseEvent) => {
    if (suppressClick.current === null) return
    window.clearTimeout(suppressClick.current)
    suppressClick.current = null
    event.preventDefault()
    event.stopPropagation()
  }
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(index + 1) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(index - 1) }
  }

  if (total === 0) return null
  const indicator = spotlightIndicator(index + 1, total)
  return (
    <section className={styles.carousel} aria-roledescription="carousel" aria-label={copy.spotlightLabel}
      data-spotlight-carousel="" data-spotlight-total={total} data-spotlight-index={index + 1} onKeyDown={onKeyDown}>
      <div ref={track} className={styles.track} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={endDrag} onPointerCancel={endDrag} onClickCapture={onClickCapture} tabIndex={0}>
        {games.map((game, position) => {
          const title = game.title[contentLocale(locale)]
          return (
            <div key={game.id} className={styles.slide} role="group" aria-roledescription="slide"
              aria-label={copy.spotlightSlide.replace('{index}', String(position + 1)).replace('{total}', String(total))}
              data-spotlight-slide={game.slug} aria-current={position === index ? 'true' : undefined}>
              <LocaleLink href={withCampaignParams(game.playPath, search)} prefetch={false} className={styles.card}
                aria-label={`${copy.play}: ${title}`} data-spotlight-game={game.id} draggable={false}>
                <Image src={game.poster} alt={game.posterAlt[contentLocale(locale)]} fill priority={position === 0}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 80vw, 540px" draggable={false} />
                <div className={styles.top}>
                  <span>{copy.featured}</span>
                  <span className={styles.indicator} aria-hidden="true">{spotlightIndicator(position + 1, total)}</span>
                </div>
                <div className={styles.bottom}>
                  <p>{copy.original} · {game.category[contentLocale(locale)]}</p>
                  <strong>{title}</strong>
                  <small>{copy.play}<ArrowUpRight size={20} aria-hidden="true" /></small>
                </div>
              </LocaleLink>
            </div>
          )
        })}
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.arrow} onClick={() => goTo(index - 1)} aria-label={copy.spotlightPrev} data-spotlight-prev="">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <output className={styles.status} aria-live="polite" data-spotlight-indicator="">{indicator}</output>
        <button type="button" className={styles.arrow} onClick={() => goTo(index + 1)} aria-label={copy.spotlightNext} data-spotlight-next="">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
