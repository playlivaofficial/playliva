import type { OriginalGameDefinition } from '../definition'

export const ISLAND_CRASH_NAME = 'PlayLiva Island Crash'
export const ISLAND_CRASH: OriginalGameDefinition = {
  id: 'island-crash', slug: 'crash', category: 'crash',
  title: { en: ISLAND_CRASH_NAME, 'pt-BR': ISLAND_CRASH_NAME, 'es-MX': ISLAND_CRASH_NAME },
}
export const CRASH_ASSETS = {
  castaway: '/originals/crash/runtime/castaway.glb?v=06933964489b',
  kicker: '/originals/crash/runtime/island-kicker.glb?v=3c82d1cd533a',
} as const
