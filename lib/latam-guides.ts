import type { Locale } from './types'
import { latamCountry, LATAM_GUIDE_SLUGS } from './latam-editorial'

interface GuideSection { heading: string; paragraphs: string[] }
const GUIDES: Record<(typeof LATAM_GUIDE_SLUGS)[number], { title: string; description: string; sections: GuideSection[]; faqs: { question: string; answer: string }[]; links: {href:string;label:string}[]; sources: {url:string;label:string}[] }> = {
  'aviator-demo': {
    title: 'Demo de Aviator: guía de práctica',
    description: 'Una guía de práctica: identifica el Aviator de SPRIBE, entiende retiro manual y automático y separa créditos de demo de dinero real.',
    sections: [
      { heading:'Demo oficial, ficha y Original: tres cosas distintas', paragraphs:[
        'Aviator es un producto de SPRIBE. La ficha oficial del proveedor presenta un acceso a demo; su disponibilidad puede depender del país y de las condiciones del proveedor. PlayLiva explica el juego, pero no aloja esa demo ni garantiza acceso sin registro. Un botón con un avión o la palabra «oficial» en otra web no acredita la identidad del producto.',
        'Un Original de PlayLiva es un juego gratuito propio con créditos virtuales. Puede compartir el formato crash sin ser Aviator, sin ejecutar su motor y sin predecir sus resultados. No hace falta depositar en PlayLiva y el saldo de práctica no se puede retirar. Mantén esa diferencia al comparar un tutorial con la pantalla de un casino.',
      ] },
      { heading:'Una sesión de aprendizaje con saldo virtual', paragraphs:[
        'Primero, identifica en la pantalla el importe de apuesta, el estado de la ronda, el multiplicador y el botón de retiro. Lee la ayuda antes de tocar controles automáticos. Comprueba que el saldo sea de práctica; si aparece una petición de depósito o una cuenta con dinero, ya no estás describiendo la misma experiencia gratuita.',
        'Después, observa una ronda completa sin apostar. En una prueba con créditos, compara qué sucede al retirar durante el vuelo y al no retirar antes de que termine. Es un ejercicio para reconocer el estado de la interfaz, no para elegir una cifra ganadora. Anota qué controles puedes cambiar antes y durante la ronda.',
        'El retiro automático expresa una instrucción: si la ronda termina antes del valor elegido, no se alcanza el retiro. La apuesta automática y el retiro automático son funciones diferentes. Revisa cómo detenerlas; practicar no obliga a mantenerlas activas ni a pasar al juego con dinero.',
      ] },
      { heading:'Lo que una demo no demuestra', paragraphs:[
        'El historial de multiplicadores muestra rondas anteriores. No revela el punto final de la siguiente, y una serie de pruebas no demuestra una estrategia rentable. Desconfía de señales, bots, APKs y promesas de retorno garantizado. No entregues claves ni datos de pago a una supuesta herramienta de predicción.',
        'Tampoco confirma disponibilidad en un operador concreto, autorización local, tiempos de retiro o condiciones de un bono. Esas comprobaciones se hacen por separado en Dónde jugar y en los términos del destino. Si no hay una opción verificada para tu visita, la ausencia es información; no la rellenamos con una marca de otro país.',
      ] },
    ],
    faqs:[{question:'¿Se pueden retirar los créditos de una demo?',answer:'No. El saldo virtual sirve para explorar los controles; no es un depósito ni dinero retirable.'},{question:'¿PlayLiva ofrece la demo de SPRIBE?',answer:'PlayLiva publica una ficha y enlaza la fuente del proveedor. Sus Originals son productos propios, no una demo de Aviator.'},{question:'¿Un historial permite predecir el siguiente multiplicador?',answer:'No. Los resultados anteriores no revelan el final de una nueva ronda ni garantizan ganancias.'}],
    links:[{href:'/games/aviator',label:'Ficha de Aviator y sus reglas'},{href:'/providers/spribe',label:'Catálogo de SPRIBE'},{href:'/crash',label:'Comparar juegos crash'},{href:'/where-to-play/aviator',label:'Revisar dónde jugar Aviator'},{href:'/guides/bonos-casino',label:'Condiciones de bonos: una revisión separada'}],
    sources:[{url:'https://spribe.co/games/aviator',label:'SPRIBE: ficha de Aviator y acceso a demo'}],
  },
  'bonos-casino': {
    title:'Bonos de casino: rollover y condiciones',
    description:'Aprende a comparar condiciones de una promoción: moneda, base del requisito de apuesta, contribución del juego, vencimiento y retiro.',
    sections:[
      {heading:'Lee las condiciones antes de comparar el titular',paragraphs:[
        'Un porcentaje alto no describe por sí solo una promoción. Anota país, moneda, quién puede participar, depósito requerido, importe máximo del bono y fecha de vencimiento. Distingue un saldo promocional de dinero disponible para retirar. La palabra «gratis» no elimina condiciones ni demuestra que todos los juegos participen.',
        'Esta guía enseña a leer términos; no anuncia un bono, una campaña sin depósito ni una aprobación de operador. Ofertas muestra únicamente campañas que superan la revisión vigente del sistema comercial. La relación de afiliación puede generar comisión, pero no cambia el contenido de los términos ni garantiza que una promoción te corresponda.',
      ]},
      {heading:'Cómo interpretar el requisito de apuesta',paragraphs:[
        'Busca a qué saldo se aplica el multiplicador del requisito: solo al bono, al depósito más bono o a otra base especificada. Después revisa cuánto contribuye cada juego. Una apuesta en tragamonedas puede contar de forma diferente que una en blackjack, casino en vivo o crash; incluso un título concreto puede quedar excluido.',
        'Ejemplo puramente educativo, sin representar una oferta real: un bono de 100 unidades con requisito 20× sobre el bono implica 2.000 unidades de apuestas que cuenten. Si la base fueran depósito de 100 más bono de 100, serían 4.000. Con contribución del 10%, una apuesta de 10 sumaría 1 al requisito. Estos cálculos describen condiciones; no estiman pérdidas ni garantizan completarlo o retirar.',
      ]},
      {heading:'Cinco datos que pueden cambiar la comparación',paragraphs:[
        'Comprueba apuesta máxima permitida, juegos excluidos, duración, límite de conversión o retiro y qué pasa al cancelar el bono. Los giros gratis activados por las reglas de Sweet Bonanza o Gates of Olympus son funciones del juego; los giros promocionales del operador tienen términos propios. No mezcles ambos al calcular el valor de una campaña.',
        'Revisa también si es necesario activar la oferta antes del depósito, si está destinada a nuevos usuarios y qué identificación exige el operador. Si una condición no está publicada, no la deduzcas a partir de otra marca o país. Guarda la referencia y consulta al operador antes de decidir; no cambies tu límite de gasto para perseguir un requisito.',
      ]},
      {heading:'Del descubrimiento a un destino verificado',paragraphs:[
        'Empieza en la ficha del juego para entender proveedor y edición. Dónde jugar separa la disponibilidad verificada de la exploración de marca; Ofertas identifica campañas vigentes con condiciones. Una ficha informativa no prueba que ese juego participe en un bono ni que un enlace de marca abra directamente el título.',
        'Solo para personas adultas. PlayLiva no acepta apuestas ni depósitos. Revisa herramientas de límites, pausas y autoexclusión del destino. La decisión de no aceptar una promoción sigue siendo una opción; un bono no compensa el riesgo de apostar dinero real.',
      ]},
    ],
    faqs:[{question:'¿Rollover siempre significa depósito más bono?',answer:'No. La base depende de los términos de cada campaña; hay que leerla antes de multiplicar.'},{question:'¿Todos los juegos contribuyen igual?',answer:'No puede presuponerse. Revisa contribuciones y exclusiones de la promoción concreta.'},{question:'¿Esta guía ofrece un bono sin depósito?',answer:'No. Es una explicación educativa. Solo la sección Ofertas puede mostrar campañas verificadas y vigentes para la visita.'}],
    links:[{href:'/offers',label:'Consultar ofertas verificadas'},{href:'/operators',label:'Leer perfiles de operadores'},{href:'/games/gates-of-olympus',label:'Gates of Olympus: función interna del juego'},{href:'/games/sweet-bonanza',label:'Sweet Bonanza: giros del juego'},{href:'/guides/aviator-demo',label:'Demo de Aviator: práctica sin dinero real'},{href:'/responsible-gaming',label:'Información de juego responsable'}],
    sources:[{url:'https://support.betano.pe/hc/es-pe/articles/7412005071645--Qu%C3%A9-es-el-Bono-de-Casino',label:'Ejemplo documental de términos y contribuciones; no es una oferta de PlayLiva'}],
  },
}

export function latamGuide(slug: string, locale: Locale) {
  const country=latamCountry(locale)
  if (!country || !(LATAM_GUIDE_SLUGS as readonly string[]).includes(slug)) return null
  const guide=GUIDES[slug as keyof typeof GUIDES]
  return { ...guide, country, title:`${guide.title} en ${country.name}`, description:`${guide.description} Referencia para ${country.name} (${country.currency}).` }
}
