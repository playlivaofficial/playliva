import type { Locale } from './types'

export const LOCALES: Locale[] = ['pt-BR', 'es-MX', 'en']
export const DEFAULT_LOCALE: Locale = 'pt-BR'

/**
 * UI string dictionaries for the public launch experience.
 * Brand names and official game names are never translated.
 * Use {token} placeholders; fill them with the `t(key, vars)` helper.
 */
type Dict = Record<string, string>

const ptBR: Dict = {
  // Brand
  'brand.slogan': 'Encontre seu próximo jogo.',
  'brand.tagline': 'Descoberta de jogos feita para o seu mercado.',

  // Hero
  'hero.titleLead': 'Encontre seu',
  'hero.titleHighlight': 'próximo jogo',
  'hero.subtitle':
    'Descubra jogos populares, compare títulos parecidos e veja onde jogá-los no seu mercado.',
  'hero.chipTitle': 'Guias verificados',
  'hero.chipSub': 'Conteúdo editorial independente',

  // Navigation
  'nav.home': 'Início',
  'nav.games': 'Jogos',
  'nav.play': 'Jogar',
  'nav.crash': 'Crash',
  'nav.slots': 'Slots',
  'nav.liveCasino': 'Cassino ao Vivo',
  'nav.sports': 'Esportes',
  'nav.tableGames': 'Jogos de Mesa',
  'nav.instantGames': 'Jogos Instantâneos',
  'nav.more': 'Mais',
  'nav.offers': 'Ofertas',
  'nav.operators': 'Operadores',
  'nav.about': 'Sobre',
  'nav.openMenu': 'Abrir menu',
  'nav.closeMenu': 'Fechar menu',
  'nav.menu': 'Menu',

  // Common CTAs
  'cta.exploreGames': 'Explorar jogos',
  'cta.browseCategories': 'Ver categorias',
  'cta.viewOffers': 'Ver ofertas',
  'cta.getOffer': 'Ver oferta',
  'cta.viewOffer': 'Ver oferta',
  'cta.viewDetails': 'Ver detalhes',
  'cta.visitOperator': 'Visitar operador',
  'cta.seeWhereToPlay': 'Ver onde jogar',
  'cta.browseAllGames': 'Ver todos os jogos',
  'cta.viewGame': 'Ver jogo',
  'cta.compare': 'Comparar',
  'cta.backToGames': 'Voltar aos jogos',
  'cta.backToGame': 'Voltar para {game}',
  'cta.backHome': 'Voltar ao início',
  'cta.explore': 'Explorar {name}',
  'affiliate.sponsored': 'Patrocinado',
  'affiliate.visitNamed': 'Visitar {name}',
  'affiliate.playAtNamed': 'Jogar na {name}',
  'affiliate.exploreNamed': 'Explorar {name}',
  'affiliate.homeBannerBody':
    'Conheça cassino e apostas na Betsson. A PlayLiva não aceita apostas nem depósitos.',
  'affiliate.genericBoundary':
    'Esta é uma indicação da marca do operador, não uma afirmação de que este PlayLiva Original esteja disponível lá.',
  'affiliate.playRealBetsson': 'JOGAR NA BETSSON',
  'affiliate.sponsoredPartner': 'Parceiro patrocinado',
  'affiliate.verifiedOffers': 'Ofertas verificadas',

  // Central partner promo (chrome only; the campaign claim comes verbatim from config)
  'promo.eyebrow': 'Oferta do parceiro',
  'promo.casinoBoundary':
    'Promoção de cassino da Betsson para jogadores no Brasil. Não se refere a este jogo. Condições no site oficial.',
  'promo.offerBoundary':
    'Promoção de cassino da Betsson para jogadores no Brasil. Condições completas no site oficial.',
  'promo.terms': 'Termos e condições',
  'promo.keepPlaying': 'Continuar jogando grátis',
  'promo.close': 'Fechar oferta',
  'promo.dialogLabel': 'Oferta da Betsson',

  // Selectors
  'selector.country': 'Selecionar país',
  'selector.language': 'Selecionar idioma',
  'selector.countryLabel': 'País',
  'selector.languageLabel': 'Idioma',

  // Geo / market
  'geo.marketLabel': 'Seu mercado',
  'geo.country': 'País',
  'geo.popularIn': 'Populares no {country}',
  'geo.popularInSub':
    'Uma seleção editorial dos jogos que os jogadores mais descobrem no {country}.',
  'geo.whereToPlay': 'Onde jogar',
  'geo.availableMarkets': 'Mercados disponíveis',
  'geo.availableIn': 'Disponível no {country}',
  'geo.emptyMarketTitle': 'Estamos preparando este mercado',
  'geo.emptyMarket':
    'Ainda estamos selecionando os títulos populares para {country}. Explore toda a biblioteca de jogos ou troque seu mercado acima.',

  // Category page
  'category.eyebrow': 'Categoria',
  'category.gamesEyebrow': 'Jogos',
  'category.popularTitle': 'Títulos de {category} em destaque no {market}',
  'category.popularSub':
    'Os títulos de {category} que os jogadores no {market} estão explorando agora. A disponibilidade pode variar por operador.',
  'category.empty': 'Ainda não há jogos listados nesta categoria.',
  'category.viewRanking': 'Ver ranking',
  'category.headToHead': '{category} frente a frente',
  'category.headToHeadSub':
    'Veja como os títulos mais populares desta categoria se comparam entre si.',
  'category.operatorsTitle': 'Operadores de {category} no {market}',
  'category.operatorsSub':
    'Os operadores exibidos correspondem ao país selecionado. Termos e disponibilidade variam.',
  'seo.comparisonTitle': '{a} vs {b} — Comparação de jogos',
  'best.methodologyTitle': 'Como fizemos esta seleção',

  // Sports — odds discovery & comparison
  'sports.pageTitle': "Arquivo de Esportes",
  'sports.pageSub':
    "Arquivo demonstrativo mantido para links existentes. Esportes não fazem mais parte das categorias principais da PlayLiva.",
  'sports.eyebrow': "Arquivo",
  'sports.demoNotice':
    "Arquivo demonstrativo: partidas, odds e casas são exemplos, não dados ao vivo. Apostas indisponíveis. LivaSports é um produto separado; nenhum destino de redirecionamento foi anunciado aqui.",
  'sports.sport.football': 'Futebol',
  'sports.sport.basketball': 'Basquete',
  'sports.sport.tennis': 'Tênis',
  'sports.featuredTitle': 'Jogos em Destaque',
  'sports.featuredSub': 'As principais partidas para comparar odds agora.',
  'sports.compareOdds': 'Comparar Odds',
  'sports.bookmakersCompared': '{count} casas comparadas',
  'sports.home': 'Casa',
  'sports.draw': 'Empate',
  'sports.away': 'Fora',
  'sports.bestOdds': 'Melhor Odd',
  'sports.bet': 'Apostar',
  'sports.oddsDisclaimer':
    'As odds podem mudar. Verifique os valores finais no site da operadora.',
  'sports.oddsComparisonTitle': 'Comparação de Odds',
  'sports.bookmaker': 'Casa de Apostas',
  'sports.totalGoals': 'Total de Gols',
  'sports.over': 'Mais de {line}',
  'sports.under': 'Menos de {line}',
  'sports.bothTeamsToScore': 'Ambas Marcam',
  'sports.yes': 'Sim',
  'sports.no': 'Não',
  'sports.doubleChance': 'Chance Dupla',
  'sports.doubleChanceHomeOrDraw': 'Casa ou Empate',
  'sports.doubleChanceDrawOrAway': 'Empate ou Fora',
  'sports.doubleChanceHomeOrAway': 'Casa ou Fora',
  'sports.moreMarkets': 'Mais Mercados',
  'sports.matchInfo': 'Informações da Partida',
  'sports.competition': 'Competição',
  'sports.matchDate': 'Data',
  'sports.matchTime': 'Horário',
  'sports.venue': 'Estádio',
  'sports.venueUnavailable': 'A ser confirmado',
  'sports.filterSport': 'Esporte',
  'sports.filterLeague': 'Liga',
  'sports.filterDate': 'Data',
  'sports.dateToday': 'Hoje',
  'sports.dateTomorrow': 'Amanhã',
  'sports.dateUpcoming': 'Próximos',
  'sports.dateAll': 'Todas as datas',
  'sports.allLeagues': 'Todas as ligas',
  'sports.noMatches': 'Nenhuma partida encontrada para este filtro.',
  'sports.comingSoonForMarket':
    "Nenhum serviço de apostas está disponível neste arquivo.",
  'sports.leagueMatchesTitle': 'Partidas de {league}',
  'sports.leaguesTitle': 'Ligas e Competições',
  'sports.viewLeague': 'Ver liga',
  'sports.upcomingMatches': 'Próximas Partidas',
  'sports.backToSport': 'Voltar para {sport}',
  'sports.backToLeague': 'Voltar para {league}',
  'sports.matchNotFound': 'Partida não encontrada.',
  'sports.leagueNotFound': 'Liga não encontrada.',

  // Game detail
  'game.byProvider': 'Por {provider}',
  'game.marketsSupported': '{count} mercados compatíveis',
  'game.gamesLike': 'Jogos como {game}',
  'game.gamesLikeSub':
    'Títulos parecidos que você pode curtir, com base na jogabilidade e na categoria.',
  'game.viewAllAlternatives': 'Ver todas as alternativas',
  'game.discoveryEyebrow': 'Descoberta',
  'game.aboutTitle': 'Sobre o jogo',
  'game.whatIsTitle': 'O que é o {game}?',
  'game.whyPopularTitle': 'Por que o {game} ficou tão conhecido?',
  'game.ownershipNote':
    'A PlayLiva não possui nem opera {game}. A disponibilidade do jogo é definida por operadores licenciados e pode variar por país.',
  'game.howItWorksTitle': 'Como funciona',
  'game.step1': 'Escolha um operador disponível no seu mercado.',
  'game.step2': 'Abra o jogo pelo lobby do operador.',
  'game.step3': 'Jogue com responsabilidade, com limites definidos com antecedência.',
  'game.chanceNote':
    'Os resultados dependem do acaso. Nenhuma estratégia garante ganhos.',
  'game.keyInfoTitle': 'Informações principais do jogo',
  'game.compareTitle': 'Compare {game}',
  'game.compareSub': 'Veja como este título se compara a jogos parecidos.',
  'game.whereToPlayTitle': 'Onde jogar {game} no {market}',
  'game.whereToPlaySub':
    'Os operadores exibidos correspondem ao mercado selecionado e oferecem esta categoria.',
  'game.fullGuide': 'Guia completo de onde jogar',

  // Geo (detail extras)
  'geo.reviewingTitle': 'As opções para {market} estão em análise no momento.',
  'geo.reviewingBody': 'Tente outro país pelo seletor no cabeçalho.',
  'geo.viewingFor': 'Você está vendo a disponibilidade para {flag} {market}.',

  // Labels (editorial)
  'label.popular': 'Popular',
  'label.trending': 'Em alta',
  'label.new': 'Novidade',
  'label.editorial': 'Seleção editorial',
  'label.provider': 'Provedor',
  'label.category': 'Categoria',
  'label.gameType': 'Tipo de jogo',
  'label.verified': 'Operador verificado',
  'label.payments': 'Opções de pagamento',
  'label.devices': 'Dispositivos',
  'label.mechanics': 'Mecânicas',
  'label.markets': 'Mercados',
  'label.welcomeCategory': 'Boas-vindas',

  // Homepage sections
  'home.exploreByType': 'Explore por tipo de jogo',
  'home.exploreByTypeSub':
    'Encontre o estilo de jogo que combina com você — do crash aos cassinos ao vivo.',
  'games.pageEyebrow': 'Descoberta',
  'games.pageTitle': 'Explore os jogos',
  'games.pageSub':
    'Navegue pelos jogos populares de todas as categorias e descubra onde jogá-los no seu mercado.',
  'home.trending': 'Jogos populares',
  'home.trendingSub': 'Uma seleção editorial de jogos em destaque.',
  'home.gamesLike': 'Jogos parecidos com {game}',
  'home.gamesLikeSub': 'Se você curte {game}, talvez goste destes títulos.',
  'home.compare': 'Compare jogos populares',
  'home.compareSub': 'Veja como os títulos mais procurados se diferenciam.',
  'home.whereToPlaySub':
    'Descubra onde encontrar seus jogos favoritos no seu mercado.',

  // Responsible gaming block (home)
  'rg.title': 'Jogo responsável',
  'rg.blockTitle': 'Jogue por diversão.',
  'rg.blockBody':
    'Apostar envolve risco financeiro e deve ser tratado como entretenimento, não como forma de ganhar dinheiro. Jogue apenas com valores que você pode perder.',

  // Games explorer
  'games.title': 'Todos os jogos',
  'games.sub': 'Explore, filtre e descubra jogos disponíveis no seu mercado.',
  'games.searchPlaceholder': 'Buscar por nome, categoria ou provedor',
  'games.all': 'Todos',
  'games.sortBy': 'Ordenar por',
  'games.sortPopular': 'Popularidade',
  'games.sortNewest': 'Mais recentes',
  'games.sortAZ': 'A–Z',
  'games.resultsCount': '{count} jogos',
  'games.emptyTitle': 'Nenhum jogo encontrado',
  'games.empty':
    'Nenhum jogo encontrado. Tente outro nome ou explore uma categoria.',
  'games.clearFilters': 'Limpar filtros',

  // Game detail (legacy extras)
  'game.responsibleNote':
    'As informações são apenas para descoberta. Jogue com responsabilidade.',

  // Comparison
  'compare.eyebrow': 'Comparação',
  'compare.vs': 'vs',
  'compare.similarities': 'Semelhanças',
  'compare.differences': 'Diferenças',
  'compare.which': 'Qual pode combinar com você?',
  'compare.moreComparisons': 'Mais comparações',
  'compare.playA': 'Ver {game}',
  'compare.playB': 'Ver {game}',
  'compare.viewGame': 'Ver {game}',
  'compare.editorialNote':
    'Esta é uma comparação editorial para fins de descoberta. Nenhum dos jogos é apresentado como mais provável de ganhar — os resultados dependem do acaso.',
  'compare.whereToPlayTitle': 'Onde jogar no {market}',
  'compare.whereToPlaySub': 'Operadores correspondentes ao mercado selecionado.',
  'compare.whereToPlayCta': 'Onde jogar {game}',

  // Where to play (shared empty states)
  'geo.offersReviewing': 'As opções para {market} estão em análise no momento.',
  'geo.offersReviewingBody':
    'Só exibimos operadores após verificá-los para este mercado.',

  // Games like / best
  'like.eyebrow': 'Descoberta',
  'like.why': 'Por que os jogadores gostam de {game}',
  'like.heroSub':
    'Se você curte {game}, estes títulos de {category} têm uma pegada parecida. Descubra alternativas e onde jogá-las.',
  'like.whyBody':
    '{game} se destaca por ritmo, mecânica e emoção. Reunimos títulos que compartilham essas qualidades para você descobrir seu próximo jogo favorito.',
  'like.allCategory': 'Ver todos os jogos de {category}',
  'like.bestAlternatives': 'Melhores alternativas a {game}',
  'like.alternativesSub':
    'Títulos parecidos, selecionados pela jogabilidade e pela categoria.',
  'like.comparisons': 'Compare {game} lado a lado',
  'like.comparisonsSub':
    'Veja comparações diretas para entender as diferenças entre os títulos.',
  'like.alternatives': 'Alternativas a {game}',
  'best.rankingNote':
    'Rankings refletem a avaliação editorial da PlayLiva com base em disponibilidade, popularidade e variedade — não são previsão de resultados.',
  'best.howWeRank': 'Como classificamos',
  'best.whyIncluded': 'Por que está na lista',
  'best.keyMechanic': 'Mecânica principal',
  'best.whereToPlayGame': 'Onde jogar no {market}',
  'best.similarGames': 'Jogos parecidos',
  'best.whereToPlayEyebrow': 'Onde jogar',
  'best.whereToPlayTitle': 'Operadores no {market}',
  'best.whereToPlaySub':
    'Os operadores exibidos correspondem ao mercado selecionado.',
  'best.guideCovers':
    'Este guia cobre os jogos que os jogadores estão descobrindo em {flag} {market}.',

  // Where to play
  'wtp.title': 'Onde jogar {game} no {country}',
  'wtp.intro':
    'Veja os operadores disponíveis no {country} onde você pode descobrir {game}, além de informações de mercado.',
  'wtp.operators': 'Operadores no {country}',
  'wtp.operatorsSub':
    'Os operadores exibidos correspondem ao mercado selecionado e oferecem esta categoria.',
  'wtp.empty':
  'Estamos verificando quais operadoras oferecem {game} no {market}. As opções serão exibidas aqui somente após confirmação de disponibilidade e parceria.',
  'wtp.operatorsTitle': 'Operadoras com {game} no {market}',
  'wtp.methodologyTitle': 'Como comparamos as operadoras',
  'wtp.methodologyIntro':
  'Nossa comparação segue uma metodologia editorial fixa, aplicada da mesma forma a todas as operadoras analisadas:',
  'wtp.methodology1': 'Disponibilidade confirmada no Brasil',
  'wtp.methodology2': 'Disponibilidade verificada do jogo em questão',
  'wtp.methodology3': 'Reputação e histórico da marca',
  'wtp.methodology4': 'Métodos de pagamento oferecidos',
  'wtp.methodology5': 'Qualidade da experiência em dispositivos móveis',
  'wtp.methodology6': 'Experiência de retirada relatada por usuários',
  'wtp.methodology7': 'Status de aprovação como parceira afiliada da PlayLiva',
  'wtp.methodology8':
  'Dados de conversão, quando existem dados reais disponíveis',
  'wtp.checklistTitle': 'O que verificar antes de jogar',
  'wtp.checklist1': 'Se a operadora está disponível no seu mercado',
  'wtp.checklist2': 'Os termos e condições da operadora',
  'wtp.checklist3': 'Os métodos de pagamento aceitos',
  'wtp.checklist4': 'As ferramentas de jogo responsável disponíveis',
  'wtp.checklist5':
  'Os detalhes finais da oferta diretamente no site da operadora',
  'wtp.aboutGameTitle': 'Sobre o {game}',
  'wtp.viewGameCta': 'Ver página do jogo',
  'wtp.viewGamesLikeCta': 'Ver jogos parecidos',
  'like.alternativesDetailTitle': 'Conheça cada alternativa',
 'wtp.serviceNote':
    'A PlayLiva é um serviço de descoberta. Não operamos jogos nem processamos apostas.',
  'wtp.noOperators': 'Estamos analisando as opções disponíveis para este mercado.',

  // Operators
  'operators.eyebrow': 'Diretório',
  'operators.title': 'Operadores',
  'operators.sub': 'Explore operadores por mercado e categoria.',
  'operators.filterAll': 'Todos',
  'operators.filterCasino': 'Cassino',
  'operators.filterSports': 'Esportes',
  'operators.filterCrash': 'Disponibilidade de crash',
  'operators.allCountries': 'Todos os países',
  'operators.count': '{count} operador(es) encontrado(s)',
  'operators.gamesHere': 'Jogos disponíveis aqui',
  'operators.gamesHereSub': 'Títulos populares que você pode descobrir com este operador.',
  'operators.paymentMethods': 'Métodos de pagamento',
  'operators.reviewing': 'Estamos analisando as opções disponíveis para este mercado.',
  'operators.reviewingSub':
    'Ainda não temos operadores verificados para exibir aqui. Enquanto isso, explore os jogos disponíveis no seu mercado.',
  'operators.filterLabel': 'Filtrar operadores',
  'operators.emptyTitle': 'Diretório de operadores em breve.',
  'operators.emptyBody':
    'Estamos verificando operadores licenciados para os seus mercados antes de listá-los. Enquanto isso, explore os jogos e descubra o que jogar.',
  'operators.backToAll': 'Todos os operadores',
  'operators.verifiedBadge': 'Verificado',
  'operators.detailsTitle': 'Detalhes',
  'operators.countryAvailability': 'Disponibilidade por país',
  'operators.gameTypesLabel': 'Tipos de jogo',
  'operators.gamesHereDetail':
    'Títulos populares que você pode descobrir na {operator} no {market}.',
  'operators.offersTitle': 'Ofertas',
  'operators.termsTitle': 'Termos importantes',
  'operators.termsPlaceholder':
    'Termos de exemplo. Os termos reais do operador, condições de bônus e elegibilidade são definidos pelo operador e devem ser revisados no site dele. Termos se aplicam. 18+.',

  // Offers
  'offers.title': 'Ofertas',
  'offers.sub': 'Uma seleção de ofertas de operadores para o seu mercado.',
  'offers.reviewing': 'Estamos analisando as ofertas disponíveis para {country}.',
  'offers.reviewingSub':
    'Ainda não temos ofertas verificadas para este mercado. Explore os jogos disponíveis enquanto isso.',
  'offers.demoNotice':
    'Conteúdo de demonstração. As ofertas exibidas são exemplos e não representam promoções reais.',
  'offers.heroTitle': 'Ofertas no {market}',
  'offers.heroSub':
    'Só exibimos ofertas depois de verificá-las para o seu mercado. Confira o que está disponível agora.',
  'offers.showingFor': 'Exibindo para',
  'offers.emptyTitle': 'As ofertas para {market} estão em análise.',
  'offers.emptyBody':
    'Só exibimos ofertas após verificá-las para este mercado. Enquanto isso, explore os jogos disponíveis.',
  'offers.highlighted': 'Destaques',
  'offers.featured': 'Ofertas em destaque',
  'offers.featuredSub': 'Ofertas verificadas para jogadores no {market}.',
  'offers.casino': 'Ofertas de cassino',
  'offers.sports': 'Ofertas de esportes',
  'offers.newPlayer': 'Ofertas para novos jogadores',

  // Play / where to play hub
  'play.title': 'Onde jogar',
  'play.sub':
    'Escolha um jogo e descubra onde jogá-lo no seu mercado com operadores disponíveis.',
  'play.heroTitle': 'Encontre onde jogar seus jogos favoritos',
  'play.heroSub':
    'Escolha uma categoria ou jogo e descubra operadores disponíveis no seu mercado.',
  'play.recommendedFor': 'Operadores no {market}',
  'play.recommendedSub':
    'Os operadores exibidos correspondem ao mercado selecionado. Termos e disponibilidade variam.',

  // Forms / contact
  'contact.title': 'Fale conosco',
  'contact.sub': 'Tem uma pergunta ou sugestão? Envie uma mensagem.',
  'contact.name': 'Nome',
  'contact.email': 'E-mail',
  'contact.message': 'Mensagem',
  'contact.send': 'Enviar mensagem',
  'contact.openDraft': 'Abrir rascunho de e-mail',
  'contact.draftNote': 'Este formulário abre seu aplicativo de e-mail. A PlayLiva não envia a mensagem por aqui; revise e envie pelo seu e-mail. Se o aplicativo não abrir, escreva diretamente para:',
  'contact.sendAnother': 'Enviar outra mensagem',
  'contact.successTitle': 'Mensagem enviada',
  'contact.success': 'Obrigado pelo contato. Retornaremos em breve.',
  'contact.errName': 'Informe seu nome.',
  'contact.errEmail': 'Informe um e-mail válido.',
  'contact.errMessage': 'Escreva uma mensagem.',
  'contact.namePlaceholder': 'Seu nome',
  'contact.emailPlaceholder': 'voce@exemplo.com',
  'contact.messagePlaceholder': 'Como podemos ajudar?',
  'contact.topic': 'Assunto',
  'contact.topicGeneral': 'Geral',
  'contact.topicPartnership': 'Parceria',
  'contact.topicAffiliate': 'Afiliados',
  'contact.topicOperator': 'Correção de operador',
  'contact.topicResponsible': 'Questão de jogo responsável',
  'contact.emailCardTitle': 'Envie um e-mail',
  'contact.emailCardText': 'Prefere e-mail? Fale com a gente diretamente em:',
  'contact.emailCardNote':
    'Para questões de jogo responsável, utilize também os recursos oficiais de apoio disponíveis no seu país.',
  'contact.successNote':
    'Este é um formulário protótipo, então nenhuma mensagem foi enviada. Em produção, sua mensagem chegaria à nossa equipe e responderíamos por e-mail.',

  // Legal
  'legal.templateNotice':
    'Modelo — requer revisão jurídica antes do lançamento.',

  // Footer
  'footer.tagline':
    'PlayLiva é uma plataforma de descoberta de jogos. Não aceitamos apostas nem processamos depósitos.',
  'footer.discover': 'Descobrir',
  'footer.company': 'Empresa',
  'footer.legal': 'Legal',
  'footer.contact': 'Contato',
  'footer.affiliateDisclosure': 'Divulgação de afiliados',
  'footer.privacy': 'Política de Privacidade',
  'footer.terms': 'Termos e Condições',
  'footer.responsible': 'Jogo Responsável',
  'footer.cookies': 'Política de Cookies',
  'footer.risk': 'Apostar envolve risco.',
  'footer.rights': '© {year} PlayLiva. Todos os direitos reservados.',
  'footer.disclaimer':
    'PlayLiva é uma plataforma informativa de descoberta de jogos e afiliação. Não somos um cassino, operador ou casa de apostas. Conteúdo para maiores de 18 anos.',

  // Cookie banner
  'cookie.title': 'Nós valorizamos sua privacidade',
  'cookie.body':
    'Usamos cookies essenciais para o funcionamento do site e cookies opcionais de análise para melhorar sua experiência. Você pode escolher o que aceitar.',
  'cookie.acceptAll': 'Aceitar todos',
  'cookie.rejectAll': 'Recusar opcionais',
  'cookie.customize': 'Personalizar',
  'cookie.preferences': 'Preferências de cookies',
  'cookie.save': 'Salvar preferências',
  'cookie.necessary': 'Essenciais',
  'cookie.necessaryDesc': 'Necessários para o funcionamento do site. Sempre ativos.',
  'cookie.analytics': 'Análise',
  'cookie.analyticsDesc': 'Ajudam a entender como o site é usado.',
  'cookie.marketing': 'Marketing',
  'cookie.marketingDesc': 'Usados para medir campanhas. Desativados por padrão.',
  'cookie.always': 'Sempre ativo',

  // Notices
  'notice.affiliate':
    'A PlayLiva pode receber comissão de afiliados por indicações. Isso não gera custo para você e não influencia nosso conteúdo editorial.',
  'notice.affiliateShort': 'Este site pode receber comissão de afiliados por indicações.',
  'notice.responsible':
    'Conteúdo destinado a maiores de 18 anos. Se o jogo deixar de ser diversão, faça uma pausa e procure ajuda.',
  'notice.responsibleShort':
    'Jogue com responsabilidade. Apostar envolve risco financeiro.',
  'notice.responsibleFull':
    'Apostar envolve risco financeiro e pode causar dependência. Esta plataforma é destinada a maiores de 18 anos. Se o jogo deixar de ser diversão, faça uma pausa ou procure ajuda. Jogue com responsabilidade e aposte apenas o que puder perder.',
  'notice.trust':
    '18+ • Jogue com responsabilidade • A disponibilidade varia por localização',
  'notice.age': '18+',

  // 404
  'notFound.title': 'Não encontramos essa página',
  'notFound.body':
    'A página que você procura pode ter sido movida. Vamos te levar de volta a descobrir jogos.',

  // Generic
  'common.viewAll': 'Ver tudo',
  'common.loading': 'Carregando…',
  'common.new': 'Novo',

  // SEO metadata (dynamic page titles/descriptions)
  'seo.homeTitle': 'PlayLiva — Descubra Jogos no Seu Mercado',
  'seo.homeDescription':
    'A PlayLiva é um serviço independente de descoberta de jogos. Explore jogos populares, compare títulos parecidos e veja onde jogá-los no seu mercado. Não aceitamos apostas nem processamos pagamentos.',
  'seo.gameDescriptionSuffix':
    'Descubra onde jogar {game} no seu mercado com a PlayLiva.',
  'seo.categoryAvailabilitySuffix':
    'Compare a disponibilidade no seu mercado.',
  'seo.gamesPageTitle': 'Explorar Jogos',
  'seo.gamesPageDescription':
    "Explore jogos de crash, slots, cassino ao vivo, jogos de mesa e jogos instantâneos e descubra sua disponibilidade no seu mercado.",
  'seo.operatorsPageTitle': 'Operadores',
  'seo.operatorsPageDescription':
    'Navegue e compare operadores licenciados por país e categoria. A PlayLiva pode receber comissão de parceiros selecionados.',
  'seo.offersPageTitle': 'Ofertas',
  'seo.offersPageDescription':
    'Explore ofertas verificadas disponíveis no seu mercado. Aplicam-se termos, 18+, disponibilidade varia por localização.',
  'seo.playPageTitle': 'Pronto para Jogar',
  'seo.playPageDescription':
    'Escolha um jogo e compare os operadores disponíveis no seu mercado com a PlayLiva.',
  'seo.sportsPageTitle': "Arquivo de Esportes",
  'seo.sportsPageDescription':
    "Arquivo demonstrativo mantido para links existentes. Esportes não fazem mais parte das categorias principais da PlayLiva.",
  'seo.sportOddsTitle': 'Comparação de Odds de {sport}',
  'seo.sportOddsDescription':
    'Compare odds de apostas de {sport} entre casas de apostas. Dados de demonstração — a PlayLiva não aceita apostas.',
  'seo.leagueOddsTitle': 'Comparação de Odds de {league}',
  'seo.leagueOddsDescription':
    'Compare odds de apostas de {league} entre casas de apostas. Dados de demonstração — a PlayLiva não aceita apostas.',
  'seo.matchOddsTitle': '{home} vs {away} — Comparação de Odds',
  'seo.matchOddsDescription':
    'Compare odds de apostas para {home} vs {away} ({league}) entre casas de apostas. Dados de demonstração — a PlayLiva não aceita apostas.',
  'seo.gamesLikeTitle': 'Jogos como {game} — Melhores alternativas a {game}',
  'seo.gamesLikeDescription':
    'Descubra as melhores alternativas a {game}. Compare jogos parecidos e veja onde jogá-los de forma responsável no seu mercado.',
  'seo.whereToPlayTitle': 'Onde jogar {game}',
  'seo.whereToPlayDescription':
    'Encontre operadores que oferecem {game} e outros jogos de {gameType} no seu mercado. Compare avaliações, ofertas e disponibilidade. 18+.',
  'seo.operatorDescription':
    '{operator} — tipos de jogo, métodos de pagamento e disponibilidade. Compare onde jogar com a PlayLiva.',
}

