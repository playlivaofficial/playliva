import { privateCampaign } from './campaign-references'

/** Imported only by the server redirect. Missing/invalid secrets fail closed.
 * Environment values are never returned to page props or analytics. */
export function serverDestination(reference: string): string | null {
  const campaign = privateCampaign(reference)
  if (!campaign) return reference.startsWith('https://') ? reference : null
  try {
    const config: unknown = JSON.parse(process.env.PLAYLIVA_AFFILIATE_DESTINATIONS ?? '{}')
    if (!config || typeof config !== 'object') return null
    const value = (config as Record<string, unknown>)[campaign.key]
    if (typeof value !== 'string') return null
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== campaign.host || url.username || url.password || url.port) return null
    // Preserve configured functional/consented templates without inventing subIDs.
    campaign.parameters.forEach((item, key) => url.searchParams.append(key, item))
    if (campaign.fragment) url.hash = campaign.fragment
    return url.toString()
  } catch { return null }
}
