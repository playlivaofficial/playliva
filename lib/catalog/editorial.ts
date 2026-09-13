import type { Localized } from './types'

export interface ReferenceComparison {
  slug: string
  a: string
  b: string
  shared: Localized<string>
  difference: Localized<[string, string]>
}
export const REFERENCE_COMPARISONS: ReferenceComparison[] = [
  { slug: 'sugar-rush-vs-sugar-rush-1000', a: 'sugar-rush', b: 'sugar-rush-1000', shared: {
    en: 'Both use connected candy clusters, cascading symbols and multipliers attached to marked grid positions. The memory belongs to the cell, not the candy occupying it.',
    'pt-BR': 'Os dois usam grupos conectados de doces, cascatas e multiplicadores ligados a posições marcadas. A memória pertence à casa, não ao doce que a ocupa.',
    'es-MX': 'Ambos utilizan grupos conectados de dulces, cascadas y multiplicadores ligados a posiciones marcadas. La memoria pertenece a la casilla, no al dulce que la ocupa.',
  }, difference: {
    en: ['The original’s documented position multiplier reaches 128×. It establishes the position-memory format without the later variant’s enlarged ceiling.', 'The 1000 edition raises the documented position ceiling to 1,024×. A larger ceiling describes a possible feature value, not its frequency or a typical result.'],
    'pt-BR': ['No original, o multiplicador por posição documentado chega a 128×. Ele apresenta a memória das casas sem o limite ampliado da variante posterior.', 'A edição 1000 aumenta o limite documentado por posição para 1.024×. Um limite maior descreve um valor possível do recurso, não sua frequência ou um resultado típico.'],
    'es-MX': ['En el original, el multiplicador por posición documentado alcanza 128×. Presenta la memoria de casillas sin el límite ampliado de la variante posterior.', 'La edición 1000 eleva el límite documentado por posición a 1,024×. Un límite mayor describe un valor posible de la función, no su frecuencia ni un resultado típico.'],
  } },
  { slug: 'the-dog-house-vs-the-dog-house-megaways', a: 'the-dog-house', b: 'the-dog-house-megaways', shared: {
    en: 'The dog theme and multiplier wilds connect these titles, but they do not share an identical reel layout or bonus structure.',
    'pt-BR': 'O tema de cães e os curingas multiplicadores conectam os títulos, mas eles não têm a mesma grade nem a mesma estrutura de bônus.',
    'es-MX': 'El tema de perros y los comodines multiplicadores conectan ambos títulos, pero no tienen la misma cuadrícula ni la misma estructura de bono.',
  }, difference: {
    en: ['The original uses a fixed five-by-three layout and twenty paylines. Its free spins retain sticky wilds in their positions.', 'Megaways varies reel height and offers two bonus modes: Sticky Wilds retains symbols, while Raining Wilds places them afresh on each bonus spin.'],
    'pt-BR': ['O original usa uma grade fixa de cinco por três e vinte linhas de pagamento. Nas rodadas grátis, curingas persistentes ficam nas mesmas posições.', 'Megaways varia a altura dos rolos e oferece dois modos: Sticky Wilds mantém os símbolos, enquanto Raining Wilds adiciona curingas a cada rodada do bônus.'],
    'es-MX': ['El original utiliza una cuadrícula fija de cinco por tres y veinte líneas de pago. En los giros gratis, los comodines persistentes conservan sus posiciones.', 'Megaways varía la altura de los rodillos y ofrece dos modos: Sticky Wilds conserva símbolos, mientras Raining Wilds añade comodines en cada giro del bono.'],
  } },
  { slug: 'lightning-baccarat-vs-speed-baccarat', a: 'lightning-baccarat', b: 'speed-baccarat', shared: {
    en: 'Both are Evolution live baccarat variants. Their main distinction is the layer added to the studio card game: random modifiers versus a shorter presentation.',
    'pt-BR': 'Ambos são variantes de baccarat ao vivo da Evolution. A principal diferença é a camada acrescentada ao jogo de cartas: modificadores aleatórios ou uma apresentação mais curta.',
    'es-MX': 'Ambos son variantes de baccarat en vivo de Evolution. La diferencia principal es la capa añadida al juego de cartas: modificadores aleatorios o una presentación más breve.',
  }, difference: {
    en: ['Lightning selects virtual cards with random multipliers. Its documented 20% Lightning Fee is part of the format and must be considered alongside the modifier description.', 'Speed deals cards face-up and shortens result-display time. That presentation change should not be mistaken for the Lightning Card system or a guarantee of different odds.'],
    'pt-BR': ['Lightning seleciona cartas virtuais com multiplicadores aleatórios. A taxa Lightning documentada de 20% faz parte do formato e deve acompanhar a descrição dos modificadores.', 'Speed distribui cartas abertas e encurta a exibição do resultado. Essa mudança visual não deve ser confundida com o sistema de cartas Lightning ou com probabilidades diferentes garantidas.'],
    'es-MX': ['Lightning selecciona cartas virtuales con multiplicadores aleatorios. La tarifa Lightning documentada del 20% forma parte del formato y debe acompañar la descripción de los modificadores.', 'Speed reparte cartas descubiertas y acorta la presentación del resultado. Ese cambio visual no debe confundirse con el sistema de cartas Lightning ni con probabilidades distintas garantizadas.'],
  } },
]

