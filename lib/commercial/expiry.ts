import { isCommercialGeo } from '../geo'
import { emptyCommercialSnapshot, type CommercialSnapshot } from './types'

/** A cached public snapshot cannot extend the server-validated review period.
 * Remove dependent records together; a different current operator stays intact. */
export function currentCommercialSnapshot(snapshot: CommercialSnapshot, now = Date.now()): CommercialSnapshot {
  if (!isCommercialGeo(snapshot.geo)) return emptyCommercialSnapshot()
  const operators = snapshot.operators.filter(operator => operator.commercialLegal?.status === 'verified' &&
    typeof operator.commercialLegal.reviewBy === 'string' && Date.parse(operator.commercialLegal.reviewBy) > now)
  if (operators.length === snapshot.operators.length) return snapshot
  const ids = new Set(operators.map(operator => operator.id))
  return { ...snapshot, operators, offers: snapshot.offers.filter(offer => ids.has(offer.operatorId)),
    campaigns: snapshot.campaigns.filter(campaign => ids.has(campaign.operatorId)) }
}

/** Called with the current snapshot so an elapsed deadline cannot create a
 * zero-delay loop, and the next remaining operator gets its own timer. */
export function nextCommercialReviewExpiry(snapshot: CommercialSnapshot): number | undefined {
  const deadline = Math.min(...snapshot.operators.map(operator => Date.parse(operator.commercialLegal?.reviewBy ?? '')))
  return Number.isFinite(deadline) ? deadline : undefined
}
