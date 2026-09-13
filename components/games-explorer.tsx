'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { GameCard } from '@/components/game-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORIES, GAMES } from '@/lib/data'
import { getCategoryContent, getGameContent } from '@/lib/content'
import { useCountry } from '@/components/country-context'
import type { CategorySlug } from '@/lib/types'
import { cn } from '@/lib/utils'
import { discoveryCategory, DISCOVERY_ORDER } from '@/lib/product-discovery'

type Filter = 'all' | CategorySlug
type Sort = 'popular' | 'new' | 'az'

export function GamesExplorer() {
  const { t, locale } = useCountry()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('popular')

  const sorts: { value: Sort; label: string }[] = [
    { value: 'popular', label: t('games.sortPopular') },
    { value: 'new', label: t('games.sortNewest') },
    { value: 'az', label: t('games.sortAZ') },
  ]

  const games = useMemo(() => {
    let list = [...GAMES]
    if (filter !== 'all') list = list.filter((g) => discoveryCategory(g) === filter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((g) => {
        const c = getGameContent(g, locale)
        const cat = getCategoryContent(discoveryCategory(g), locale)
        return (
          g.title.toLowerCase().includes(q) ||
          g.provider.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q) ||
          c.shortDescription.toLowerCase().includes(q)
        )
      })
    }
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'new')
      list.sort((a, b) => (b.tag === 'New' ? 1 : 0) - (a.tag === 'New' ? 1 : 0))
    if (sort === 'popular')
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    return list
  }, [filter, query, sort, locale])

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('games.all')}
          </FilterChip>
          {DISCOVERY_ORDER.map(slug => CATEGORIES.find(c => c.slug === slug)!).filter((c) =>
            GAMES.some((g) => discoveryCategory(g) === c.slug),
          ).map((c) => (
            <FilterChip
              key={c.slug}
              active={filter === c.slug}
              onClick={() => setFilter(c.slug)}
            >
              {getCategoryContent(c.slug, locale).name}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('games.searchPlaceholder')}
              aria-label={t('games.searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('games.sortBy')}</span>
        {sorts.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSort(s.value)}
            aria-pressed={sort === s.value}
            className={cn(
              'min-h-11 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors',
              sort === s.value
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground" role="status">
          {t('games.resultsCount', { count: games.length })}
        </span>
      </div>

      {games.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">{t('games.empty')}</p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery('')
              setFilter('all')
            }}
          >
            {t('games.clearFilters')}
          </Button>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-11 rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
