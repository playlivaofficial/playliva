import { contentLocale } from '@/lib/locale'
import type { Locale } from '@/lib/types'

const COPY = {
  en: {
    directoryIntro: 'Browse game formats, providers and documented mechanics. Catalog inclusion alone does not establish availability in your market.',
    reference: 'Game reference', catalog: 'More provider game references', catalogIntro: 'Documented game mechanics, grouped by provider and format. These entries do not confirm operator or market availability.',
    providers: 'Providers', providersIntro: 'Browse the providers represented in this reference collection. Counts describe PlayLiva’s index, not each provider’s complete portfolio.', allProviders: 'All providers', provider: 'Provider',
    category: 'Category', all: 'All categories', search: 'Search title, provider or category', clear: 'Clear filters', empty: 'No games match these filters.', results: 'games found', previous: 'Previous', next: 'Next', page: 'Page', of: 'of', sort: 'Title A–Z',
    read: 'Read game reference', fallback: 'Neutral PlayLiva cover — not official game artwork', overview: 'Overview', how: 'How the format works', features: 'Key mechanics', related: 'Related formats', comparisons: 'Compare the mechanics',
    sources: 'Official sources', checked: 'Facts checked', evidence: 'Independent reference, not a playable provider demo. An official source establishes the described mechanics, not availability in your market. Cover images are local derivatives of recorded official or catalog game art; they do not confirm playable availability.',
    chance: 'Random outcomes cannot be predicted from animations or previous results. This page is a description of game design, not a winning strategy.',
    similar: 'Games like', similarIntro: 'A focused reading list connected by the mechanics below. Similarity does not imply equal rules, odds or availability.',
    contrast: 'What changes', shared: 'What they share', comparisonIntro: 'A factual comparison of format and feature structure. Neither game is ranked as a better bet.',
    back: 'All game references', catalogCount: 'games indexed', home: 'Home', games: 'Games', details: 'Mechanics and features', collection: 'In this collection', providerNote: 'Only games currently documented by PlayLiva appear here. Inclusion is not a claim of distribution in any particular country.',
  },
  'pt-BR': {
    directoryIntro: 'Explore formatos, provedores e mecânicas documentadas. A presença no catálogo, por si só, não comprova disponibilidade no seu mercado.',
    reference: 'Ficha do jogo', catalog: 'Mais fichas de jogos de provedores', catalogIntro: 'Mecânicas documentadas, organizadas por provedor e formato. Estas fichas não confirmam disponibilidade em operadores ou mercados.',
    providers: 'Provedores', providersIntro: 'Conheça os provedores representados nesta coleção de fichas. As quantidades se referem ao índice da PlayLiva, não ao catálogo completo de cada empresa.', allProviders: 'Todos os provedores', provider: 'Provedor',
    category: 'Categoria', all: 'Todas as categorias', search: 'Buscar título, provedor ou categoria', clear: 'Limpar filtros', empty: 'Nenhum jogo corresponde a estes filtros.', results: 'jogos encontrados', previous: 'Anterior', next: 'Próxima', page: 'Página', of: 'de', sort: 'Título A–Z',
    read: 'Ler ficha do jogo', fallback: 'Capa neutra da PlayLiva — não é arte oficial do jogo', overview: 'Visão geral', how: 'Como o formato funciona', features: 'Principais mecânicas', related: 'Formatos relacionados', comparisons: 'Comparar as mecânicas',
    sources: 'Fontes oficiais', checked: 'Fatos verificados em', evidence: 'Ficha independente, não uma demonstração jogável do provedor. A fonte oficial comprova as mecânicas descritas, não a disponibilidade no seu mercado. As capas são derivados locais de arte oficial ou de catálogo registrada; não confirmam disponibilidade para jogar.',
    chance: 'Animações e resultados anteriores não permitem prever resultados aleatórios. Esta página descreve o design do jogo; não apresenta uma estratégia para ganhar.',
    similar: 'Jogos como', similarIntro: 'Uma seleção de leituras conectadas pelas mecânicas abaixo. Semelhança não significa regras, probabilidades ou disponibilidade iguais.',
    contrast: 'O que muda', shared: 'O que têm em comum', comparisonIntro: 'Comparação factual de formato e estrutura de recursos. Nenhum jogo é classificado como uma aposta melhor.',
    back: 'Todas as fichas de jogos', catalogCount: 'jogos no índice', home: 'Início', games: 'Jogos', details: 'Mecânicas e recursos', collection: 'Nesta coleção', providerNote: 'Esta página reúne apenas jogos documentados pela PlayLiva. A inclusão não comprova distribuição em um país específico.',
  },
  'es-MX': {
    directoryIntro: 'Explora formatos, proveedores y mecánicas documentadas. Aparecer en el catálogo, por sí solo, no demuestra disponibilidad en tu mercado.',
    reference: 'Ficha del juego', catalog: 'Más fichas de juegos de proveedores', catalogIntro: 'Mecánicas documentadas, organizadas por proveedor y formato. Estas fichas no confirman disponibilidad en operadores o mercados.',
    providers: 'Proveedores', providersIntro: 'Conoce los proveedores representados en esta colección de fichas. Las cantidades corresponden al índice de PlayLiva, no al catálogo completo de cada empresa.', allProviders: 'Todos los proveedores', provider: 'Proveedor',
    category: 'Categoría', all: 'Todas las categorías', search: 'Buscar título, proveedor o categoría', clear: 'Limpiar filtros', empty: 'Ningún juego coincide con estos filtros.', results: 'juegos encontrados', previous: 'Anterior', next: 'Siguiente', page: 'Página', of: 'de', sort: 'Título A–Z',
    read: 'Leer ficha del juego', fallback: 'Portada neutral de PlayLiva — no es arte oficial del juego', overview: 'Descripción general', how: 'Cómo funciona el formato', features: 'Mecánicas principales', related: 'Formatos relacionados', comparisons: 'Comparar las mecánicas',
    sources: 'Fuentes oficiales', checked: 'Datos verificados el', evidence: 'Ficha independiente, no una demostración jugable del proveedor. La fuente oficial respalda las mecánicas descritas, no la disponibilidad en tu mercado. Las portadas son derivados locales de arte oficial o de catálogo registrado; no confirman disponibilidad para jugar.',
    chance: 'Las animaciones y los resultados anteriores no permiten predecir resultados aleatorios. Esta página describe el diseño del juego; no presenta una estrategia para ganar.',
    similar: 'Juegos como', similarIntro: 'Una selección de lecturas conectadas por las mecánicas siguientes. La semejanza no implica reglas, probabilidades o disponibilidad iguales.',
    contrast: 'Qué cambia', shared: 'Qué comparten', comparisonIntro: 'Comparación factual del formato y la estructura de funciones. Ningún juego se clasifica como una mejor apuesta.',
    back: 'Todas las fichas de juegos', catalogCount: 'juegos en el índice', home: 'Inicio', games: 'Juegos', details: 'Mecánicas y funciones', collection: 'En esta colección', providerNote: 'Esta página reúne solo juegos documentados por PlayLiva. La inclusión no demuestra distribución en un país concreto.',
  },
}
export const catalogCopy = (locale: Locale) => COPY[contentLocale(locale)]
