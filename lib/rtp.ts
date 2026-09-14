import type { Locale } from './types'

export interface RtpEvidence {
  gameSlug: string
  provider: string
  /** Exact provider-published percent, retained without estimation. */
  publishedPercent: string
  source: string
  verifiedAt: string
  variant: Record<Locale, string>
}

// Public provider specifications, not a claim about any operator's configured version.
export const RTP_EVIDENCE: Readonly<Record<string, RtpEvidence>> = {
  aviator: {
    gameSlug: 'aviator', provider: 'Spribe', publishedPercent: '97%',
    source: 'https://spribe.co/games/aviator', verifiedAt: '2026-09-14',
    variant: { en: 'SPRIBE Aviator — public product specification', 'pt-BR': 'Aviator da SPRIBE — especificação pública do produto', 'es-MX': 'Aviator de SPRIBE — especificación pública del producto' },
  },
  'spribe-dice': {
    gameSlug: 'spribe-dice', provider: 'SPRIBE', publishedPercent: '97%',
    source: 'https://spribe.co/games/dice', verifiedAt: '2026-09-14',
    variant: { en: 'SPRIBE Dice — numerical threshold edition', 'pt-BR': 'Dice da SPRIBE — edição de limite numérico', 'es-MX': 'Dice de SPRIBE — edición de umbral numérico' },
  },
  'spribe-keno': {
    gameSlug: 'spribe-keno', provider: 'SPRIBE', publishedPercent: '97%',
    source: 'https://spribe.co/games/keno', verifiedAt: '2026-09-14',
    variant: { en: 'SPRIBE Keno — 36 numbers, not Keno 80', 'pt-BR': 'Keno da SPRIBE — 36 números, não Keno 80', 'es-MX': 'Keno de SPRIBE — 36 números, no Keno 80' },
  },
}

export function validRtpEvidence(evidence: RtpEvidence | undefined, slug: string, provider: string): evidence is RtpEvidence {
  if (!evidence || evidence.gameSlug !== slug || evidence.provider.toLowerCase() !== provider.toLowerCase() ||
    !/^\d{1,2}(?:\.\d{1,4})?%$|^100(?:\.0{1,4})?%$/.test(evidence.publishedPercent) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(evidence.verifiedAt) || !Number.isFinite(Date.parse(evidence.verifiedAt)) ||
    !['en', 'pt-BR', 'es-MX'].every(locale => evidence.variant?.[locale as Locale]?.trim())) return false
  const sources: Record<string, string> = { aviator: '/games/aviator', 'spribe-dice': '/games/dice', 'spribe-keno': '/games/keno' }
  // Extending coverage requires an explicit source/edition review, not just any provider URL.
  return Boolean(sources[slug]) && evidence.source === `https://spribe.co${sources[slug]}`
}

export function getRtpEvidence(slug: string, provider: string): RtpEvidence | undefined {
  const evidence = RTP_EVIDENCE[slug]
  return validRtpEvidence(evidence, slug, provider) ? evidence : undefined
}
