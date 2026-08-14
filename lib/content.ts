import type {
  CategorySlug,
  Comparison,
  Game,
  GameList,
  Locale,
} from './types'

/**
 * Locale-aware EDITORIAL content. Factual fields (provider, category,
 * device support, supported markets) live on the base data model and are
 * not translated. Brand and official game names are never translated.
 *
 * Every supported LANGUAGE (pt-BR, es-MX, en) provides full coverage, so the
 * visitor's chosen language is honored everywhere regardless of their GEO.
 */

interface PageSeoOverride {
  title: string
  description: string
  h1: string
}

interface GameContent {
  description: string
  shortDescription: string
  gameType: string
  mechanics: string[]
  about?: string
  /** "What is {game}?" editorial paragraph. Optional — falls back to `about`. */
  whatIsIt?: string
  /** Game-specific "how it works" steps. Optional — falls back to the generic step1/2/3 UI copy. */
  howItWorks?: string[]
  /** "Why did {game} become well known?" editorial paragraph. Only rendered when present. */
  whyPopular?: string
  /**
   * Optional literal SEO title/description/H1 overrides per target page,
   * used for high-intent game clusters that need exact hand-written copy
   * instead of the generic templated title/description. Sparse by design —
   * absent pages fall back to the generic template.
   */
  seo?: {
    game?: PageSeoOverride
    gamesLike?: PageSeoOverride
    whereToPlay?: PageSeoOverride
  }
}

