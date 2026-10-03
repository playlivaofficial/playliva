import { GEO_CONFIG, geoForLocale, type CommercialGeo } from './geo'
import type { Locale } from './types'

const COUNTRY_GUIDES: Record<CommercialGeo, { intro: string; money: string; checks: string[] }> = {
  MX: {
    intro: 'Explora juegos de proveedores y Originals desde México. Una ficha explica el juego; una recomendación comercial necesita una revisión independiente para México. La popularidad de un título en otro país no confirma que esté disponible aquí.',
    money: 'La referencia monetaria de México es el peso mexicano (MXN). Si un operador muestra un importe con el símbolo $, comprueba el código de moneda, el costo total y las condiciones antes de compararlo con otra oferta. Los créditos de los Originals nunca se convierten a MXN.',
    checks: ['Identifica el proveedor y la edición exacta del juego, especialmente si varios títulos comparten nombre.', 'Comprueba que el destino y las condiciones publicados se refieran a México. Un enlace de Brasil o de otro mercado no sirve como confirmación.', 'Revisa los términos del operador y la información oficial aplicable. PlayLiva no atribuye autorizaciones ni bonos que no estén documentados.'],
  },
  CO: {
    intro: 'Esta edición acompaña el descubrimiento de juegos desde Colombia. Puedes comparar mecánicas y practicar con Originals gratuitos; la presencia de un juego en el catálogo no significa que un operador lo ofrezca en Colombia.',
    money: 'La referencia para Colombia es el peso colombiano (COP). No compares importes solo por el símbolo $: distingue COP de MXN y otras monedas, comprueba los separadores de miles y lee el importe completo. Las cifras de los juegos gratuitos son créditos virtuales, no pesos colombianos.',
    checks: ['Distingue una ficha de proveedor de un Original gratuito: los Originals no son saldos retirables ni pronósticos de otros juegos.', 'Antes de elegir un destino, verifica la disponibilidad específica para Colombia y la identidad del operador en sus condiciones.', 'Contrasta la moneda, las restricciones y la información de autorización con fuentes oficiales. Las promociones de otros países no se trasladan automáticamente a Colombia.'],
  },
  PE: {
    intro: 'Descubre desde Perú cómo funcionan los juegos y en qué se diferencian. El catálogo comparte referencias de proveedores, pero cada destino comercial necesita su propia comprobación para Perú. Un juego gratuito de PlayLiva no acredita disponibilidad en un casino.',
    money: 'Para Perú la referencia es el sol (PEN). Al revisar un importe, identifica PEN o S/ y comprueba si las condiciones usan otra moneda; no presupongas equivalencia con dólares ni con pesos. Los créditos de los Originals no tienen valor en soles ni pueden retirarse.',
    checks: ['Compara el formato y las reglas de la edición concreta, no solo la imagen o un nombre parecido.', 'Revisa si las condiciones corresponden a Perú y si la moneda de la oferta coincide con la del importe que estás leyendo.', 'Comprueba la identidad y la información oficial del operador antes de salir del catálogo. La ausencia de una recomendación significa que PlayLiva no presenta un destino verificado para ese contexto.'],
  },
}

export function geoEditorial(locale: Locale) {
  const geo = geoForLocale(locale)
  return geo ? { ...GEO_CONFIG[geo], ...COUNTRY_GUIDES[geo] } : null
}

export function geoEditorialMetadata(path: string, locale: Locale) {
  const country = geoEditorial(locale)
  if (!country || !['/', '/games'].includes(path)) return null
  return path === '/'
    ? { title: `PlayLiva ${country.name} — descubre juegos y juega gratis`, description: `Descubre juegos desde ${country.name}: Originals gratis, guías de proveedores y criterios para revisar disponibilidad y moneda ${country.currency}. Sin depósitos en PlayLiva.` }
    : { title: `Juegos para explorar desde ${country.name} — guías y Originals`, description: `Explora el catálogo de PlayLiva desde ${country.name}. Compara formatos y proveedores, distingue los créditos gratuitos de ${country.currency} y revisa la disponibilidad por país.` }
}