export interface ReferenceReadingList { slug: string; intro: Localized<string>; alternatives: { slug: string; reason: Localized<string> }[] }
export const REFERENCE_READING_LISTS: ReferenceReadingList[] = [
  { slug: 'sugar-rush', intro: {
    en: 'Sugar Rush is defined by connected clusters and memory attached to grid positions. These references separate that structure from symbol-based multipliers and charged grid features.',
    'pt-BR': 'Sugar Rush se define pelos grupos conectados e pela memória das posições da grade. Estas fichas distinguem essa estrutura dos multiplicadores nos símbolos e dos recursos de grade carregados.',
    'es-MX': 'Sugar Rush se define por grupos conectados y memoria de posiciones. Estas fichas distinguen esa estructura de los multiplicadores en símbolos y de las funciones de cuadrícula cargadas.',
  }, alternatives: [
    { slug: 'sugar-rush-1000', reason: { en: 'The closest structural relative: position memory remains, but the multiplier ceiling changes.', 'pt-BR': 'O parentesco estrutural mais próximo: a memória de posições permanece, mas o limite dos multiplicadores muda.', 'es-MX': 'El parentesco estructural más cercano: conserva memoria de posiciones, pero cambia el límite de multiplicadores.' } },
    { slug: 'fruit-party', reason: { en: 'Another connected-cluster format, but multipliers belong to symbols rather than remembered positions.', 'pt-BR': 'Outro formato de grupos conectados, mas os multiplicadores pertencem aos símbolos, não à memória das posições.', 'es-MX': 'Otro formato de grupos conectados, pero los multiplicadores pertenecen a símbolos, no a posiciones recordadas.' } },
    { slug: 'reactoonz', reason: { en: 'Clusters and cascades are shared; a charged feature queue replaces the position-multiplier focus.', 'pt-BR': 'Grupos e cascatas são pontos comuns; uma fila de recursos carregada substitui o foco nos multiplicadores por posição.', 'es-MX': 'Comparte grupos y cascadas; una cola de funciones cargada sustituye el enfoque en multiplicadores por posición.' } },
  ] },
  { slug: 'the-dog-house', intro: {
    en: 'The original Dog House combines fixed paylines with sticky multiplier wilds. This list compares the same theme in a different reel system and similar wild behavior in other themes.',
    'pt-BR': 'The Dog House original combina linhas fixas e curingas multiplicadores persistentes. A seleção compara o mesmo tema em outro sistema de rolos e comportamentos semelhantes de curingas em outros temas.',
    'es-MX': 'The Dog House original combina líneas fijas y comodines multiplicadores persistentes. La selección compara el mismo tema en otro sistema de rodillos y comportamientos similares de comodines en otros temas.',
  }, alternatives: [
    { slug: 'the-dog-house-megaways', reason: { en: 'Same title family; variable reel heights and a second bonus mode change the structure.', 'pt-BR': 'Mesma família de títulos; alturas variáveis dos rolos e outro modo de bônus mudam a estrutura.', 'es-MX': 'Misma familia; alturas variables de rodillos y otro modo de bono cambian la estructura.' } },
    { slug: 'wild-west-gold', reason: { en: 'Sticky multiplier wilds connect the free-spin features, but the grid and theme differ.', 'pt-BR': 'Curingas multiplicadores persistentes conectam as rodadas grátis, mas grade e tema são diferentes.', 'es-MX': 'Los comodines multiplicadores persistentes conectan los giros gratis, pero cuadrícula y tema son distintos.' } },
    { slug: 'hot-fiesta', reason: { en: 'A fixed-payline comparison focused on multiplier wilds, without assuming the same sticky behavior.', 'pt-BR': 'Comparação de linhas fixas com foco nos curingas multiplicadores, sem presumir a mesma persistência.', 'es-MX': 'Comparación de líneas fijas centrada en comodines multiplicadores, sin asumir la misma persistencia.' } },
  ] },
  { slug: 'reactoonz', intro: {
    en: 'Reactoonz connects cluster outcomes to a queue of grid effects. These titles offer specific comparisons for that charged-feature system, not a list selected only by colourful artwork.',
    'pt-BR': 'Reactoonz conecta resultados de grupos a uma fila de efeitos na grade. Estes títulos permitem comparar sistemas de recursos carregados; não foram reunidos apenas pela aparência colorida.',
    'es-MX': 'Reactoonz conecta resultados de grupos con una cola de efectos en la cuadrícula. Estos títulos permiten comparar sistemas de funciones cargadas; no se eligieron solo por su aspecto colorido.',
  }, alternatives: [
    { slug: 'reactoonz-100', reason: { en: 'The same series with a revised Gargantoon sequence and an additional energized multiplier.', 'pt-BR': 'A mesma série com sequência de Gargantoon revisada e um multiplicador energizado adicional.', 'es-MX': 'La misma serie con secuencia de Gargantoon revisada y un multiplicador energizado adicional.' } },
    { slug: 'dr-toonz', reason: { en: 'Shared alien setting, but a three-charge Quantumeter replaces the original feature-queue structure.', 'pt-BR': 'Compartilha o universo de alienígenas, mas um Quantumeter de três cargas substitui a fila original.', 'es-MX': 'Comparte el universo de alienígenas, pero un Quantumeter de tres cargas sustituye la cola original.' } },
    { slug: 'moon-princess', reason: { en: 'A different theme using character-driven grid changes and a charged special feature.', 'pt-BR': 'Outro tema com alterações na grade ligadas às personagens e um recurso especial carregado.', 'es-MX': 'Otro tema con cambios de cuadrícula ligados a personajes y una función especial cargada.' } },
  ] },
]
export const getReferenceComparison = (slug: string) => REFERENCE_COMPARISONS.find(item => item.slug === slug)
export const getReferenceReadingList = (slug: string) => REFERENCE_READING_LISTS.find(item => item.slug === slug)
