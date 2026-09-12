import type { Locale } from '@/lib/types'

const en = {
  description: 'A sunny island. One spectacular kick. Cash out before your castaway comes back to earth. Play free with virtual Liva Credits.',
  stake: 'Stake', start: 'START FLIGHT', cashOut: 'CASH OUT', again: 'PLAY AGAIN', auto: 'Auto cashout', autoTarget: 'Cash out at',
  ready: 'READY FOR TAKEOFF', preparing: 'HERE COMES THE KICK', kick: 'TAKEOFF!', flying: 'STILL FLYING',
  crashed: 'JUNGLE LANDING!', cashed_out: 'CASHED OUT', settled: 'NEXT FLIGHT SOON',
  loading: 'Getting the island ready…', loadingHint: 'Loading two characters · 7.5 MB',
  loadError: 'The island could not load. Check your connection and try again.', retry: 'Try again',
  unsupported: 'This browser could not start the 3D island. Try a browser with WebGL enabled.',
  earned: 'Credits returned', lost: 'Stake spent', yourFlights: 'Your flights', noFlights: 'Your next story starts with a kick.',
  how: 'How to play', step1: 'Choose your virtual stake.', step2: 'Start a flight. The multiplier rises after the kick.',
  step3: 'Cash out before the crash to return your stake × multiplier. Or set an auto cashout before you start.',
  notice: 'Single-player entertainment. Background islanders are scenery. Credits have no cash value.',
  interruption: 'Leaving or reloading during a flight spends the stake. Unfinished flights are not resumed or refunded.',
  math: 'Returns are rounded down to whole credits. A cashout at the crash point loses. Maximum multiplier: 100×.',
  soundHint: 'Sound starts off. Turn it on in game settings.',
  errors: {
    'invalid-amount': 'Enter a positive whole number of credits.',
    'insufficient-credits': 'Not enough credits. Lower your stake or reset your demo balance.',
    'invalid-auto': 'Choose an auto cashout from 1.01× to 100.00×, with at most two decimal places.',
    'balance-limit': 'Choose a smaller stake or reset your demo balance to leave room for a return.',
    'round-active': 'Finish the current flight before starting another.',
    'random-unavailable': 'Secure randomness is unavailable. Use a secure connection and try again.',
    'history-limit': 'This local session has reached its limit. Start a new browser session.',
    'invalid-context': 'The flight could not start. Reload and try again.',
  },
}
type CrashCopy = { [K in keyof typeof en]: K extends 'errors' ? Record<keyof typeof en.errors, string> : string }
const copies: Record<Locale, CrashCopy> = {
  en,
  'pt-BR': {
    description: 'Uma ilha ensolarada. Um chute espetacular. Retire antes que seu náufrago volte ao chão. Jogue grátis com Liva Credits virtuais.',
    stake: 'Créditos por rodada', start: 'INICIAR VOO', cashOut: 'RETIRAR', again: 'JOGAR DE NOVO', auto: 'Retirada automática', autoTarget: 'Retirar em',
    ready: 'PRONTO PARA DECOLAR', preparing: 'LÁ VEM O CHUTE', kick: 'DECOLAGEM!', flying: 'AINDA VOANDO',
    crashed: 'POUSO NA SELVA!', cashed_out: 'RETIRADA FEITA', settled: 'O PRÓXIMO VOO JÁ VEM',
    loading: 'Preparando a ilha…', loadingHint: 'Carregando dois personagens · 7,5 MB',
    loadError: 'Não foi possível carregar a ilha. Confira sua conexão e tente de novo.', retry: 'Tentar de novo',
    unsupported: 'Não foi possível iniciar a ilha 3D neste navegador. Tente um navegador com WebGL ativado.',
    earned: 'Créditos recebidos', lost: 'Créditos usados', yourFlights: 'Seus voos', noFlights: 'Sua próxima história começa com um chute.',
    how: 'Como jogar', step1: 'Escolha quantos créditos virtuais usar.', step2: 'Inicie um voo. O multiplicador sobe depois do chute.',
    step3: 'Retire antes da queda para receber seus créditos × multiplicador. Ou configure a retirada automática antes de começar.',
    notice: 'Entretenimento para uma pessoa. Os habitantes ao fundo são parte do cenário. Os créditos não têm valor em dinheiro.',
    interruption: 'Sair ou recarregar durante um voo consome os créditos da rodada. Voos interrompidos não continuam nem são reembolsados.',
    math: 'Os retornos são arredondados para baixo, em créditos inteiros. Retirar no ponto da queda perde a rodada. Multiplicador máximo: 100×.',
    soundHint: 'O som começa desligado. Ative nas configurações do jogo.',
    errors: {
      'invalid-amount': 'Digite um número inteiro e positivo de créditos.',
      'insufficient-credits': 'Créditos insuficientes. Reduza o valor da rodada ou restaure o saldo de demonstração.',
      'invalid-auto': 'Escolha uma retirada entre 1,01× e 100,00×, com até duas casas decimais.',
      'balance-limit': 'Reduza o valor da rodada ou restaure o saldo para deixar espaço para o retorno.',
      'round-active': 'Termine o voo atual antes de iniciar outro.',
      'random-unavailable': 'A geração segura de resultados está indisponível. Use uma conexão segura e tente de novo.',
      'history-limit': 'Esta sessão local atingiu o limite. Inicie uma nova sessão no navegador.',
      'invalid-context': 'Não foi possível iniciar o voo. Recarregue e tente de novo.',
    },
  },
  'es-MX': {
    description: 'Una isla soleada. Una patada espectacular. Retira antes de que tu náufrago vuelva al suelo. Juega gratis con Liva Credits virtuales.',
    stake: 'Créditos por ronda', start: 'INICIAR VUELO', cashOut: 'RETIRAR', again: 'JUGAR DE NUEVO', auto: 'Retiro automático', autoTarget: 'Retirar en',
    ready: 'LISTO PARA DESPEGAR', preparing: 'AHÍ VIENE LA PATADA', kick: '¡DESPEGUE!', flying: 'SIGUE VOLANDO',
    crashed: '¡ATERRIZAJE EN LA SELVA!', cashed_out: 'RETIRO LISTO', settled: 'EL SIGUIENTE VUELO YA VIENE',
    loading: 'Preparando la isla…', loadingHint: 'Cargando dos personajes · 7.5 MB',
    loadError: 'No se pudo cargar la isla. Revisa tu conexión e inténtalo de nuevo.', retry: 'Intentar de nuevo',
    unsupported: 'No se pudo iniciar la isla 3D en este navegador. Prueba un navegador con WebGL activado.',
    earned: 'Créditos recibidos', lost: 'Créditos usados', yourFlights: 'Tus vuelos', noFlights: 'Tu próxima historia empieza con una patada.',
    how: 'Cómo jugar', step1: 'Elige cuántos créditos virtuales usar.', step2: 'Inicia un vuelo. El multiplicador sube después de la patada.',
    step3: 'Retira antes de la caída para recibir tus créditos × multiplicador. O configura el retiro automático antes de empezar.',
    notice: 'Entretenimiento para una persona. Los isleños del fondo son parte del escenario. Los créditos no tienen valor en dinero.',
    interruption: 'Salir o recargar durante un vuelo consume los créditos de la ronda. Los vuelos interrumpidos no se reanudan ni se reembolsan.',
    math: 'Los retornos se redondean hacia abajo a créditos enteros. Retirar en el punto de caída pierde la ronda. Multiplicador máximo: 100×.',
    soundHint: 'El sonido empieza apagado. Actívalo en la configuración del juego.',
    errors: {
      'invalid-amount': 'Ingresa un número entero y positivo de créditos.',
      'insufficient-credits': 'Créditos insuficientes. Reduce el valor de la ronda o restablece el saldo de demostración.',
      'invalid-auto': 'Elige un retiro entre 1.01× y 100.00×, con hasta dos decimales.',
      'balance-limit': 'Reduce el valor de la ronda o restablece el saldo para dejar espacio para el retorno.',
      'round-active': 'Termina el vuelo actual antes de iniciar otro.',
      'random-unavailable': 'La generación segura de resultados no está disponible. Usa una conexión segura e inténtalo de nuevo.',
      'history-limit': 'Esta sesión local llegó al límite. Inicia una nueva sesión del navegador.',
      'invalid-context': 'No se pudo iniciar el vuelo. Recarga e inténtalo de nuevo.',
    },
  },
}
export const crashCopy = (locale: Locale) => copies[locale]
export function parseAutoInput(value: string): number {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(normalized)) return NaN
  const [whole, fraction = ''] = normalized.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
