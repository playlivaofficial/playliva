import type { Locale } from '@/lib/types'
import { FOOTBALL_CARDS } from '../football-cards'

const ptBR = {
  seoTitle: 'Liva Ginga: jogo crash de futebol grátis',
  description: 'Jogo crash de futebol grátis do PlayLiva: faça toques na bola, veja o multiplicador subir e retire antes de a bola cair. Só créditos virtuais, sem depósitos.',
  ...FOOTBALL_CARDS.embaixadinha['pt-BR'],
  stake: 'Créditos por rodada', start: 'COMEÇAR', cashOut: 'RETIRAR', again: 'JOGAR DE NOVO', auto: 'Retirada automática', autoTarget: 'Retirar em',
  ready: 'BOLA NO PÉ', preparing: 'PREPARANDO O TOQUE', juggling: 'NA GINGA!', dropped: 'CAIU A BOLA!',
  cashed_out: 'RETIRADA FEITA', crashed: 'CAIU', youCashedOut: 'Você retirou em', lost: 'Créditos usados',
  touch: 'toque', touches: 'toques', loading: 'Preparando a quadra…', loadingHint: 'Aquecendo o craque para as toques na bola',
  loadError: 'Não foi possível carregar a quadra. Confira sua conexão e tente de novo.', retry: 'Tentar de novo',
  unsupported: 'Não foi possível iniciar a quadra 3D neste navegador. Tente um navegador com WebGL ativado.',
  history: 'Suas rodadas', noHistory: 'Sua primeira sequência começa com um toque.',
  how: 'Como jogar', step1: 'Escolha seus créditos virtuais por rodada.',
  step2: 'Toque em Começar: o craque levanta a bola e o multiplicador sobe enquanto ele mantém a bola no ar.',
  step3: 'Retire antes de ele perder a bola para garantir créditos × multiplicador. Se a bola cair, a rodada termina. Você também pode definir uma retirada automática antes de começar.',
  math: 'Cada rodada decide, antes do primeiro toque, em qual toque a bola vai cair; a animação só mostra esse resultado. O multiplicador vai de 1,00× até no máximo 100×. A retirada exatamente no toque que falha perde. Os créditos são arredondados para baixo em 0,01.',
  interruption: 'Sair ou recarregar a página não retoma a rodada nem devolve os créditos usados. Uma retirada já creditada continua no seu saldo.',
  soundHint: 'O som começa desligado. Ative em Som nas configurações do jogo.',
  notice: 'Jogo gratuito · Sem depósitos ou saques · Créditos sem valor monetário. Não é um jogo de dinheiro real.',
  articleTitle: 'Jogo crash de futebol grátis, feito pelo PlayLiva',
  articleIntro: 'Liva Ginga é um PlayLiva Original: um jogo de futebol online grátis em que cada toque faz o multiplicador subir. Nosso craque em 3D mantém a bola no ar numa quadra de comunidade cheia de cor, sol e muita bola no pé — e a rodada acaba no instante em que ele perde o controle da bola.',
  articleCrash: 'É a mecânica de um jogo crash, com cara de futebol de rua: quanto mais tempo a sequência dura, maior o multiplicador, e você decide a hora de retirar. Não há apostas em dinheiro no PlayLiva: tudo usa Liva Credits virtuais, sem depósitos, sem saques e sem valor monetário.',
  rulesTitle: 'Regras do Liva Ginga',
  rules: [
    'Os créditos usados em cada rodada são virtuais (Liva Credits) e não têm valor monetário.',
    'O multiplicador começa em 1,00× no primeiro toque e sobe enquanto a bola continua sob controle.',
    'Retire antes de a bola cair para receber créditos × multiplicador atual.',
    'Quando o craque perde a bola, a rodada termina e os créditos da rodada não voltam.',
    'O resultado de cada rodada é definido antes do primeiro toque; animação, som e tela só mostram esse resultado.',
    'A retirada automática, se definida antes de começar (de 1,01× a 100,00×), retira sozinha quando o multiplicador chega ao alvo, desde que a bola ainda esteja no ar.',
    'O multiplicador tem limite de 100×: no toque de 100× a bola sempre cai. Retirar exatamente no toque que falha perde.',
  ],
  creditsTitle: 'Créditos virtuais, diversão de verdade',
  credits: 'Você começa com um saldo demo de Liva Credits e pode restaurá-lo quando quiser. Nada disso vale dinheiro. Se quiser conhecer jogos de provedores e onde jogá-los no seu mercado, explore o catálogo separado do PlayLiva.',
  breadcrumbOriginals: 'PlayLiva Originals',
  errors: {
    'invalid-amount': 'Digite uma quantidade positiva com no máximo duas casas decimais.',
    'insufficient-credits': 'Créditos insuficientes. Diminua o valor ou restaure o saldo demo.',
    'invalid-auto': 'Escolha uma retirada automática entre 1,01× e 100,00×, com no máximo duas casas decimais.',
    'balance-limit': 'Escolha um valor menor ou restaure o saldo demo para deixar espaço para o retorno.',
    'round-active': 'Termine a rodada atual antes de começar outra.',
    'random-unavailable': 'A aleatoriedade segura não está disponível. Use uma conexão segura e tente de novo.',
    'history-limit': 'Esta sessão local chegou ao limite. Abra uma nova sessão no navegador.',
    'invalid-context': 'Não foi possível começar a rodada. Recarregue e tente de novo.',
  },
}
type EmbaixadinhaCopy = typeof ptBR

