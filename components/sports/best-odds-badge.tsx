'use client'

import { BadgeCheck } from 'lucide-react'
import { useTranslation } from '@/components/country-context'
import { cn } from '@/lib/utils'

export function BestOddsBadge({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary',
        className,
      )}
    >
      <BadgeCheck className="size-3" aria-hidden />
      {t('sports.bestOdds')}
    </span>
  )
}
