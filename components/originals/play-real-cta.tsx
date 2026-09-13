'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useCountry } from '@/components/country-context'
import { originalsCopy } from '@/lib/originals/copy'
import { getPlayRealOptions } from '@/lib/originals/play-real'
import { trackFreePlay, type FreePlayEventContext } from '@/lib/originals/analytics'
import type { OriginalGameDefinition } from '@/lib/originals/definition'
import { getVerifiedBlackjackReferrals } from '@/lib/originals/blackjack/play-real'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import { LIVA_BLACKJACK } from '@/lib/originals/blackjack/definition'
import { LIVA_ROULETTE } from '@/lib/originals/roulette/config'
import { rouletteCopy } from '@/lib/originals/roulette/copy'
import { getVerifiedRouletteReferrals } from '@/lib/originals/roulette/play-real'

function OperatorLink({ option, context, label }: {
  option: ReturnType<typeof getPlayRealOptions>[number]
  context: FreePlayEventContext
  label: string
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const { originalId, originalSlug, category, country, locale } = context
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        trackFreePlay('play_real_view', { originalId, originalSlug, category, country, locale, operatorSlug: option.operatorSlug })
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [originalId, originalSlug, category, country, locale, option.operatorSlug])
  return <Button size="lg" render={<a ref={ref} href={option.href} target="_blank"
    rel="sponsored noopener noreferrer" onClick={() => trackFreePlay('play_real_click', {
      ...context, operatorSlug: option.operatorSlug,
    })} />}>{label} · {option.name}</Button>
}

export function PlayRealCTA({ game }: { game: OriginalGameDefinition }) {
  const { countryCode, locale } = useCountry()
  const copy = originalsCopy(locale)
  const blackjack = game.id === LIVA_BLACKJACK.id
  const roulette = game.id === LIVA_ROULETTE.id
  const options = roulette ? getVerifiedRouletteReferrals(countryCode, locale) : blackjack ? getVerifiedBlackjackReferrals(countryCode, locale) : getPlayRealOptions(countryCode, game.category, locale)
  const context = { originalId: game.id, originalSlug: game.slug, category: game.category, country: countryCode, locale }
  return <aside className="space-y-3 rounded-2xl border border-border bg-card p-5" aria-label={copy.playReal}>
    <h2 className="font-display text-lg font-semibold">{copy.playReal}</h2>
    <p className="text-sm text-muted-foreground">{roulette ? rouletteCopy(locale).realBoundary : blackjack ? blackjackCopy(locale).realBoundary : game.category === 'crash' ? copy.crashRealBoundary : game.id === 'liva-capybara-gold' ? copy.slotsRealBoundary : copy.realBoundary}</p>
    {roulette && options.length > 0 && <p className="text-sm text-muted-foreground">{rouletteCopy(locale).verifiedReferral}</p>}
    {blackjack && options.length > 0 && <p className="text-sm text-muted-foreground">{blackjackCopy(locale).verifiedReferral}</p>}
    {options.length ? <div className="flex flex-wrap gap-3">{options.map(option =>
      <OperatorLink key={`${countryCode}:${game.category}:${option.operatorSlug}`} option={option} context={context} label={copy.playReal} />,
    )}</div> : <p className="text-sm text-muted-foreground">{copy.noOperators}</p>}
  </aside>
}
