'use client'

import { Check, Trophy } from 'lucide-react'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { useTranslation } from '@/components/country-context'
import type { League } from '@/lib/sports-types'

export function LeagueFilter({
  leagues,
  value,
  onChange,
}: {
  leagues: League[]
  value: string | 'all'
  onChange: (value: string | 'all') => void
}) {
  const { t } = useTranslation()
  const activeLabel =
    value === 'all' ? t('sports.allLeagues') : leagues.find((l) => l.id === value)?.name

  return (
    <Dropdown
      label={t('sports.filterLeague')}
      trigger={
        <>
          <Trophy className="size-4 text-muted-foreground" aria-hidden />
          {activeLabel}
        </>
      }
    >
      {(close) => (
        <>
          <DropdownItem
            active={value === 'all'}
            onClick={() => {
              onChange('all')
              close()
            }}
          >
            {value === 'all' && <Check className="size-3.5" aria-hidden />}
            {t('sports.allLeagues')}
          </DropdownItem>
          {leagues.map((league) => (
            <DropdownItem
              key={league.id}
              active={value === league.id}
              onClick={() => {
                onChange(league.id)
                close()
              }}
            >
              {value === league.id && <Check className="size-3.5" aria-hidden />}
              {league.name}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  )
}
