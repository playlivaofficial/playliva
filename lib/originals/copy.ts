import type { Locale } from '../types'

const en = {
  playFree: 'Play Free', freePlay: 'FREE PLAY', demo: 'DEMO', balance: 'Demo Balance', credits: 'Liva Credits',
  reset: 'Reset Balance', resetConfirm: 'Reset to 10,000 Liva Credits?', confirm: 'Reset', cancel: 'Cancel',
  boundary: 'Virtual credits have no monetary value. PlayLiva does not accept bets or deposits.',
  history: 'Recent activity', empty: 'No demo activity yet.', sound: 'Sound', haptics: 'Haptics',
  fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen', fullscreenUnavailable: 'Fullscreen is unavailable here.',
  controls: 'Game controls', viewport: 'Game area', debit: 'Credits used', credit: 'Credits added', resetEntry: 'Balance reset',
  memoryOnly: 'Progress is available in this tab only; local saving is unavailable.',
  recovered: 'Saved demo data could not be restored. A new demo balance has been created.',
  playReal: 'Play Real', realBoundary: 'Play real-money games at approved operators. This does not mean this PlayLiva Original is available there.',
  crashRealBoundary: 'Play real-money crash games at approved operators. This does not mean this PlayLiva Original is available there.',
  slotsRealBoundary: 'Play real-money slots at approved operators. This does not mean Liva Capybara Gold is available there.',
  noOperators: 'No approved operators are available for this category in your selected market.',
}
type Copy = { [K in keyof typeof en]: string }
const copy: Record<Locale, Copy> = {
  en,
  'pt-BR': {
    playFree: 'Jogar Grátis', freePlay: 'JOGUE GRÁTIS', demo: 'DEMO', balance: 'Saldo Demo', credits: 'Liva Credits',
    reset: 'Redefinir Saldo', resetConfirm: 'Redefinir para 10.000 Liva Credits?', confirm: 'Redefinir', cancel: 'Cancelar',
    boundary: 'Os créditos virtuais não têm valor monetário. O PlayLiva não aceita apostas nem depósitos.',
    history: 'Atividade recente', empty: 'Nenhuma atividade demo ainda.', sound: 'Som', haptics: 'Vibração',
    fullscreen: 'Tela cheia', exitFullscreen: 'Sair da tela cheia', fullscreenUnavailable: 'Tela cheia indisponível aqui.',
    controls: 'Controles do jogo', viewport: 'Área do jogo', debit: 'Créditos usados', credit: 'Créditos adicionados', resetEntry: 'Saldo redefinido',
    memoryOnly: 'O progresso está disponível apenas nesta aba; o salvamento local está indisponível.',
    recovered: 'Não foi possível restaurar os dados demo. Um novo saldo demo foi criado.',
    playReal: 'Jogar com Dinheiro Real', realBoundary: 'Jogue com dinheiro real em operadores aprovados. Isso não significa que este PlayLiva Original esteja disponível lá.',
    crashRealBoundary: 'Jogue crash com dinheiro real em operadores aprovados. Isso não significa que este PlayLiva Original esteja disponível lá.',
    slotsRealBoundary: 'Jogue slots com dinheiro real em operadores aprovados. Isso não significa que Liva Capybara Gold esteja disponível lá.',
    noOperators: 'Não há operadores aprovados para esta categoria no mercado selecionado.',
  },
  'es-MX': {
    playFree: 'Jugar Gratis', freePlay: 'JUEGA GRATIS', demo: 'DEMO', balance: 'Saldo Demo', credits: 'Liva Credits',
    reset: 'Restablecer Saldo', resetConfirm: '¿Restablecer a 10,000 Liva Credits?', confirm: 'Restablecer', cancel: 'Cancelar',
    boundary: 'Los créditos virtuales no tienen valor monetario. PlayLiva no acepta apuestas ni depósitos.',
    history: 'Actividad reciente', empty: 'Todavía no hay actividad demo.', sound: 'Sonido', haptics: 'Vibración',
    fullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa', fullscreenUnavailable: 'Pantalla completa no disponible aquí.',
    controls: 'Controles del juego', viewport: 'Área del juego', debit: 'Créditos usados', credit: 'Créditos añadidos', resetEntry: 'Saldo restablecido',
    memoryOnly: 'El progreso solo está disponible en esta pestaña; el guardado local no está disponible.',
    recovered: 'No se pudieron restaurar los datos demo. Se creó un nuevo saldo demo.',
    playReal: 'Jugar con Dinero Real', realBoundary: 'Juega con dinero real en operadores aprobados. Esto no significa que este PlayLiva Original esté disponible allí.',
    crashRealBoundary: 'Juega crash con dinero real en operadores aprobados. Esto no significa que este PlayLiva Original esté disponible allí.',
    slotsRealBoundary: 'Juega slots con dinero real en operadores aprobados. Esto no significa que Liva Capybara Gold esté disponible allí.',
    noOperators: 'No hay operadores aprobados para esta categoría en el mercado seleccionado.',
  },
}
export const originalsCopy = (locale: Locale): Copy => copy[locale]