const GAME_CONTENT: Record<Locale, Record<string, GameContent>> = {
  'pt-BR': {
    g1: {
      description:
        'Um multiplicador aumenta a cada rodada. Acompanhe ele subir e faça o cash out antes que a rodada termine.',
      shortDescription:
        'Acompanhe o multiplicador subir e faça o cash out antes do fim da rodada.',
      gameType: 'Crash / multiplicador',
      mechanics: ['Multiplicador crescente', 'Cash-out manual', 'Cash-out automático', 'Apostas duplas'],
      whatIsIt:
        'O Aviator é um jogo de crash desenvolvido pela SPRIBE, um dos provedores que ajudou a popularizar esse formato na América Latina. A mecânica é direta: a cada rodada, um multiplicador começa a subir a partir de 1x, e cabe ao jogador escolher o momento de sair — o chamado cash out — antes que a rodada termine. As rodadas são curtas e se repetem em sequência rápida, o que dá ao jogo um ritmo bem dinâmico.',
      howItWorks: [
        'A rodada começa e o multiplicador parte de 1x.',
        'O multiplicador sobe continuamente enquanto a rodada estiver em andamento.',
        'O jogador pode fazer o cash out em qualquer momento antes do fim da rodada.',
        'Se a rodada terminar antes do cash out, a aposta feita nela é perdida.',
      ],
      whyPopular:
        'O Aviator ficou conhecido por combinar uma mecânica simples com rodadas rápidas e uma apresentação fácil de entender à primeira vista. Essa combinação — simplicidade, ritmo e clareza visual — ajudou o jogo a se tornar uma referência dentro da categoria de jogos crash, servindo como porta de entrada para quem quer conhecer esse formato de jogo.',
    },
    g2: {
      description: 'Um jogo de multiplicador com tema de jato de combate e uma base fiel de jogadores.',
      shortDescription: 'Multiplicador com tema de jato de combate.',
      gameType: 'Crash / multiplicador',
      mechanics: ['Multiplicador crescente', 'Cash-out manual', 'Apostas duplas'],
    },
    g3: {
      description: 'Uma jornada cósmica de multiplicador com mecânica simples de cash-out.',
      shortDescription: 'Multiplicador cósmico com cash-out simples.',
      gameType: 'Crash / multiplicador',
      mechanics: ['Multiplicador crescente', 'Cash-out parcial', 'Cash-out automático'],
    },
    g4: {
      description: 'Revele quadrados seguros e evite as minas para aumentar seu multiplicador.',
      shortDescription: 'Revele quadrados seguros, evite as minas.',
      gameType: 'Grade / instantâneo',
      mechanics: ['Revelar grade', 'Seleção de risco', 'Cash-out manual'],
    },
    g5: {
      description: 'Um slot de alta volatilidade com tema do deus do trovão.',
      shortDescription: 'Slot de alta volatilidade com pagamento em qualquer posição.',
      gameType: 'Video slot',
      mechanics: ['Pagamento em qualquer posição', 'Multiplicadores', 'Rodadas grátis', 'Tumble'],
      whatIsIt:
        'Gates of Olympus é um slot da Pragmatic Play com tema mitológico, ambientado no universo dos deuses gregos. É um jogo baseado em grade, com uma jogabilidade centrada em multiplicadores que aparecem entre os giros. O visual traz colunas de símbolos com uma forte identidade grega — moedas, coroas de louro e uma presença central de Zeus.',
      howItWorks: [
        'O jogo paga combinações em qualquer posição da grade, e não apenas em linhas fixas.',
        'Símbolos multiplicadores podem aparecer durante os giros e aumentam o valor dos prêmios.',
        'Existe uma mecânica de tumble: símbolos que formam combinação saem e novos símbolos caem no lugar, podendo gerar novas combinações na mesma rodada.',
        'O jogo conta com um modo de rodadas grátis.',
      ],
      whyPopular:
        'Gates of Olympus ficou conhecido por combinar um tema mitológico com forte identidade visual e uma apresentação chamativa dos multiplicadores durante o jogo. Essa combinação, somada à associação com a Pragmatic Play — um dos provedores mais reconhecidos no mercado de slots online —, ajudou o jogo a se tornar uma referência dentro da categoria.',
      seo: {
        game: {
          title: 'Gates of Olympus: Como Funciona o Jogo | PlayLiva',
          description:
            'Conheça Gates of Olympus, entenda sua mecânica, veja jogos parecidos e descubra onde o slot pode estar disponível no Brasil.',
          h1: 'Gates of Olympus: como funciona o jogo',
        },
        gamesLike: {
          title: 'Jogos Parecidos com Gates of Olympus | PlayLiva',
          description:
            'Conheça jogos parecidos com Gates of Olympus, compare slots semelhantes e descubra outras opções da categoria.',
          h1: 'Jogos parecidos com Gates of Olympus',
        },
        whereToPlay: {
          title: 'Onde Jogar Gates of Olympus no Brasil | PlayLiva',
          description:
            'Veja onde Gates of Olympus pode estar disponível no Brasil e compare operadoras verificadas antes de visitar o site da operadora.',
          h1: 'Onde jogar Gates of Olympus no Brasil',
        },
      },
    },
    g6: {
      description: 'Um slot colorido de cluster pays com tema de doces.',
      shortDescription: 'Slot de cluster pays com tema de doces.',
      gameType: 'Video slot',
      mechanics: ['Cluster pays', 'Multiplicadores', 'Rodadas grátis', 'Tumble'],
    },
    g7: {
      description: 'Roleta ao vivo com multiplicadores aleatórios eletrizantes a cada rodada.',
      shortDescription: 'Roleta ao vivo com multiplicadores aleatórios.',
      gameType: 'Roleta ao vivo',
      mechanics: ['Dealer ao vivo', 'Multiplicadores aleatórios', 'Apostas diretas'],
    },
    g8: {
      description: 'Uma experiência de game-show ao vivo com rodadas de bônus e apresentadores.',
      shortDescription: 'Game-show ao vivo com rodadas de bônus.',
      gameType: 'Game show ao vivo',
      mechanics: ['Apresentador ao vivo', 'Roda da fortuna', 'Rodadas de bônus'],
    },
    g10: {
      description: 'Solte a bolinha e veja-a quicar em direção a um multiplicador.',
      shortDescription: 'Solte a bolinha e busque o multiplicador.',
      gameType: 'Instantâneo / arcade',
      mechanics: ['Queda da bolinha', 'Seleção de risco', 'Seleção de linhas'],
    },
    g11: {
      description: 'Um slot com tema de pescaria e mecânica de coleta em rodadas grátis.',
      shortDescription: 'Slot de pescaria com rodadas grátis.',
      gameType: 'Video slot',
      mechanics: ['Rodadas grátis', 'Coleta de prêmios', 'Multiplicadores'],
    },
    g12: {
      description: 'Mesas clássicas de blackjack com dealer ao vivo em vários limites.',
      shortDescription: 'Mesas clássicas de blackjack ao vivo.',
      gameType: 'Mesa ao vivo',
      mechanics: ['Dealer ao vivo', 'Vários limites', 'Apostas laterais'],
    },
  },
  'es-MX': {
    g1: {
      description:
        'Un multiplicador aumenta en cada ronda. Síguelo mientras sube y retira antes de que la ronda termine.',
      shortDescription:
        'Sigue cómo aumenta el multiplicador y retira antes de que termine la ronda.',
      gameType: 'Crash / multiplicador',
      mechanics: ['Multiplicador creciente', 'Cash-out manual', 'Cash-out automático', 'Apuestas dobles'],
      whatIsIt:
        'Aviator es un juego de choque desarrollado por SPRIBE, uno de los proveedores que ayudó a popularizar este formato en América Latina. La mecánica es directa: en cada ronda, un multiplicador comienza a subir desde 1x, y depende del jugador elegir el momento de salir — el llamado cash out — antes de que la ronda termine. Las rondas son cortas y se repiten en secuencia rápida, lo que le da al juego un ritmo muy dinámico.',
      howItWorks: [
        'La ronda comienza y el multiplicador parte de 1x.',
        'El multiplicador sube continuamente mientras la ronda esté en curso.',
        'El jugador puede hacer el cash out en cualquier momento antes de que termine la ronda.',
        'Si la ronda termina antes del cash out, la apuesta realizada en ella se pierde.',
      ],
      whyPopular:
        'Aviator se hizo conocido por combinar una mecánica simple con rondas rápidas y una presentación fácil de entender a primera vista. Esa combinación — simplicidad, ritmo y claridad visual — ayudó al juego a convertirse en una referencia dentro de la categoría de juegos de choque, sirviendo como puerta de entrada para quienes quieren conocer este formato de juego.',
      seo: {
        game: {
          title: 'Aviator México: Cómo Funciona y Cómo Jugar | PlayLiva',
          description:
            'Descubre cómo funciona Aviator, conoce su mecánica, encuentra juegos similares y revisa dónde está disponible en México.',
          h1: 'Aviator México: cómo funciona el juego',
        },
        gamesLike: {
          title: 'Juegos Similares a Aviator: Alternativas para Probar | PlayLiva',
          description:
            'Conoce juegos similares a Aviator, compara alternativas como JetX y Spaceman y descubre otras opciones de juegos crash e instantáneos.',
          h1: 'Juegos similares a Aviator',
        },
        whereToPlay: {
          title: 'Dónde Jugar Aviator en México | PlayLiva',
          description:
            'Consulta dónde está disponible Aviator en México y compara operadores verificados antes de visitar el sitio del operador.',
          h1: 'Dónde jugar Aviator en México',
        },
      },
    },
    g2: {
      description: 'Un juego de multiplicador con tema de jet de combate y una base fiel de jugadores.',
      shortDescription: 'Multiplicador con tema de jet de combate.',
      gameType: 'Crash / multiplicador',
      mechanics: ['Multiplicador creciente', 'Cash-out manual', 'Apuestas dobles'],
    },
    g3: {
      description: 'Un viaje cósmico de multiplicador con una mecánica sencilla de cash-out.',
      shortDescription: 'Multiplicador cósmico con cash-out sencillo.',
      gameType: 'Crash / multiplicador',
      mechanics: ['Multiplicador creciente', 'Cash-out parcial', 'Cash-out automático'],
    },
    g4: {
      description: 'Revela casillas seguras y evita las minas para aumentar tu multiplicador.',
      shortDescription: 'Revela casillas seguras, evita las minas.',
      gameType: 'Cuadrícula / instantáneo',
      mechanics: ['Revelar cuadrícula', 'Selección de riesgo', 'Cash-out manual'],
    },
    g5: {
      description: 'Un slot de alta volatilidad con tema del dios del trueno.',
      shortDescription: 'Slot de alta volatilidad con pago en cualquier posición.',
      gameType: 'Video slot',
      mechanics: ['Pago en cualquier posición', 'Multiplicadores', 'Giros gratis', 'Tumble'],
    },
    g6: {
      description: 'Un slot colorido de cluster pays con tema de dulces.',
      shortDescription: 'Slot de cluster pays con tema de dulces.',
      gameType: 'Video slot',
      mechanics: ['Cluster pays', 'Multiplicadores', 'Giros gratis', 'Tumble'],
    },
    g7: {
      description: 'Ruleta en vivo con multiplicadores aleatorios electrizantes en cada ronda.',
      shortDescription: 'Ruleta en vivo con multiplicadores aleatorios.',
      gameType: 'Ruleta en vivo',
      mechanics: ['Dealer en vivo', 'Multiplicadores aleatorios', 'Apuestas directas'],
    },
    g8: {
      description: 'Una experiencia de game-show en vivo con rondas de bonus y presentadores.',
      shortDescription: 'Game-show en vivo con rondas de bonus.',
      gameType: 'Game show en vivo',
      mechanics: ['Presentador en vivo', 'Rueda de la fortuna', 'Rondas de bonus'],
    },
    g10: {
      description: 'Suelta la pelota y mírala rebotar hacia un multiplicador.',
      shortDescription: 'Suelta la pelota y busca el multiplicador.',
      gameType: 'Instantáneo / arcade',
      mechanics: ['Caída de la pelota', 'Selección de riesgo', 'Selección de filas'],
    },
    g11: {
      description: 'Un slot con tema de pesca y mecánica de recolección en giros gratis.',
      shortDescription: 'Slot de pesca con giros gratis.',
      gameType: 'Video slot',
      mechanics: ['Giros gratis', 'Recolección de premios', 'Multiplicadores'],
    },
    g12: {
      description: 'Mesas clásicas de blackjack con dealer en vivo en varios límites.',
      shortDescription: 'Mesas clásicas de blackjack en vivo.',
      gameType: 'Mesa en vivo',
      mechanics: ['Dealer en vivo', 'Varios límites', 'Apuestas laterales'],
    },
  },
  en: {
    g1: {
      description:
        'A multiplier climbs every round. Watch it rise and cash out before the round ends.',
      shortDescription:
        'Watch the multiplier climb and cash out before the round ends.',
      gameType: 'Crash / multiplier',
      mechanics: ['Rising multiplier', 'Manual cash-out', 'Auto cash-out', 'Dual bets'],
      whatIsIt:
        'Aviator is a crash game developed by SPRIBE, one of the providers that helped popularize this format across Latin America. The mechanic is straightforward: each round, a multiplier starts climbing from 1x, and it is up to the player to choose the moment to exit — known as the cash out — before the round ends. Rounds are short and repeat in quick succession, giving the game a fast, dynamic pace.',
      howItWorks: [
        'The round begins and the multiplier starts at 1x.',
        'The multiplier climbs continuously while the round is in progress.',
        'The player can cash out at any moment before the round ends.',
        "If the round ends before cashing out, the bet placed on it is lost.",
      ],
      whyPopular:
        'Aviator became known for pairing a simple mechanic with fast rounds and a presentation that is easy to grasp at a glance. That combination — simplicity, pace, and visual clarity — helped the game become a reference point within the crash game category, serving as an entry point for players getting to know this game format.',
    },
    g2: {
      description: 'A fighter-jet-themed multiplier game with a loyal player base.',
      shortDescription: 'Fighter-jet-themed multiplier.',
      gameType: 'Crash / multiplier',
      mechanics: ['Rising multiplier', 'Manual cash-out', 'Dual bets'],
    },
    g3: {
      description: 'A cosmic multiplier journey with simple cash-out mechanics.',
      shortDescription: 'Cosmic multiplier with simple cash-out.',
      gameType: 'Crash / multiplier',
      mechanics: ['Rising multiplier', 'Partial cash-out', 'Auto cash-out'],
    },
    g4: {
      description: 'Reveal safe tiles and avoid the mines to grow your multiplier.',
      shortDescription: 'Reveal safe tiles, avoid the mines.',
      gameType: 'Grid / instant',
      mechanics: ['Grid reveal', 'Risk selection', 'Manual cash-out'],
    },
    g5: {
      description: 'A high-volatility slot themed around the god of thunder.',
      shortDescription: 'High-volatility slot with pays-anywhere wins.',
      gameType: 'Video slot',
      mechanics: ['Pays anywhere', 'Multipliers', 'Free spins', 'Tumble'],
    },
    g6: {
      description: 'A colorful cluster-pays slot with a candy theme.',
      shortDescription: 'Cluster-pays slot with a candy theme.',
      gameType: 'Video slot',
      mechanics: ['Cluster pays', 'Multipliers', 'Free spins', 'Tumble'],
    },
    g7: {
      description: 'Live roulette with electrifying random multipliers every round.',
      shortDescription: 'Live roulette with random multipliers.',
      gameType: 'Live roulette',
      mechanics: ['Live dealer', 'Random multipliers', 'Straight-up bets'],
    },
    g8: {
      description: 'A live game-show experience with bonus rounds and hosts.',
      shortDescription: 'Live game show with bonus rounds.',
      gameType: 'Live game show',
      mechanics: ['Live host', 'Wheel of fortune', 'Bonus rounds'],
    },
    g10: {
      description: 'Drop the ball and watch it bounce toward a multiplier.',
      shortDescription: 'Drop the ball and chase the multiplier.',
      gameType: 'Instant / arcade',
      mechanics: ['Ball drop', 'Risk selection', 'Row selection'],
    },
    g11: {
      description: 'A fishing-themed slot with a collect mechanic in free spins.',
      shortDescription: 'Fishing-themed slot with free spins.',
      gameType: 'Video slot',
      mechanics: ['Free spins', 'Prize collection', 'Multipliers'],
    },
    g12: {
      description: 'Classic blackjack tables with a live dealer across several limits.',
      shortDescription: 'Classic live blackjack tables.',
      gameType: 'Live table',
      mechanics: ['Live dealer', 'Multiple limits', 'Side bets'],
    },
  },
}

