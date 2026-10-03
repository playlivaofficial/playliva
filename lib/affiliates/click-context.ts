import { resolveDestination } from '../affiliate'
import type { CountryCode } from '../types'
import { parseCommercialReference } from '../commercial/references'
import type { CommercialSnapshot } from '../commercial/types'

/** Identify the configured campaign from the actual internal CTA href, keeping
 * redirect context separate from the analytics page-family classification. */
export function campaignForGoHref(href: string, snapshot?: CommercialSnapshot): string | undefined {
  if (!href.startsWith('/go?')) return undefined
  const params = new URLSearchParams(href.slice(4))
  const resolved = resolveDestination({ country: params.get('country') as CountryCode,
    operatorSlug: params.get('operator'), offerId: params.get('offer'), category: params.get('category'),
    gameSlug: params.get('game'), matchSlug: params.get('match'), pageType: params.get('page'),
    pageSlug: params.get('pageSlug'), placement: params.get('placement') ?? params.get('cta'),
  }, snapshot)
  return parseCommercialReference(resolved?.url)?.campaignKey
}
