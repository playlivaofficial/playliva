'use client'
import type { Locale } from '@/lib/types'
import type { MinesSnapshot } from '@/lib/originals/mines/engine'
import { minesCopy } from '@/lib/originals/mines/copy'
import styles from './mines.module.css'

function Treasure({ hazard = false }: { hazard?: boolean }) {
  return <svg viewBox="0 0 48 48" aria-hidden="true" className={styles.gem}>
    {hazard ? <><path d="M24 5 44 37 37 44H11L4 37Z" fill="#c56c3b" stroke="#ffc38a" strokeWidth="2"/><path d="m24 9-4 15 9 3-7 16M10 34l11-7M30 30l11 5" fill="none" stroke="#402b25" strokeWidth="3"/><path d="M24 17v10m0 5v3" stroke="#fff0c2" strokeWidth="3"/></> :
      <><path d="M13 8h22l10 14-21 23L3 22Z" fill="#debd66" stroke="#ffeeb4" strokeWidth="2"/><path d="m13 8 5 14L24 45 30 22 35 8 24 3Z" fill="#5be6ac"/><path d="m3 22 15 0L24 3 30 22h15M18 22h12" fill="none" stroke="#f6e7a2" strokeWidth="1.5"/><path d="m9 13 5 1-2 6-2-3-4-1Z" fill="#fffbe1"/></>}
  </svg>
}
export function MinesBoard({ round, locale, pick }: { round: MinesSnapshot; locale: Locale; pick: (index: number) => void }) {
  const copy = minesCopy(locale), secured = round.result?.kind === 'cashout'
  const points = round.safe.map(index => `${(index % 5) * 20 + 10},${Math.floor(index / 5) * 20 + 10}`).join(' ')
  return <div className={styles.board} data-mines-board data-secured={secured || undefined} role="group" aria-label={copy.board}>
    {Array.from({ length: 25 }, (_, index) => {
      const order = round.safe.indexOf(index), safe = order >= 0, mine = round.revealedMines.includes(index), hit = round.hit === index
      return <button type="button" key={index} className={styles.tile} data-tile={index} data-safe={safe || undefined} data-mine={mine || undefined} data-hit={hit || undefined}
        disabled={round.phase !== 'active' || safe} aria-label={`${copy.tile} ${Math.floor(index / 5) + 1}, ${index % 5 + 1}: ${safe ? copy.safe : mine ? copy.mine : copy.hidden}`}
        onClick={() => pick(index)}>
        {safe || mine ? <Treasure hazard={mine}/> : <span className={styles.seal} aria-hidden="true">✧</span>}
        {safe && <small className={styles.order} aria-hidden="true">{order + 1}</small>}
        {hit && <span className={styles.dust} aria-hidden="true"/>}
      </button>
    })}
    <svg className={styles.trail} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-treasure-trail data-safe-count={round.safe.length}>
      {round.safe.length > 1 && <><polyline points={points} fill="none" stroke="#efc968" strokeWidth="2.1" opacity=".22"/><polyline points={points} fill="none" stroke="#ffe4a1" strokeWidth=".65" strokeLinejoin="round" strokeLinecap="round"/></>}
    </svg>
  </div>
}