export function getGameContent(game: Game, locale: Locale) {
  const c = GAME_CONTENT[locale]?.[game.id]
  const description = c?.description ?? game.description
  const categoryName = getCategoryContent(game.category, locale).name
  const about =
    c?.about ??
    (locale === 'pt-BR'
      ? `${game.title} é um título de ${categoryName.toLowerCase()} da ${game.provider}. ${description} É um dos jogos que os jogadores descobrem pela PlayLiva ao explorar o que jogar no seu mercado.`
      : locale === 'es-MX'
        ? `${game.title} es un título de ${categoryName.toLowerCase()} de ${game.provider}. ${description} Es uno de los juegos que los jugadores descubren a través de PlayLiva al explorar qué jugar en su mercado.`
        : `${game.title} is a ${categoryName.toLowerCase()} title from ${game.provider}. ${description} It's one of the games players discover through PlayLiva while exploring what to play in their market.`)
  return {
    title: game.title, // never translated
    provider: game.provider, // factual
    description,
    shortDescription: c?.shortDescription ?? game.shortDescription,
    gameType: c?.gameType ?? game.gameType,
    mechanics: c?.mechanics ?? game.mechanics,
    about,
    whatIsIt: c?.whatIsIt,
    howItWorks: c?.howItWorks,
    whyPopular: c?.whyPopular,
    seo: c?.seo,
  }
}

