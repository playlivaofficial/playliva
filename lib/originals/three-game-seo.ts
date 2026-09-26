import { absoluteUrl, pageMetadata } from '../seo'
import { segmentToLocale, type LocaleSegment } from '../locale'
import type { Locale } from '../types'
import { THREE_GAMES, gamePoster, type ThreeGameKind } from './three-game-definitions'
import { threeDescription } from './three-game-copy'

const content: Record<Locale, Record<ThreeGameKind, { title: string; paragraphs: string[] }>> = {
  'pt-BR': {
    'samba-drop': {
      title: 'Liva Samba Drop — Plinko grátis com multiplicadores',
      paragraphs: [
        'Liva Samba Drop é um jogo plinko grátis e instantâneo: escolha a quantidade de fileiras e o risco, solte uma bola e acompanhe seu caminho até um compartimento de multiplicador. O tabuleiro combina pinos luminosos com o ritmo do samba, em um PlayLiva Original para jogar no navegador.',
        'Mais fileiras criam mais destinos possíveis. O risco muda a distribuição dos retornos: os compartimentos externos oferecem multiplicadores maiores, mas são menos prováveis. Consulte a tabela abaixo do jogo para ver cada multiplicador e sua probabilidade. Depois do lançamento, não há retirada nem controle sobre os quiques; o retorno em créditos virtuais é aplicado na chegada.',
      ],
    },
    'skuptu-levanta': {
      title: 'Skuptu Levanta — Jogo crash grátis de academia',
      paragraphs: [
        'Skuptu Levanta transforma um levantamento de peso em um jogo crash de academia. Skuptu segura a barra enquanto o multiplicador cresce; você decide quando retirar os créditos virtuais antes da falha. A academia tropical, o esforço do personagem e o impacto da barra dão identidade a este PlayLiva Original.',
        'Você pode retirar manualmente ou definir uma retirada automática antes de começar. Após uma retirada bem-sucedida, o levantamento continua até a barra cair, mas o retorno já está garantido. A animação mostra o andamento da rodada, não prevê o instante da falha: esperar por um multiplicador maior também mantém o risco de perder os créditos usados.',
      ],
    },
    'carnaval-gold': {
      title: 'Liva Carnaval Gold — Slot grátis de carnaval',
      paragraphs: [
        'Liva Carnaval Gold é um slot grátis com cinco rolos, 20 linhas e uma festa de tambores, joias e máscaras. Este caça-níquel de carnaval PlayLiva Original usa apenas créditos virtuais e traz um bônus de rodadas grátis com um Medidor de Samba que pode chegar a ×5.',
        'As Coroas substituem símbolos pagantes, enquanto três ou mais Máscaras no giro pago iniciam o desfile de rodadas grátis. Durante o bônus, as Notas elevam o medidor e as Máscaras podem acrescentar rodadas dentro do limite total. Consulte a tabela de pagamentos e os desenhos das 20 linhas; o modo Turbo muda a velocidade da apresentação, sem alterar as chances ou os retornos.',
      ],
    },
  },
  en: {
    'samba-drop': { title: 'Liva Samba Drop — Free Plinko multiplier game', paragraphs: [
      'Liva Samba Drop is a free instant Plinko game with a Brazilian rhythm. Choose your rows and risk, release one ball and follow its bounces into a multiplier bucket. Glowing pegs and percussion give this browser-based PlayLiva Original its own identity.',
      'More rows create more possible landing positions. Risk changes the return distribution: outer buckets offer larger multipliers but are less likely. The table below the board lists every multiplier and probability. Once released, the ball cannot be steered or cashed out; virtual credits settle when it lands.',
    ] },
    'skuptu-levanta': { title: 'Skuptu Levanta — Free gym crash game', paragraphs: [
      'Skuptu Levanta turns a heavy deadlift into a free gym crash game. Skuptu holds the bar as the multiplier rises, and you choose when to cash out your virtual credits before the lift fails. A tropical gym, visible strain and the falling bar give this PlayLiva Original its character.',
      'Cash out manually or select an automatic target before starting. The lift continues after a successful cashout, but your return is already secured. The animation reflects the current round rather than predicting failure: waiting for a higher multiplier keeps your played credits at risk.',
    ] },
    'carnaval-gold': { title: 'Liva Carnaval Gold — Free carnival slot', paragraphs: [
      'Liva Carnaval Gold is a free five-reel slot with 20 lines and a parade of drums, jewels and masks. This PlayLiva Original uses virtual credits only and features free spins with a persistent Samba Meter that can reach ×5.',
      'Crowns substitute for paying symbols, while three or more Masks in a paid spin launch the free-spin parade. During the bonus, Notes raise the meter and Masks can add spins within the overall limit. Check the paytable and the 20 line diagrams; Turbo changes presentation speed without changing chances or returns.',
    ] },
  },
  'es-MX': {
    'samba-drop': { title: 'Liva Samba Drop — Plinko gratis con multiplicadores', paragraphs: [
      'Liva Samba Drop es un juego plinko gratis e instantáneo al ritmo de Brasil. Elige las filas y el riesgo, suelta una bola y sigue sus rebotes hasta una casilla de multiplicador. Los pines luminosos y la percusión dan identidad a este PlayLiva Original para navegador.',
      'Más filas crean más destinos posibles. El riesgo cambia la distribución de los retornos: las casillas externas ofrecen multiplicadores mayores, pero son menos probables. La tabla debajo del tablero muestra cada multiplicador y su probabilidad. Una vez lanzada, la bola no se puede dirigir ni retirar; los créditos virtuales se abonan al llegar.',
    ] },
    'skuptu-levanta': { title: 'Skuptu Levanta — Juego crash gratis de gimnasio', paragraphs: [
      'Skuptu Levanta convierte el levantamiento de pesas en un juego crash gratis de gimnasio. Skuptu sostiene la barra mientras sube el multiplicador y tú decides cuándo retirar tus créditos virtuales antes del fallo. El gimnasio tropical, el esfuerzo y la caída de la barra distinguen a este PlayLiva Original.',
      'Retira manualmente o fija un objetivo automático antes de comenzar. El levantamiento continúa después de un retiro exitoso, pero tu retorno ya está asegurado. La animación refleja la ronda actual y no predice el fallo: esperar un multiplicador mayor mantiene en riesgo los créditos usados.',
    ] },
    'carnaval-gold': { title: 'Liva Carnaval Gold — Slot gratis de carnaval', paragraphs: [
      'Liva Carnaval Gold es un slot gratis de cinco rodillos y 20 líneas, con tambores, joyas y máscaras de carnaval. Este PlayLiva Original utiliza solo créditos virtuales e incluye giros gratis con un Medidor de Samba que puede llegar a ×5.',
      'Las Coronas sustituyen símbolos de pago y tres o más Máscaras en un giro pagado inician el desfile de giros gratis. En el bono, las Notas aumentan el medidor y las Máscaras pueden añadir giros dentro del límite total. Consulta la tabla de pagos y los dibujos de las 20 líneas; Turbo solo cambia la velocidad de presentación, sin modificar las probabilidades ni los retornos.',
    ] },
  },
}

