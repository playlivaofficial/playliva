import { isCommercialGeo, type CommercialGeo } from '../geo'

const KEY = /^[a-z0-9][a-z0-9_-]{0,79}$/
export function isCommercialKey(value: unknown): value is string { return typeof value === 'string' && KEY.test(value) }
export function commercialReference(geo: CommercialGeo, operatorId: string, campaignKey: string): string {
  return `playliva-affiliate:${geo}:${operatorId}:${campaignKey}`
}
export function parseCommercialReference(value: unknown): { geo: CommercialGeo; operatorId: string; campaignKey: string } | null {
  if (typeof value !== 'string') return null
  const parts = value.split(':')
  if (parts.length !== 4 || parts[0] !== 'playliva-affiliate' || !isCommercialGeo(parts[1]) || !isCommercialKey(parts[2]) || !isCommercialKey(parts[3])) return null
  return { geo: parts[1], operatorId: parts[2], campaignKey: parts[3] }
}