const en: EmbaixadinhaCopy = {
  seoTitle: 'Liva Ginga: free football crash game',
  description: 'A free football crash game from PlayLiva: keep the ball up, watch the multiplier climb and cash out before it drops. Virtual credits only, no deposits.',
  ...FOOTBALL_CARDS.embaixadinha['en'],
  stake: 'Stake', start: 'START', cashOut: 'CASH OUT', again: 'PLAY AGAIN', auto: 'Auto cashout', autoTarget: 'Cash out at',
  ready: 'BALL AT HIS FEET', preparing: 'GETTING READY', juggling: 'KEEPIE-UPPIES!', dropped: 'BALL DROPPED!',
  cashed_out: 'CASHED OUT', crashed: 'DROPPED', youCashedOut: 'You cashed out at', lost: 'Stake spent',
  touch: 'touch', touches: 'touches', loading: 'Getting the court ready…', loadingHint: 'Warming up our player',
  loadError: 'The court could not load. Check your connection and try again.', retry: 'Try again',
  unsupported: 'This browser could not start the 3D court. Try a browser with WebGL enabled.',
  history: 'Your rounds', noHistory: 'Your first streak starts with one touch.',
  how: 'How to play', step1: 'Choose your virtual stake.',
  step2: 'Press Start: our player flicks the ball up and the multiplier rises for as long as he keeps it in the air.',
  step3: 'Cash out before he loses the ball to lock in stake × multiplier. If the ball drops, the round ends. You can also set an auto cashout before you start.',
  math: 'Each round decides, before the first touch, which touch will lose the ball; the animation only shows that result. The multiplier runs from 1.00× to a maximum of 100×. A cashout exactly at the failing touch loses. Credits are rounded down to 0.01.',
  interruption: 'Leaving or reloading does not resume a round or refund its stake. An already credited cashout stays in your balance.',
  soundHint: 'Sound starts off. Turn it on with Sound in the game settings.',
  notice: 'Free play · No deposits or withdrawals · Credits have no monetary value. Not a real-money game.',
  articleTitle: 'A free football crash game, made by PlayLiva',
  articleIntro: 'Liva Ginga is a PlayLiva Original: a free online football game where every keepie-uppy lifts the multiplier. Our stylized 3D player keeps the ball up on a sunny, colourful community court — and the round ends the instant he loses control of the ball.',
  articleCrash: 'It plays like a crash game with a street-football soul: the longer the streak, the higher the multiplier, and you choose when to cash out. There is no real-money betting on PlayLiva: everything uses virtual Liva Credits, with no deposits, no withdrawals and no monetary value.',
  rulesTitle: 'Liva Ginga rules',
  rules: [
    'Stakes use virtual Liva Credits, which have no monetary value.',
    'The multiplier starts at 1.00× on the first touch and rises while the ball stays under control.',
    'Cash out before the ball is lost to receive stake × the current multiplier.',
    'When the player loses the ball, the round ends and its stake is not returned.',
    'Each result is fixed before the first touch; animation, sound and display only show it.',
    'An auto cashout set before the start (1.01× to 100.00×) collects on its own when the multiplier reaches the target, as long as the ball is still in play.',
    'The multiplier is capped at 100×: the ball is always lost at the 100× touch. A cashout exactly at the failing touch loses.',
  ],
  creditsTitle: 'Virtual credits, real fun',
  credits: 'You start with a demo balance of Liva Credits and can reset it at any time. None of it is worth money. To discover provider games and where to play them in your market, explore PlayLiva’s separate catalog.',
  breadcrumbOriginals: 'PlayLiva Originals',
  errors: {
    'invalid-amount': 'Enter a positive credit amount with at most two decimal places.',
    'insufficient-credits': 'Not enough credits. Lower your stake or reset your demo balance.',
    'invalid-auto': 'Choose an auto cashout from 1.01× to 100.00×, with at most two decimal places.',
    'balance-limit': 'Choose a smaller stake or reset your demo balance to leave room for a return.',
    'round-active': 'Finish the current round before starting another.',
    'random-unavailable': 'Secure randomness is unavailable. Use a secure connection and try again.',
    'history-limit': 'This local session has reached its limit. Start a new browser session.',
    'invalid-context': 'The round could not start. Reload and try again.',
  },
}

