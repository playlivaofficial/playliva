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
  /** Factual distinction from adjacent game formats, used on entity pages. */
  entityDifference?: string
  /** Intent-specific opening for the alternatives page. */
  gamesLikeIntro?: string
  /** Intent-specific opening for the availability page. */
  whereToPlayIntro?: string
  /** How commercial availability is checked, without implying permanence. */
  availabilityNote?: string
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
        'O Aviator é um jogo de crash desenvolvido pela SPRIBE. A mecânica é direta: a cada rodada, um multiplicador começa a subir a partir de 1x, e cabe ao jogador escolher o momento de sair — o chamado cash out — antes que a rodada termine. As rodadas são curtas e se repetem em sequência.',
      howItWorks: [
        'A rodada começa e o multiplicador parte de 1x.',
        'O multiplicador sobe continuamente enquanto a rodada estiver em andamento.',
        'O jogador pode fazer o cash out em qualquer momento antes do fim da rodada.',
        'Se a rodada terminar antes do cash out, a aposta feita nela é perdida.',
      ],
      entityDifference:
        'Ao contrário de um slot, o Aviator não usa rolos, linhas de pagamento ou rodadas de símbolos. A interação central acontece durante uma curva de multiplicador: o jogador decide se faz o cash out antes de a rodada terminar. Também não é um jogo de mesa tradicional, porque não há cartas, roleta ou dealer.',
      gamesLikeIntro:
        'As alternativas mais próximas do Aviator mantêm o multiplicador crescente e a decisão de cash out. Outras opções, como Mines e Plinko, usam multiplicadores em formatos instantâneos diferentes. A comparação abaixo separa essas semelhanças e diferenças.',
      whereToPlayIntro:
        'A PlayLiva mostra abaixo somente operadoras aprovadas, ativas e verificadas com disponibilidade registrada para Aviator no Brasil.',
      availabilityNote:
        'A disponibilidade é conferida nos registros da PlayLiva por jogo, categoria e mercado. O catálogo da operadora pode mudar; confirme o título e as condições no site da operadora antes de continuar.',
      seo: {
        game: {
          title: 'Aviator: Como Funciona e Como Jogar | PlayLiva',
          description:
            'Entenda o que é Aviator, como funciona uma rodada, o multiplicador e o cash out. Compare jogos semelhantes e opções disponíveis no Brasil.',
          h1: 'Aviator: como funciona o jogo',
        },
        gamesLike: {
          title: 'Jogos Como Aviator: Alternativas de Crash | PlayLiva',
          description:
            'Compare jogos parecidos com Aviator, como JetX e Spaceman, e entenda o que muda nas mecânicas e na experiência de cada alternativa.',
          h1: 'Jogos como Aviator: alternativas e diferenças',
        },
        whereToPlay: {
          title: 'Onde Jogar Aviator no Brasil | PlayLiva',
          description:
            'Veja onde Aviator está disponível no Brasil com operadoras verificadas pela PlayLiva e confira como a disponibilidade é validada.',
          h1: 'Onde jogar Aviator no Brasil',
        },
      },
    },
    g2: {
      description: 'Um jogo de multiplicador crescente da SmartSoft com tema de jato de combate.',
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
      description: 'Um slot da Pragmatic Play com tema mitológico, pagamento em qualquer posição, multiplicadores e cascatas.',
      shortDescription: 'Slot mitológico com pagamento em qualquer posição e cascatas.',
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
      entityDifference:
        'Gates of Olympus não usa linhas de pagamento fixas. As combinações podem pagar em qualquer posição da grade, e a cascata remove símbolos vencedores para que novos símbolos ocupem o espaço na mesma rodada. Essa estrutura o diferencia dos slots tradicionais baseados em linhas.',
      gamesLikeIntro:
        'As alternativas abaixo compartilham elementos documentados com Gates of Olympus, como cascatas, multiplicadores, rodadas grátis ou o mesmo provedor. Cada opção também explica a diferença de estrutura e tema.',
      whereToPlayIntro:
        'A PlayLiva mostra abaixo somente operadoras aprovadas, ativas e verificadas com disponibilidade registrada para Gates of Olympus no Brasil.',
      availabilityNote:
        'A disponibilidade é conferida nos registros da PlayLiva por jogo, categoria e mercado. O catálogo da operadora pode mudar; confirme Gates of Olympus e as condições no site da operadora antes de continuar.',
      seo: {
        game: {
          title: 'Gates of Olympus: Como Funciona o Jogo | PlayLiva',
          description:
            'Conheça Gates of Olympus, entenda sua mecânica, veja jogos parecidos e descubra onde o slot pode estar disponível no Brasil.',
          h1: 'Gates of Olympus: como funciona o jogo',
        },
        gamesLike: {
          title: 'Jogos Como Gates of Olympus: Alternativas de Slots | PlayLiva',
          description:
            'Compare jogos como Gates of Olympus por provedor, cascatas, multiplicadores, rodadas grátis e estrutura de pagamento.',
          h1: 'Jogos como Gates of Olympus: alternativas e diferenças',
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
      description: 'Um slot da Pragmatic Play com tema de doces, pagamento em qualquer posição, multiplicadores, rodadas grátis e cascatas.',
      shortDescription: 'Slot de doces com pagamento em qualquer posição e cascatas.',
      gameType: 'Video slot',
      mechanics: ['Pagamento em qualquer posição', 'Multiplicadores', 'Rodadas grátis', 'Tumble'],
      whatIsIt:
        'Sweet Bonanza é um slot da Pragmatic Play com tema de doces. O jogo usa seis rolos em uma grade e paga quando oito ou mais símbolos iguais aparecem em qualquer posição, além de cascatas, rodadas grátis e multiplicadores.',
      howItWorks: [
        'Oito ou mais símbolos iguais em qualquer posição da grade formam uma combinação, sem linhas fixas.',
        'Quando uma combinação é formada, os símbolos saem e novos símbolos caem na grade.',
        'As cascatas podem criar novas combinações dentro da mesma rodada.',
        'Quatro ou mais símbolos scatter ativam o modo de rodadas grátis, no qual podem aparecer multiplicadores.',
      ],
      entityDifference:
        'Sweet Bonanza paga por símbolos iguais em qualquer posição e usa cascatas, enquanto um slot tradicional de linhas fixas avalia combinações em trajetos predefinidos. Em relação a Gates of Olympus, os dois compartilham essa base, mas diferem no tema e na aplicação documentada dos multiplicadores.',
      whereToPlayIntro:
        'A PlayLiva mostra abaixo somente operadoras aprovadas, ativas e verificadas com disponibilidade registrada para Sweet Bonanza no Brasil.',
      availabilityNote:
        'A disponibilidade é conferida nos registros da PlayLiva por jogo, categoria e mercado. O catálogo da operadora pode mudar; confirme Sweet Bonanza e as condições no site da operadora antes de continuar.',
      seo: {
        game: {
          title: 'Sweet Bonanza: Como Funciona o Jogo | PlayLiva',
          description:
            'Entenda como funciona Sweet Bonanza, seus pagamentos por grupos, cascatas, multiplicadores e rodadas grátis.',
          h1: 'Sweet Bonanza: como funciona o jogo',
        },
        whereToPlay: {
          title: 'Onde Jogar Sweet Bonanza no Brasil | PlayLiva',
          description:
            'Veja operadoras verificadas com disponibilidade registrada para Sweet Bonanza no Brasil e como a PlayLiva confere essa informação.',
          h1: 'Onde jogar Sweet Bonanza no Brasil',
        },
      },
    },
    g7: {
      description: 'Roleta ao vivo da Evolution com roda de zero único, dealer ao vivo e Números da Sorte selecionados aleatoriamente.',
      shortDescription: 'Roleta ao vivo com Números da Sorte e multiplicadores aleatórios.',
      gameType: 'Roleta ao vivo',
      mechanics: ['Dealer ao vivo', 'Roda de zero único', 'Números da Sorte', 'Apostas diretas'],
      whatIsIt:
        'Lightning Roulette é uma roleta ao vivo da Evolution. Ela preserva a roda de zero único, o dealer ao vivo e as apostas conhecidas da roleta, acrescentando uma seleção aleatória de um a cinco Números da Sorte por rodada.',
      howItWorks: [
        'As apostas são feitas antes de a roda automática iniciar o giro da bola.',
        'Depois do encerramento das apostas, o jogo seleciona aleatoriamente de um a cinco Números da Sorte.',
        'Cada Número da Sorte recebe um Pagamento da Sorte aleatório, exibido na interface.',
        'O resultado continua sendo definido pelo bolso numerado em que a bola para; o multiplicador se aplica quando o resultado e a aposta direta atendem às regras do recurso.',
      ],
      entityDifference:
        'A estrutura principal continua sendo a roleta europeia ao vivo. O diferencial é a camada de Números da Sorte e multiplicadores aleatórios para apostas diretas; isso não transforma Lightning Roulette em um game show de roda como Crazy Time.',
      whereToPlayIntro:
        'A PlayLiva mostra abaixo somente operadoras aprovadas, ativas e verificadas com disponibilidade registrada para Lightning Roulette no Brasil.',
      availabilityNote:
        'A disponibilidade é conferida nos registros da PlayLiva por jogo, categoria e mercado. O catálogo da operadora pode mudar; confirme Lightning Roulette e as condições no site da operadora antes de continuar.',
      seo: {
        game: {
          title: 'Lightning Roulette: Como Funciona a Roleta ao Vivo | PlayLiva',
          description:
            'Entenda como funciona Lightning Roulette, a roleta ao vivo da Evolution com Números da Sorte e multiplicadores aleatórios.',
          h1: 'Lightning Roulette: como funciona a roleta ao vivo',
        },
        whereToPlay: {
          title: 'Onde Jogar Lightning Roulette no Brasil | PlayLiva',
          description:
            'Veja operadoras verificadas com disponibilidade registrada para Lightning Roulette no Brasil e como a PlayLiva confere essa informação.',
          h1: 'Onde jogar Lightning Roulette no Brasil',
        },
      },
    },
    g8: {
      description: 'Game show ao vivo da Evolution com roda de prêmios, Top Slot e quatro rodadas de bônus.',
      shortDescription: 'Game show ao vivo com roda, Top Slot e quatro bônus.',
      gameType: 'Game show ao vivo',
      mechanics: ['Apresentador ao vivo', 'Roda de prêmios', 'Top Slot', 'Quatro rodadas de bônus'],
      whatIsIt:
        'Crazy Time é um game show de cassino ao vivo da Evolution. Um apresentador conduz a transmissão em estúdio, enquanto uma roda de prêmios com números e quatro áreas de bônus define o formato central de cada rodada.',
      howItWorks: [
        'Antes do giro, as opções incluem os números 1, 2, 5 e 10 e as áreas Coin Flip, Cash Hunt, Pachinko e Crazy Time.',
        'O Top Slot gira junto com a roda principal e pode atribuir multiplicadores a áreas selecionadas.',
        'O apresentador gira a roda; um segmento numérico encerra a rodada principal conforme suas regras.',
        'Quando a roda para em uma área de bônus, a rodada correspondente é aberta para quem apostou naquela opção.',
      ],
      entityDifference:
        'Crazy Time não usa a grade de um slot nem a mesa e o conjunto de apostas de uma roleta convencional. A rodada parte de uma roda conduzida por apresentador e pode seguir para Coin Flip, Cash Hunt, Pachinko ou a própria rodada Crazy Time.',
      gamesLikeIntro:
        'As alternativas abaixo mantêm algum elemento documentado do Crazy Time — transmissão ao vivo, apresentador, roda ou recurso aleatório — e explicam também onde o formato muda. Lightning Roulette continua sendo roleta; Blackjack Live é um jogo de cartas; Dream Catcher e MONOPOLY Live usam suas próprias rodas e recursos.',
      whereToPlayIntro:
        'A PlayLiva mostra abaixo somente operadoras aprovadas, ativas e verificadas com disponibilidade registrada para Crazy Time no Brasil.',
      availabilityNote:
        'A disponibilidade é conferida nos registros da PlayLiva por jogo, categoria e mercado. O catálogo da operadora pode mudar; confirme Crazy Time e as condições no site da operadora antes de continuar.',
      seo: {
        game: {
          title: 'Crazy Time: Como Funciona o Jogo ao Vivo | PlayLiva',
          description:
            'Conheça Crazy Time, entenda como funciona o jogo ao vivo da Evolution, veja jogos parecidos e descubra onde ele pode estar disponível no Brasil.',
          h1: 'Crazy Time: como funciona o jogo ao vivo',
        },
        gamesLike: {
          title: 'Jogos Como Crazy Time: Alternativas de Game Show | PlayLiva',
          description:
            'Compare jogos como Crazy Time por formato, provedor, roda, apresentação ao vivo e recursos documentados.',
          h1: 'Jogos como Crazy Time: alternativas e diferenças',
        },
        whereToPlay: {
          title: 'Onde Jogar Crazy Time no Brasil | PlayLiva',
          description:
            'Veja onde Crazy Time pode estar disponível no Brasil e compare operadoras verificadas antes de visitar o site da operadora.',
          h1: 'Onde jogar Crazy Time no Brasil',
        },
      },
    },
    g10: {
      description: 'Solte a bolinha e veja-a quicar em direção a um multiplicador.',
      shortDescription: 'Solte a bolinha e busque o multiplicador.',
      gameType: 'Instantâneo / arcade',
      mechanics: ['Queda da bolinha', 'Seleção de risco', 'Seleção de linhas'],
    },
    g11: {
      description: 'Um slot da Pragmatic Play com tema de pescaria, rodadas grátis, coleta de prêmios e multiplicadores.',
      shortDescription: 'Slot de pescaria com rodadas grátis e coleta de prêmios.',
      gameType: 'Video slot',
      mechanics: ['Rodadas grátis', 'Coleta de prêmios', 'Multiplicadores'],
      whatIsIt:
        'Big Bass Bonanza é um slot da Pragmatic Play com tema de pescaria. A ficha editorial da PlayLiva documenta rodadas grátis, coleta de prêmios e multiplicadores como suas mecânicas centrais.',
      howItWorks: [
        'O jogo usa uma estrutura de video slot com tema de pescaria.',
        'Um modo de rodadas grátis faz parte dos recursos documentados.',
        'A coleta de prêmios organiza a progressão do recurso de rodadas grátis.',
        'Multiplicadores também aparecem entre as mecânicas registradas para o título.',
      ],
      seo: {
        game: {
          title: 'Big Bass Bonanza: Como Funciona o Jogo | PlayLiva',
          description:
            'Conheça Big Bass Bonanza, da Pragmatic Play, e entenda suas rodadas grátis, coleta de prêmios e multiplicadores.',
          h1: 'Big Bass Bonanza: como funciona o jogo',
        },
      },
    },
    g12: {
      description: 'Blackjack ao vivo da Evolution com dealer em estúdio, mesas em diferentes limites e apostas laterais opcionais.',
      shortDescription: 'Blackjack da Evolution com dealer ao vivo.',
      gameType: 'Blackjack ao vivo',
      mechanics: ['Dealer ao vivo', 'Vários limites', 'Apostas laterais'],
      whatIsIt:
        'Blackjack Live representa as mesas clássicas de blackjack ao vivo da Evolution. As cartas são distribuídas por um dealer em estúdio, e a decisão central continua sendo formar uma mão mais próxima de 21 do que a mão do dealer sem ultrapassar esse total.',
      howItWorks: [
        'O dealer distribui as cartas da mesa durante uma transmissão ao vivo.',
        'O jogador toma decisões de blackjack, como pedir carta, parar, dobrar ou dividir quando as regras da mesa permitirem.',
        'A mão é comparada com a do dealer conforme as regras exibidas na mesa escolhida.',
        'Limites, lugares e apostas laterais podem variar entre as mesas e devem ser conferidos no produto da operadora.',
      ],
      entityDifference:
        'Blackjack Live é um produto da Evolution com dealer e transmissão de estúdio. Liva Blackjack é um PlayLiva Original separado, gratuito e local, jogado apenas com créditos virtuais; ele não é uma mesa da Evolution e não oferece apostas com dinheiro real.',
      whereToPlayIntro:
        'A PlayLiva mostra abaixo somente operadoras aprovadas, ativas e verificadas com disponibilidade registrada para Blackjack Live no Brasil.',
      availabilityNote:
        'A disponibilidade é conferida nos registros da PlayLiva por jogo, categoria e mercado. O catálogo e as regras de cada mesa podem mudar; confirme Blackjack Live e as condições no site da operadora antes de continuar.',
      seo: {
        game: {
          title: 'Blackjack Live: Como Funciona o Blackjack ao Vivo | PlayLiva',
          description:
            'Entenda o formato de Blackjack Live da Evolution, o papel do dealer ao vivo e a diferença para o Blackjack gratuito da PlayLiva.',
          h1: 'Blackjack Live: como funciona o blackjack ao vivo',
        },
        whereToPlay: {
          title: 'Onde Jogar Blackjack Live no Brasil | PlayLiva',
          description:
            'Veja operadoras verificadas com disponibilidade registrada para Blackjack Live no Brasil e como a PlayLiva confere essa informação.',
          h1: 'Onde jogar Blackjack Live no Brasil',
        },
      },
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
      whatIsIt:
        'Gates of Olympus es un slot de Pragmatic Play con temática mitológica, ambientado en el universo de los dioses griegos. Es un juego basado en cuadrícula, con una jugabilidad centrada en multiplicadores que aparecen entre los giros. El aspecto visual presenta columnas de símbolos con una fuerte identidad griega — monedas, coronas de laurel y una presencia central de Zeus.',
      howItWorks: [
        'El juego paga combinaciones en cualquier posición de la cuadrícula, no solo en líneas fijas.',
        'Pueden aparecer símbolos multiplicadores durante los giros, y aumentan el valor de los premios.',
        'Existe una mecánica de tumble: los símbolos que forman combinación desaparecen y caen nuevos símbolos en su lugar, lo que puede generar nuevas combinaciones en la misma ronda.',
        'El juego incluye un modo de giros gratis.',
      ],
      whyPopular:
        'Gates of Olympus se hizo conocido por combinar una temática mitológica con una fuerte identidad visual y una presentación llamativa de los multiplicadores durante el juego. Esa combinación, sumada a la asociación con Pragmatic Play — uno de los proveedores más reconocidos del mercado de slots en línea —, ayudó al juego a convertirse en una referencia dentro de la categoría.',
      seo: {
        game: {
          title: 'Gates of Olympus México: Cómo Funciona el Juego | PlayLiva',
          description:
            'Conoce Gates of Olympus, entiende cómo funciona, descubre juegos similares y revisa dónde puede estar disponible en México.',
          h1: 'Gates of Olympus: cómo funciona el juego',
        },
        gamesLike: {
          title: 'Juegos Similares a Gates of Olympus | PlayLiva',
          description:
            'Descubre juegos similares a Gates of Olympus, compara slots relacionados y conoce otras opciones de Pragmatic Play y la categoría slots.',
          h1: 'Juegos similares a Gates of Olympus',
        },
        whereToPlay: {
          title: 'Dónde Jugar Gates of Olympus en México | PlayLiva',
          description:
            'Consulta dónde Gates of Olympus puede estar disponible en México y compara operadores verificados antes de visitar el sitio del operador.',
          h1: 'Dónde jugar Gates of Olympus en México',
        },
      },
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
      whatIsIt:
        'Crazy Time es un juego de casino en vivo de Evolution con formato de game show. En lugar de una mesa tradicional, el juego lo conduce un presentador en vivo desde un estudio, con una rueda giratoria como elemento central de cada ronda.',
      howItWorks: [
        'El jugador apuesta en segmentos de la rueda antes de cada ronda.',
        'Un presentador en vivo gira la rueda en tiempo real desde el estudio.',
        'La rueda incluye segmentos numéricos y segmentos de rondas de bonus.',
        'Cuando la rueda se detiene en un segmento de bonus, se activa una ronda de bonus con el presentador.',
      ],
      whyPopular:
        'Crazy Time se hizo conocido por su presentación con host en vivo, la identidad visual llamativa de la rueda y la sensación interactiva del formato de game show en vivo. La asociación con Evolution, uno de los proveedores más reconocidos de casino en vivo, también ayudó al juego a convertirse en una referencia dentro de la categoría.',
      seo: {
        game: {
          title: 'Crazy Time México: Cómo Funciona el Juego en Vivo | PlayLiva',
          description:
            'Conoce Crazy Time, entiende cómo funciona el juego en vivo de Evolution, descubre juegos similares y revisa dónde puede estar disponible en México.',
          h1: 'Crazy Time: cómo funciona el juego en vivo',
        },
        gamesLike: {
          title: 'Juegos Similares a Crazy Time | PlayLiva',
          description:
            'Descubre juegos similares a Crazy Time, compara opciones de casino en vivo y conoce otras experiencias relacionadas.',
          h1: 'Juegos similares a Crazy Time',
        },
        whereToPlay: {
          title: 'Dónde Jugar Crazy Time en México | PlayLiva',
          description:
            'Consulta dónde Crazy Time puede estar disponible en México y compara operadores verificados antes de visitar el sitio del operador.',
          h1: 'Dónde jugar Crazy Time en México',
        },
      },
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
    entityDifference: c?.entityDifference,
    gamesLikeIntro: c?.gamesLikeIntro,
    whereToPlayIntro: c?.whereToPlayIntro,
    availabilityNote: c?.availabilityNote,
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
      'O Mines segue um formato diferente do crash: em vez de acompanhar um multiplicador subir sozinho, o jogador revela quadrados em uma grade e evita minas escondidas para aumentar o multiplicador. É uma alternativa baseada em decisões por casa, não um clone do formato crash.',
    'g1:g10':
      'O Plinko é um jogo instantâneo em que uma bolinha é solta e desce por uma grade de pinos até parar em uma casa com um multiplicador. Sua mecânica é estruturalmente diferente do crash: não existe uma curva crescente acompanhada durante a rodada.',
    'g5:g6':
      'Sweet Bonanza também é da Pragmatic Play e compartilha pagamento em qualquer posição, cascatas, multiplicadores e rodadas grátis com Gates of Olympus. Sweet Bonanza usa tema de doces e concentra os multiplicadores no recurso de rodadas grátis; Gates of Olympus usa tema mitológico e pode apresentar multiplicadores no jogo base e nas rodadas grátis.',
    'g5:g11':
      'Big Bass Bonanza também é da Pragmatic Play e registra rodadas grátis e multiplicadores, mas organiza seu recurso em torno de coleta de prêmios. Gates of Olympus usa pagamento em qualquer posição e cascatas, portanto a estrutura central é diferente.',
    'g8:g7':
      'Lightning Roulette também é da Evolution e combina transmissão ao vivo com uma camada aleatória de multiplicadores. A diferença central é o formato: usa uma roda de roleta de zero único e Números da Sorte, enquanto Crazy Time usa uma roda de game show e quatro rodadas de bônus.',
    'g8:g12':
      'Blackjack Live também é da Evolution e mantém apresentador humano em estúdio, mas o núcleo é um jogo de cartas contra a mão do dealer. Não usa a roda, o Top Slot nem as quatro rodadas de bônus do Crazy Time.',
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
    'g5:g6':
      'Sweet Bonanza también es de Pragmatic Play y comparte la mecánica de tumble y los símbolos multiplicadores de Gates of Olympus, pero paga por cluster en lugar de pagar en cualquier posición de la cuadrícula, y cambia la temática mitológica por un universo de dulces. Es la alternativa más cercana para quien disfruta la sensación de juego de Gates of Olympus.',
    'g5:g11':
      'Big Bass Bonanza, también de Pragmatic Play, usa un formato de giros gratis con recolección de premios en lugar del pago en cualquier posición de Gates of Olympus. El público que disfruta los slots de alta acción de Pragmatic Play suele explorar ambos, pero la mecánica central es distinta.',
    'g8:g7':
      'Lightning Roulette, también de Evolution, cambia la rueda de game show de Crazy Time por una mesa de ruleta en vivo con multiplicadores aleatorios electrizantes. Es la alternativa más cercana en cuanto a ritmo y proveedor, pero el formato central es una ruleta, no un game show.',
    'g8:g12':
      'Blackjack Live, también de Evolution, ofrece mesas clásicas de blackjack con dealer en vivo en varios límites, sin la rueda ni las rondas de bonus de Crazy Time. Es una opción para quien quiere salir del formato game show y volver a un juego de mesa tradicional dentro del casino en vivo.',
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
  h1?: string
  seoTitle?: string
  seoDescription?: string
}

const CATEGORY_CONTENT: Record<Locale, Record<CategorySlug | 'sports', CategoryContent>> = {
  'pt-BR': {
    crash: {
      name: 'Crash',
      description:
        'Entenda como funcionam os jogos crash e explore títulos, comparações e guias para escolher o formato que combina com a experiência que você procura.',
      cta: 'Explorar Crash',
      h1: 'Jogos crash: conheça a categoria e seus formatos',
      seoTitle: 'Jogos Crash: Guia da Categoria e Principais Títulos | PlayLiva',
      seoDescription:
        'Conheça a categoria de jogos crash, explore Aviator, JetX e Spaceman e acesse comparações, alternativas e guias editoriais da PlayLiva.',
    },
    slots: {
      name: 'Slots',
      description: 'Explore slots por formato, mecânicas documentadas, provedor e guias editoriais da PlayLiva.',
      cta: 'Explorar Slots',
      h1: 'Jogos de slots: explore formatos e mecânicas',
      seoTitle: 'Jogos de Slots: Catálogo, Mecânicas e Guias | PlayLiva',
      seoDescription:
        'Explore jogos de slots por formato, mecânicas e provedor. Acesse Gates of Olympus, Sweet Bonanza, Big Bass Bonanza e guias para o Brasil.',
    },
    'live-casino': {
      name: 'Cassino ao Vivo',
      description: 'Explore roleta ao vivo, blackjack com dealer e game shows da Evolution, com guias factuais e disponibilidade verificada.',
      cta: 'Explorar ao Vivo',
      h1: 'Jogos de cassino ao vivo: roleta, blackjack e game shows',
      seoTitle: 'Cassino ao Vivo: Roleta, Blackjack e Game Shows | PlayLiva',
      seoDescription:
        'Explore jogos de cassino ao vivo, Crazy Time, Lightning Roulette, Blackjack Live e títulos da Evolution com guias e disponibilidade verificada.',
    },
    'table-games': { name: 'Jogos de Mesa', description: 'Explore jogos de mesa de cassino e suas regras.', cta: 'Explorar Jogos de Mesa' },
    'instant-games': { name: 'Jogos Instantâneos', description: 'Descubra Mines, Plinko e suas mecânicas de jogos instantâneos.', cta: 'Explorar Jogos Instantâneos' },
    sports: {
      name: 'Esportes',
      description: 'Visite o LivaSports, o site de esportes da nossa rede.',
      cta: 'Visitar LivaSports',
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
    'table-games': { name: 'Juegos de Mesa', description: 'Explora juegos de mesa de casino y sus reglas.', cta: 'Explorar Juegos de Mesa' },
    'instant-games': { name: 'Juegos Instantáneos', description: 'Descubre Mines, Plinko y sus mecánicas de juegos instantáneos.', cta: 'Explorar Juegos Instantáneos' },
    sports: {
      name: 'Deportes',
      description: 'Visita LivaSports, el sitio de deportes de nuestra red.',
      cta: 'Visitar LivaSports',
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
    'table-games': { name: 'Table Games', description: 'Explore casino table games and their rules.', cta: 'Explore Table Games' },
    'instant-games': { name: 'Instant Games', description: 'Discover Mines, Plinko and their instant-game mechanics.', cta: 'Explore Instant Games' },
    sports: {
      name: 'Sports',
      description: 'Visit LivaSports, the sports site in our network.',
      cta: 'Visit LivaSports',
    },
  },
}

export function getCategoryContent(slug: CategorySlug | 'sports', locale: Locale): CategoryContent {
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
  /**
   * Optional literal SEO title/description override for this comparison,
   * used for high-intent pairs that need exact hand-written copy instead of
   * the generic templated title. Sparse by design — falls back to the
   * generic template when absent.
   */
  seo?: {
    title: string
    description: string
  }
}

const COMPARISON_CONTENT: Record<Locale, Record<string, ComparisonContent>> = {
  'pt-BR': {
    'aviator-vs-jetx': {
      intro:
        'Aviator e JetX usam a estrutura central dos jogos crash: o multiplicador sobe durante a rodada e o jogador decide quando fazer o cash out. A diferença mais clara está no provedor, na identidade visual e nos recursos documentados de cada título.',
      similarities: [
        'Formato crash de multiplicador crescente',
        'Decisão de cash out antes do fim da rodada',
        'Suporte a duas apostas simultâneas',
        'Fluxo de rodada centrado em acompanhar o multiplicador',
      ],
      differences: [
        'Aviator é desenvolvido pela SPRIBE; JetX é desenvolvido pela SmartSoft',
        'Aviator usa um avião estilizado; JetX usa um jato como elemento visual central',
        'Aviator registra cash out automático entre suas mecânicas; o cadastro editorial do JetX documenta cash out manual',
      ],
      editorialSummary:
        'Aviator atende quem procura a apresentação da SPRIBE e a opção documentada de cash out automático. JetX oferece a mesma decisão central de sair antes do crash, com a identidade visual e a implementação da SmartSoft. A escolha depende do formato e dos recursos preferidos; esta comparação não indica vencedor.',
      seo: {
        title: 'Aviator vs JetX: Diferenças dos Jogos Crash | PlayLiva',
        description:
          'Compare Aviator e JetX por provedor, mecânica de cash out, recursos e apresentação. Veja as diferenças factuais entre os dois jogos crash.',
      },
    },
    'aviator-vs-spaceman': {
      intro:
        'Aviator e Spaceman usam multiplicador crescente e decisão de cash out, mas o Spaceman registra cash out parcial entre suas mecânicas. Provedor, apresentação e opções de saída diferenciam os dois formatos.',
      similarities: [
        'Formato crash de multiplicador crescente',
        'Suporte a cash-out automático',
        'Rodadas rápidas e repetíveis',
      ],
      differences: [
        'Spaceman permite cash-out parcial no meio da rodada',
        'Aviator registra suporte a duas apostas; Spaceman não traz esse recurso no cadastro editorial',
        'Aviator é da SPRIBE; Spaceman é da Pragmatic Play',
        'Aviator usa tema de avião; Spaceman usa uma apresentação espacial',
      ],
      editorialSummary:
        'Spaceman oferece uma opção documentada de saída parcial, útil para quem quer comparar formas de encerrar a participação na rodada. Aviator combina cash out manual e automático com suporte a duas apostas. A escolha depende do recurso e da apresentação procurados; a comparação não atribui superioridade a nenhum dos títulos.',
      seo: {
        title: 'Aviator vs Spaceman: Mecânicas e Diferenças | PlayLiva',
        description:
          'Compare Aviator e Spaceman por cash out, recursos, provedor e apresentação. Entenda as diferenças factuais entre os dois jogos crash.',
      },
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
        'Gates of Olympus e Sweet Bonanza são slots da Pragmatic Play com pagamento em qualquer posição, cascatas, multiplicadores e rodadas grátis. As diferenças documentadas estão no tema, na quantidade de símbolos exigida e em como os multiplicadores aparecem.',
      similarities: [
        'Ambos são video slots da Pragmatic Play',
        'Ambos pagam por símbolos iguais em qualquer posição da grade',
        'Ambos usam mecânica de tumble',
        'Ambos têm símbolos multiplicadores',
        'Ambos têm modo de rodadas grátis',
      ],
      differences: [
        'Gates of Olympus exige de 8 a 30 símbolos iguais; Sweet Bonanza exige 8 a 12 ou mais símbolos iguais',
        'Gates of Olympus pode apresentar multiplicadores no jogo base e nas rodadas grátis; Sweet Bonanza apresenta multiplicadores no recurso de rodadas grátis',
        'Gates of Olympus inicia o recurso com 15 rodadas grátis; Sweet Bonanza inicia com 10',
        'Gates of Olympus tem tema mitológico; Sweet Bonanza tem tema de doces',
      ],
      editorialSummary:
        'Os dois usam pagamento em qualquer posição e cascatas. Gates of Olympus combina tema mitológico com multiplicadores no jogo base e nas rodadas grátis; Sweet Bonanza usa tema de doces e reserva os multiplicadores para o recurso de rodadas grátis. A escolha depende da apresentação e da estrutura de recursos procuradas, sem um vencedor geral.',
      seo: {
        title: 'Gates of Olympus vs Sweet Bonanza: Diferenças | PlayLiva',
        description:
          'Compare Gates of Olympus e Sweet Bonanza por provedor, pagamento em qualquer posição, cascatas, multiplicadores, rodadas grátis e tema.',
      },
    },
    'crazy-time-vs-lightning-roulette': {
      intro:
        'Crazy Time e Lightning Roulette são títulos ao vivo da Evolution, mas atendem a intenções diferentes: Crazy Time é um game show de roda com quatro bônus; Lightning Roulette é uma roleta de zero único com Números da Sorte e multiplicadores aleatórios.',
      similarities: [
        'Ambos são títulos ao vivo da Evolution',
        'Ambos usam apresentação de estúdio com host ou dealer',
        'Ambos combinam um resultado físico ao vivo com recursos aleatórios exibidos na interface',
        'Ambos têm páginas de disponibilidade verificadas separadas na PlayLiva',
      ],
      differences: [
        'Crazy Time usa uma roda de game show; Lightning Roulette usa uma roda de roleta europeia com zero único',
        'Crazy Time aceita opções numéricas e quatro áreas de bônus; Lightning Roulette mantém as apostas da roleta e seleciona de um a cinco Números da Sorte',
        'O Top Slot pode atribuir multiplicadores no Crazy Time; os Pagamentos da Sorte são ligados aos Números da Sorte na Lightning Roulette',
        'Crazy Time pode seguir para Coin Flip, Cash Hunt, Pachinko ou Crazy Time; Lightning Roulette não usa essas rodadas de bônus',
      ],
      editorialSummary:
        'Crazy Time pode interessar a quem procura uma apresentação de game show com caminhos para bônus distintos. Lightning Roulette mantém a leitura e as opções de uma roleta ao vivo, acrescentando Números da Sorte. A escolha depende do formato procurado; esta comparação não define vencedor nem sugere resultado esperado.',
      seo: {
        title: 'Crazy Time vs Lightning Roulette: Diferenças | PlayLiva',
        description:
          'Compare Crazy Time e Lightning Roulette por formato, mecânica central, apresentação ao vivo, bônus, multiplicadores e disponibilidade verificada.',
      },
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
    'gates-of-olympus-vs-sweet-bonanza': {
      intro:
        'Gates of Olympus y Sweet Bonanza son dos slots de Pragmatic Play que comparten varias mecánicas, lo que los convierte en una comparación natural para quien ya juega uno de los dos y quiere conocer el otro.',
      similarities: [
        'Ambos son video slots de Pragmatic Play',
        'Ambos usan mecánica de tumble',
        'Ambos tienen símbolos multiplicadores',
        'Ambos tienen modo de giros gratis',
      ],
      differences: [
        'Gates of Olympus paga en cualquier posición de la cuadrícula; Sweet Bonanza paga por cluster',
        'Gates of Olympus tiene temática mitológica; Sweet Bonanza tiene temática de dulces',
        'Identidad visual y diseño de símbolos distintos',
      ],
      editorialSummary:
        'Quien disfruta la sensación de tumble con multiplicadores de Gates of Olympus, pero quiere una temática y una estructura de pago distintas, suele probar Sweet Bonanza después. Ninguno es objetivamente mejor — la elección depende de la preferencia de temática y de si prefieres el pago en cualquier posición o por cluster.',
      seo: {
        title: 'Gates of Olympus vs Sweet Bonanza: Comparación | PlayLiva',
        description:
          'Compara Gates of Olympus y Sweet Bonanza, conoce sus principales diferencias y descubre cuál experiencia puede interesarte más.',
      },
    },
    'crazy-time-vs-lightning-roulette': {
      intro:
        'Crazy Time y Lightning Roulette son dos juegos de casino en vivo de Evolution, pero siguen enfoques muy distintos dentro del formato en vivo — uno construido alrededor de una rueda de game show, el otro alrededor de una mesa de ruleta con multiplicadores aleatorios.',
      similarities: [
        'Ambos son juegos de casino en vivo de Evolution',
        'Ambos tienen presentador/dealer en vivo',
        'Ambos incluyen un elemento de multiplicador aleatorio',
        'Ambos están pensados para rondas rápidas y repetibles',
      ],
      differences: [
        'Crazy Time es un formato de game show construido alrededor de una rueda y rondas de bonus; Lightning Roulette es una mesa de ruleta tradicional',
        'Las apuestas en Crazy Time se hacen en segmentos de la rueda y juegos de bonus; las apuestas en Lightning Roulette se hacen en números directos con multiplicadores aleatorios',
        'Formatos completamente distintos — game show frente a juego de mesa',
      ],
      editorialSummary:
        'Cuál puede interesarte más depende del tipo de experiencia que busques. Quien disfruta el ritmo interactivo y conducido por un presentador de Crazy Time también puede disfrutar las rondas electrizantes de Lightning Roulette, pero son formatos distintos — un game show frente a una mesa de ruleta.',
      seo: {
        title: 'Crazy Time vs Lightning Roulette: Comparación | PlayLiva',
        description:
          'Compara Crazy Time y Lightning Roulette, conoce sus principales diferencias y descubre qué tipo de experiencia ofrece cada juego en vivo.',
      },
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
    seo: c?.seo,
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
  methodologyCriteria?: string[]
  selectionReasons?: Record<string, string>
}

const LIST_CONTENT: Record<Locale, Record<string, ListContent>> = {
  'pt-BR': {
    'best-crash-games-brazil': {
      title: 'Seleção editorial de crash games no Brasil',
      intro:
        'Esta seleção reúne Aviator, JetX e Spaceman para comparar mecânicas, apresentação e disponibilidade verificada no mercado brasileiro. A ordem organiza a leitura e não indica desempenho ou chance de resultado.',
      editorialContent:
        'A seleção usa critérios editoriais fixos: mecânicas documentadas, disponibilidade no Brasil confirmada nos registros da PlayLiva, diferenças úteis entre os formatos e qualidade das fontes consultadas. A ordem serve apenas para leitura; não é previsão, avaliação de desempenho nem garantia de ganho.',
      seoTitle: 'Melhores Jogos Crash no Brasil: Seleção Editorial | PlayLiva',
      seoDescription:
        'Compare uma seleção editorial de jogos crash no Brasil, entenda por que cada título foi incluído e veja os critérios verificáveis da PlayLiva.',
      methodologyCriteria: [
        'Mecânicas e recursos documentados no catálogo editorial',
        'Diferenças de formato que ajudam a comparar a experiência',
        'Compatibilidade com celular registrada para o título',
        'Disponibilidade em operadora aprovada e verificada para o Brasil',
        'Clareza das regras e identificação do provedor',
      ],
      selectionReasons: {
        g1: 'Incluído como referência do formato crash da SPRIBE, com cash out manual e automático, duas apostas e disponibilidade verificada no Brasil.',
        g2: 'Incluído para representar uma implementação da SmartSoft com duas apostas e identidade visual própria, permitindo uma comparação direta com Aviator.',
        g3: 'Incluído pela mecânica documentada de cash out parcial e pela apresentação da Pragmatic Play, que acrescentam um ponto de comparação distinto.',
      },
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
      title: 'Seleção editorial de slots no Brasil',
      intro:
        'Esta seleção reúne Gates of Olympus, Sweet Bonanza e Big Bass Bonanza para comparar mecânicas documentadas e disponibilidade verificada no Brasil. A ordem organiza a leitura e não indica desempenho ou chance de resultado.',
      editorialContent:
        'A seleção usa critérios editoriais fixos: identidade do provedor, mecânicas registradas, diferenças úteis entre formatos, suporte a dispositivos e disponibilidade no Brasil confirmada nos registros da PlayLiva. A ordem serve apenas para leitura; não é previsão, avaliação de desempenho nem garantia de ganho.',
      seoTitle: 'Seleção de Slots no Brasil: Critérios Editoriais | PlayLiva',
      seoDescription:
        'Compare uma seleção editorial de slots no Brasil, entenda os critérios de inclusão e veja opções com disponibilidade verificada.',
      methodologyCriteria: [
        'Mecânicas e recursos documentados no catálogo editorial',
        'Diferenças de formato que ajudam a comparar os títulos',
        'Compatibilidade registrada com computador, celular e tablet',
        'Disponibilidade em operadora aprovada e verificada para o Brasil',
        'Identificação clara do provedor e da categoria',
      ],
      selectionReasons: {
        g5: 'Incluído para representar pagamento em qualquer posição, cascatas, multiplicadores e rodadas grátis em um título da Pragmatic Play.',
        g6: 'Incluído para comparar outra aplicação de pagamento em qualquer posição e cascatas, com tema de doces e multiplicadores no recurso de rodadas grátis.',
        g11: 'Incluído por usar rodadas grátis, coleta de prêmios e multiplicadores em uma estrutura diferente dos outros dois títulos.',
      },
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
      title: 'Selección editorial de juegos crash en Brasil',
      intro:
        'Esta selección reúne Aviator, JetX y Spaceman para comparar mecánicas, presentación y disponibilidad verificada en el mercado brasileño. El orden organiza la lectura y no indica rendimiento ni probabilidad de resultado.',
      editorialContent:
        'La selección usa criterios editoriales fijos: mecánicas documentadas, disponibilidad en Brasil confirmada en los registros de PlayLiva, diferencias útiles entre formatos y calidad de las fuentes consultadas. El orden solo guía la lectura; no predice resultados ni rendimiento.',
      seoTitle: 'Selección de Juegos Crash en Brasil | PlayLiva',
      seoDescription:
        'Compara una selección editorial de juegos crash disponibles en Brasil y conoce los criterios usados por PlayLiva.',
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
      title: 'Editorial crash game selection for Brazil',
      intro:
        'This selection brings together Aviator, JetX and Spaceman to compare mechanics, presentation and verified availability in Brazil. The order structures the guide and does not imply performance or likely outcomes.',
      editorialContent:
        "The selection uses fixed editorial criteria: documented mechanics, Brazil availability confirmed in PlayLiva's records, meaningful format differences and source quality. Order is for reading only; it does not predict results or performance.",
      seoTitle: 'Editorial Crash Game Selection for Brazil | PlayLiva',
      seoDescription:
        'Compare an editorial selection of crash games available in Brazil and see the criteria PlayLiva used.',
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
    methodologyCriteria: c?.methodologyCriteria,
    selectionReasons: c?.selectionReasons,
  }
}

/** Alias kept for readability at call sites that pass a GameList. */
export const getGameListContent = getListContent

/* ------------------------------------------------------------------ */
/* Small convenience accessors                                         */
/* ------------------------------------------------------------------ */

/** Localized category display name only. */
export function getCategoryName(slug: CategorySlug | 'sports', locale: Locale): string {
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

/* ------------------------------------------------------------------ */
/* "Best Crash Games" editorial discovery hub (/best/crash-games)      */
/* ------------------------------------------------------------------ */

interface CrashHubCriterion {
  label: string
  text: string
}

interface CrashHubContent {
  seoTitle: string
  seoDescription: string
  h1: string
  breadcrumbLabel: string
  intro: string
  featuredHeading: string
  featuredSub: string
  howToChooseHeading: string
  howToChooseIntro: string
  criteria: CrashHubCriterion[]
  whereToPlayHeading: string
  whereToPlaySub: string
}

const CRASH_HUB_CONTENT: Record<Locale, CrashHubContent> = {
  'pt-BR': {
    seoTitle: 'Como Escolher Crash Games: Guia de Comparação | PlayLiva',
    seoDescription:
      'Aprenda a comparar jogos crash por mecânicas, cash out, interface, celular, provedor, modo gratuito e disponibilidade verificada.',
    h1: 'Como avaliar e escolher crash games',
    breadcrumbLabel: 'Guia de crash games',
    intro:
      'Crash games são jogos de multiplicador: uma curva sobe a partir de 1x enquanto a rodada está em andamento, e cabe ao jogador decidir o momento de sair — o cash out — antes que a rodada termine. Este guia explica como comparar apresentação, ritmo, provedor, mecânicas e disponibilidade. Não é um ranking nem uma promessa de resultado.',
    featuredHeading: 'Crash games em destaque',
    featuredSub:
      'Exemplos do catálogo para comparar mecânicas, provedores e apresentações sem transformar o guia em um ranking.',
    howToChooseHeading: 'Como escolher um crash game?',
    howToChooseIntro:
      'Não existe uma fórmula que garanta resultado em um crash game — cada rodada é independente. O que pode ajudar é entender o que diferencia um título do outro:',
    criteria: [
      {
        label: 'Apresentação',
        text: 'O visual e o tema do jogo — de um avião estilizado a um foguete espacial — mudam a experiência sem alterar a mecânica central.',
      },
      {
        label: 'Ritmo',
        text: 'Algumas rodadas são bem curtas e se repetem rapidamente; outras dão mais tempo para acompanhar a curva subir.',
      },
      {
        label: 'Provedor',
        text: 'Cada crash game é desenvolvido por um provedor diferente (Spribe, SmartSoft, Pragmatic Play, entre outros), o que influencia a qualidade da apresentação e a disponibilidade em cada operador.',
      },
      {
        label: 'Mecânica',
        text: 'Recursos como cash-out automático, apostas duplas simultâneas ou cash-out parcial variam de título para título.',
      },
      {
        label: 'Disponibilidade',
        text: 'Nem todo crash game está disponível em todos os operadores ou mercados — vale confirmar antes de escolher onde jogar.',
      },
      {
        label: 'Experiência no celular',
        text: 'Confira se a interface mantém controles legíveis, cash out acessível e acompanhamento claro da rodada em telas menores.',
      },
      {
        label: 'Modo gratuito',
        text: 'Um modo gratuito pode ajudar a entender regras e controles sem apostar dinheiro. A presença desse modo deve ser confirmada em cada produto.',
      },
      {
        label: 'Clareza das regras',
        text: 'Prefira páginas e produtos que identifiquem o provedor, expliquem a rodada e apresentem os recursos sem prometer resultados.',
      },
    ],
    whereToPlayHeading: 'Onde jogar crash games?',
    whereToPlaySub:
      'Operadores verificados e aprovados que oferecem crash games na sua região.',
  },
  'es-MX': {
    seoTitle: 'Guía de Juegos Crash: Cómo Comparar Formatos | PlayLiva',
    seoDescription:
      'Conoce juegos crash como Aviator, JetX y Spaceman, compara sus estilos y descubre opciones disponibles en PlayLiva.',
    h1: 'Guía de juegos crash: cómo comparar formatos',
    breadcrumbLabel: 'Guía de juegos crash',
    intro:
      'Los juegos crash usan un multiplicador que sube desde 1x durante la ronda, y el jugador decide cuándo retirarse antes de que termine. Esta guía explica cómo comparar presentación, ritmo, proveedor, mecánicas y disponibilidad. No es una clasificación ni una promesa de resultado.',
    featuredHeading: 'Juegos crash destacados',
    featuredSub:
      'Una selección editorial de los juegos crash más conocidos, con una breve explicación de qué hace diferente a cada uno.',
    howToChooseHeading: 'Cómo elegir un juego crash',
    howToChooseIntro:
      'No existe una fórmula que garantice un resultado en un juego crash —cada ronda es independiente—. Lo que sí puede ayudar es entender qué diferencia a un título de otro:',
    criteria: [
      {
        label: 'Presentación',
        text: 'El estilo visual y la temática —de un avión estilizado a un cohete espacial— cambian la experiencia sin modificar la mecánica central.',
      },
      {
        label: 'Ritmo',
        text: 'Algunas rondas son muy cortas y se repiten rápido; otras dan más tiempo para seguir la curva mientras sube.',
      },
      {
        label: 'Proveedor',
        text: 'Cada juego crash lo desarrolla un proveedor distinto (Spribe, SmartSoft, Pragmatic Play, entre otros), lo que influye en la calidad de la presentación y en su disponibilidad en cada operador.',
      },
      {
        label: 'Mecánica',
        text: 'Funciones como el cash out automático, las apuestas dobles simultáneas o el cash out parcial varían de un título a otro.',
      },
      {
        label: 'Disponibilidad',
        text: 'No todos los juegos crash están disponibles en todos los operadores o mercados — conviene confirmarlo antes de elegir dónde jugar.',
      },
    ],
    whereToPlayHeading: 'Dónde jugar juegos crash',
    whereToPlaySub:
      'Operadores verificados y aprobados que ofrecen juegos crash en tu región.',
  },
  en: {
    seoTitle: 'Crash Game Guide: How to Compare Formats | PlayLiva',
    seoDescription:
      'Discover crash games like Aviator, JetX and Spaceman, compare their styles and find available options on PlayLiva.',
    h1: 'Crash game guide: how to compare formats',
    breadcrumbLabel: 'Crash game guide',
    intro:
      'Crash games use a multiplier that rises from 1x during a round, and the player decides when to cash out before it ends. This guide explains how to compare presentation, pace, provider, mechanics and availability. It is not a ranking or a promise of any outcome.',
    featuredHeading: 'Featured crash games',
    featuredSub:
      'An editorial selection of the best-known crash games, with a short note on what makes each one different.',
    howToChooseHeading: 'How to choose a crash game?',
    howToChooseIntro:
      'There is no formula that guarantees an outcome in a crash game — every round is independent. What can help is understanding what sets one title apart from another:',
    criteria: [
      {
        label: 'Presentation',
        text: 'Visual style and theme — from a stylized plane to a space rocket — change the experience without altering the core mechanic.',
      },
      {
        label: 'Pace',
        text: 'Some rounds are short and repeat quickly; others give more time to follow the curve as it rises.',
      },
      {
        label: 'Provider',
        text: 'Each crash game is built by a different provider (Spribe, SmartSoft, Pragmatic Play, among others), which affects presentation quality and availability at each operator.',
      },
      {
        label: 'Mechanics',
        text: 'Features like auto cash-out, simultaneous double bets or partial cash-out vary from title to title.',
      },
      {
        label: 'Availability',
        text: 'Not every crash game is available at every operator or market — worth confirming before choosing where to play.',
      },
    ],
    whereToPlayHeading: 'Where to play crash games',
    whereToPlaySub:
      'Verified, approved operators offering crash games in your region.',
  },
}

export function getCrashHubContent(locale: Locale): CrashHubContent {
  return CRASH_HUB_CONTENT[locale]
}