const esMX: Dict = {
  'brand.slogan': 'Encuentra tu próximo juego.',
  'brand.tagline': 'Descubrimiento de juegos hecho para tu mercado.',

  'hero.titleLead': 'Encuentra tu',
  'hero.titleHighlight': 'próximo juego',
  'hero.subtitle':
    'Descubre juegos populares, compara títulos parecidos y mira dónde jugarlos en tu mercado.',
  'hero.chipTitle': 'Guías verificadas',
  'hero.chipSub': 'Contenido editorial independiente',

  'nav.home': 'Inicio',
  'nav.games': 'Juegos',
  'nav.play': 'Jugar',
  'nav.crash': 'Crash',
  'nav.slots': 'Slots',
  'nav.liveCasino': 'Casino en Vivo',
  'nav.sports': 'Deportes',
  'nav.tableGames': 'Juegos de Mesa',
  'nav.instantGames': 'Juegos Instantáneos',
  'nav.more': 'Más',
  'nav.offers': 'Ofertas',
  'nav.operators': 'Operadores',
  'nav.about': 'Acerca de',
  'nav.openMenu': 'Abrir menú',
  'nav.closeMenu': 'Cerrar menú',
  'nav.menu': 'Menú',

  'cta.exploreGames': 'Explorar juegos',
  'cta.browseCategories': 'Ver categorías',
  'cta.viewOffers': 'Ver ofertas',
  'cta.getOffer': 'Ver oferta',
  'cta.viewOffer': 'Ver oferta',
  'cta.viewDetails': 'Ver detalles',
  'cta.visitOperator': 'Visitar operador',
  'cta.seeWhereToPlay': 'Ver dónde jugar',
  'cta.browseAllGames': 'Ver todos los juegos',
  'cta.viewGame': 'Ver juego',
  'cta.compare': 'Comparar',
  'cta.backToGames': 'Volver a los juegos',
  'cta.backToGame': 'Volver a {game}',
  'cta.backHome': 'Volver al inicio',
  'cta.explore': 'Explorar {name}',
  'affiliate.sponsored': 'Patrocinado',
  'affiliate.visitNamed': 'Visitar {name}',
  'affiliate.playAtNamed': 'Jugar en {name}',
  'affiliate.exploreNamed': 'Explorar {name}',
  'affiliate.homeBannerBody':
    'Explora casino y apuestas en Betsson. PlayLiva no acepta apuestas ni depósitos.',
  'affiliate.genericBoundary':
    'Esta es una indicación de la marca del operador, no una afirmación de que este PlayLiva Original esté disponible allí.',
  'affiliate.playRealBetsson': 'JUGAR EN BETSSON',
  'affiliate.sponsoredPartner': 'Socio patrocinado',
  'affiliate.verifiedOffers': 'Ofertas verificadas',

  // Central partner promo (chrome only; the campaign claim comes verbatim from config)
  'promo.eyebrow': 'Oferta del socio',
  'promo.casinoBoundary':
    'Promoción de casino de Betsson para jugadores en Brasil. No se refiere a este juego. Condiciones en el sitio oficial.',
  'promo.offerBoundary':
    'Promoción de casino de Betsson para jugadores en Brasil. Condiciones completas en el sitio oficial.',
  'promo.terms': 'Términos y condiciones',
  'promo.keepPlaying': 'Seguir jugando gratis',
  'promo.close': 'Cerrar oferta',
  'promo.dialogLabel': 'Oferta de Betsson',

  'selector.country': 'Seleccionar país',
  'selector.language': 'Seleccionar idioma',
  'selector.countryLabel': 'País',
  'selector.languageLabel': 'Idioma',

  'geo.marketLabel': 'Tu mercado',
  'geo.country': 'País',
  'geo.popularIn': 'Populares en {country}',
  'geo.popularInSub':
    'Una selección editorial de los juegos que más descubren los jugadores en {country}.',
  'geo.whereToPlay': 'Dónde jugar',
  'geo.availableMarkets': 'Mercados disponibles',
  'geo.availableIn': 'Disponible en {country}',
  'geo.emptyMarketTitle': 'Estamos preparando este mercado',
  'geo.emptyMarket':
    'Todavía estamos seleccionando los títulos populares para {country}. Explora toda la biblioteca de juegos o cambia tu mercado arriba.',

  'category.eyebrow': 'Categoría',
  'category.gamesEyebrow': 'Juegos',
  'category.popularTitle': 'Juegos de {category} populares en {market}',
  'category.popularSub':
    'Los títulos de {category} que los jugadores en {market} están explorando ahora. La disponibilidad puede variar según el operador.',
  'category.empty': 'Aún no hay juegos listados en esta categoría.',
  'category.viewRanking': 'Ver ranking',
  'category.headToHead': '{category} frente a frente',
  'category.headToHeadSub':
    'Mira cómo se comparan entre sí los títulos más populares de esta categoría.',
  'category.operatorsTitle': 'Operadores de {category} en {market}',
  'category.operatorsSub':
    'Los operadores mostrados corresponden al país seleccionado. Los términos y la disponibilidad varían.',
  'seo.comparisonTitle': '{a} vs {b} — Comparación de juegos',
  'best.methodologyTitle': 'Cómo hicimos esta selección',

  // Sports — odds discovery & comparison
  'sports.pageTitle': "Archivo de Deportes",
  'sports.pageSub':
    "Archivo de demostración conservado para enlaces existentes. Los deportes ya no forman parte de las categorías principales de PlayLiva.",
  'sports.eyebrow': "Archivo",
  'sports.demoNotice':
    "Archivo de demostración: partidos, cuotas y casas son ejemplos, no datos en vivo. Apuestas no disponibles. LivaSports es un producto separado; aquí no se ha anunciado un destino de redirección.",
  'sports.sport.football': 'Fútbol',
  'sports.sport.basketball': 'Baloncesto',
  'sports.sport.tennis': 'Tenis',
  'sports.featuredTitle': 'Partidos Destacados',
  'sports.featuredSub': 'Los partidos más relevantes para comparar cuotas ahora.',
  'sports.compareOdds': 'Comparar Cuotas',
  'sports.bookmakersCompared': '{count} casas de apuestas comparadas',
  'sports.home': 'Local',
  'sports.draw': 'Empate',
  'sports.away': 'Visitante',
  'sports.bestOdds': 'Mejor Cuota',
  'sports.bet': 'Apostar',
  'sports.oddsDisclaimer':
    'Las cuotas pueden cambiar. Verifica los valores finales en el sitio del operador.',
  'sports.oddsComparisonTitle': 'Comparación de Cuotas',
  'sports.bookmaker': 'Casa de Apuestas',
  'sports.totalGoals': 'Total de Goles',
  'sports.over': 'Más de {line}',
  'sports.under': 'Menos de {line}',
  'sports.bothTeamsToScore': 'Ambos Anotan',
  'sports.yes': 'Sí',
  'sports.no': 'No',
  'sports.doubleChance': 'Doble Oportunidad',
  'sports.doubleChanceHomeOrDraw': 'Local o Empate',
  'sports.doubleChanceDrawOrAway': 'Empate o Visitante',
  'sports.doubleChanceHomeOrAway': 'Local o Visitante',
  'sports.moreMarkets': 'Más Mercados',
  'sports.matchInfo': 'Información del Partido',
  'sports.competition': 'Competición',
  'sports.matchDate': 'Fecha',
  'sports.matchTime': 'Hora',
  'sports.venue': 'Estadio',
  'sports.venueUnavailable': 'Por confirmar',
  'sports.filterSport': 'Deporte',
  'sports.filterLeague': 'Liga',
  'sports.filterDate': 'Fecha',
  'sports.dateToday': 'Hoy',
  'sports.dateTomorrow': 'Mañana',
  'sports.dateUpcoming': 'Próximos',
  'sports.dateAll': 'Todas las fechas',
  'sports.allLeagues': 'Todas las ligas',
  'sports.noMatches': 'No se encontraron partidos para este filtro.',
  'sports.comingSoonForMarket':
    "No hay ningún servicio de apuestas disponible en este archivo.",
  'sports.leagueMatchesTitle': 'Partidos de {league}',
  'sports.leaguesTitle': 'Ligas y Competiciones',
  'sports.viewLeague': 'Ver liga',
  'sports.upcomingMatches': 'Próximos Partidos',
  'sports.backToSport': 'Volver a {sport}',
  'sports.backToLeague': 'Volver a {league}',
  'sports.matchNotFound': 'Partido no encontrado.',
  'sports.leagueNotFound': 'Liga no encontrada.',

  'game.byProvider': 'Por {provider}',
  'game.marketsSupported': '{count} mercados compatibles',
  'game.gamesLike': 'Juegos como {game}',
  'game.gamesLikeSub':
    'Títulos parecidos que podrías disfrutar, según la jugabilidad y la categoría.',
  'game.viewAllAlternatives': 'Ver todas las alternativas',
  'game.discoveryEyebrow': 'Descubrimiento',
  'game.aboutTitle': 'Sobre el juego',
  'game.whatIsTitle': '¿Qué es {game}?',
  'game.whyPopularTitle': '¿Por qué {game} se volvió tan conocido?',
  'game.ownershipNote':
    'PlayLiva no posee ni opera {game}. La disponibilidad del juego la definen operadores con licencia y puede variar según el país.',
  'game.howItWorksTitle': 'Cómo funciona',
  'game.step1': 'Elige un operador disponible en tu mercado.',
  'game.step2': 'Abre el juego desde el lobby del operador.',
  'game.step3': 'Juega con responsabilidad, con límites definidos de antemano.',
  'game.chanceNote':
    'Los resultados dependen del azar. Ninguna estrategia garantiza ganancias.',
  'game.keyInfoTitle': 'Información clave del juego',
  'game.compareTitle': 'Compara {game}',
  'game.compareSub': 'Mira cómo se compara este título con juegos parecidos.',
  'game.whereToPlayTitle': 'Dónde jugar {game} en {market}',
  'game.whereToPlaySub':
    'Los operadores mostrados corresponden al mercado seleccionado y ofrecen esta categoría.',
  'game.fullGuide': 'Guía completa de dónde jugar',

  'geo.reviewingTitle': 'Las opciones para {market} están en revisión por ahora.',
  'geo.reviewingBody': 'Prueba otro país desde el selector en el encabezado.',
  'geo.viewingFor': 'Estás viendo la disponibilidad para {flag} {market}.',

  'label.popular': 'Popular',
  'label.trending': 'En tendencia',
  'label.new': 'Nuevo',
  'label.editorial': 'Selección editorial',
  'label.provider': 'Proveedor',
  'label.category': 'Categoría',
  'label.gameType': 'Tipo de juego',
  'label.verified': 'Operador verificado',
  'label.payments': 'Opciones de pago',
  'label.devices': 'Dispositivos',
  'label.mechanics': 'Mecánicas',
  'label.markets': 'Mercados',
  'label.welcomeCategory': 'Bienvenida',

  'home.exploreByType': 'Explora por tipo de juego',
  'home.exploreByTypeSub':
    'Encuentra el estilo de juego que va contigo — del crash a los casinos en vivo.',
  'games.pageEyebrow': 'Descubrimiento',
  'games.pageTitle': 'Explora los juegos',
  'games.pageSub':
    'Explora los juegos populares de todas las categorías y descubre dónde jugarlos en tu mercado.',
  'home.trending': 'Juegos populares',
  'home.trendingSub': 'Una selección editorial de juegos destacados.',
  'home.gamesLike': 'Juegos parecidos a {game}',
  'home.gamesLikeSub': 'Si te gusta {game}, quizá disfrutes estos títulos.',
  'home.compare': 'Compara juegos populares',
  'home.compareSub': 'Mira cómo se diferencian los títulos más buscados.',
  'home.whereToPlaySub':
    'Descubre dónde encontrar tus juegos favoritos en tu mercado.',

  'rg.title': 'Juego responsable',
  'rg.blockTitle': 'Juega por diversión.',
  'rg.blockBody':
    'Apostar implica riesgo financiero y debe tratarse como entretenimiento, no como una forma de ganar dinero. Juega solo con dinero que puedas permitirte perder.',

  'games.title': 'Todos los juegos',
  'games.sub': 'Explora, filtra y descubre juegos disponibles en tu mercado.',
  'games.searchPlaceholder': 'Buscar por nombre, categoría o proveedor',
  'games.all': 'Todos',
  'games.sortBy': 'Ordenar por',
  'games.sortPopular': 'Popularidad',
  'games.sortNewest': 'Más recientes',
  'games.sortAZ': 'A–Z',
  'games.resultsCount': '{count} juegos',
  'games.emptyTitle': 'No se encontraron juegos',
  'games.empty':
    'No encontramos ese juego. Prueba con otro nombre o explora una categoría.',
  'games.clearFilters': 'Limpiar filtros',

  'game.responsibleNote':
    'La información es solo para descubrimiento. Juega con responsabilidad.',

  'compare.eyebrow': 'Comparación',
  'compare.vs': 'vs',
  'compare.similarities': 'Similitudes',
  'compare.differences': 'Diferencias',
  'compare.which': '¿Cuál puede ir contigo?',
  'compare.moreComparisons': 'Más comparaciones',
  'compare.playA': 'Ver {game}',
  'compare.playB': 'Ver {game}',
  'compare.viewGame': 'Ver {game}',
  'compare.editorialNote':
    'Esta es una comparación editorial con fines de descubrimiento. Ninguno de los juegos se presenta como más probable de ganar — los resultados dependen del azar.',
  'compare.whereToPlayTitle': 'Dónde jugar en {market}',
  'compare.whereToPlaySub': 'Operadores que corresponden al mercado seleccionado.',
  'compare.whereToPlayCta': 'Dónde jugar {game}',

  'geo.offersReviewing': 'Las opciones para {market} están en revisión por ahora.',
  'geo.offersReviewingBody':
    'Solo mostramos operadores después de verificarlos para este mercado.',

  'like.eyebrow': 'Descubrimiento',
  'like.why': 'Por qué a los jugadores les gusta {game}',
  'like.heroSub':
    'Si disfrutas {game}, estos títulos de {category} tienen un estilo parecido. Descubre alternativas y dónde jugarlas.',
  'like.whyBody':
    '{game} destaca por su ritmo, mecánica y emoción. Reunimos títulos que comparten esas cualidades para que descubras tu próximo juego favorito.',
  'like.allCategory': 'Ver todos los juegos de {category}',
  'like.bestAlternatives': 'Mejores alternativas a {game}',
  'like.alternativesSub':
    'Títulos parecidos, seleccionados por su jugabilidad y categoría.',
  'like.comparisons': 'Compara {game} lado a lado',
  'like.comparisonsSub':
    'Consulta comparaciones directas para entender las diferencias entre los títulos.',
  'like.alternatives': 'Alternativas a {game}',
  'best.rankingNote':
    'Los rankings reflejan la evaluación editorial de PlayLiva según disponibilidad, popularidad y variedad — no predicen resultados.',
  'best.howWeRank': 'Cómo clasificamos',
  'best.whyIncluded': 'Por qué está en la lista',
  'best.keyMechanic': 'Mecánica principal',
  'best.whereToPlayGame': 'Dónde jugar en {market}',
  'best.similarGames': 'Juegos parecidos',
  'best.whereToPlayEyebrow': 'Dónde jugar',
  'best.whereToPlayTitle': 'Operadores en {market}',
  'best.whereToPlaySub':
    'Los operadores mostrados corresponden al mercado seleccionado.',
  'best.guideCovers':
    'Esta guía cubre los juegos que los jugadores están descubriendo en {flag} {market}.',

  'wtp.title': 'Dónde jugar {game} en {country}',
  'wtp.intro':
    'Consulta los operadores disponibles en {country} donde puedes descubrir {game}, además de información del mercado.',
  'wtp.operators': 'Operadores en {country}',
  'wtp.operatorsSub':
    'Los operadores mostrados corresponden al mercado seleccionado y ofrecen esta categoría.',
  'wtp.empty':
  'Estamos verificando qué operadores ofrecen {game} en {market}. Las opciones aparecerán aquí únicamente después de confirmar su disponibilidad y la relación de afiliación.',
  'wtp.operatorsTitle': 'Operadoras con {game} en {market}',
  'wtp.methodologyTitle': 'Cómo comparamos las operadoras',
  'wtp.methodologyIntro':
  'Nuestra comparación sigue una metodología editorial fija, aplicada de la misma forma a todas las operadoras analizadas:',
  'wtp.methodology1': 'Disponibilidad confirmada en el mercado',
  'wtp.methodology2': 'Disponibilidad verificada del juego en cuestión',
  'wtp.methodology3': 'Reputación e historial de la marca',
  'wtp.methodology4': 'Métodos de pago ofrecidos',
  'wtp.methodology5': 'Calidad de la experiencia en dispositivos móviles',
  'wtp.methodology6': 'Experiencia de retiro reportada por usuarios',
  'wtp.methodology7': 'Estado de aprobación como socia afiliada de PlayLiva',
  'wtp.methodology8':
  'Datos de conversión, cuando existen datos reales disponibles',
  'wtp.checklistTitle': 'Qué verificar antes de jugar',
  'wtp.checklist1': 'Si la operadora está disponible en tu mercado',
  'wtp.checklist2': 'Los términos y condiciones de la operadora',
  'wtp.checklist3': 'Los métodos de pago aceptados',
  'wtp.checklist4': 'Las herramientas de juego responsable disponibles',
  'wtp.checklist5':
  'Los detalles finales de la oferta directamente en el sitio de la operadora',
  'wtp.aboutGameTitle': 'Sobre {game}',
  'wtp.viewGameCta': 'Ver página del juego',
  'wtp.viewGamesLikeCta': 'Ver juegos parecidos',
  'like.alternativesDetailTitle': 'Conoce cada alternativa',
 'wtp.serviceNote':
    'PlayLiva es un servicio de descubrimiento. No operamos juegos ni procesamos apuestas.',
  'wtp.noOperators': 'Estamos revisando las opciones disponibles para este mercado.',

  'operators.eyebrow': 'Directorio',
  'operators.title': 'Operadores',
  'operators.sub': 'Explora operadores por mercado y categoría.',
  'operators.filterAll': 'Todos',
  'operators.filterCasino': 'Casino',
  'operators.filterSports': 'Deportes',
  'operators.filterCrash': 'Disponibilidad de crash',
  'operators.filterLabel': 'Filtrar operadores',
  'operators.allCountries': 'Todos los países',
  'operators.count': '{count} operador(es) encontrado(s)',
  'operators.emptyTitle': 'Directorio de operadores próximamente.',
  'operators.emptyBody':
    'Estamos verificando operadores con licencia para tus mercados antes de listarlos. Mientras tanto, explora los juegos y descubre qué jugar.',
  'operators.gamesHere': 'Juegos disponibles aquí',
  'operators.gamesHereSub': 'Títulos populares que puedes descubrir con este operador.',
  'operators.paymentMethods': 'Métodos de pago',
  'operators.reviewing': 'Estamos revisando las opciones disponibles para este mercado.',
  'operators.reviewingSub':
    'Todavía no tenemos operadores verificados para mostrar aquí. Mientras tanto, explora los juegos disponibles en tu mercado.',
  'operators.backToAll': 'Todos los operadores',
  'operators.verifiedBadge': 'Verificado',
  'operators.detailsTitle': 'Detalles',
  'operators.countryAvailability': 'Disponibilidad por país',
  'operators.gameTypesLabel': 'Tipos de juego',
  'operators.gamesHereDetail':
    'Títulos populares que puedes descubrir en {operator} en {market}.',
  'operators.offersTitle': 'Ofertas',
  'operators.termsTitle': 'Términos importantes',
  'operators.termsPlaceholder':
    'Términos de ejemplo. Los términos reales del operador, condiciones de bono y elegibilidad los define el operador y deben revisarse en su sitio. Aplican términos. 18+.',

  'offers.title': 'Ofertas',
  'offers.sub': 'Una selección de ofertas de operadores para tu mercado.',
  'offers.reviewing': 'Estamos revisando las ofertas disponibles para {country}.',
  'offers.reviewingSub':
    'Todavía no tenemos ofertas verificadas para este mercado. Explora los juegos disponibles mientras tanto.',
  'offers.demoNotice':
    'Contenido de demostración. Las ofertas mostradas son ejemplos y no representan promociones reales.',
  'offers.heroTitle': 'Ofertas en {market}',
  'offers.heroSub':
    'Solo mostramos ofertas después de verificarlas para tu mercado. Consulta lo que está disponible ahora.',
  'offers.showingFor': 'Mostrando para',
  'offers.emptyTitle': 'Las ofertas para {market} están en revisión.',
  'offers.emptyBody':
    'Solo mostramos ofertas después de verificarlas para este mercado. Mientras tanto, explora los juegos disponibles.',
  'offers.highlighted': 'Destacados',
  'offers.featured': 'Ofertas destacadas',
  'offers.featuredSub': 'Ofertas verificadas para jugadores en {market}.',
  'offers.casino': 'Ofertas de casino',
  'offers.sports': 'Ofertas de deportes',
  'offers.newPlayer': 'Ofertas para nuevos jugadores',

  'play.title': 'Dónde jugar',
  'play.sub':
    'Elige un juego y descubre dónde jugarlo en tu mercado con operadores disponibles.',
  'play.heroTitle': 'Encuentra dónde jugar tus juegos favoritos',
  'play.heroSub':
    'Elige una categoría o juego y descubre operadores disponibles en tu mercado.',
  'play.recommendedFor': 'Operadores en {market}',
  'play.recommendedSub':
    'Los operadores mostrados corresponden al mercado seleccionado. Los términos y la disponibilidad varían.',

  'contact.title': 'Contáctanos',
  'contact.sub': '¿Tienes una pregunta o sugerencia? Envíanos un mensaje.',
  'contact.name': 'Nombre',
  'contact.email': 'Correo electrónico',
  'contact.message': 'Mensaje',
  'contact.send': 'Enviar mensaje',
  'contact.openDraft': 'Abrir borrador de correo',
  'contact.draftNote': 'Este formulario abre tu aplicación de correo. PlayLiva no envía el mensaje desde aquí; revísalo y envíalo desde tu correo. Si la aplicación no se abre, escribe directamente a:',
  'contact.sendAnother': 'Enviar otro mensaje',
  'contact.successTitle': 'Mensaje enviado',
  'contact.success': 'Gracias por escribirnos. Te responderemos pronto.',
  'contact.errName': 'Ingresa tu nombre.',
  'contact.errEmail': 'Ingresa un correo válido.',
  'contact.errMessage': 'Escribe un mensaje.',
  'contact.namePlaceholder': 'Tu nombre',
  'contact.emailPlaceholder': 'tu@ejemplo.com',
  'contact.messagePlaceholder': '¿Cómo podemos ayudarte?',
  'contact.topic': 'Tema',
  'contact.topicGeneral': 'General',
  'contact.topicPartnership': 'Alianza',
  'contact.topicAffiliate': 'Afiliados',
  'contact.topicOperator': 'Corrección de operador',
  'contact.topicResponsible': 'Tema de juego responsable',
  'contact.emailCardTitle': 'Escríbenos por correo',
  'contact.emailCardText': '¿Prefieres el correo? Escríbenos directamente a:',
  'contact.emailCardNote':
    'Para temas de juego responsable, utiliza también los recursos oficiales de apoyo disponibles en tu país.',
  'contact.successNote':
    'Este es un formulario prototipo, así que no se envió ningún mensaje. En producción, tu mensaje llegaría a nuestro equipo y responderíamos por correo.',

  'legal.templateNotice':
    'Plantilla — requiere revisión legal antes del lanzamiento.',

  'footer.tagline':
    'PlayLiva es una plataforma de descubrimiento de juegos. No aceptamos apuestas ni procesamos depósitos.',
  'footer.discover': 'Descubrir',
  'footer.company': 'Empresa',
  'footer.legal': 'Legal',
  'footer.contact': 'Contacto',
  'footer.affiliateDisclosure': 'Divulgación de afiliados',
  'footer.privacy': 'Política de Privacidad',
  'footer.terms': 'Términos y Condiciones',
  'footer.responsible': 'Juego Responsable',
  'footer.cookies': 'Política de Cookies',
  'footer.risk': 'Apostar implica riesgo.',
  'footer.rights': '© {year} PlayLiva. Todos los derechos reservados.',
  'footer.disclaimer':
    'PlayLiva es una plataforma informativa de descubrimiento de juegos y afiliación. No somos un casino, operador ni casa de apuestas. Contenido para mayores de 18 años.',

  'cookie.title': 'Valoramos tu privacidad',
  'cookie.body':
    'Usamos cookies esenciales para el funcionamiento del sitio y cookies opcionales de análisis para mejorar tu experiencia. Puedes elegir qué aceptar.',
  'cookie.acceptAll': 'Aceptar todas',
  'cookie.rejectAll': 'Rechazar opcionales',
  'cookie.customize': 'Personalizar',
  'cookie.preferences': 'Preferencias de cookies',
  'cookie.save': 'Guardar preferencias',
  'cookie.necessary': 'Esenciales',
  'cookie.necessaryDesc': 'Necesarias para el funcionamiento del sitio. Siempre activas.',
  'cookie.analytics': 'Análisis',
  'cookie.analyticsDesc': 'Ayudan a entender cómo se usa el sitio.',
  'cookie.marketing': 'Marketing',
  'cookie.marketingDesc': 'Se usan para medir campañas. Desactivadas por defecto.',
  'cookie.always': 'Siempre activa',

  'notice.affiliate':
    'PlayLiva puede recibir comisión de afiliados por referencias. Esto no tiene costo para ti y no influye en nuestro contenido editorial.',
  'notice.affiliateShort': 'Este sitio puede recibir comisión de afiliados por referencias.',
  'notice.responsible':
    'Contenido destinado a mayores de 18 años. Si el juego deja de ser diversión, toma un descanso y busca ayuda.',
  'notice.responsibleShort':
    'Juega con responsabilidad. Apostar implica riesgo financiero.',
  'notice.responsibleFull':
    'Apostar implica riesgo financiero y puede causar adicción. Esta plataforma está destinada a mayores de 18 años. Si el juego deja de ser diversión, toma un descanso o busca ayuda. Juega con responsabilidad y apuesta solo lo que puedas permitirte perder.',
  'notice.trust':
    '18+ • Juega con responsabilidad • La disponibilidad varía según la ubicación',
  'notice.age': '18+',

  'notFound.title': 'No encontramos esa página',
  'notFound.body':
    'La página que buscas pudo haberse movido. Te llevamos de vuelta a descubrir juegos.',

  'common.viewAll': 'Ver todo',
  'common.loading': 'Cargando…',
  'common.new': 'Nuevo',

  // SEO metadata (dynamic page titles/descriptions)
  'seo.homeTitle': 'PlayLiva — Descubre Juegos en Tu Mercado',
  'seo.homeDescription':
    'PlayLiva es un servicio independiente de descubrimiento de juegos. Explora juegos populares, compara títulos similares y descubre dónde jugarlos en tu mercado. No aceptamos apuestas ni procesamos pagos.',
  'seo.gameDescriptionSuffix':
    'Descubre dónde jugar {game} en tu mercado con PlayLiva.',
  'seo.categoryAvailabilitySuffix':
    'Compara la disponibilidad en tu mercado.',
  'seo.gamesPageTitle': 'Explorar Juegos',
  'seo.gamesPageDescription':
    "Explora juegos crash, slots, casino en vivo, juegos de mesa e instantáneos y descubre su disponibilidad en tu mercado.",
  'seo.operatorsPageTitle': 'Operadores',
  'seo.operatorsPageDescription':
    'Explora y compara operadores con licencia por país y categoría. PlayLiva puede recibir una comisión de socios seleccionados.',
  'seo.offersPageTitle': 'Ofertas',
  'seo.offersPageDescription':
    'Explora ofertas verificadas disponibles en tu mercado. Aplican términos, 18+, la disponibilidad varía según la ubicación.',
  'seo.playPageTitle': 'Listo para Jugar',
  'seo.playPageDescription':
    'Elige un juego y compara los operadores disponibles en tu mercado con PlayLiva.',
  'seo.sportsPageTitle': "Archivo de Deportes",
  'seo.sportsPageDescription':
    "Archivo de demostración conservado para enlaces existentes. Los deportes ya no forman parte de las categorías principales de PlayLiva.",
  'seo.sportOddsTitle': 'Comparación de Cuotas de {sport}',
  'seo.sportOddsDescription':
    'Compara cuotas de apuestas de {sport} entre casas de apuestas. Datos de demostración — PlayLiva no acepta apuestas.',
  'seo.leagueOddsTitle': 'Comparación de Cuotas de {league}',
  'seo.leagueOddsDescription':
    'Compara cuotas de apuestas de {league} entre casas de apuestas. Datos de demostración — PlayLiva no acepta apuestas.',
  'seo.matchOddsTitle': '{home} vs {away} — Comparación de Cuotas',
  'seo.matchOddsDescription':
    'Compara cuotas de apuestas para {home} vs {away} ({league}) entre casas de apuestas. Datos de demostración — PlayLiva no acepta apuestas.',
  'seo.gamesLikeTitle': 'Juegos como {game} — Mejores alternativas a {game}',
  'seo.gamesLikeDescription':
    'Descubre las mejores alternativas a {game}. Compara juegos similares y encuentra dónde jugarlos de forma responsable en tu mercado.',
  'seo.whereToPlayTitle': 'Dónde jugar {game}',
  'seo.whereToPlayDescription':
    'Encuentra operadores que ofrecen {game} y juegos similares de {gameType} en tu mercado. Compara valoraciones, ofertas y disponibilidad. 18+.',
  'seo.operatorDescription':
    '{operator} — tipos de juego, métodos de pago y disponibilidad. Compara dónde jugar con PlayLiva.',
  }

