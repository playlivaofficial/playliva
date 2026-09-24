import type { Locale } from '@/lib/types'
import type { SlotSymbol } from './config'
export interface SlotCopy {
  description: string; spin: string; spinning: string; bet: string; win: string; ready: string; noWin: string
  freeSpins: string; remaining: string; bonusMultiplier: string; jungleBonus: string; begin: string; again: string
  bonusTotal: string; bonusComplete: string; spinsPlayed: string; plusSpin: string; introNote: string; bigWin: string; superWin: string; megaWin: string; ways: string; wild: string; scatter: string
  loading: string; loadError: string; retry: string; insufficient: string; unavailable: string; settlementError: string
  how: string; rules: string; wildRules: string; bonusRules: string; interruption: string; paytable: string; paytableNote: string
  reel: string; row: string; result: string; symbols: Record<SlotSymbol, string>; notice: string
  discovery: string; posterAlt: string; categoryTitle: string; categoryDescription: string; category: string
}
const COPY: Record<Locale, SlotCopy> = {
  en: {
    description: 'Meet your golden river companion. Play an original tropical slot with Capybara Wilds, growing multipliers and eight Jungle Bonus free spins. Virtual credits only.',
    spin: 'Spin', spinning: 'Spinning…', bet: 'Bet', win: 'Win', ready: 'The river is yours', noWin: 'No win this spin',
    freeSpins: 'Free Spins', remaining: 'Spins remaining', bonusMultiplier: 'Gold Multiplier', jungleBonus: 'Jungle Gold Bonus', begin: 'Start free spins', again: 'Play again',
    bonusTotal: 'Bonus total', bonusComplete: 'Bonus complete', spinsPlayed: 'Free spins played', plusSpin: 'Free Spin',
    introNote: 'Every Capybara: +1 multiplier, up to ×5 · Every Sun: +1 spin', bigWin: 'Big win', superWin: 'Super win', megaWin: 'Mega win', ways: '1,024 ways', wild: 'WILD', scatter: 'BONUS',
    loading: 'Preparing your river…', loadError: 'Artwork could not load. Your credits are safe.', retry: 'Retry', insufficient: 'Not enough Liva Credits. Lower your bet or reset the demo balance.',
    unavailable: 'Spin unavailable. No stake was taken. Try again when ready.', settlementError: 'The payout could not be booked. No win has been recorded. Reset the demo balance to continue.',
    how: 'How to play', rules: 'Match a normal symbol on 3, 4 or 5 adjacent reels from the left. Any row counts. Only the longest combination pays; matching cells multiply the ways. Five reels × four rows = 1,024 ways. Returns may be less than your bet.',
    wildRules: 'Capybara Wilds appear on reels 2–5 and replace normal symbols, never Bonus symbols. Count distinct Wilds in winning combinations: 1 / 2 / 3 / 4+ apply ×2 / ×3 / ×5 / ×10 once to the entire win. Wild and Bonus symbols have no separate payout.',
    bonusRules: '3, 4 or 5+ Golden Sun symbols anywhere on a paid spin (no adjacency needed) award 8, 12 or 20 free spins at that bet. The Gold Multiplier starts at ×1: every Capybara Wild that lands in a free spin adds +1 before that spin pays, up to ×5, and it stays for the rest of the bonus. It replaces the normal Wild multiplier. Every Sun in a free spin adds +1 free spin, up to 50 free spins per bonus. Maximum payout per spin: 1,000× bet.',
    interruption: 'Local demo only. Leaving or reloading ends pending spins and unused free spins without a refund. Already booked credits remain. Avoid playing the same wallet in multiple tabs.',
    paytable: 'Paytable', paytableNote: 'Total-bet multiples per way for 3 / 4 / 5 reels, before Wild or bonus multipliers. All ways are summed, then the payout is rounded down once to 0.01 Liva Credits.',
    reel: 'Reel', row: 'row', result: 'Reel result', symbols: { wild: 'Capybara Wild', coconut: 'Golden coconut', emerald: 'Emerald', flower: 'Tropical flower', toucan: 'Toucan', pearl: 'River pearl', acai: 'Açaí', leaf: 'Jungle leaf', scatter: 'Golden Sun Bonus' },
    notice: 'Free play · No deposits or withdrawals · No monetary value. Not a certified or real-money game.',
    discovery: 'A golden capybara. A turquoise river. Spin into tropical Wilds and eight free spins with a growing bonus multiplier.',
    posterAlt: 'An original golden capybara beside an emerald jungle and turquoise river at sunset.', categoryTitle: 'Our river. Your free spin.',
    categoryDescription: 'Play Liva Capybara Gold with virtual credits. A separate PlayLiva Original, not a provider or operator game.', category: 'Slots',
  },
  'pt-BR': {
    description: 'Conheça sua companheira dourada do rio. Jogue um slot tropical original com curingas de capivara, multiplicadores crescentes e oito rodadas grátis no Bônus da Selva. Só créditos virtuais.',
    spin: 'Girar', spinning: 'Girando…', bet: 'Aposta', win: 'Ganho', ready: 'O rio é seu', noWin: 'Sem ganho nesta rodada',
    freeSpins: 'Rodadas grátis', remaining: 'Rodadas restantes', bonusMultiplier: 'Multiplicador Ouro', jungleBonus: 'Bônus Ouro da Selva', begin: 'Iniciar rodadas grátis', again: 'Jogar novamente',
    bonusTotal: 'Total do bônus', bonusComplete: 'Bônus concluído', spinsPlayed: 'Rodadas grátis jogadas', plusSpin: 'Rodada grátis',
    introNote: 'Cada capivara: +1 no multiplicador, até ×5 · Cada sol: +1 rodada', bigWin: 'Grande ganho', superWin: 'Super ganho', megaWin: 'Mega ganho', ways: '1.024 formas', wild: 'CURINGA', scatter: 'BÔNUS',
    loading: 'Preparando seu rio…', loadError: 'Não foi possível carregar as imagens. Seus créditos estão seguros.', retry: 'Tentar novamente', insufficient: 'Liva Credits insuficientes. Reduza a aposta ou restaure o saldo demo.',
    unavailable: 'Rodada indisponível. Nenhuma aposta foi descontada. Tente novamente quando estiver pronto.', settlementError: 'Não foi possível registrar o pagamento. Nenhum ganho foi creditado. Restaure o saldo demo para continuar.',
    how: 'Como jogar', rules: 'Combine um símbolo comum em 3, 4 ou 5 rolos consecutivos, começando pela esquerda. Qualquer linha vale. Só a combinação mais longa paga; a quantidade de símbolos por rolo multiplica as formas de ganhar. Cinco rolos × quatro linhas = 1.024 formas. O retorno pode ser menor que a aposta.',
    wildRules: 'Os curingas de capivara aparecem nos rolos 2–5 e substituem símbolos comuns, nunca símbolos de bônus. Conte os curingas distintos nas combinações vencedoras: 1 / 2 / 3 / 4+ aplicam ×2 / ×3 / ×5 / ×10 uma única vez ao ganho total. Curingas e símbolos de bônus não pagam separadamente.',
    bonusRules: '3, 4 ou 5+ Sóis Dourados em qualquer posição de uma rodada paga (não precisam estar vizinhos) dão 8, 12 ou 20 rodadas grátis com a mesma aposta. O Multiplicador Ouro começa em ×1: cada capivara curinga que cai numa rodada grátis soma +1 antes do pagamento da própria rodada, até ×5, e continua até o fim do bônus. Ele substitui o multiplicador normal dos curingas. Cada sol numa rodada grátis dá +1 rodada grátis, até 50 rodadas grátis por bônus. Pagamento máximo por rodada: 1.000× a aposta.',
    interruption: 'Demo local. Sair ou recarregar encerra rodadas pendentes e rodadas grátis não usadas, sem devolução da aposta. Créditos já registrados permanecem. Evite usar a mesma carteira em várias abas.',
    paytable: 'Tabela de pagamentos', paytableNote: 'Múltiplos da aposta total por forma para 3 / 4 / 5 rolos, antes dos multiplicadores. Todas as formas são somadas; o pagamento é arredondado para baixo uma única vez, até 0,01 Liva Credits.',
    reel: 'Rolo', row: 'linha', result: 'Resultado dos rolos', symbols: { wild: 'Capivara curinga', coconut: 'Coco dourado', emerald: 'Esmeralda', flower: 'Flor tropical', toucan: 'Tucano', pearl: 'Pérola do rio', acai: 'Açaí', leaf: 'Folha da selva', scatter: 'Sol Dourado bônus' },
    notice: 'Jogo grátis · Sem depósitos ou saques · Sem valor monetário. Não é um jogo certificado nem de dinheiro real.',
    discovery: 'Uma capivara dourada. Um rio turquesa. Descubra curingas tropicais e oito rodadas grátis com um multiplicador de bônus que cresce.',
    posterAlt: 'Uma capivara dourada original junto à selva esmeralda e ao rio turquesa ao pôr do sol.', categoryTitle: 'Nosso rio. Sua rodada grátis.',
    categoryDescription: 'Jogue Liva Capybara Gold com créditos virtuais. Um PlayLiva Original separado, não um jogo de provedor ou operador.', category: 'Slots',
  },
  'es-MX': {
    description: 'Conoce a tu compañera dorada del río. Juega un slot tropical original con comodines de capibara, multiplicadores crecientes y ocho giros gratis en el Bono de la Selva. Solo créditos virtuales.',
    spin: 'Girar', spinning: 'Girando…', bet: 'Apuesta', win: 'Ganancia', ready: 'El río es tuyo', noWin: 'Sin ganancia en este giro',
    freeSpins: 'Giros gratis', remaining: 'Giros restantes', bonusMultiplier: 'Multiplicador Oro', jungleBonus: 'Bono Oro de la Selva', begin: 'Iniciar giros gratis', again: 'Jugar de nuevo',
    bonusTotal: 'Total del bono', bonusComplete: 'Bono completado', spinsPlayed: 'Giros gratis jugados', plusSpin: 'Giro gratis',
    introNote: 'Cada capibara: +1 al multiplicador, hasta ×5 · Cada sol: +1 giro', bigWin: 'Gran ganancia', superWin: 'Súper ganancia', megaWin: 'Mega ganancia', ways: '1,024 formas', wild: 'COMODÍN', scatter: 'BONO',
    loading: 'Preparando tu río…', loadError: 'No se pudieron cargar las imágenes. Tus créditos están seguros.', retry: 'Reintentar', insufficient: 'Liva Credits insuficientes. Reduce la apuesta o restablece el saldo demo.',
    unavailable: 'Giro no disponible. No se descontó ninguna apuesta. Inténtalo cuando esté listo.', settlementError: 'No se pudo registrar el pago. No se acreditó ninguna ganancia. Restablece el saldo demo para continuar.',
    how: 'Cómo jugar', rules: 'Combina un símbolo normal en 3, 4 o 5 rodillos consecutivos desde la izquierda. Cualquier fila cuenta. Solo paga la combinación más larga; los símbolos por rodillo multiplican las formas de ganar. Cinco rodillos × cuatro filas = 1,024 formas. El retorno puede ser menor que la apuesta.',
    wildRules: 'Los comodines de capibara aparecen en los rodillos 2–5 y sustituyen símbolos normales, nunca símbolos de bono. Cuenta los comodines distintos en combinaciones ganadoras: 1 / 2 / 3 / 4+ aplican ×2 / ×3 / ×5 / ×10 una sola vez a la ganancia total. Los comodines y bonos no pagan por separado.',
    bonusRules: '3, 4 o 5+ Soles Dorados en cualquier posición de un giro pagado (no tienen que estar juntos) dan 8, 12 o 20 giros gratis con la misma apuesta. El Multiplicador Oro empieza en ×1: cada capibara comodín que cae en un giro gratis suma +1 antes de pagar ese giro, hasta ×5, y se mantiene el resto del bono. Sustituye al multiplicador normal de los comodines. Cada sol en un giro gratis da +1 giro gratis, hasta 50 giros gratis por bono. Pago máximo por giro: 1,000× la apuesta.',
    interruption: 'Demo local. Salir o recargar termina los giros pendientes y los giros gratis sin usar, sin devolver la apuesta. Los créditos ya registrados permanecen. Evita usar la misma cartera en varias pestañas.',
    paytable: 'Tabla de pagos', paytableNote: 'Múltiplos de la apuesta total por forma para 3 / 4 / 5 rodillos, antes de los multiplicadores. Se suman todas las formas y se redondea hacia abajo una sola vez a 0.01 Liva Credits.',
    reel: 'Rodillo', row: 'fila', result: 'Resultado de los rodillos', symbols: { wild: 'Capibara comodín', coconut: 'Coco dorado', emerald: 'Esmeralda', flower: 'Flor tropical', toucan: 'Tucán', pearl: 'Perla del río', acai: 'Açaí', leaf: 'Hoja de la selva', scatter: 'Sol Dorado bono' },
    notice: 'Juego gratis · Sin depósitos ni retiros · Sin valor monetario. No es un juego certificado ni de dinero real.',
    discovery: 'Una capibara dorada. Un río turquesa. Descubre comodines tropicales y ocho giros gratis con un multiplicador de bono que crece.',
    posterAlt: 'Una capibara dorada original junto a la selva esmeralda y al río turquesa al atardecer.', categoryTitle: 'Nuestro río. Tu giro gratis.',
    categoryDescription: 'Juega Liva Capybara Gold con créditos virtuales. Un PlayLiva Original independiente, no un juego de proveedor u operador.', category: 'Slots',
  },
}
export const capybaraCopy = (locale: Locale): SlotCopy => COPY[locale]
