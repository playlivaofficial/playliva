import type { Locale } from './types'
import { REFERENCE_PATHS } from './catalog/paths'

export const EDITOR = {
  id: 'playliva', name: 'PlayLiva', profile: '/authors/playliva',
  role: { en: 'Editorial publisher', 'pt-BR': 'Publicação editorial', 'es-MX': 'Publicación editorial' },
  bio: {
    en: 'PlayLiva maintains this game-reference collection and is responsible for its sourcing, corrections and disclosures. This organizational credit does not claim an individual reviewer, professional qualification or independent certification.',
    'pt-BR': 'A PlayLiva mantém esta coleção de referências e responde pelas fontes, correções e divulgações. Este crédito institucional não afirma a participação de um revisor individual, qualificação profissional ou certificação independente.',
    'es-MX': 'PlayLiva mantiene esta colección de referencias y responde por sus fuentes, correcciones y divulgaciones. Este crédito institucional no afirma la participación de un revisor individual, una cualificación profesional ni una certificación independiente.',
  },
} as const

export interface EditorialRecord { authorId: 'playliva'; publishedAt?: string; updatedAt?: string; evidence: string }

export function editorialRecord(path: string): EditorialRecord | undefined {
  if (REFERENCE_PATHS.includes(path)) return {
    authorId: 'playliva', publishedAt: '2026-09-13', updatedAt: '2026-09-13',
    evidence: 'M11 production release d2c13f6; source-content checkpoint 6c1b100. Later artwork/layout releases are not editorial updates.',
  }
  if (/^\/(games|compare|games-like|best|where-to-play)\//.test(path)) return {
    authorId: 'playliva', evidence: 'Legacy content; first publication and individual review dates are not independently recorded. Dates deliberately omitted.',
  }
  if (path.startsWith('/operators/')) return {
    authorId: 'playliva', updatedAt: '2026-09-14', evidence: 'M12 addition of sourced authorization facts; original publication date unknown.',
  }
  return undefined
}

export const editorialCopy = (locale: Locale) => ({
  en: { policy: 'Editorial policy', research: 'How PlayLiva researches games', published: 'Published', updated: 'Last updated', archive: 'Editorial archive', unknown: 'Original publication date not independently recorded.', sources: 'Sources and corrections' },
  'pt-BR': { policy: 'Política editorial', research: 'Como a PlayLiva pesquisa jogos', published: 'Publicado em', updated: 'Última atualização', archive: 'Arquivo editorial', unknown: 'A data de publicação original não foi registrada de forma independente.', sources: 'Fontes e correções' },
  'es-MX': { policy: 'Política editorial', research: 'Cómo investiga juegos PlayLiva', published: 'Publicado el', updated: 'Última actualización', archive: 'Archivo editorial', unknown: 'La fecha de publicación original no se registró de forma independiente.', sources: 'Fuentes y correcciones' },
})[locale]

