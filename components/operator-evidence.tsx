import type { Locale } from '@/lib/types'
import { BRAZIL_AUTHORIZATIONS } from '@/lib/compliance/brazil'
import { EditorialByline } from './editorial-byline'

/** Factual review evidence, separate from commercial approval and referral UI. */
export function OperatorEvidence({ operatorId, slug, locale }: { operatorId: string; slug: string; locale: Locale }) {
  const evidence = BRAZIL_AUTHORIZATIONS[operatorId]
  if (!evidence) return null
  const c = {
    en: { title: 'Authorization and evidence', entity: 'Legal entity', domain: 'Authorized Brazilian domain', licence: 'Authorization reference', checked: 'Register checked', source: 'Official SPA register', scope: 'This records the named brand in the official Brazilian register, not a guarantee of service quality, eligibility for an individual, or exact game availability.', unknown: 'Not independently verified: PIX and other payment methods, deposit or withdrawal limits and times, Portuguese support, native apps and the current full provider catalogue. These fields are intentionally not presented as confirmed features.', review: 'Evidence review due (PlayLiva policy, not licence expiry)' },
    'pt-BR': { title: 'Autorização e evidências', entity: 'Razão social', domain: 'Domínio brasileiro autorizado', licence: 'Referência de autorização', checked: 'Cadastro consultado em', source: 'Cadastro oficial da SPA', scope: 'Este registro identifica a marca no cadastro oficial brasileiro. Não garante qualidade do serviço, elegibilidade individual ou disponibilidade de um jogo específico.', unknown: 'Não verificados de forma independente: PIX e outros pagamentos, limites e prazos de depósito ou saque, suporte em português, aplicativos nativos e catálogo completo atual de provedores. Esses campos não são apresentados como recursos confirmados.', review: 'Revisão da evidência até (política da PlayLiva, não validade da licença)' },
    'es-MX': { title: 'Autorización y evidencia', entity: 'Razón social', domain: 'Dominio brasileño autorizado', licence: 'Referencia de autorización', checked: 'Registro consultado el', source: 'Registro oficial de la SPA', scope: 'Este registro identifica la marca en el listado oficial brasileño. No garantiza calidad del servicio, elegibilidad individual ni disponibilidad de un juego específico.', unknown: 'No verificados de forma independiente: PIX y otros pagos, límites y plazos de depósito o retiro, soporte en portugués, aplicaciones nativas y catálogo completo actual de proveedores. Estos campos no se presentan como funciones confirmadas.', review: 'Revisión de evidencia hasta (política de PlayLiva, no vencimiento de licencia)' },
  }[locale]
  return <section className="my-6 space-y-4 rounded-2xl border border-border p-5" data-operator-evidence={operatorId}>
    <h2 className="text-xl font-semibold">{c.title}</h2>
    <EditorialByline path={`/operators/${slug}`} locale={locale} />
    <dl className="space-y-3 break-words text-sm leading-relaxed">
      {[[c.entity, evidence.legalEntity], ['CNPJ', evidence.cnpj], [c.domain, evidence.authorizedDomain], [c.licence, evidence.authorization], [c.checked, evidence.verifiedAt], [c.review, evidence.reviewBy]].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="text-muted-foreground">{value}</dd></div>)}
    </dl>
    <a href={evidence.source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-4">{c.source}</a>
    <p className="text-sm leading-relaxed">{c.scope}</p><p className="text-sm leading-relaxed text-muted-foreground">{c.unknown}</p>
  </section>
}
