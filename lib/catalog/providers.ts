import type { Localized, ProviderId } from './types'
export interface ReferenceProvider { id: ProviderId; name: string; overview: Localized<string>; source: string }
export const PROVIDERS: ReferenceProvider[] = [
  { id: 'pragmatic-play', name: 'Pragmatic Play', source: 'https://www.pragmaticplay.com/en/games/', overview: {
    en: 'This collection documents Pragmatic Play’s reel and grid slots: fixed paylines, connected clusters, pay-anywhere tumbles and Megaways variants. The title families below are kept separate because a similar name does not establish identical rules.',
    'pt-BR': 'Esta coleção documenta slots de rolos e grades da Pragmatic Play: linhas fixas, grupos conectados, cascatas com pagamento em qualquer posição e variantes Megaways. As famílias abaixo ficam separadas porque nomes parecidos não comprovam regras iguais.',
    'es-MX': 'Esta colección documenta slots de rodillos y cuadrículas de Pragmatic Play: líneas fijas, grupos conectados, cascadas con pago en cualquier posición y variantes Megaways. Las familias se mantienen separadas porque nombres parecidos no demuestran reglas iguales.',
  } },
  { id: 'play-n-go', name: 'Play’n GO', source: 'https://www.playngo.com/games', overview: {
    en: 'The Play’n GO entries here contrast expanding-symbol reel play with grid-based feature systems. Reactoonz charges a queue of effects, while Moon Princess and Rise of Olympus assign different effects to their characters. These are design distinctions, not performance rankings.',
    'pt-BR': 'As fichas da Play’n GO contrastam rolos com símbolos expansivos e sistemas de recursos em grade. Reactoonz carrega uma fila de efeitos; Moon Princess e Rise of Olympus atribuem efeitos diferentes às personagens. São diferenças de design, não classificações de desempenho.',
    'es-MX': 'Las fichas de Play’n GO contrastan rodillos con símbolos expansivos y sistemas de funciones en cuadrícula. Reactoonz carga una cola de efectos; Moon Princess y Rise of Olympus asignan efectos distintos a sus personajes. Son diferencias de diseño, no clasificaciones de rendimiento.',
  } },
  { id: 'evolution', name: 'Evolution', source: 'https://games.evolution.com/live-casino/', overview: {
    en: 'Evolution’s represented formats span live card tables, physical dice, roulette and hosted wheel shows. The pages distinguish studio presentation from additional random features, and separate baccarat cards from Bac Bo’s dice despite their similar side labels.',
    'pt-BR': 'A coleção da Evolution reúne mesas de cartas ao vivo, dados físicos, roleta e game shows com apresentador. As fichas separam o jogo físico transmitido do estúdio, os recursos aleatórios adicionais e as diferenças entre formatos como blackjack, baccarat, roleta e rodas ao vivo.',
    'es-MX': 'Los formatos de Evolution representados aquí incluyen mesas de cartas en vivo, dados físicos, ruleta y ruedas con presentador. Las fichas distinguen presentación de estudio y funciones aleatorias adicionales, y separan las cartas de baccarat de los dados de Bac Bo.',
  } },
  { id: 'smartsoft', name: 'SmartSoft', source: 'https://www.smartsoftgaming.com/', overview: {
    en: 'Alongside JetX, the SmartSoft catalog documents two further crash presentations: Balloon’s ascending balloon and CarX’s moving car. CarX also documents an endpoint-range mode. A change in scenery or mode is not evidence that a round endpoint can be predicted.',
    'pt-BR': 'Além de JetX, o catálogo da SmartSoft documenta duas outras apresentações crash: o balão ascendente de Balloon e o carro de CarX. CarX também documenta um modo de faixa de encerramento. Mudar o cenário ou o modo não torna o fim da rodada previsível.',
    'es-MX': 'Además de JetX, el catálogo de SmartSoft documenta otras dos presentaciones crash: el globo ascendente de Balloon y el automóvil de CarX. CarX también documenta un modo de rango final. Cambiar el escenario o el modo no vuelve predecible el final de la ronda.',
  } },
  { id: 'spribe', name: 'SPRIBE', source: 'https://spribe.co/games', overview: {
    en: 'This collection covers SPRIBE’s Aviator, Mines, Plinko, Dice and thirty-six-number Keno. Dice and Keno use distinct numerical mechanics. One compares a numerical result with a threshold; the other compares selected numbers with a draw. Neither uses the continuously rising presentation of a crash game.',
    'pt-BR': 'Esta coleção reúne Aviator, Mines, Plinko, Dice e o Keno de trinta e seis números da SPRIBE. Dice e Keno usam mecânicas numéricas distintas. O primeiro compara um resultado numérico com um limite; o segundo compara números selecionados com um sorteio. Nenhum usa a apresentação de crescimento contínuo de um jogo crash.',
    'es-MX': 'Esta colección reúne Aviator, Mines, Plinko, Dice y el Keno de treinta y seis números de SPRIBE. Dice y Keno utilizan mecánicas numéricas distintas. El primero compara un resultado numérico con un límite; el segundo compara números seleccionados con un sorteo. Ninguno utiliza la presentación de crecimiento continuo de un juego crash.',
  } },
]
export const getReferenceProvider = (id: string) => PROVIDERS.find(provider => provider.id === id)
