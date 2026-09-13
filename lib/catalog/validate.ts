import { GAMES, CATEGORIES, COMPARISONS, GAME_LISTS, OPERATORS, offersByCountry } from '@/lib/data'
import { getGameContent } from '@/lib/content'
import { REFERENCE_GAMES } from './games'
import { PROVIDERS } from './providers'
import { REFERENCE_COMPARISONS, REFERENCE_READING_LISTS } from './editorial'
import { REFERENCE_PATHS } from './paths'
import type { ReferenceGame } from './types'

export function validateCatalog(games: ReferenceGame[] = REFERENCE_GAMES): string[] {
  const errors: string[] = []
  const check = (condition: unknown, message: string) => { if (!condition) errors.push(message) }
  const unique = (items: string[], label: string) => check(new Set(items).size === items.length, `Duplicate ${label}`)
  const locales = ['en', 'pt-BR', 'es-MX'] as const
  const ids = new Set([...GAMES, ...games].map(game => game.id))
  const legacyIds = new Set(GAMES.map(game => game.id))
  const slugs = new Set(games.map(game => game.slug))
  const categories = new Set(CATEGORIES.map(category => category.slug))
  const providers = new Set(PROVIDERS.map(provider => provider.id))
  unique([...GAMES, ...games].map(game => game.id), 'game IDs')
  unique([...GAMES, ...games].map(game => game.slug), 'game slugs')
  unique(PROVIDERS.map(provider => provider.id), 'provider IDs')
  unique(REFERENCE_PATHS, 'sitemap reference paths')
  for (const provider of PROVIDERS) for (const locale of locales) check(provider.overview[locale]?.trim(), `${provider.id}: missing ${locale} overview`)
  for (const game of games) {
    const label = game.slug || game.id
    check(/^m11-\d{2}$/.test(game.id), `${label}: invalid stable ID`)
    check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug), `${label}: invalid slug`)
    check(game.title?.trim(), `${label}: missing title`)
    check(providers.has(game.providerId), `${label}: invalid provider`)
    check(categories.has(game.category), `${label}: invalid category`)
    check(game.artwork?.status === 'fallback' && game.artwork?.source === 'playliva-neutral' && game.artwork?.sourceUrl === null && game.artwork?.rightsStatus === 'pending-rights', `${label}: missing or invalid artwork/provenance`)
    check(game.artwork?.verifiedAt === game.verifiedAt && /^\d{4}-\d{2}-\d{2}$/.test(game.verifiedAt), `${label}: missing verification timestamp`)
    check(game.availability?.status === 'unverified' && game.availability?.operatorEvidence?.length === 0, `${label}: unauthorized availability claim`)
    check(game.sources?.length, `${label}: missing official evidence`)
    for (const source of game.sources ?? []) {
      try { const url = new URL(source); check(url.protocol === 'https:' && ['www.pragmaticplay.com', 'www.playngo.com', 'games.evolution.com', 'www.smartsoftgaming.com', 'spribe.co'].includes(url.hostname), `${label}: invalid source URL`) }
      catch { errors.push(`${label}: invalid source URL`) }
    }
    for (const locale of locales) {
      const content = game.content?.[locale]
      check(content?.summary?.trim() && content?.overview?.trim() && content?.howItWorks?.trim(), `${label}: missing ${locale} localization`)
      check(content?.features?.length >= 2 && content?.features.every(item => item.trim()), `${label}: missing ${locale} mechanics`)
      check(!JSON.stringify(content ?? '').includes('\uFFFD'), `${label}: ${locale} encoding`)
    }
    check(game.relatedSlugs?.length >= 2, `${label}: missing related-game references`)
    unique(game.relatedSlugs ?? [], `${label} related references`)
    for (const slug of game.relatedSlugs ?? []) check(slugs.has(slug) && slug !== game.slug, `${label}: invalid related reference ${slug}`)
  }
  const comparisonSlugs = new Set(COMPARISONS.map(item => item.slug))
  for (const item of REFERENCE_COMPARISONS) {
    check(!comparisonSlugs.has(item.slug), `Duplicate comparison ${item.slug}`); comparisonSlugs.add(item.slug)
    check(slugs.has(item.a) && slugs.has(item.b) && item.a !== item.b, `${item.slug}: broken comparison references`)
    for (const locale of locales) check(item.shared[locale]?.trim() && item.difference[locale]?.length === 2 && item.difference[locale].every(value => value.trim()), `${item.slug}: missing comparison localization ${locale}`)
  }
  unique(REFERENCE_READING_LISTS.map(item => item.slug), 'Games Like slugs')
  for (const list of REFERENCE_READING_LISTS) {
    check(slugs.has(list.slug) && list.alternatives.length >= 3, `${list.slug}: broken Games Like source`)
    for (const item of list.alternatives) {
      check(slugs.has(item.slug) && item.slug !== list.slug, `${list.slug}: broken Games Like reference ${item.slug}`)
      for (const locale of locales) check(item.reason[locale]?.trim() && list.intro[locale]?.trim(), `${list.slug}: missing Games Like localization ${locale}`)
    }
  }
  const legacyProviders = new Set(['Spribe', 'SmartSoft', 'Pragmatic Play', 'Evolution'])
  for (const game of GAMES) {
    check(legacyProviders.has(game.provider), `${game.slug}: invalid legacy provider`)
    check(categories.has(game.category), `${game.slug}: invalid legacy category`)
    check(['official', 'approved', 'pending', 'placeholder'].includes(game.assetStatus), `${game.slug}: invalid legacy artwork status`)
    check(['approved', 'permission-required', 'unknown'].includes(game.assetRightsStatus), `${game.slug}: invalid legacy artwork rights`)
    for (const id of [...game.relatedGameIds, ...game.comparisonGameIds]) check(legacyIds.has(id), `${game.slug}: invalid legacy game reference ${id}`)
    for (const locale of locales) check(getGameContent(game, locale)?.shortDescription?.trim(), `${game.slug}: missing legacy localization ${locale}`)
  }
  for (const item of COMPARISONS) check(ids.has(item.gameAId) && ids.has(item.gameBId), `${item.slug}: invalid legacy comparison`)
  for (const list of GAME_LISTS) for (const id of list.gameIds) check(legacyIds.has(id), `${list.slug}: invalid game list reference ${id}`)
  const offers = Object.values(offersByCountry).flat()
  const operatorIds = new Set(OPERATORS.map(operator => operator.id)), offerIds = new Set(offers.map(offer => offer.id))
  for (const operator of OPERATORS) {
    for (const values of Object.values(operator.verifiedGames ?? {})) for (const id of values ?? []) check(legacyIds.has(id), `${operator.slug}: invalid verified game ${id}`)
    for (const id of operator.verifiedOffers ?? []) check(offerIds.has(id), `${operator.slug}: invalid offer reference ${id}`)
  }
  for (const offer of offers) check(operatorIds.has(offer.operatorId), `${offer.id}: invalid operator reference`)
  return errors
}
