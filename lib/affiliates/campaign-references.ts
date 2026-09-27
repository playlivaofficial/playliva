/** Public campaign keys, never partner tracking IDs or destinations. */
export const PRIVATE_CAMPAIGNS = {
  'betsson-br-brand': { operatorId: 'op-betsson', host: 'record.betsson.bet.br' },
  'betsson-br-crash': { operatorId: 'op-betsson', host: 'record.betsson.bet.br' },
  'betsson-br-live-casino': { operatorId: 'op-betsson', host: 'record.betsson.bet.br' },
  'betsson-br-promo': { operatorId: 'op-betsson', host: 'record.betsson.bet.br' },
} as const

export function privateCampaign(value: string | undefined) {
  if (!value?.startsWith('playliva-affiliate:')) return null
  try {
    const url = new URL(value), key = url.pathname
    if (!Object.hasOwn(PRIVATE_CAMPAIGNS, key) || url.host) return null
    return { key: key as keyof typeof PRIVATE_CAMPAIGNS, ...PRIVATE_CAMPAIGNS[key as keyof typeof PRIVATE_CAMPAIGNS], parameters: url.searchParams, fragment: url.hash }
  } catch { return null }
}