/* ------------------------------------------------------------------ */
/* "Games like X" — per-alternative editorial notes                    */
/* ------------------------------------------------------------------ */

/**
 * Short editorial note explaining how a specific alternative relates to a
 * specific base game (e.g. "JetX" in the context of "games like Aviator").
 * Keyed by `${baseGameId}:${alternativeGameId}`. Sparse by design — only
 * populated where real editorial notes exist; absent pairs simply render
 * without an individual write-up.
 */
const ALTERNATIVE_NOTES: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    'g1:g2':
      'O JetX é um jogo de crash da SmartSoft com o mesmo núcleo do Aviator — um multiplicador que sobe até quebrar — mas com tema de jato de combate e uma apresentação visual diferente. É uma alternativa direta para quem já conhece o formato crash e quer conhecer outro provedor.',
    'g1:g3':
      'O Spaceman, da Pragmatic Play, também usa a mecânica de multiplicador crescente, mas adiciona a opção de cash-out parcial durante a rodada. É uma alternativa próxima ao Aviator, com uma camada extra de controle sobre a saída.',
    'g1:g4':
      'O Mines segue um formato diferente do crash: em vez de acompanhar um multiplicador subir sozinho, o jogador revela quadrados em uma grade e evita minas escondidas para aumentar o multiplicador. O público que gosta do Aviator costuma também explorar o Mines, mas a mecânica não é um clone direto do formato crash.',
    'g1:g10':
      'O Plinko é um jogo instantâneo em que uma bolinha é solta e desce por uma grade de pinos até parar em uma casa com um multiplicador. Assim como o Mines, ele atrai um público parecido com o do Aviator, porém sua mecânica é estruturalmente diferente do crash — é baseado em probabilidade, sem uma rodada que "sobe" continuamente.',
    'g5:g6':
      'O Sweet Bonanza também é da Pragmatic Play e compartilha a mecânica de tumble e os símbolos multiplicadores do Gates of Olympus, mas paga por cluster em vez de pagar em qualquer posição da grade, e troca o tema mitológico por um universo de doces. É a alternativa mais próxima para quem gosta da sensação de jogo do Gates of Olympus.',
    'g5:g11':
      'O Big Bass Bonanza, também da Pragmatic Play, usa um formato de rodadas grátis com coleta de prêmios em vez do pagamento em qualquer posição do Gates of Olympus. O público que curte slots de alta ação da Pragmatic Play costuma explorar os dois, mas a mecânica central é diferente.',
  },
  'es-MX': {
    'g1:g2':
      'JetX es un juego de choque de SmartSoft con el mismo núcleo que Aviator — un multiplicador que sube hasta romperse — pero con temática de jet de combate y una presentación visual diferente. Es una alternativa directa para quien ya conoce el formato de choque y quiere conocer otro proveedor.',
    'g1:g3':
      'Spaceman, de Pragmatic Play, también usa la mecánica de multiplicador creciente, pero agrega la opción de retiro parcial durante la ronda. Es una alternativa cercana a Aviator, con una capa extra de control sobre la salida.',
    'g1:g4':
      'Mines sigue un formato diferente al de choque: en lugar de seguir un multiplicador que sube solo, el jugador revela casillas en una cuadrícula y evita minas ocultas para aumentar el multiplicador. El público que disfruta Aviator suele explorar también Mines, aunque la mecánica no es un clon directo del formato de choque.',
    'g1:g10':
      'Plinko es un juego instantáneo en el que se suelta una bolita que baja por una cuadrícula de clavos hasta detenerse en una casilla con un multiplicador. Igual que Mines, atrae a un público parecido al de Aviator, pero su mecánica es estructuralmente distinta al choque — se basa en la probabilidad, sin una ronda que "sube" de forma continua.',
  },
  en: {
    'g1:g2':
      "JetX is a crash game from SmartSoft with the same core as Aviator — a multiplier that climbs until it crashes — but with a combat jet theme and a different visual presentation. It's a direct alternative for players who already know the crash format and want to try another provider.",
    'g1:g3':
      'Spaceman, from Pragmatic Play, also uses the rising-multiplier mechanic but adds a partial cash-out option during the round. It sits close to Aviator, with an extra layer of control over the exit.',
    'g1:g4':
      "Mines follows a different format than crash: instead of watching a multiplier climb on its own, the player reveals tiles on a grid and avoids hidden mines to raise the multiplier. Players who enjoy Aviator often explore Mines too, but the mechanic isn't a direct clone of the crash format.",
    'g1:g10':
      'Plinko is an instant game where a ball drops through a grid of pins until it lands in a slot with a multiplier. Like Mines, it draws a similar audience to Aviator, but its mechanic is structurally different from crash — it\u2019s probability-based, with no round that continuously "climbs."',
  },
}