export const threeSeoCopy = (kind: ThreeGameKind, locale: Locale) => content[locale][kind]

export function threeGameMetadata(kind: ThreeGameKind, segment: LocaleSegment) {
  const locale = segmentToLocale(segment)
  return pageMetadata({ title: content[locale][kind].title, description: threeDescription(kind, locale), path: `/play/${kind}`, localeSegment: segment, images: [gamePoster(kind)] })
}

/** Factual game entity, using the site's existing JsonLd renderer. No ratings or invented reviews. */
export function threeGameJsonLd(kind: ThreeGameKind, segment: LocaleSegment) {
  const locale = segmentToLocale(segment), game = THREE_GAMES.find(g => g.slug === kind)!
  const url = absoluteUrl(`/${segment}/play/${kind}`)
  return {
    '@context': 'https://schema.org', '@type': 'VideoGame', '@id': `${url}#game`,
    name: game.title[locale], description: threeDescription(kind, locale), url,
    image: absoluteUrl(gamePoster(kind)), inLanguage: locale, isAccessibleForFree: true,
    applicationCategory: 'GameApplication', gamePlatform: 'Web browser',
    playMode: 'https://schema.org/SinglePlayer',
    publisher: { '@type': 'Organization', name: 'PlayLiva', url: absoluteUrl('/') },
  }
}
