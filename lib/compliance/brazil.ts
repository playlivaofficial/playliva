import type { Operator } from '../types'

export const BRAZIL_AD_RULES = {
  checkedAt: '2026-09-14',
  minimumWarningArea: 0.1,
  age: '18+',
  warnings: [
    'Ministério da Fazenda adverte: Apostar pode causar dependência',
    'Ministério da Fazenda adverte: Apostar faz você perder dinheiro',
    'Ministério da Fazenda adverte: Aposta não é investimento',
  ],
  guidance: 'https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/julho/ministerio-da-fazenda-amplia-exigencias-de-publicidade-de-apostas-no-pais',
  register: 'https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/transparencia-ativa-processos-de-autorizacao-de-apostas-de-quota-fixa/empresas-autorizadas',
} as const

export interface BrazilAuthorization {
  operatorId: string
  brand: string
  legalEntity: string
  cnpj: string
  authorizedDomain: string
  authorization: string
  source: string
  sourceUpdatedAt: string
  verifiedAt: string
  /** PlayLiva evidence-review deadline, NOT expiry of the government licence. */
  reviewBy: string
  status: 'active' | 'suspended' | 'withdrawn'
}

// This independent regulatory check never grants affiliate or game approval.
// SPA list, row 39, updated 8 September 2026; rechecked 14 September 2026.
export const BRAZIL_AUTHORIZATIONS: Readonly<Record<string, Readonly<BrazilAuthorization>>> = {
  'op-betsson': {
    operatorId: 'op-betsson', brand: 'BETSSON',
    legalEntity: 'SIMULCASTING BRASIL SOM E IMAGEM S.A.',
    cnpj: '17.385.948/0001-05', authorizedDomain: 'betsson.bet.br',
    authorization: 'SPA/MF nº 371, de 24 de fevereiro de 2025',
    source: BRAZIL_AD_RULES.register, sourceUpdatedAt: '2026-09-08',
    verifiedAt: '2026-09-14', reviewBy: '2026-10-14', status: 'active',
  },
}

export function hasCurrentBrazilEvidence(
  evidence: Readonly<BrazilAuthorization> | undefined,
  now = Date.now(),
): evidence is Readonly<BrazilAuthorization> {
  if (!evidence || evidence.status !== 'active' || !Number.isFinite(now)) return false
  const verified = Date.parse(`${evidence.verifiedAt}T00:00:00Z`)
  const review = Date.parse(`${evidence.reviewBy}T00:00:00Z`)
  return Number.isFinite(verified) && Number.isFinite(review) &&
    verified <= now && now < review && review > verified &&
    review - verified <= 30 * 86_400_000 &&
    Boolean(evidence.legalEntity && evidence.cnpj && evidence.authorization) &&
    evidence.source === BRAZIL_AD_RULES.register
}

/** Restrict existing destinations to the exact licensed domain or its subdomains. */
export function isAuthorizedBrazilDestination(
  operator: Pick<Operator, 'id'>,
  destination: string | undefined,
  now = Date.now(),
): boolean {
  const evidence = BRAZIL_AUTHORIZATIONS[operator.id]
  if (!hasCurrentBrazilEvidence(evidence, now) || !destination || evidence.operatorId !== operator.id) return false
  try {
    const url = new URL(destination)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
      (url.hostname === evidence.authorizedDomain || url.hostname.endsWith(`.${evidence.authorizedDomain}`))
  } catch { return false }
}

/** Full-width warning height; includes ad padding and narrower warning width. */
export function requiredWarningHeight(adWidth: number, adHeight: number, warningWidth: number, warningHeight: number): number {
  if (![adWidth, adHeight, warningWidth, warningHeight].every(Number.isFinite) || warningWidth <= 0) return 96
  const denominator = warningWidth - BRAZIL_AD_RULES.minimumWarningArea * adWidth
  if (denominator <= 0) return 96
  return Math.max(96, Math.ceil(BRAZIL_AD_RULES.minimumWarningArea * adWidth * Math.max(0, adHeight - warningHeight) / denominator))
}
