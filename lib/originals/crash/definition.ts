import type { OriginalGameDefinition } from '../definition'

export const ISLAND_CRASH_NAME = 'PlayLiva Island Crash'
export const ISLAND_CRASH: OriginalGameDefinition = {
  id: 'island-crash', slug: 'crash', category: 'crash',
  title: { en: ISLAND_CRASH_NAME, 'pt-BR': ISLAND_CRASH_NAME, 'es-MX': ISLAND_CRASH_NAME },
}
export const CRASH_ASSETS = {
  castaway: '/originals/crash/runtime/castaway.glb?v=ba0d3dd0d618',
  kicker: '/originals/crash/runtime/island-kicker.glb?v=0b5d3a22e614',
} as const
