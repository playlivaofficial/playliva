'use client'

import { type ComponentProps } from 'react'
import { OperatorCard } from '@/components/operator-card'
import { BetssonDiscoveryOffer } from '@/components/affiliates/betsson-discovery-offer'
import { useCountry } from '@/components/country-context'
import { BETSSON_PROMO, BETSSON_PROMO_PLACEMENTS, getBetssonPromo } from '@/lib/affiliates/betsson-promo'

/**
 * Where-to-Play grid item. Multi-operator discovery stays intact; only the
 * Betsson card is swapped for the live campaign card when the central promo
 * resolves for the visitor's market. Every other operator, and Betsson when no
 * campaign is live, renders the existing generic operator card.
 */
export function WhereToPlayOperatorCard(props: ComponentProps<typeof OperatorCard>) {
  const { countryCode, locale } = useCountry()
  const gameSlug = props.gameSlug ?? (props.pageType === 'game' || props.pageType === 'where_to_play' ? props.pageSlug : undefined)
  const promo = props.operator.id === BETSSON_PROMO.operatorId && props.country === countryCode
    ? getBetssonPromo(countryCode, locale, BETSSON_PROMO_PLACEMENTS.discoveryGame, { pageSlug: props.pageSlug })
    : null
  if (promo) return <BetssonDiscoveryOffer gameSlug={gameSlug} pageSlug={props.pageSlug} />
  return <OperatorCard {...props} />
}
