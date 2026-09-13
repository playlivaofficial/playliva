import type { CatalogSummary } from './types'

export const CATALOG_PAGE_SIZE = 12
export const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[’']/g, '').trim()
export function filterCatalog(entries: CatalogSummary[], query = '', category = 'all', provider = 'all') {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean)
  return entries.filter(game => (category === 'all' || game.category === category) &&
    (provider === 'all' || game.providerId === provider) &&
    words.every(word => game.searchText.includes(word)))
}
