'use client'

import { useMemo, useState } from 'react'
import { useCountry } from '@/components/country-context'
import { Input } from '@/components/ui/input'
import { LocaleLink } from '@/components/locale-link'
import { catalogCopy } from '@/lib/catalog/copy'
import { CATALOG_PAGE_SIZE, filterCatalog } from '@/lib/catalog/query'
import type { CatalogSummary } from '@/lib/catalog/types'
import { CatalogCard } from './catalog-card'
import styles from './catalog.module.css'

export function CatalogExplorer({ entries, compact = false }: { entries: CatalogSummary[]; compact?: boolean }) {
  const { locale, t } = useCountry()
  const c = catalogCopy(locale)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [provider, setProvider] = useState('all')
  const [page, setPage] = useState(1)
  const categories = useMemo(() => [...new Map(entries.map(g => [g.category, g.categoryLabel])).entries()], [entries])
  const providers = useMemo(() => [...new Map(entries.map(g => [g.providerId, g.provider])).entries()].sort((a, b) => a[1].localeCompare(b[1])), [entries])
  const results = useMemo(() => filterCatalog(entries, query, category, provider), [entries, query, category, provider])
  const pages = Math.max(1, Math.ceil(results.length / CATALOG_PAGE_SIZE))
  const current = Math.min(page, pages)
  function clear() { setQuery(''); setCategory('all'); setProvider('all'); setPage(1) }
  return <div data-catalog-explorer className={styles.explorer}>
    <div className={styles.tools}>
      <label className={styles.search}>{c.search}<Input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} placeholder={c.search} /></label>
      {!compact && <label>{c.category}<select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}><option value="all">{c.all}</option>{categories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
      {providers.length > 1 && <label>{c.provider}<select value={provider} onChange={e => { setProvider(e.target.value); setPage(1) }}><option value="all">{c.allProviders}</option>{providers.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
    </div>
    <div className={styles.resultLine}>
      <p role="status" aria-live="polite">{results.length} {c.results} · {c.sort}</p>
      {(query || category !== 'all' || provider !== 'all') && <button onClick={clear}>{c.clear}</button>}
      {!compact && <LocaleLink href="/providers">{c.providers} →</LocaleLink>}
    </div>
    {results.length ? <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-catalog-results>
      {results.slice((current - 1) * CATALOG_PAGE_SIZE, current * CATALOG_PAGE_SIZE).map(game => <CatalogCard key={game.id} game={game} readLabel={game.reference ? c.read : t('cta.viewGame')} />)}
    </div> : <div className={styles.empty}><p>{c.empty}</p><button onClick={clear}>{c.clear}</button></div>}
    {pages > 1 && <nav aria-label={`${c.page} — ${c.games}`} className={styles.pagination}>
      <button disabled={current <= 1} onClick={() => setPage(current - 1)}>{c.previous}</button>
      <span>{c.page} {current} {c.of} {pages}</span>
      <button disabled={current >= pages} onClick={() => setPage(current + 1)}>{c.next}</button>
    </nav>}
  </div>
}