const en: Dict = {
  'brand.slogan': 'Find your next game.',
  'brand.tagline': 'Game discovery built for your market.',

  'hero.titleLead': 'Find your',
  'hero.titleHighlight': 'next game',
  'hero.subtitle':
    'Discover popular games, compare similar titles and see where to play them in your market.',
  'hero.chipTitle': 'Verified guides',
  'hero.chipSub': 'Independent editorial content',

  'nav.home': 'Home',
  'nav.games': 'Games',
  'nav.play': 'Play',
  'nav.crash': 'Crash',
  'nav.slots': 'Slots',
  'nav.liveCasino': 'Live Casino',
  'nav.sports': 'Sports',
  'nav.tableGames': 'Table Games',
  'nav.instantGames': 'Instant Games',
  'nav.more': 'More',
  'nav.offers': 'Offers',
  'nav.operators': 'Operators',
  'nav.about': 'About',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.menu': 'Menu',

  'cta.exploreGames': 'Explore games',
  'cta.browseCategories': 'Browse categories',
  'cta.viewOffers': 'View offers',
  'cta.getOffer': 'View offer',
  'cta.viewOffer': 'View offer',
  'cta.viewDetails': 'View details',
  'cta.visitOperator': 'Visit operator',
  'cta.seeWhereToPlay': 'See where to play',
  'cta.browseAllGames': 'Browse all games',
  'cta.viewGame': 'View game',
  'cta.compare': 'Compare',
  'cta.backToGames': 'Back to games',
  'cta.backToGame': 'Back to {game}',
  'cta.backHome': 'Back home',
  'cta.explore': 'Explore {name}',
  'affiliate.sponsored': 'Sponsored',
  'affiliate.visitNamed': 'Visit {name}',
  'affiliate.playAtNamed': 'Play at {name}',
  'affiliate.exploreNamed': 'Explore {name}',
  'affiliate.homeBannerBody':
    'Explore casino and betting at Betsson. PlayLiva does not accept bets or deposits.',
  'affiliate.genericBoundary':
    'This is a brand referral to the operator, not a claim that this PlayLiva Original is available there.',
  'affiliate.playRealBetsson': 'PLAY REAL · BETSSON',
  'affiliate.sponsoredPartner': 'Sponsored Partner',
  'affiliate.verifiedOffers': 'Verified Offers',

  // Central partner promo (chrome only; the campaign claim comes verbatim from config)
  'promo.eyebrow': 'Partner offer',
  'promo.casinoBoundary':
    'Betsson casino promotion for players in Brazil. It does not refer to this game. Conditions on the official site.',
  'promo.offerBoundary':
    'Betsson casino promotion for players in Brazil. Full conditions on the official site.',
  'promo.terms': 'Terms and conditions',
  'promo.keepPlaying': 'Keep playing free',
  'promo.close': 'Close offer',
  'promo.dialogLabel': 'Betsson offer',

  'selector.country': 'Select country',
  'selector.language': 'Select language',
  'selector.countryLabel': 'Country',
  'selector.languageLabel': 'Language',

  'geo.marketLabel': 'Your market',
  'geo.country': 'Country',
  'geo.popularIn': 'Popular in {country}',
  'geo.popularInSub':
    'An editorial selection of the games players discover most in {country}.',
  'geo.whereToPlay': 'Where to play',
  'geo.availableMarkets': 'Available markets',
  'geo.availableIn': 'Available in {country}',
  'geo.emptyMarketTitle': "We're preparing this market",
  'geo.emptyMarket':
    "We're still curating popular titles for {country}. Explore the full game library or switch your market above.",

  'category.eyebrow': 'Category',
  'category.gamesEyebrow': 'Games',
  'category.popularTitle': 'Popular {category} games in {market}',
  'category.popularSub':
    'The {category} titles players in {market} are exploring right now. Availability may vary by operator.',
  'category.empty': 'No games listed in this category yet.',
  'category.viewRanking': 'View ranking',
  'category.headToHead': '{category} head to head',
  'category.headToHeadSub':
    'See how the most popular titles in this category compare to each other.',
  'category.operatorsTitle': '{category} operators in {market}',
  'category.operatorsSub':
    'Operators shown match the selected country. Terms and availability vary.',
  'seo.comparisonTitle': '{a} vs {b} — Game comparison',
  'best.methodologyTitle': 'How this selection was made',

  // Sports — odds discovery & comparison
  'sports.pageTitle': "Sports Archive",
  'sports.pageSub':
    "Demonstration archive retained for existing links. Sports is no longer a core PlayLiva category.",
  'sports.eyebrow': "Archive",
  'sports.demoNotice':
    "Demonstration archive: matches, odds and bookmakers are examples, not live data. Betting is unavailable. LivaSports is a separate product; no redirect destination has been announced here.",
  'sports.sport.football': 'Football',
  'sports.sport.basketball': 'Basketball',
  'sports.sport.tennis': 'Tennis',
  'sports.featuredTitle': 'Featured Matches',
  'sports.featuredSub': 'The top matches to compare odds on right now.',
  'sports.compareOdds': 'Compare Odds',
  'sports.bookmakersCompared': '{count} bookmakers compared',
  'sports.home': 'Home',
  'sports.draw': 'Draw',
  'sports.away': 'Away',
  'sports.bestOdds': 'Best Odds',
  'sports.bet': 'Bet',
  'sports.oddsDisclaimer':
    "Odds may change. Check the final values on the operator's site.",
  'sports.oddsComparisonTitle': 'Odds Comparison',
  'sports.bookmaker': 'Bookmaker',
  'sports.totalGoals': 'Total Goals',
  'sports.over': 'Over {line}',
  'sports.under': 'Under {line}',
  'sports.bothTeamsToScore': 'Both Teams to Score',
  'sports.yes': 'Yes',
  'sports.no': 'No',
  'sports.doubleChance': 'Double Chance',
  'sports.doubleChanceHomeOrDraw': 'Home or Draw',
  'sports.doubleChanceDrawOrAway': 'Draw or Away',
  'sports.doubleChanceHomeOrAway': 'Home or Away',
  'sports.moreMarkets': 'More Markets',
  'sports.matchInfo': 'Match Information',
  'sports.competition': 'Competition',
  'sports.matchDate': 'Date',
  'sports.matchTime': 'Time',
  'sports.venue': 'Venue',
  'sports.venueUnavailable': 'To be confirmed',
  'sports.filterSport': 'Sport',
  'sports.filterLeague': 'League',
  'sports.filterDate': 'Date',
  'sports.dateToday': 'Today',
  'sports.dateTomorrow': 'Tomorrow',
  'sports.dateUpcoming': 'Upcoming',
  'sports.dateAll': 'All dates',
  'sports.allLeagues': 'All leagues',
  'sports.noMatches': 'No matches found for this filter.',
  'sports.comingSoonForMarket':
    "No betting service is available in this archive.",
  'sports.leagueMatchesTitle': '{league} Matches',
  'sports.leaguesTitle': 'Leagues & Competitions',
  'sports.viewLeague': 'View league',
  'sports.upcomingMatches': 'Upcoming Matches',
  'sports.backToSport': 'Back to {sport}',
  'sports.backToLeague': 'Back to {league}',
  'sports.matchNotFound': 'Match not found.',
  'sports.leagueNotFound': 'League not found.',

  // Game detail
  'game.byProvider': 'By {provider}',
  'game.marketsSupported': '{count} markets supported',
  'game.gamesLike': 'Games like {game}',
  'game.gamesLikeSub':
    'Similar titles you might enjoy, based on gameplay and category.',
  'game.viewAllAlternatives': 'View all alternatives',
  'game.discoveryEyebrow': 'Discovery',
  'game.aboutTitle': 'About the game',
  'game.whatIsTitle': 'What is {game}?',
  'game.whyPopularTitle': 'Why did {game} become so well known?',
  'game.ownershipNote':
    "PlayLiva doesn't own or operate {game}. Game availability is set by licensed operators and may vary by country.",
  'game.howItWorksTitle': 'How it works',
  'game.step1': 'Choose an operator available in your market.',
  'game.step2': "Open the game from the operator's lobby.",
  'game.step3': 'Play responsibly, with limits set in advance.',
  'game.chanceNote':
    'Results depend on chance. No strategy guarantees winnings.',
  'game.keyInfoTitle': 'Key game information',
  'game.compareTitle': 'Compare {game}',
  'game.compareSub': 'See how this title compares to similar games.',
  'game.whereToPlayTitle': 'Where to play {game} in {market}',
  'game.whereToPlaySub':
    'Operators shown match the selected market and offer this category.',
  'game.fullGuide': 'Full where-to-play guide',

  // Geo (detail extras)
  'geo.reviewingTitle': 'Options for {market} are currently under review.',
  'geo.reviewingBody': 'Try another country using the selector in the header.',
  'geo.viewingFor': "You're viewing availability for {flag} {market}.",

  // Labels (editorial)
  'label.popular': 'Popular',
  'label.trending': 'Trending',
  'label.new': 'New',
  'label.editorial': 'Editorial pick',
  'label.provider': 'Provider',
  'label.category': 'Category',
  'label.gameType': 'Game type',
  'label.verified': 'Verified operator',
  'label.payments': 'Payment options',
  'label.devices': 'Devices',
  'label.mechanics': 'Mechanics',
  'label.markets': 'Markets',
  'label.welcomeCategory': 'Welcome',

  // Homepage sections
  'home.exploreByType': 'Explore by game type',
  'home.exploreByTypeSub':
    'Find the style of game that suits you — from crash to live casinos.',
  'games.pageEyebrow': 'Discovery',
  'games.pageTitle': 'Explore games',
  'games.pageSub':
    'Browse popular games across every category and discover where to play them in your market.',
  'home.trending': 'Popular games',
  'home.trendingSub': 'An editorial selection of featured games.',
  'home.gamesLike': 'Games like {game}',
  'home.gamesLikeSub': 'If you enjoy {game}, you might like these titles.',
  'home.compare': 'Compare popular games',
  'home.compareSub': 'See how the most sought-after titles differ.',
  'home.whereToPlaySub':
    'Discover where to find your favorite games in your market.',

  // Responsible gaming block (home)
  'rg.title': 'Responsible gaming',
  'rg.blockTitle': 'Play for fun.',
  'rg.blockBody':
    'Betting involves financial risk and should be treated as entertainment, not a way to make money. Only play with money you can afford to lose.',

  // Games explorer
  'games.title': 'All games',
  'games.sub': 'Explore, filter and discover games available in your market.',
  'games.searchPlaceholder': 'Search by name, category or provider',
  'games.all': 'All',
  'games.sortBy': 'Sort by',
  'games.sortPopular': 'Popularity',
  'games.sortNewest': 'Newest',
  'games.sortAZ': 'A–Z',
  'games.resultsCount': '{count} games',
  'games.emptyTitle': 'No games found',
  'games.empty':
    "We couldn't find that game. Try another name or explore a category.",
  'games.clearFilters': 'Clear filters',

  // Game detail (legacy extras)
  'game.responsibleNote':
    'This information is for discovery purposes only. Play responsibly.',

  // Comparison
  'compare.eyebrow': 'Comparison',
  'compare.vs': 'vs',
  'compare.similarities': 'Similarities',
  'compare.differences': 'Differences',
  'compare.which': 'Which one might suit you?',
  'compare.moreComparisons': 'More comparisons',
  'compare.playA': 'View {game}',
  'compare.playB': 'View {game}',
  'compare.viewGame': 'View {game}',
  'compare.editorialNote':
    "This is an editorial comparison for discovery purposes. Neither game is presented as more likely to win — results depend on chance.",
  'compare.whereToPlayTitle': 'Where to play in {market}',
  'compare.whereToPlaySub': 'Operators matching the selected market.',
  'compare.whereToPlayCta': 'Where to play {game}',

  // Where to play (shared empty states)
  'geo.offersReviewing': 'Options for {market} are currently under review.',
  'geo.offersReviewingBody':
    'We only show operators after verifying them for this market.',

  // Games like / best
  'like.eyebrow': 'Discovery',
  'like.why': 'Why players like {game}',
  'like.heroSub':
    'If you enjoy {game}, these {category} titles have a similar feel. Discover alternatives and where to play them.',
  'like.whyBody':
    '{game} stands out for its pace, mechanics and excitement. We gathered titles that share these qualities to help you discover your next favorite game.',
  'like.allCategory': 'View all {category} games',
  'like.bestAlternatives': 'Best alternatives to {game}',
  'like.alternativesSub':
    'Similar titles, selected by gameplay and category.',
  'like.comparisons': 'Compare {game} side by side',
  'like.comparisonsSub':
    'Check direct comparisons to understand the differences between titles.',
  'like.alternatives': 'Alternatives to {game}',
  'best.rankingNote':
    "Rankings reflect PlayLiva's editorial assessment based on availability, popularity and variety — they are not a prediction of outcomes.",
  'best.howWeRank': 'How we rank',
  'best.whyIncluded': 'Why it made the list',
  'best.keyMechanic': 'Key mechanic',
  'best.whereToPlayGame': 'Where to play in {market}',
  'best.similarGames': 'Similar games',
  'best.whereToPlayEyebrow': 'Where to play',
  'best.whereToPlayTitle': 'Operators in {market}',
  'best.whereToPlaySub':
    'Operators shown match the selected market.',
  'best.guideCovers':
    'This guide covers the games players are discovering in {flag} {market}.',

  // Where to play
  'wtp.title': 'Where to play {game} in {country}',
  'wtp.intro':
    'See the operators available in {country} where you can discover {game}, plus market information.',
  'wtp.operators': 'Operators in {country}',
  'wtp.operatorsSub':
    'Operators shown match the selected market and offer this category.',
  'wtp.empty':
  "We're reviewing where to play {game} in {market}. Try another market with the selector.",
  'wtp.operatorsTitle': 'Operators with {game} in {market}',
  'wtp.methodologyTitle': 'How we compare operators',
  'wtp.methodologyIntro':
  'Our comparison follows a fixed editorial methodology, applied the same way to every operator reviewed:',
  'wtp.methodology1': 'Confirmed availability in the market',
  'wtp.methodology2': 'Verified availability of the game in question',
  'wtp.methodology3': 'Brand reputation and track record',
  'wtp.methodology4': 'Payment methods offered',
  'wtp.methodology5': 'Mobile experience quality',
  'wtp.methodology6': 'User-reported withdrawal experience',
  'wtp.methodology7': "Approval status as a PlayLiva affiliate partner",
  'wtp.methodology8': 'Conversion data, when real data is available',
  'wtp.checklistTitle': 'What to check before you play',
  'wtp.checklist1': 'Whether the operator is available in your market',
  'wtp.checklist2': "The operator's terms and conditions",
  'wtp.checklist3': 'Accepted payment methods',
  'wtp.checklist4': 'Available responsible gambling tools',
  'wtp.checklist5':
  "The final offer details directly on the operator's site",
  'wtp.aboutGameTitle': 'About {game}',
  'wtp.viewGameCta': 'View game page',
  'wtp.viewGamesLikeCta': 'View similar games',
  'like.alternativesDetailTitle': 'Get to know each alternative',
 'wtp.serviceNote':
    "PlayLiva is a discovery service. We don't operate games or process bets.",
  'wtp.noOperators': 'We are reviewing the options available for this market.',

  // Operators
  'operators.eyebrow': 'Directory',
  'operators.title': 'Operators',
  'operators.sub': 'Explore operators by market and category.',
  'operators.filterAll': 'All',
  'operators.filterCasino': 'Casino',
  'operators.filterSports': 'Sports',
  'operators.filterCrash': 'Crash availability',
  'operators.allCountries': 'All countries',
  'operators.count': '{count} operator(s) found',
  'operators.gamesHere': 'Games available here',
  'operators.gamesHereSub': 'Popular titles you can discover with this operator.',
  'operators.paymentMethods': 'Payment methods',
  'operators.reviewing': 'We are reviewing the options available for this market.',
  'operators.reviewingSub':
    "We don't have verified operators to show here yet. In the meantime, explore the games available in your market.",
  'operators.filterLabel': 'Filter operators',
  'operators.emptyTitle': 'Operator directory coming soon.',
  'operators.emptyBody':
    "We're verifying licensed operators for your markets before listing them. In the meantime, explore the games and discover what to play.",
  'operators.backToAll': 'All operators',
  'operators.verifiedBadge': 'Verified',
  'operators.detailsTitle': 'Details',
  'operators.countryAvailability': 'Country availability',
  'operators.gameTypesLabel': 'Game types',
  'operators.gamesHereDetail':
    'Popular titles you can discover at {operator} in {market}.',
  'operators.offersTitle': 'Offers',
  'operators.termsTitle': 'Important terms',
  'operators.termsPlaceholder':
    'Placeholder terms. Real operator terms, bonus conditions and eligibility are set by the operator and must be reviewed on their site. Terms apply. 18+.',

  // Offers
  'offers.title': 'Offers',
  'offers.sub': 'A selection of operator offers for your market.',
  'offers.reviewing': 'We are reviewing the offers available for {country}.',
  'offers.reviewingSub':
    "We don't have verified offers for this market yet. Explore the available games in the meantime.",
  'offers.demoNotice':
    'Demo content. The offers shown are examples and do not represent real promotions.',
  'offers.heroTitle': 'Offers in {market}',
  'offers.heroSub':
    "We only show offers after verifying them for your market. Check out what's available now.",
  'offers.showingFor': 'Showing for',
  'offers.emptyTitle': 'Offers for {market} are under review.',
  'offers.emptyBody':
    'We only show offers after verifying them for this market. In the meantime, explore the available games.',
  'offers.highlighted': 'Highlights',
  'offers.featured': 'Featured offers',
  'offers.featuredSub': 'Verified offers for players in {market}.',
  'offers.casino': 'Casino offers',
  'offers.sports': 'Sports offers',
  'offers.newPlayer': 'New player offers',

  // Play / where to play hub
  'play.title': 'Where to play',
  'play.sub':
    'Choose a game and discover where to play it in your market with available operators.',
  'play.heroTitle': 'Find where to play your favorite games',
  'play.heroSub':
    'Choose a category or game and discover operators available in your market.',
  'play.recommendedFor': 'Operators in {market}',
  'play.recommendedSub':
    'Operators shown match the selected market. Terms and availability vary.',

  // Forms / contact
  'contact.title': 'Contact us',
  'contact.sub': 'Have a question or suggestion? Send us a message.',
  'contact.name': 'Name',
  'contact.email': 'Email',
  'contact.message': 'Message',
  'contact.send': 'Send message',
  'contact.openDraft': 'Open email draft',
  'contact.draftNote': 'This form opens your email app. PlayLiva does not send the message here; review and send it from your email app. If it does not open, email us directly at:',
  'contact.sendAnother': 'Send another message',
  'contact.successTitle': 'Message sent',
  'contact.success': "Thanks for reaching out. We'll get back to you soon.",
  'contact.errName': 'Please enter your name.',
  'contact.errEmail': 'Please enter a valid email.',
  'contact.errMessage': 'Please write a message.',
  'contact.namePlaceholder': 'Your name',
  'contact.emailPlaceholder': 'you@example.com',
  'contact.messagePlaceholder': 'How can we help?',
  'contact.topic': 'Topic',
  'contact.topicGeneral': 'General',
  'contact.topicPartnership': 'Partnership',
  'contact.topicAffiliate': 'Affiliates',
  'contact.topicOperator': 'Operator correction',
  'contact.topicResponsible': 'Responsible gaming concern',
  'contact.emailCardTitle': 'Email us',
  'contact.emailCardText': 'Prefer email? Reach us directly at:',
  'contact.emailCardNote':
    'For responsible gaming concerns, also use the official support resources available in your country.',
  'contact.successNote':
    "This is a prototype form, so no message was actually sent. In production, your message would reach our team and we'd reply by email.",

  // Legal
  'legal.templateNotice':
    'Template — requires legal review before launch.',

  // Footer
  'footer.tagline':
    "PlayLiva is a game discovery platform. We don't accept bets or process deposits.",
  'footer.discover': 'Discover',
  'footer.company': 'Company',
  'footer.legal': 'Legal',
  'footer.contact': 'Contact',
  'footer.affiliateDisclosure': 'Affiliate Disclosure',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms & Conditions',
  'footer.responsible': 'Responsible Gaming',
  'footer.cookies': 'Cookie Policy',
  'footer.risk': 'Betting involves risk.',
  'footer.rights': '© {year} PlayLiva. All rights reserved.',
  'footer.disclaimer':
    "PlayLiva is an informational game discovery and affiliate platform. We are not a casino, operator or bookmaker. Content for 18+.",

  // Cookie banner
  'cookie.title': 'We value your privacy',
  'cookie.body':
    'We use essential cookies for the site to work and optional analytics cookies to improve your experience. You can choose what to accept.',
  'cookie.acceptAll': 'Accept all',
  'cookie.rejectAll': 'Reject optional',
  'cookie.customize': 'Customize',
  'cookie.preferences': 'Cookie preferences',
  'cookie.save': 'Save preferences',
  'cookie.necessary': 'Necessary',
  'cookie.necessaryDesc': 'Required for the site to function. Always active.',
  'cookie.analytics': 'Analytics',
  'cookie.analyticsDesc': 'Help us understand how the site is used.',
  'cookie.marketing': 'Marketing',
  'cookie.marketingDesc': 'Used to measure campaigns. Off by default.',
  'cookie.always': 'Always active',

  // Notices
  'notice.affiliate':
    "PlayLiva may earn an affiliate commission on referrals. This costs you nothing and doesn't influence our editorial content.",
  'notice.affiliateShort': 'This site may earn an affiliate commission on referrals.',
  'notice.responsible':
    "Content intended for ages 18+. If gaming stops being fun, take a break and seek help.",
  'notice.responsibleShort':
    'Play responsibly. Betting involves financial risk.',
  'notice.responsibleFull':
    'Betting involves financial risk and can be addictive. This platform is intended for ages 18+. If gaming stops being fun, take a break or seek help. Play responsibly and only bet what you can afford to lose.',
  'notice.trust':
    '18+ • Play responsibly • Availability varies by location',
  'notice.age': '18+',

  // 404
  'notFound.title': "We couldn't find that page",
  'notFound.body':
    "The page you're looking for may have moved. Let's get you back to discovering games.",

  // Generic
  'common.viewAll': 'View all',
  'common.loading': 'Loading…',
  'common.new': 'New',

  // SEO metadata (dynamic page titles/descriptions)
  'seo.homeTitle': 'PlayLiva — Game Discovery for Your Market',
  'seo.homeDescription':
    'PlayLiva is an independent game discovery service. Explore popular games, compare similar titles and see where to play them in your market. We do not accept bets or process payments.',
  'seo.gameDescriptionSuffix':
    'Discover where to play {game} in your market with PlayLiva.',
  'seo.categoryAvailabilitySuffix':
    'Compare availability in your market.',
  'seo.gamesPageTitle': 'Explore Games',
  'seo.gamesPageDescription':
    "Browse crash, slots, live casino, table games and instant games, and discover their availability in your market.",
  'seo.operatorsPageTitle': 'Operators',
  'seo.operatorsPageDescription':
    'Browse and compare licensed operators by country and category. PlayLiva may receive commission from selected partners.',
  'seo.offersPageTitle': 'Offers',
  'seo.offersPageDescription':
    'Explore verified offers available in your market. Terms apply, 18+, availability varies by location.',
  'seo.playPageTitle': 'Ready to Play',
  'seo.playPageDescription':
    'Choose a game and compare available operators in your market with PlayLiva.',
  'seo.sportsPageTitle': "Sports Archive",
  'seo.sportsPageDescription':
    "Demonstration archive retained for existing links. Sports is no longer a core PlayLiva category.",
  'seo.sportOddsTitle': '{sport} Odds Comparison',
  'seo.sportOddsDescription':
    'Compare {sport} betting odds across bookmakers. Demo data — PlayLiva does not accept bets.',
  'seo.leagueOddsTitle': '{league} Odds Comparison',
  'seo.leagueOddsDescription':
    'Compare {league} betting odds across bookmakers. Demo data — PlayLiva does not accept bets.',
  'seo.matchOddsTitle': '{home} vs {away} — Odds Comparison',
  'seo.matchOddsDescription':
    'Compare betting odds for {home} vs {away} ({league}) across bookmakers. Demo data — PlayLiva does not accept bets.',
  'seo.gamesLikeTitle': 'Games Like {game} — Best {game} Alternatives',
  'seo.gamesLikeDescription':
    'Discover the best {game} alternatives. Compare similar games and find where to play them responsibly in your market.',
  'seo.whereToPlayTitle': 'Where to Play {game}',
  'seo.whereToPlayDescription':
    'Find operators that offer {game} and similar {gameType} games in your market. Compare ratings, offers and availability. 18+.',
  'seo.operatorDescription':
    '{operator} — game types, payment methods and availability. Compare places to play with PlayLiva.',
  }

const DICTS: Record<Locale, Dict> = {
  'pt-BR': ptBR,
  'es-MX': esMX,
  en,
}

/** Create a translator bound to a locale, with {token} interpolation. */
export function createTranslator(locale: Locale) {
  const dict = DICTS[locale] ?? DICTS[DEFAULT_LOCALE]
  return function t(key: string, vars?: Record<string, string | number>): string {
    let str = dict[key] ?? DICTS[DEFAULT_LOCALE][key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return str
  }
}

export type Translator = ReturnType<typeof createTranslator>
