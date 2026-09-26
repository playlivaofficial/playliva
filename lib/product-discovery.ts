import type { CategorySlug, Game, Locale } from '@/lib/types'

/** Presentation taxonomy only. Never pass this override to affiliate routing. */
export const discoveryCategory = (game: Pick<Game, 'slug' | 'category'>): CategorySlug =>
  game.slug === 'blackjack-live' ? 'live-casino' : game.category

export const DISCOVERY_ORDER: CategorySlug[] = ['slots', 'crash', 'live-casino', 'instant-games', 'table-games']

const PROVIDER_SLUGS: Record<string, string> = {
  Evolution: 'evolution',
  'Pragmatic Play': 'pragmatic-play',
  SmartSoft: 'smartsoft',
  Spribe: 'spribe',
  SPRIBE: 'spribe',
}

export const providerSlug = (provider: string): string | undefined =>
  PROVIDER_SLUGS[provider]

const en = {
  eyebrow: 'A new way to discover', heroLead: 'Find your', heroAccent: 'next obsession.',
  heroDescription: 'Discover games. Play free. Explore what’s next. Original adventures and a separate guide to provider games, all in one place.',
  play: 'Play Free', explore: 'Explore Games', featured: 'In the spotlight',
  original: 'PlayLiva Original', freeNote: 'Virtual credits. No deposits. No monetary value.',
  homeOriginals: 'Made by us. Played by you.', homeOriginalsSub: 'Step into the PlayLiva universe. Four featured adventures, ready in your browser.',
  providerLabel: 'Provider game catalog', providerTitle: 'Beyond the Originals.',
  providerSub: 'Explore real provider titles through guides, reviews and side-by-side comparisons. These are catalog pages, not playable PlayLiva demos.',
  categories: 'Find your kind of game.', categoriesSub: 'Different formats. One place to explore them.',
  trustTitle: 'A little curiosity goes a long way.', trustSub: 'Two ways to explore. A clear distinction at every step.',
  trustDiscover: 'Get to know the games', trustDiscoverBody: 'Explore formats, features and provider profiles before choosing what to read next.',
  trustCompare: 'See the differences', trustCompareBody: 'Read reviews and comparisons. Find similar games without starting your search over.',
  trustPlay: 'Try something of our own', trustPlayBody: 'PlayLiva Originals run in your browser, using virtual credits with no monetary value.',
  hubEyebrow: 'The free-play lobby', hubTitle: 'Your next play starts here.',
  hubSub: 'Twelve Originals. Twelve different moods. Pick an adventure and make it yours—only virtual credits, always free.',
  all: 'All Originals', crash: 'Crash', slots: 'Slots', cards: 'Cards & roulette', instant: 'Instant Games',
  resultCount: '{count} games ready to play', navPrimary: 'Primary', navMobile: 'Quick navigation',
  lobbyBack: 'All Originals', settings: 'Session & activity', noLiveDealer: 'Free-play demo · No live dealer',
  blackjackContext: 'Explore blackjack in Live Casino. This separate PlayLiva demo uses an automated dealer and virtual credits, not a live dealer.',
  artworkPending: 'Artwork pending approval.', skipContent: 'Skip to content',
  onPage: 'In this guide', overview: 'Overview', details: 'Key facts', related: 'Similar games',
  desktop: 'Computer', mobile: 'Phone', tablet: 'Tablet',
  spotlightLabel: 'Featured Originals', spotlightPrev: 'Previous game', spotlightNext: 'Next game',
  spotlightSlide: 'Game {index} of {total}',
}
type Copy = { [K in keyof typeof en]: string }
const COPY: Record<Locale, Copy> = {
  en,
  'pt-BR': {
    eyebrow: 'Seu próximo jogo começa aqui', heroLead: 'Descubra sua', heroAccent: 'próxima aventura.',
    heroDescription: 'Descubra jogos. Jogue grátis. Explore o que vem a seguir. Aventuras originais e um catálogo de jogos de provedores, cada um no seu espaço.',
    play: 'Jogar grátis', explore: 'Explorar jogos', featured: 'Em destaque', original: 'PlayLiva Original',
    freeNote: 'Créditos virtuais. Sem depósitos. Sem valor monetário.',
    homeOriginals: 'A gente cria. Você joga.', homeOriginalsSub: 'Entre no universo PlayLiva. Quatro aventuras em destaque, direto no navegador.',
    providerLabel: 'Catálogo de jogos de provedores', providerTitle: 'Além dos Originals.',
    providerSub: 'Conheça títulos de provedores em guias, análises e comparações lado a lado. Aqui você encontra informações, não demos jogáveis do PlayLiva.',
    categories: 'Encontre o seu estilo.', categoriesSub: 'Vários formatos. Um só lugar para descobrir.',
    trustTitle: 'A curiosidade abre o jogo.', trustSub: 'Dois caminhos para explorar. Sem confundir uma coisa com a outra.',
    trustDiscover: 'Conheça os jogos', trustDiscoverBody: 'Explore formatos, recursos e perfis de provedores para escolher sua próxima leitura.',
    trustCompare: 'Entenda as diferenças', trustCompareBody: 'Leia análises e comparações. Encontre jogos parecidos sem começar a busca do zero.',
    trustPlay: 'Experimente nossos Originals', trustPlayBody: 'Os PlayLiva Originals rodam no navegador e usam créditos virtuais, sem valor monetário.',
    hubEyebrow: 'Sua área de jogos grátis', hubTitle: 'Qual vai ser o próximo?',
    hubSub: 'Doze Originals. Doze jeitos de se divertir. Escolha sua aventura: só créditos virtuais, sempre grátis.',
    all: 'Todos os Originals', crash: 'Crash', slots: 'Slots', cards: 'Cartas e roleta', instant: 'Jogos instantâneos',
    resultCount: '{count} jogos para explorar', navPrimary: 'Principal', navMobile: 'Navegação rápida',
    lobbyBack: 'Todos os Originals', settings: 'Sessão e atividade', noLiveDealer: 'Demo grátis · Sem croupier ao vivo',
    blackjackContext: 'Conheça blackjack na área Cassino ao Vivo. Este demo separado do PlayLiva tem uma mesa automatizada e créditos virtuais, sem croupier ao vivo.',
    artworkPending: 'Ilustração aguardando aprovação.', skipContent: 'Pular para o conteúdo',
    onPage: 'Neste guia', overview: 'Visão geral', details: 'Informações principais', related: 'Jogos parecidos',
    desktop: 'Computador', mobile: 'Celular', tablet: 'Tablet',
    spotlightLabel: 'Originals em destaque', spotlightPrev: 'Jogo anterior', spotlightNext: 'Próximo jogo',
    spotlightSlide: 'Jogo {index} de {total}',
  },
  'es-MX': {
    eyebrow: 'Tu próximo juego empieza aquí', heroLead: 'Descubre tu', heroAccent: 'próxima aventura.',
    heroDescription: 'Descubre juegos. Juega gratis. Explora lo que sigue. Aventuras originales y un catálogo de juegos de proveedores, cada uno en su espacio.',
    play: 'Jugar gratis', explore: 'Explorar juegos', featured: 'En portada', original: 'PlayLiva Original',
    freeNote: 'Créditos virtuales. Sin depósitos. Sin valor monetario.',
    homeOriginals: 'Nosotros creamos. Tú juegas.', homeOriginalsSub: 'Entra al universo PlayLiva. Cuatro aventuras destacadas, directo en tu navegador.',
    providerLabel: 'Catálogo de juegos de proveedores', providerTitle: 'Más allá de los Originals.',
    providerSub: 'Conoce títulos de proveedores con guías, reseñas y comparaciones. Estas son páginas informativas, no demos jugables de PlayLiva.',
    categories: 'Encuentra tu estilo.', categoriesSub: 'Distintos formatos. Un solo lugar para descubrirlos.',
    trustTitle: 'La curiosidad abre el juego.', trustSub: 'Dos formas de explorar. Siempre bien diferenciadas.',
    trustDiscover: 'Conoce los juegos', trustDiscoverBody: 'Explora formatos, funciones y perfiles de proveedores para elegir tu próxima lectura.',
    trustCompare: 'Entiende las diferencias', trustCompareBody: 'Lee reseñas y comparaciones. Encuentra juegos similares sin empezar de cero.',
    trustPlay: 'Prueba nuestros Originals', trustPlayBody: 'Los PlayLiva Originals funcionan en tu navegador con créditos virtuales sin valor monetario.',
    hubEyebrow: 'Tu sala de juegos gratis', hubTitle: '¿Cuál será el siguiente?',
    hubSub: 'Doce Originals. Doce formas de divertirte. Elige tu aventura: solo créditos virtuales, siempre gratis.',
    all: 'Todos los Originals', crash: 'Crash', slots: 'Slots', cards: 'Cartas y ruleta', instant: 'Juegos instantáneos',
    resultCount: '{count} juegos por explorar', navPrimary: 'Principal', navMobile: 'Navegación rápida',
    lobbyBack: 'Todos los Originals', settings: 'Sesión y actividad', noLiveDealer: 'Demo gratis · Sin crupier en vivo',
    blackjackContext: 'Explora blackjack en Casino en Vivo. Este demo independiente de PlayLiva usa un crupier automatizado y créditos virtuales, no un crupier en vivo.',
    artworkPending: 'Ilustración pendiente de aprobación.', skipContent: 'Saltar al contenido',
    onPage: 'En esta guía', overview: 'Resumen', details: 'Datos principales', related: 'Juegos similares',
    desktop: 'Computadora', mobile: 'Celular', tablet: 'Tablet',
    spotlightLabel: 'Originals destacados', spotlightPrev: 'Juego anterior', spotlightNext: 'Siguiente juego',
    spotlightSlide: 'Juego {index} de {total}',
  },
}
export const productCopy = (locale: Locale): Copy => COPY[locale]