export function getAlternativeNote(
  baseGameId: string,
  alternativeGameId: string,
  locale: Locale,
): string | undefined {
  return ALTERNATIVE_NOTES[locale]?.[`${baseGameId}:${alternativeGameId}`]
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

interface CategoryContent {
  name: string
  description: string
  cta: string
}

const CATEGORY_CONTENT: Record<Locale, Record<CategorySlug, CategoryContent>> = {
  'pt-BR': {
    crash: {
      name: 'Crash',
      description: 'Jogos de multiplicador rápidos e títulos populares de crash.',
      cta: 'Explorar Crash',
    },
    slots: {
      name: 'Slots',
      description: 'Descubra slots populares e novos lançamentos.',
      cta: 'Explorar Slots',
    },
    'live-casino': {
      name: 'Cassino ao Vivo',
      description: 'Explore mesas com dealer ao vivo e experiências de cassino.',
      cta: 'Explorar ao Vivo',
    },
    sports: {
      name: 'Apostas Esportivas',
      description: 'Encontre casas de apostas e opções disponíveis no seu mercado.',
      cta: 'Explorar Esportes',
    },
  },
  'es-MX': {
    crash: {
      name: 'Crash',
      description: 'Juegos de multiplicador rápidos y títulos populares de crash.',
      cta: 'Explorar Crash',
    },
    slots: {
      name: 'Slots',
      description: 'Descubre slots populares y nuevos lanzamientos.',
      cta: 'Explorar Slots',
    },
    'live-casino': {
      name: 'Casino en Vivo',
      description: 'Explora mesas con dealer en vivo y experiencias de casino.',
      cta: 'Explorar en Vivo',
    },
    sports: {
      name: 'Apuestas Deportivas',
      description: 'Encuentra casas de apuestas y opciones disponibles en tu mercado.',
      cta: 'Explorar Deportes',
    },
  },
  en: {
    crash: {
      name: 'Crash',
      description: 'Fast-paced multiplier games and popular crash titles.',
      cta: 'Explore Crash',
    },
    slots: {
      name: 'Slots',
      description: 'Discover popular slots and new releases.',
      cta: 'Explore Slots',
    },
    'live-casino': {
      name: 'Live Casino',
      description: 'Explore live dealer tables and casino experiences.',
      cta: 'Explore Live',
    },
    sports: {
      name: 'Sports Betting',
      description: 'Find sportsbooks and betting options available in your market.',
      cta: 'Explore Sports',
    },
  },
}

export function getCategoryContent(slug: CategorySlug, locale: Locale): CategoryContent {
  return (
    CATEGORY_CONTENT[locale]?.[slug] ?? {
      name: slug,
      description: '',
      cta: '',
    }
  )
}

/* ------------------------------------------------------------------ */
/* Comparisons                                                         */
/* ------------------------------------------------------------------ */

interface ComparisonContent {
  intro: string
  similarities: string[]
  differences: string[]
  editorialSummary: string
}

const COMPARISON_CONTENT: Record<Locale, Record<string, ComparisonContent>> = {
  'pt-BR': {
    'aviator-vs-jetx': {
      intro:
        'Aviator e JetX são dois dos jogos de crash mais conhecidos na América Latina. Ambos compartilham o mesmo núcleo — um multiplicador que sobe até quebrar — mas diferem no ritmo, na apresentação e na sensação.',
      similarities: [
        'Formato crash de multiplicador crescente',
        'Opções de aposta manual e dupla',
        'Rodadas simples e rápidas',
        'Ampla disponibilidade nos mercados de lançamento',
      ],
      differences: [
        'Aviator usa tema de avião; JetX usa tema de jato de combate',
        'As rodadas do JetX podem parecer um pouco mais lentas entre decolagens',
        'Provedores diferentes (Spribe vs SmartSoft) significam lobbies diferentes',
      ],
      editorialSummary:
        'Quem procura o jogo de crash mais disponível costuma começar pelo Aviator. Quem gosta de um ritmo e estilo visual um pouco diferentes pode preferir o JetX. Nenhum é objetivamente "melhor" — o ideal depende do ritmo e visual que você curte.',
    },
    'aviator-vs-spaceman': {
      intro:
        'Aviator e Spaceman oferecem uma experiência de multiplicador crescente, mas o Spaceman adiciona um cash-out parcial que muda a forma de gerenciar a rodada.',
      similarities: [
        'Formato crash de multiplicador crescente',
        'Suporte a cash-out automático',
        'Rodadas rápidas e repetíveis',
      ],
      differences: [
        'Spaceman permite cash-out parcial no meio da rodada',
        'Aviator tem comunidade maior e feed social em muitos lobbies',
        'Provedores diferentes (Spribe vs Pragmatic Play)',
      ],
      editorialSummary:
        'Se você gosta de controle fino sobre o cash-out, o Spaceman pode combinar com você. Se prefere a comunidade de crash mais estabelecida, o Aviator é o ponto de partida comum.',
    },
    'jetx-vs-spaceman': {
      intro:
        'JetX e Spaceman são alternativas populares ao Aviator. Ambos mantêm o núcleo crash, mas trazem seu próprio tema e ritmo.',
      similarities: [
        'Formato crash de multiplicador crescente',
        'Suporte a apostas duplas',
        'Design pensado para o celular',
      ],
      differences: [
        'Spaceman oferece cash-out parcial; JetX não',
        'Temas visuais diferentes (jato vs astronauta)',
        'Provedores diferentes (SmartSoft vs Pragmatic Play)',
      ],
      editorialSummary:
        'Ambos são boas escolhas para quem explora além do Aviator. Escolha pelo tema que você curte e se o cash-out parcial importa para você.',
    },
    'gates-of-olympus-vs-sweet-bonanza': {
      intro:
        'Gates of Olympus e Sweet Bonanza são dois slots da Pragmatic Play que compartilham várias mecânicas, o que os torna uma comparação natural para quem já joga um deles e quer conhecer o outro.',
      similarities: [
        'Ambos são video slots da Pragmatic Play',
        'Ambos usam mecânica de tumble',
        'Ambos têm símbolos multiplicadores',
        'Ambos têm modo de rodadas grátis',
      ],
      differences: [
        'Gates of Olympus paga em qualquer posição da grade; Sweet Bonanza paga por cluster',
        'Gates of Olympus tem tema mitológico; Sweet Bonanza tem tema de doces',
        'Identidade visual e desenho de símbolos diferentes',
      ],
      editorialSummary:
        'Quem gosta da sensação de tumble com multiplicadores do Gates of Olympus, mas quer um tema e uma estrutura de pagamento diferentes, costuma experimentar o Sweet Bonanza a seguir. Nenhum é objetivamente melhor — a escolha depende da preferência de tema e de você preferir pagamento em qualquer posição ou por cluster.',
    },
  },
  'es-MX': {
    'aviator-vs-jetx': {
      intro:
        'Aviator y JetX son dos de los juegos de crash más conocidos en América Latina. Ambos comparten el mismo núcleo — un multiplicador que sube hasta que se estrella — pero difieren en el ritmo, la presentación y la sensación.',
      similarities: [
        'Formato crash de multiplicador creciente',
        'Opciones de apuesta manual y doble',
        'Rondas simples y rápidas',
        'Amplia disponibilidad en los mercados de lanzamiento',
      ],
      differences: [
        'Aviator usa tema de avión; JetX usa tema de jet de combate',
        'Las rondas de JetX pueden sentirse un poco más lentas entre despegues',
        'Proveedores distintos (Spribe vs SmartSoft) implican lobbies distintos',
      ],
      editorialSummary:
        'Quienes buscan el juego de crash más disponible suelen empezar con Aviator. Quienes disfrutan un ritmo y estilo visual algo distintos pueden preferir JetX. Ninguno es objetivamente "mejor" — depende del ritmo y el aspecto que disfrutes.',
    },
    'aviator-vs-spaceman': {
      intro:
        'Aviator y Spaceman ofrecen una experiencia de multiplicador creciente, pero Spaceman añade un cash-out parcial que cambia cómo gestionas la ronda.',
      similarities: [
        'Formato crash de multiplicador creciente',
        'Soporte de cash-out automático',
        'Rondas rápidas y repetibles',
      ],
      differences: [
        'Spaceman permite cash-out parcial a mitad de ronda',
        'Aviator tiene una comunidad más grande y feed social en muchos lobbies',
        'Proveedores distintos (Spribe vs Pragmatic Play)',
      ],
      editorialSummary:
        'Si te gusta el control fino sobre el cash-out, Spaceman puede ir contigo. Si prefieres la comunidad de crash más consolidada, Aviator es el punto de partida común.',
    },
    'jetx-vs-spaceman': {
      intro:
        'JetX y Spaceman son alternativas populares a Aviator. Ambos mantienen el núcleo crash, pero aportan su propio tema y ritmo.',
      similarities: [
        'Formato crash de multiplicador creciente',
        'Soporte de apuestas dobles',
        'Diseño pensado para el móvil',
      ],
      differences: [
        'Spaceman ofrece cash-out parcial; JetX no',
        'Temas visuales distintos (jet vs astronauta)',
        'Proveedores distintos (SmartSoft vs Pragmatic Play)',
      ],
      editorialSummary:
        'Ambos son buenas opciones para quien explora más allá de Aviator. Elige según el tema que disfrutes y si el cash-out parcial te importa.',
    },
  },
  en: {
    'aviator-vs-jetx': {
      intro:
        'Aviator and JetX are two of the best-known crash games in Latin America. Both share the same core — a multiplier that climbs until it crashes — but differ in pacing, presentation and feel.',
      similarities: [
        'Rising-multiplier crash format',
        'Manual and dual bet options',
        'Simple, fast rounds',
        'Wide availability across launch markets',
      ],
      differences: [
        'Aviator uses an airplane theme; JetX uses a fighter-jet theme',
        'JetX rounds can feel slightly slower between takeoffs',
        'Different providers (Spribe vs SmartSoft) mean different lobbies',
      ],
      editorialSummary:
        'Players looking for the most widely available crash game usually start with Aviator. Those who enjoy a slightly different pace and visual style may prefer JetX. Neither is objectively "better" — it comes down to the pace and look you enjoy.',
    },
    'aviator-vs-spaceman': {
      intro:
        'Aviator and Spaceman both offer a rising-multiplier experience, but Spaceman adds a partial cash-out that changes how you manage the round.',
      similarities: [
        'Rising-multiplier crash format',
        'Auto cash-out support',
        'Fast, repeatable rounds',
      ],
      differences: [
        'Spaceman allows partial cash-out mid-round',
        'Aviator has a larger community and social feed in many lobbies',
        'Different providers (Spribe vs Pragmatic Play)',
      ],
      editorialSummary:
        'If you like fine-grained control over your cash-out, Spaceman may suit you. If you prefer the more established crash community, Aviator is the common starting point.',
    },
    'jetx-vs-spaceman': {
      intro:
        'JetX and Spaceman are both popular alternatives to Aviator. Both keep the crash core but bring their own theme and pacing.',
      similarities: [
        'Rising-multiplier crash format',
        'Dual bet support',
        'Mobile-first design',
      ],
      differences: [
        'Spaceman offers partial cash-out; JetX does not',
        'Different visual themes (jet vs astronaut)',
        'Different providers (SmartSoft vs Pragmatic Play)',
      ],
      editorialSummary:
        'Both are solid picks for players exploring beyond Aviator. Choose based on the theme you enjoy and whether partial cash-out matters to you.',
    },
  },
}

export function getComparisonContent(comparison: Comparison, locale: Locale) {
  const c = COMPARISON_CONTENT[locale]?.[comparison.slug]
  return {
    intro: c?.intro ?? comparison.intro,
    similarities: c?.similarities ?? comparison.similarities,
    differences: c?.differences ?? comparison.differences,
    editorialSummary: c?.editorialSummary ?? comparison.editorialSummary,
  }
}

/* ------------------------------------------------------------------ */
/* Editorial lists ("Best X in GEO")                                   */
/* ------------------------------------------------------------------ */

interface ListContent {
  title: string
  intro: string
  editorialContent: string
  seoTitle: string
  seoDescription: string
}

const LIST_CONTENT: Record<Locale, Record<string, ListContent>> = {
  'pt-BR': {
    'best-crash-games-brazil': {
      title: 'Melhores jogos de crash no Brasil',
      intro:
        'Os jogos de crash estão entre os mais jogados no Brasil. Esta seleção editorial destaca os títulos de crash que os jogadores brasileiros mais descobrem, com uma breve explicação do que torna cada um distinto.',
      editorialContent:
        'Os rankings refletem a avaliação editorial da PlayLiva com base em disponibilidade, popularidade e variedade de jogabilidade no mercado brasileiro. Não são previsão de resultados nem garantia de qualquer ganho.',
      seoTitle: 'Melhores jogos de crash no Brasil | PlayLiva',
      seoDescription:
        'Descubra os melhores jogos de crash no Brasil, como cada um funciona e onde jogá-los com responsabilidade.',
    },
    'best-crash-games-mexico': {
      title: 'Melhores jogos de crash no México',
      intro:
        'Os jogos de crash têm forte presença no México. Esta seleção cobre os títulos de crash que os jogadores mexicanos mais exploram, com notas claras sobre suas diferenças.',
      editorialContent:
        'Os rankings refletem a avaliação editorial da PlayLiva com base em disponibilidade, popularidade e variedade no mercado mexicano. Não são previsão de resultados.',
      seoTitle: 'Melhores jogos de crash no México | PlayLiva',
      seoDescription:
        'Descubra os melhores jogos de crash no México, como cada um funciona e onde jogá-los com responsabilidade.',
    },
    'best-slots-brazil': {
      title: 'Melhores slots no Brasil',
      intro:
        'Os slots continuam sendo uma categoria central para os jogadores brasileiros. Estes são os slots mais descobertos pela PlayLiva no Brasil.',
      editorialContent:
        'Os rankings refletem a avaliação editorial da PlayLiva com base em disponibilidade e popularidade no Brasil. A volatilidade e os recursos variam por título; jogue com responsabilidade.',
      seoTitle: 'Melhores slots no Brasil | PlayLiva',
      seoDescription:
        'Descubra slots populares no Brasil, seus principais recursos e onde jogá-los com responsabilidade.',
    },
    'best-slots-mexico': {
      title: 'Melhores slots no México',
      intro:
        'Os slots são favoritos entre os jogadores mexicanos. Esta seleção destaca slots populares e o que torna cada um interessante de explorar.',
      editorialContent:
        'Os rankings refletem a avaliação editorial da PlayLiva com base em disponibilidade e popularidade no México. A volatilidade e os recursos variam por título; jogue com responsabilidade.',
      seoTitle: 'Melhores slots no México | PlayLiva',
      seoDescription:
        'Descubra slots populares no México, seus principais recursos e onde jogá-los com responsabilidade.',
    },
  },
  'es-MX': {
    'best-crash-games-brazil': {
      title: 'Mejores juegos de crash en Brasil',
      intro:
        'Los juegos de crash están entre los más jugados en Brasil. Esta selección editorial destaca los títulos de crash que más descubren los jugadores brasileños, con una breve explicación de lo que hace distinto a cada uno.',
      editorialContent:
        'Los rankings reflejan el criterio editorial de PlayLiva según disponibilidad, popularidad y variedad de juego en el mercado brasileño. No son una predicción de resultados ni una garantía de ganancia.',
      seoTitle: 'Mejores juegos de crash en Brasil | PlayLiva',
      seoDescription:
        'Descubre los mejores juegos de crash en Brasil, cómo funciona cada uno y dónde jugarlos con responsabilidad.',
    },
    'best-crash-games-mexico': {
      title: 'Mejores juegos de crash en México',
      intro:
        'Los juegos de crash tienen una fuerte presencia en México. Esta selección cubre los títulos de crash que más exploran los jugadores mexicanos, con notas claras sobre sus diferencias.',
      editorialContent:
        'Los rankings reflejan el criterio editorial de PlayLiva según disponibilidad, popularidad y variedad en el mercado mexicano. No son una predicción de resultados.',
      seoTitle: 'Mejores juegos de crash en México | PlayLiva',
      seoDescription:
        'Descubre los mejores juegos de crash en México, cómo funciona cada uno y dónde jugarlos con responsabilidad.',
    },
    'best-slots-brazil': {
      title: 'Mejores slots en Brasil',
      intro:
        'Los slots siguen siendo una categoría central para los jugadores brasileños. Estos son los slots más descubiertos a través de PlayLiva en Brasil.',
      editorialContent:
        'Los rankings reflejan el criterio editorial de PlayLiva según disponibilidad y popularidad en Brasil. La volatilidad y las funciones varían por título; juega con responsabilidad.',
      seoTitle: 'Mejores slots en Brasil | PlayLiva',
      seoDescription:
        'Descubre slots populares en Brasil, sus funciones principales y dónde jugarlos con responsabilidad.',
    },
    'best-slots-mexico': {
      title: 'Mejores slots en México',
      intro:
        'Los slots son favoritos entre los jugadores mexicanos. Esta selección destaca slots populares y lo que hace interesante explorar cada uno.',
      editorialContent:
        'Los rankings reflejan el criterio editorial de PlayLiva según disponibilidad y popularidad en México. La volatilidad y las funciones varían por título; juega con responsabilidad.',
      seoTitle: 'Mejores slots en México | PlayLiva',
      seoDescription:
        'Descubre slots populares en México, sus funciones principales y dónde jugarlos con responsabilidad.',
    },
  },
  en: {
    'best-crash-games-brazil': {
      title: 'Best crash games in Brazil',
      intro:
        'Crash games are among the most played in Brazil. This editorial selection highlights the crash titles Brazilian players discover most, with a brief explanation of what makes each one distinct.',
      editorialContent:
        "Rankings reflect PlayLiva's editorial assessment based on availability, popularity and gameplay variety in the Brazilian market. They are not a prediction of outcomes or a guarantee of any winnings.",
      seoTitle: 'Best Crash Games in Brazil | PlayLiva',
      seoDescription:
        'Discover the best crash games in Brazil, how each one works, and where to play them responsibly.',
    },
    'best-crash-games-mexico': {
      title: 'Best crash games in Mexico',
      intro:
        'Crash games have a strong presence in Mexico. This selection covers the crash titles Mexican players explore most, with clear notes on their differences.',
      editorialContent:
        "Rankings reflect PlayLiva's editorial assessment based on availability, popularity and variety in the Mexican market. They are not a prediction of outcomes.",
      seoTitle: 'Best Crash Games in Mexico | PlayLiva',
      seoDescription:
        'Discover the best crash games in Mexico, how each one works, and where to play them responsibly.',
    },
    'best-slots-brazil': {
      title: 'Best slots in Brazil',
      intro:
        'Slots remain a core category for Brazilian players. These are the slots most discovered through PlayLiva in Brazil.',
      editorialContent:
        "Rankings reflect PlayLiva's editorial assessment based on availability and popularity in Brazil. Volatility and features vary by title; play responsibly.",
      seoTitle: 'Best Slots in Brazil | PlayLiva',
      seoDescription:
        'Discover popular slots in Brazil, their key features, and where to play them responsibly.',
    },
    'best-slots-mexico': {
      title: 'Best slots in Mexico',
      intro:
        'Slots are a favorite among Mexican players. This selection highlights popular slots and what makes each one worth exploring.',
      editorialContent:
        "Rankings reflect PlayLiva's editorial assessment based on availability and popularity in Mexico. Volatility and features vary by title; play responsibly.",
      seoTitle: 'Best Slots in Mexico | PlayLiva',
      seoDescription:
        'Discover popular slots in Mexico, their key features, and where to play them responsibly.',
    },
  },
}

export function getListContent(list: GameList, locale: Locale) {
  const c = LIST_CONTENT[locale]?.[list.slug]
  return {
    title: c?.title ?? list.title,
    intro: c?.intro ?? list.intro,
    editorialContent: c?.editorialContent ?? list.editorialContent,
    seoTitle: c?.seoTitle ?? list.seoTitle,
    seoDescription: c?.seoDescription ?? list.seoDescription,
  }
}

/** Alias kept for readability at call sites that pass a GameList. */
export const getGameListContent = getListContent

/* ------------------------------------------------------------------ */
/* Small convenience accessors                                         */
/* ------------------------------------------------------------------ */

/** Localized category display name only. */
export function getCategoryName(slug: CategorySlug, locale: Locale): string {
  return getCategoryContent(slug, locale).name
}

/** Localized label for a game's editorial tag. */
export function getTagLabel(
  tag: 'Popular' | 'Trending' | 'New',
  locale: Locale,
): string {
  const labels: Record<Locale, Record<typeof tag, string>> = {
    'pt-BR': { Popular: 'Popular', Trending: 'Em alta', New: 'Novo' },
    'es-MX': { Popular: 'Popular', Trending: 'En tendencia', New: 'Nuevo' },
    en: { Popular: 'Popular', Trending: 'Trending', New: 'New' },
  }
  return labels[locale]?.[tag] ?? tag
}
