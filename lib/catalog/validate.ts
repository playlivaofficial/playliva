import { contentLocale } from '@/lib/locale'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { GAMES, CATEGORIES, COMPARISONS, GAME_LISTS, OPERATORS, offersByCountry } from '@/lib/data'
import { getGameContent } from '@/lib/content'
import { REFERENCE_GAMES } from './games'
import { PROVIDERS } from './providers'
import { REFERENCE_COMPARISONS, REFERENCE_READING_LISTS } from './editorial'
import { REFERENCE_PATHS } from './paths'
import type { ReferenceGame } from './types'
import { RTP_EVIDENCE, validRtpEvidence } from '@/lib/rtp'

const ARTWORK_HOSTS = new Set(['bsw-dk1.pragmaticplay.net', 'www.pragmaticplay.com', 'static.wixstatic.com', 'games.evolution.com', 'cdn.prod.website-files.com', 'cdn2.softswiss.net'])
const OFFICIAL_SOURCES = new Set(['pragmatic-play-official', 'playngo-official', 'evolution-official', 'smartsoft-official'])
const CATALOG_SOURCES = new Set(['catalog-softswiss'])
const publicRoot = join(process.cwd(), 'public')

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
  const usedArtworkPaths = new Set<string>()
  for (const [slug, evidence] of Object.entries(RTP_EVIDENCE)) {
    const legacy = GAMES.find(game => game.slug === slug)
    const reference = games.find(game => game.slug === slug)
    const provider = legacy?.provider ?? PROVIDERS.find(item => item.id === reference?.providerId)?.name ?? ''
    check(Boolean(legacy || reference) && validRtpEvidence(evidence, slug, provider), `${slug}: invalid RTP provenance or edition`)
  }
  for (const provider of PROVIDERS) for (const locale of locales) check(provider.overview[contentLocale(locale)]?.trim(), `${provider.id}: missing ${locale} overview`)
  for (const game of games) {
    const label = game.slug || game.id
    check(/^m11-\d{2}$/.test(game.id), `${label}: invalid stable ID`)
    check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.slug), `${label}: invalid slug`)
    check(game.title?.trim(), `${label}: missing title`)
    check(providers.has(game.providerId), `${label}: invalid provider`)
    check(categories.has(game.category), `${label}: invalid category`)
    check(game.artwork?.verifiedAt === game.verifiedAt && /^\d{4}-\d{2}-\d{2}$/.test(game.verifiedAt), `${label}: missing verification timestamp`)
    validateArtwork(game, check, usedArtworkPaths)
    check(game.availability?.status === 'unverified' && game.availability?.operatorEvidence?.length === 0, `${label}: unauthorized availability claim`)
    check(game.sources?.length, `${label}: missing official evidence`)
    for (const source of game.sources ?? []) {
      try { const url = new URL(source); check(url.protocol === 'https:' && ['www.pragmaticplay.com', 'www.playngo.com', 'games.evolution.com', 'www.smartsoftgaming.com', 'spribe.co'].includes(url.hostname), `${label}: invalid source URL`) }
      catch { errors.push(`${label}: invalid source URL`) }
    }
    for (const locale of locales) {
      const content = game.content?.[contentLocale(locale)]
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
    for (const locale of locales) check(item.shared[contentLocale(locale)]?.trim() && item.difference[contentLocale(locale)]?.length === 2 && item.difference[contentLocale(locale)].every(value => value.trim()), `${item.slug}: missing comparison localization ${locale}`)
  }
  unique(REFERENCE_READING_LISTS.map(item => item.slug), 'Games Like slugs')
  for (const list of REFERENCE_READING_LISTS) {
    check(slugs.has(list.slug) && list.alternatives.length >= 3, `${list.slug}: broken Games Like source`)
    for (const item of list.alternatives) {
      check(slugs.has(item.slug) && item.slug !== list.slug, `${list.slug}: broken Games Like reference ${item.slug}`)
      for (const locale of locales) check(item.reason[contentLocale(locale)]?.trim() && list.intro[contentLocale(locale)]?.trim(), `${list.slug}: missing Games Like localization ${locale}`)
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

function validateArtwork(game: ReferenceGame, check: (condition: unknown, message: string) => void, usedPaths: Set<string>) {
  const label = game.slug || game.id
  const art = game.artwork
  if (!art) { check(false, `${label}: missing or invalid artwork/provenance`); return }
  if (art.status === 'fallback') {
    check(art.source === 'playliva-neutral' && art.sourceUrl === null && art.rightsStatus === 'pending-rights', `${label}: missing or invalid artwork/provenance`)
    return
  }
  check((art.status === 'official' && OFFICIAL_SOURCES.has(art.source)) || (art.status === 'approved' && CATALOG_SOURCES.has(art.source)), `${label}: missing or invalid artwork/provenance`)
  check(art.rightsStatus === 'approved' && typeof art.sourceUrl === 'string' && typeof art.assetPath === 'string', `${label}: missing or invalid artwork/provenance`)
  try {
    const url = new URL(art.sourceUrl)
    check(url.protocol === 'https:' && ARTWORK_HOSTS.has(url.hostname), `${label}: missing or invalid artwork/provenance`)
  } catch { check(false, `${label}: missing or invalid artwork/provenance`) }
  check(art.assetPath === `/catalog/covers/${game.slug}.webp`, `${label}: missing or invalid artwork/provenance`)
  check(art.width >= 300 && art.height >= 300, `${label}: missing or invalid artwork/provenance`)
  const webp = join(publicRoot, art.assetPath.slice(1))
  const avif = join(publicRoot, art.assetPath.replace(/\.webp$/, '.avif').slice(1))
  check(existsSync(webp) && existsSync(avif), `${label}: missing or invalid artwork/provenance`)
  check(!usedPaths.has(art.assetPath), `${label}: missing or invalid artwork/provenance`)
  usedPaths.add(art.assetPath)
}
