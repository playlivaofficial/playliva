'use client'

import { CalendarDays, Check } from 'lucide-react'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { useTranslation } from '@/components/country-context'
import type { DateFilterValue } from '@/lib/sports-data'

const OPTIONS: Array<{ value: DateFilterValue | 'all'; key: string }> = [
  { value: 'all', key: 'sports.dateAll' },
  { value: 'today', key: 'sports.dateToday' },
  { value: 'tomorrow', key: 'sports.dateTomorrow' },
  { value: 'upcoming', key: 'sports.dateUpcoming' },
]

export function DateFilter({
  value,
  onChange,
}: {
  value: DateFilterValue | 'all'
  onChange: (value: DateFilterValue | 'all') => void
}) {
  const { t } = useTranslation()
  const activeLabel = t(OPTIONS.find((o) => o.value === value)?.key ?? 'sports.dateAll')

  return (
    <Dropdown
      label={t('sports.filterDate')}
      trigger={
        <>
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          {activeLabel}
        </>
      }
    >
      {(close) => (
        <>
          {OPTIONS.map((opt) => (
            <DropdownItem
              key={opt.value}
              active={opt.value === value}
              onClick={() => {
                onChange(opt.value)
                close()
              }}
            >
              {opt.value === value && <Check className="size-3.5" aria-hidden />}
              {t(opt.key)}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  )
}
