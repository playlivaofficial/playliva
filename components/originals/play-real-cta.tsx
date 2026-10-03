'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { AffiliateDisclosureLine } from '@/components/notices'
import { useCountry } from '@/components/country-context'
import { originalsCopy } from '@/lib/originals/copy'
import { getOriginalOperatorCtas, type OperatorCtaOption } from '@/lib/originals/play-real'
import { trackFreePlay, type FreePlayEventContext } from '@/lib/originals/analytics'
import type { OriginalGameDefinition } from '@/lib/originals/definition'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import { LIVA_BLACKJACK } from '@/lib/originals/blackjack/definition'
import { LIVA_ROULETTE } from '@/lib/originals/roulette/config'
import { rouletteCopy } from '@/lib/originals/roulette/copy'
import { minesCopy } from '@/lib/originals/mines/copy'
import { CommercialAdDisclosure } from '@/components/affiliates/commercial-ad-disclosure'

function OperatorLink({ option, context, label }: {
  option: OperatorCtaOption
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
  return <Button size="lg" className="min-h-11 min-w-11 w-full whitespace-normal px-4 sm:w-auto" render={<a ref={ref} href={option.href} target="_blank"
    rel="sponsored noopener noreferrer" data-cta-mode={option.mode} onClick={() => trackFreePlay('play_real_click', {
      ...context, operatorSlug: option.operatorSlug,
    })} />}>{label}</Button>
}

export function PlayRealCTA({ game }: { game: OriginalGameDefinition }) {
  const { countryCode, marketCode, locale, t, commercial } = useCountry()
  const copy = originalsCopy(locale)
  const blackjack = game.id === LIVA_BLACKJACK.id
  const roulette = game.id === LIVA_ROULETTE.id
  const options = marketCode ? getOriginalOperatorCtas(game, marketCode, locale, commercial) : []
  const mode = options[0]?.mode ?? 'none'
  const context = { originalId: game.id, originalSlug: game.slug, category: game.category, country: countryCode, locale }
  const generic = mode === 'generic-brand'
  const boundary = generic ? t('affiliate.genericBoundary')
    : roulette ? rouletteCopy(locale).realBoundary
    : blackjack ? blackjackCopy(locale).realBoundary
    : game.category === 'crash' ? copy.crashRealBoundary
    : game.id === 'liva-capybara-gold' ? copy.slotsRealBoundary
    : game.id === 'liva-mines' ? minesCopy(locale).realBoundary
    : copy.realBoundary
  const heading = generic ? t('affiliate.exploreNamed', { name: options[0].name }) : copy.playReal
  const logo = options[0] ? commercial.operators.find(item => item.slug === options[0].operatorSlug)?.logo : undefined
  return <aside className="space-y-2 rounded-2xl border border-border bg-card p-3 sm:p-4" aria-label={heading}
    data-operator-cta="play-real" data-operator-cta-mode={mode}
    data-commercial-ad={options.length ? "" : undefined}>
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
      {logo ? <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
        <Image src={logo} alt="" width={40} height={40} className="size-10 object-cover" />
      </div> : null}
      <div className="min-w-0 flex-1">
        {options.length > 0 && <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-primary">{t('affiliate.sponsored')}</p>}
        <h2 className="font-display text-base font-semibold leading-tight sm:text-lg">{heading}</h2>
      </div>
      {options.length ? <div className="flex w-full min-w-0 flex-wrap gap-3 sm:w-auto">{options.map(option =>
        <OperatorLink key={`${countryCode}:${game.category}:${option.mode}:${option.operatorSlug}`} option={option} context={context}
          label={generic ? t('affiliate.visitNamed', { name: option.name }) : `${copy.playReal} · ${option.name}`} />,
      )}</div> : null}
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{boundary}</p>
    {roulette && options.length > 0 && <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{rouletteCopy(locale).verifiedReferral}</p>}
    {blackjack && options.length > 0 && <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{blackjackCopy(locale).verifiedReferral}</p>}
    {options.length === 0 && <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{copy.noOperators}</p>}
    {options.length > 0 && <AffiliateDisclosureLine />}
    {options.length > 0 && <CommercialAdDisclosure operatorId={commercial.operators.find(item => item.slug === options[0].operatorSlug)?.id ?? ''} />}
  </aside>
}
