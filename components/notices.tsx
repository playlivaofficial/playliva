'use client'

import { Info, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'

export function AffiliateDisclosure({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground',
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p className="text-pretty leading-relaxed">{t('notice.affiliate')}</p>
    </div>
  )
}

/**
 * Compact, single-line affiliate disclosure for placement near affiliate
 * CTAs (e.g. "Where to Play" operator lists). Deliberately unboxed — no
 * border/background — so it reads as a small legal footnote rather than a
 * prominent UI block. Links to the full disclosure page for complete
 * compliance text; keeps the same underlying `notice.affiliateShort`
 * copy across all locales.
 */
export function AffiliateDisclosureLine({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {t('notice.affiliateShort')}{' '}
      <LocaleLink
        href="/affiliate-disclosure"
        className="underline underline-offset-2 hover:text-foreground"
      >
        {t('footer.affiliateDisclosure')}
      </LocaleLink>
    </p>
  )
}

export function ResponsibleNotice({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        className,
      )}
    >
      <span className="inline-grid size-5 place-items-center rounded border border-primary/40 text-[10px] font-bold text-primary">
        {t('notice.age')}
      </span>
      {t('notice.responsibleShort')}
    </p>
  )
}

export function ResponsibleGamingNotice({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground',
        className,
      )}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p className="text-pretty leading-relaxed">{t('notice.responsibleFull')}</p>
    </div>
  )
}

export function TrustLine({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {t('notice.trust')}
    </p>
  )
}
