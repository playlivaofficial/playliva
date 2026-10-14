import { registration } from './commercial.mjs'
import promotion from '../../lib/affiliates/promotion.ts'

// Process-local QA inventory only. Never imported by application code.
export const GEO_PARTNERS = { MX: ['Betsson', 'Winpot'], CO: ['bwin', 'Betsson'], PE: ['Inkabet', '1xBet'] }
export function geoLanguageRegistry() {
  const verifiedAt = new Date(Date.now() - 86400000).toISOString(), reviewBy = new Date(Date.now() + 7 * 86400000).toISOString()
  return Object.entries(GEO_PARTNERS).flatMap(([geo, names]) => names.map((brand, index) => {
    const key = `fixture-${geo.toLowerCase()}-${index}`, text = `QA terms ${geo} ${{MX:'MXN',CO:'COP',PE:'PEN'}[geo]}`
    const copy = Object.fromEntries(['en','pt-BR','es-MX','es-CO','es-PE'].map(locale => [locale,{headline:`QA ${brand}`,condition:text,cta:'QA visit'}]))
    return registration(geo, { id:key,slug:key,brand,priority:index?1:9,campaignKey:key,affiliateUrl:`https://partner.test/${key}`,
      offer:{ id:'promo-'+key,approved:true,active:true,cadence:{cycleMultiple:3,delayMs:0},validFrom:verifiedAt,validUntil:reviewBy,verifiedTerms:[text],copy,
        placements:[...Object.values(promotion.BANNER_SURFACES).map(item=>item.placement),'offers_page','originals_engagement_offer'],
        offer:{id:'offer-'+key,title:'QA '+brand,description:text,terms:text,category:'welcome',status:'verified',active:true,source:'https://partner.test/terms',lastVerifiedAt:verifiedAt,
          complianceReview:{status:'reviewed-permitted',market:geo,legalSource:'https://partner.test/legal',verifiedAt,reviewBy} } } })
  }))
}
