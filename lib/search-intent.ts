import type { Locale } from './types'
import { hasSearchIntentReview } from './search-intent-scope'

interface ReadingLink { href: string; label: string }
interface IntentSection { heading: string; paragraphs: string[]; links?: ReadingLink[] }
interface IntentGuide { title: string; sections: IntentSection[]; source: { url: string; label: string } }
const SPRIBE = { url: 'https://spribe.co/games/aviator', label: 'SPRIBE: Aviator' }
const PRAGMATIC = { url: 'https://www.pragmaticplay.com/en/games/gates-of-olympus/', label: 'Pragmatic Play: Gates of Olympus original' }
const EVOLUTION = { url: 'https://games.evolution.com/live-casino/live-blackjack/', label: 'Evolution: familias de blackjack en vivo' }
const AVIATOR_CONTROLS: IntentSection = {
  heading: 'Apuesta, retiro y resultado: cómo leer una ronda',
  paragraphs: [
    'Antes del inicio, reconoce el importe y el estado de tu apuesta. Durante el vuelo, el multiplicador muestra el factor disponible en ese momento; retirar cierra esa apuesta. Al terminar el vuelo, una apuesta que no se retiró pierde. Observar una ronda sin apostar ayuda a distinguir esos estados de una pantalla que solo muestra el historial.',
    'Ejemplo de lectura, no de estrategia: retirar 10 créditos de práctica a 1,50× representa un retorno bruto de 15 créditos, incluida la apuesta inicial. Si el vuelo termina antes del retiro, ese resultado no se obtiene. Un valor objetivo no modifica el punto final de la ronda, y los créditos de demo no son dinero retirable.',
  ],
  links: [{ href: '/guides/aviator-demo', label: 'Reconocer una demo y practicar los controles de Aviator' }],
}
const AVIATOR_AUTO: IntentSection = {
  heading: 'Retiro automático y apuesta automática no son lo mismo',
  paragraphs: [
    'El retiro automático fija el multiplicador al que se intenta cerrar una apuesta; la apuesta automática prepara participación en nuevas rondas. Comprueba qué función activaste, el importe que utiliza y cómo detenerla en la ayuda de la edición abierta. El retiro automático no protege una apuesta si el vuelo termina antes de alcanzar el valor elegido.',
    'No interpretes una sucesión de vuelos cortos como una señal de que viene uno largo. Esta ficha permite entender el juego de SPRIBE; no ofrece predicciones ni aloja su demo. Un Original gratuito con un avión pertenece a otro producto y sus resultados no sirven para probar una estrategia en Aviator.',
  ],
}
const GUIDES: Partial<Record<Locale, Record<string, IntentGuide>>> = {
  'es-MX': {
    '/games/blackjack-live': {
      title: 'Blackjack en vivo: decisiones y diferencias entre mesas', source: EVOLUTION,
      sections: [
        { heading: 'Qué cambia al pedir, plantarse, doblar o dividir', paragraphs: [
          'Pedir añade una carta; plantarse conserva el total. Doblar aumenta la apuesta de esa mano y limita las cartas adicionales según las reglas de la mesa. Dividir separa una pareja en dos manos con sus apuestas correspondientes cuando la variante lo permite. Comprueba las restricciones antes de decidir: ver el botón no significa que todos los casos admitan la misma acción.',
          'Ejemplo de lectura: 10 y 6 suman 16; otra carta puede mejorar ese total o hacerlo superar 21. Un as puede contar como 1 u 11 según la mano. Estas distinciones explican la interfaz, no recomiendan una apuesta ni garantizan un resultado. Liva Blackjack permite practicar sus propias reglas con créditos virtuales; no es la demo de Evolution.',
        ], links: [{ href: '/play/blackjack', label: 'Explorar las reglas del Original gratuito Liva Blackjack' }] },
        { heading: 'Clásico, Infinite y Lightning: identifica la variante', paragraphs: [
          'Evolution distingue mesas clásicas de siete plazas de Infinite Blackjack, que admite jugadores simultáneos sin ese límite y permite decisiones individuales a partir de una mano inicial común. Lightning Blackjack añade una función de multiplicadores y un cargo específico. Esa diferencia importa antes de comparar el coste o las reglas; no traslades extras de una variante a otra.',
          'En la ayuda de la mesa concreta revisa pago del blackjack, conducta del crupier, reglas de división, tiempo para decidir y apuestas laterales. Para México, comprueba MXN y los términos del destino por separado. Una ficha del proveedor no demuestra disponibilidad local ni que un bono contribuya igual en casino en vivo que en tragamonedas.',
        ], links: [{ href: '/providers/evolution', label: 'Comparar los formatos de Evolution' }, { href: '/guides/bonos-casino', label: 'Revisar contribución y exclusiones de casino en vivo' }] },
      ],
    },
    '/games/aviator': {
      title: 'Entender Aviator antes de elegir dónde jugar', source: SPRIBE,
      sections: [AVIATOR_CONTROLS, AVIATOR_AUTO,
        { heading: 'De la ficha a una opción para México', paragraphs: [
          'Compara primero proveedor y controles, no un supuesto ranking de ganancias. La selección mexicana de crash reúne Aviator, JetX y Spaceman para leer sus diferencias; el orden es editorial. Después consulta Dónde jugar para distinguir disponibilidad del título de una invitación genérica a explorar una marca. Ni una traducción al español ni un enlace comercial prueban que puedas abrir el juego desde México.',
        ], links: [{ href: '/best/best-crash-games-mexico', label: 'Selección de crash para México: criterios y diferencias' }, { href: '/where-to-play/aviator', label: 'Comprobar la disponibilidad de Aviator para la visita' }] },
      ],
    },
    '/games/gates-of-olympus': {
      title: 'Gates of Olympus original: símbolos, cascadas y función de giros', source: PRAGMATIC,
      sections: [
        { heading: 'Lee la cantidad de símbolos, no una línea fija', paragraphs: [
          'La ficha de Pragmatic Play describe seis rodillos y premios con ocho o más símbolos iguales en cualquier posición. Los símbolos ganadores desaparecen y otros ocupan su lugar. Una cascada pertenece a la misma secuencia; no significa que se haya hecho otra apuesta ni que el siguiente reemplazo vaya a pagar.',
          'Para leer un ejemplo sin asignarle un premio inventado: busca ocho símbolos iguales, consulta su valor en la tabla de pagos y observa qué ocurre tras retirarlos. El importe depende de esa tabla y de la apuesta de la edición abierta. Los multiplicadores son una función del juego, no un indicador de que un casino pagará más que otro.',
        ] },
        { heading: 'Giros de la función y giros de una promoción', paragraphs: [
          'En el original, cuatro o más scatters activan 15 giros gratis según la ficha del proveedor. No apliques ese dato a Gates of Olympus 1000 u otra edición sin leer su ayuda. La función se activa dentro del juego; una oferta de giros de un operador puede exigir registro, depósito, contribución al requisito y una fecha de uso.',
          'Si buscas opciones desde México, verifica MXN, edición exacta y exclusiones antes de comparar términos. Esta ficha no anuncia una campaña ni confirma que un enlace de marca abra Gates of Olympus. Para comparar temas y funciones, revisa la selección editorial mexicana de slots y vuelve a las fichas de cada juego.',
        ], links: [{ href: '/best/best-slots-mexico', label: 'Comparar la selección de tragamonedas para México' }, { href: '/guides/bonos-casino', label: 'Distinguir giros del juego de una promoción de casino' }] },
      ],
    },
    '/slots': {
      title: 'Cómo comparar tragamonedas antes de abrir una ficha', source: PRAGMATIC,
      sections: [
        { heading: 'Elige qué mecánica quieres entender', paragraphs: [
          'Empieza por una pregunta concreta: ¿se paga por líneas, por cantidad de símbolos o por otra regla? Gates of Olympus permite estudiar cascadas y multiplicadores; Sweet Bonanza sirve para contrastar otro juego de cascadas. Que compartan proveedor no convierte sus funciones en idénticas. La selección de slots para México explica por qué incluimos cada título, sin atribuirle una popularidad medida.',
        ], links: [{ href: '/best/best-slots-mexico', label: 'Ver criterios y selección de slots en México' }, { href: '/games/gates-of-olympus', label: 'Leer símbolos y giros de Gates of Olympus' }, { href: '/games/sweet-bonanza', label: 'Identificar la edición de Sweet Bonanza' }] },
        { heading: 'Una revisión corta de la edición y la oferta', paragraphs: [
          'Anota el nombre completo y proveedor; después abre la tabla de pagos, comprueba el modo demo y reconoce el saldo que aparece. Un sufijo como 1000 identifica una variante y puede cambiar funciones. La práctica gratuita permite leer controles, pero no acredita disponibilidad en un operador ni anticipa resultados con dinero.',
          'En un destino para México comprueba moneda MXN, importe por giro y límites antes de continuar. Revisa por separado qué juegos participan en una promoción, su contribución, vencimiento y apuesta máxima. Si una condición no está publicada, no la deduzcas de otro slot ni de un bono de otro país. Ofertas muestra la revisión vigente del sistema comercial, no un catálogo de beneficios garantizados.',
        ], links: [{ href: '/guides/bonos-casino', label: 'Interpretar rollover y juegos excluidos' }, { href: '/offers', label: 'Consultar las ofertas elegibles para esta visita' }] },
      ],
    },
    '/best/best-crash-games-mexico': {
      title: 'Cómo usar esta selección mexicana de crash', source: SPRIBE,
      sections: [
        { heading: 'Compara una diferencia por vez', paragraphs: [
          'Abre la ficha de Aviator para entender el retiro de SPRIBE y después contrasta las fichas de JetX y Spaceman. Revisa proveedor, controles y ayuda, sin trasladar una regla o historial entre juegos. La numeración organiza la lectura; no representa usuarios, rentabilidad ni una clasificación de casinos mexicanos.',
          'Si quieres practicar, la guía de demo distingue la fuente del proveedor de los Originals gratuitos de PlayLiva. Si quieres consultar un destino, Dónde jugar requiere evidencia comercial separada. La inclusión en esta selección no confirma que una marca tenga el título ni que participe en un bono.',
        ], links: [{ href: '/crash', label: 'Leer el formato crash antes de comparar' }, { href: '/guides/aviator-demo', label: 'Práctica y demo de Aviator: qué se puede comprobar' }, { href: '/where-to-play/aviator', label: 'Revisar disponibilidad de Aviator' }] },
      ],
    },
    '/best/best-slots-mexico': {
      title: 'Cómo usar esta selección mexicana de tragamonedas', source: PRAGMATIC,
      sections: [
        { heading: 'Mecánicas del juego y condiciones del casino', paragraphs: [
          'Usa Gates of Olympus y Sweet Bonanza para comparar dos presentaciones de cascadas y consulta Big Bass Bonanza en su propia ficha para estudiar otra familia. El tema visual no establece cómo se calcula un premio. Lee la ayuda del título y de la edición exacta; el orden de esta lista no mide popularidad ni recomienda una apuesta.',
          'Después separa las funciones de giros del juego de una campaña del operador. Para México, verifica MXN y si ese título está incluido en los términos. Un catálogo de Pragmatic Play no prueba disponibilidad comercial. Esta selección sirve como ruta de lectura hacia fichas, fuentes y condiciones, no como promesa de bonos o ganancias.',
        ], links: [{ href: '/slots', label: 'Comparar formatos de tragamonedas' }, { href: '/providers/pragmatic-play', label: 'Consultar las familias de Pragmatic Play' }, { href: '/guides/bonos-casino', label: 'Revisar condiciones y exclusiones de bonos' }] },
      ],
    },
  },
  'es-CO': {
    '/games/aviator': { title: 'Controles de Aviator y comprobación en Colombia', source: SPRIBE, sections: [AVIATOR_CONTROLS, AVIATOR_AUTO,
      { heading: 'Proveedor, portal y moneda: tres comprobaciones separadas', paragraphs: [
        'SPRIBE identifica Aviator, Coljuegos informa sobre los portales de juego por Internet y los términos del destino describen cuenta y moneda. Ninguna de esas comprobaciones sustituye las otras. Comprueba el dominio exacto y COP; no traslades una oferta de México o Perú a una visita desde Colombia.',
        'Consulta primero la guía de práctica y luego Dónde jugar. Una opción genérica de marca no confirma el título ni un bono aplicable a crash. Si la revisión de disponibilidad no ofrece una coincidencia para la visita, puedes seguir leyendo la ficha sin que se active una alternativa de otro país.',
      ], links: [{ href: '/where-to-play/aviator', label: 'Consultar disponibilidad de Aviator para Colombia' }, { href: '/guides/bonos-casino', label: 'Revisar moneda y contribución del juego al bono' }] },
    ] },
  },
  'es-PE': {
    '/where-to-play/aviator': { title: 'Antes de seguir un destino de Aviator en Perú', source: { url: 'https://apuestasdeportivas.mincetur.gob.pe/index.html', label: 'MINCETUR: información de juegos a distancia' }, sections: [
      { heading: 'Disponibilidad del título no equivale a una marca', paragraphs: [
        'La ficha de SPRIBE sirve para identificar Aviator; no certifica que un operador peruano lo ofrezca. En esta página, distingue una opción con disponibilidad del juego verificada de un acceso genérico para explorar una marca. Antes de registrarte, busca Aviator y SPRIBE en el catálogo del destino y confirma que la edición se pueda abrir desde tu ubicación.',
        'La edición en español para Perú explica el contexto, pero no cambia tu GEO. Las opciones comerciales de la visita se resuelven por separado: una página peruana abierta desde otro país no habilita ofertas peruanas. Tampoco trasladamos disponibilidad desde un casino de otro mercado.',
      ], links: [{ href: '/games/aviator', label: 'Identificar Aviator y sus controles' }, { href: '/providers/spribe', label: 'Consultar el proveedor SPRIBE' }] },
      { heading: 'Qué comprobar en el portal antes de continuar', paragraphs: [
        'Contrasta razón social, dominio y actividad con la información vigente de MINCETUR. Revisa PEN o S/, importe de apuesta, identificación, depósitos y retiros en los términos del portal. Una autorización de apuestas deportivas no debe asumirse como prueba de cualquier producto de casino; consulta el alcance del registro.',
        'Si hay una promoción, verifica que incluya Aviator, su contribución al requisito, apuesta máxima y vencimiento. La guía de bonos explica ese cálculo sin anunciar una oferta. Puedes optar por leer la demo antes de decidir: créditos de práctica no son soles ni saldo retirable. PlayLiva no recibe depósitos, y un enlace de afiliación puede generar comisión sin garantizar el acceso al juego.',
      ], links: [{ href: '/guides/aviator-demo', label: 'Revisar práctica sin dinero real' }, { href: '/guides/bonos-casino', label: 'Entender requisitos de una promoción' }, { href: '/offers', label: 'Ver ofertas elegibles para la visita' }] },
    ] },
  },
}

/** Exact locale scope prevents shared Spanish copy from inventing market claims. */
export function searchIntentGuide(path: string, locale: Locale) {
  return hasSearchIntentReview(path, locale) ? GUIDES[locale]?.[path] ?? null : null
}
