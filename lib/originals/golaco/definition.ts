import type { OriginalGameDefinition } from '../definition'

/** Brand name stays identical across locales, like the other PlayLiva Originals. */
export const GOLACO_NAME = 'Liva Golaço'
export const GOLACO: OriginalGameDefinition = Object.freeze({
  id: 'liva-golaco', slug: 'golaco', category: 'slots',
  title: { en: GOLACO_NAME, 'pt-BR': GOLACO_NAME, 'es-MX': GOLACO_NAME },
})
export const GOLACO_ART = '/originals/golaco'
export const golacoSymbolAsset = (symbol: string) => `${GOLACO_ART}/${symbol}.webp`
export const GOLACO_POSTER = `${GOLACO_ART}/poster.webp`
export const GOLACO_STADIUM = `${GOLACO_ART}/stadium.webp`