export const RESEARCH_POLICY: Record<Locale, string[]> = {
  en: [
    'We identify each game by provider and edition, then consult the provider’s public product documentation. Similar names do not establish the same rules, artwork rights or RTP. Sources and verification dates are retained with the reference records; unknown values are omitted.',
    'Artwork records identify the source and local derivative. Public access to an image is not, by itself, a licence to redistribute it. Rights evidence must be reviewed separately from factual game documentation; a source citation does not resolve a rights dispute.',
    'Provider documentation does not prove that a particular operator offers a game in a particular market. Exact availability uses separate, explicit evidence. A generic brand link is not confirmation of an exact game, offer or PlayLiva Original at that operator.',
    'PlayLiva Originals are local free-play simulations with virtual credits, not provider games or real-money balances. Their results do not predict external games. PlayLiva does not accept deposits or cash withdrawals.',
    'Editorial dates describe recorded publication or substantive content changes, not the current build date. Organizational attribution does not imply that a named expert reviewed the content. We do not publish invented ratings, player counts or personal testing claims.',
    'Commercial links may generate commission and are labelled separately. Authorization, source freshness and publication restrictions can suppress promotion even when a commercial partnership is approved. No commission arrangement establishes factual game availability.',
    'Use Contact to report a factual error, missing source or rights concern, including the page and supporting evidence. The form opens an email draft; it does not send a message or promise a response time.',
  ],
  'pt-BR': [
    'Identificamos cada jogo pelo provedor e pela edição e consultamos a documentação pública do produto. Nomes semelhantes não comprovam regras, direitos de imagem ou RTP iguais. Mantemos fontes e datas de verificação nas fichas; omitimos valores desconhecidos.',
    'Os registros de imagens identificam a fonte e a versão local. O acesso público a uma imagem não constitui, por si só, licença de redistribuição. A comprovação de direitos deve ser analisada separadamente da documentação factual; citar uma fonte não resolve uma disputa de direitos.',
    'A documentação do provedor não comprova que um operador ofereça o jogo em um mercado específico. A disponibilidade exata depende de evidência explícita e separada. Um link genérico da marca não confirma um jogo, oferta ou Original da PlayLiva nesse operador.',
    'Os Originals da PlayLiva são simulações locais gratuitas com créditos virtuais, não jogos dos provedores nem saldos em dinheiro real. Seus resultados não preveem jogos externos. A PlayLiva não aceita depósitos ou saques em dinheiro.',
    'As datas editoriais descrevem publicação registrada ou mudanças substanciais do conteúdo, não a data de compilação. O crédito institucional não significa revisão por um especialista identificado. Não publicamos avaliações, quantidades de jogadores ou testes pessoais inventados.',
    'Links comerciais podem gerar comissão e são identificados separadamente. Autorização, atualização das fontes e restrições de publicação podem impedir a promoção mesmo com parceria comercial aprovada. Comissões não comprovam disponibilidade de jogos.',
    'Use Contato para informar erro factual, fonte ausente ou questão de direitos, indicando a página e a evidência. O formulário abre um rascunho de e-mail; não envia a mensagem nem promete prazo de resposta.',
  ],
  'es-MX': [
    'Identificamos cada juego por proveedor y edición y consultamos su documentación pública. Los nombres similares no demuestran reglas, derechos de imagen ni RTP iguales. Conservamos fuentes y fechas de verificación; omitimos valores desconocidos.',
    'Los registros de imágenes identifican la fuente y la versión local. El acceso público a una imagen no constituye por sí mismo una licencia de redistribución. Los derechos deben revisarse por separado de la documentación factual; citar una fuente no resuelve una disputa de derechos.',
    'La documentación del proveedor no demuestra que un operador ofrezca un juego en un mercado específico. La disponibilidad exacta requiere evidencia explícita y separada. Un enlace genérico de marca no confirma un juego, oferta ni Original de PlayLiva en ese operador.',
    'Los Originals de PlayLiva son simulaciones locales gratuitas con créditos virtuales, no juegos de proveedores ni saldos de dinero real. Sus resultados no predicen juegos externos. PlayLiva no acepta depósitos ni retiros de dinero.',
    'Las fechas editoriales describen una publicación registrada o cambios sustanciales del contenido, no la fecha de compilación. El crédito institucional no implica revisión por un experto identificado. No publicamos calificaciones, cantidades de jugadores ni pruebas personales inventadas.',
    'Los enlaces comerciales pueden generar comisión y se identifican por separado. La autorización, vigencia de las fuentes y restricciones de publicación pueden impedir la promoción incluso con una relación comercial aprobada. Las comisiones no demuestran disponibilidad de juegos.',
    'Usa Contacto para informar un error factual, fuente ausente o cuestión de derechos, indicando la página y la evidencia. El formulario abre un borrador de correo; no envía el mensaje ni promete un plazo de respuesta.',
  ],
}
