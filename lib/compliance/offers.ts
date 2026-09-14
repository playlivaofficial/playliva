import type { Offer } from '../types'

/** Publication evidence is independent from an affiliate's commercial approval. */
export function hasCurrentOfferEvidence(offer: Offer, now = Date.now()): boolean {
  const review = offer.complianceReview
  if (!offer.title?.trim() || !offer.terms?.trim() || !offer.source || !offer.lastVerifiedAt ||
    !offer.validUntil || review?.status !== 'reviewed-permitted' || review.market !== offer.country ||
    !review.legalSource) return false
  try {
    for (const value of [offer.source, review.legalSource]) {
      const url = new URL(value)
      if (url.protocol !== 'https:' || url.username || url.password ||
        /(^|\.)(example\.(com|net|org)|localhost)$/.test(url.hostname)) return false
    }
  } catch { return false }
  const verified = Date.parse(offer.lastVerifiedAt)
  const reviewed = Date.parse(review.verifiedAt)
  const deadline = Date.parse(review.reviewBy)
  return [verified, reviewed, deadline, now].every(Number.isFinite) &&
    verified <= now && reviewed <= now && now < deadline &&
    deadline > reviewed && deadline - reviewed <= 30 * 86_400_000 &&
    now - verified < 30 * 86_400_000 && Date.parse(offer.validUntil) > now
}