const esMX: EmbaixadinhaCopy = {
  seoTitle: 'Liva Ginga: juego crash de futbol gratis',
  description: 'Juego crash de futbol gratis de PlayLiva: haz dominadas, mira subir el multiplicador y retira antes de que caiga el balón. Solo créditos virtuales.',
  ...FOOTBALL_CARDS.embaixadinha['es-MX'],
  stake: 'Créditos por ronda', start: 'EMPEZAR', cashOut: 'RETIRAR', again: 'JUGAR DE NUEVO', auto: 'Retiro automático', autoTarget: 'Retirar en',
  ready: 'BALÓN AL PIE', preparing: 'PREPARANDO EL TOQUE', juggling: '¡DOMINADAS!', dropped: '¡SE CAYÓ EL BALÓN!',
  cashed_out: 'RETIRO HECHO', crashed: 'SE CAYÓ', youCashedOut: 'Retiraste en', lost: 'Créditos usados',
  touch: 'toque', touches: 'toques', loading: 'Preparando la cancha…', loadingHint: 'Calentando a nuestro jugador',
  loadError: 'No se pudo cargar la cancha. Revisa tu conexión e inténtalo de nuevo.', retry: 'Reintentar',
  unsupported: 'Este navegador no pudo iniciar la cancha 3D. Prueba un navegador con WebGL activado.',
  history: 'Tus rondas', noHistory: 'Tu primera racha empieza con un toque.',
  how: 'Cómo jugar', step1: 'Elige tus créditos virtuales por ronda.',
  step2: 'Pulsa Empezar: nuestro jugador levanta el balón y el multiplicador sube mientras lo mantiene en el aire.',
  step3: 'Retira antes de que pierda el balón para asegurar créditos × multiplicador. Si el balón cae, la ronda termina. También puedes fijar un retiro automático antes de empezar.',
  math: 'Cada ronda decide, antes del primer toque, en qué toque caerá el balón; la animación solo muestra ese resultado. El multiplicador va de 1.00× a un máximo de 100×. Retirar justo en el toque que falla pierde. Los créditos se redondean hacia abajo a 0.01.',
  interruption: 'Salir o recargar no reanuda la ronda ni devuelve los créditos usados. Un retiro ya acreditado se queda en tu saldo.',
  soundHint: 'El sonido empieza apagado. Actívalo en Sonido, en la configuración del juego.',
  notice: 'Juego gratis · Sin depósitos ni retiros · Créditos sin valor monetario. No es un juego de dinero real.',
  articleTitle: 'Un juego crash de futbol gratis, hecho por PlayLiva',
  articleIntro: 'Liva Ginga es un PlayLiva Original: un juego de futbol en línea gratis en el que cada dominada sube el multiplicador. Nuestro jugador 3D mantiene el balón en el aire en una cancha de barrio llena de color y sol, y la ronda termina en el instante en que pierde el control del balón.',
  articleCrash: 'Se juega como un juego crash con alma de futbol callejero: cuanto más dura la racha, más alto el multiplicador, y tú decides cuándo retirar. En PlayLiva no se apuesta dinero real: todo usa Liva Credits virtuales, sin depósitos, sin retiros y sin valor monetario.',
  rulesTitle: 'Reglas de Liva Ginga',
  rules: [
    'Los créditos de cada ronda son virtuales (Liva Credits) y no tienen valor monetario.',
    'El multiplicador empieza en 1.00× en el primer toque y sube mientras el balón sigue bajo control.',
    'Retira antes de perder el balón para recibir créditos × el multiplicador actual.',
    'Cuando el jugador pierde el balón, la ronda termina y sus créditos no se devuelven.',
    'Cada resultado se fija antes del primer toque; la animación, el sonido y la pantalla solo lo muestran.',
    'El retiro automático, si lo fijas antes de empezar (de 1.01× a 100.00×), retira solo cuando el multiplicador llega al objetivo, siempre que el balón siga en juego.',
    'El multiplicador tiene un tope de 100×: en el toque de 100× el balón siempre cae. Retirar justo en el toque que falla pierde.',
  ],
  creditsTitle: 'Créditos virtuales, diversión real',
  credits: 'Empiezas con un saldo demo de Liva Credits y puedes restablecerlo cuando quieras. Nada de esto vale dinero. Para conocer juegos de proveedores y dónde jugarlos en tu mercado, explora el catálogo independiente de PlayLiva.',
  breadcrumbOriginals: 'PlayLiva Originals',
  errors: {
    'invalid-amount': 'Ingresa una cantidad positiva con máximo dos decimales.',
    'insufficient-credits': 'Créditos insuficientes. Baja la cantidad o restablece tu saldo demo.',
    'invalid-auto': 'Elige un retiro automático de 1.01× a 100.00×, con máximo dos decimales.',
    'balance-limit': 'Elige una cantidad menor o restablece tu saldo demo para dejar espacio al retorno.',
    'round-active': 'Termina la ronda actual antes de empezar otra.',
    'random-unavailable': 'La aleatoriedad segura no está disponible. Usa una conexión segura e inténtalo de nuevo.',
    'history-limit': 'Esta sesión local llegó a su límite. Abre una nueva sesión del navegador.',
    'invalid-context': 'No se pudo empezar la ronda. Recarga e inténtalo de nuevo.',
  },
}

const COPY: Record<Locale, EmbaixadinhaCopy> = { 'pt-BR': ptBR, en, 'es-MX': esMX }
export const embaixadinhaCopy = (locale: Locale): EmbaixadinhaCopy => COPY[locale]
export type EmbaixadinhaErrors = keyof EmbaixadinhaCopy['errors']

/** UI-boundary parse of an auto target like "2.00" / "2,00" into hundredths. */
export function parseAutoInput(value: string): number {
  const input = value.trim().replace(',', '.')
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(input)) return NaN
  const [whole, fraction = ''] = input.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
