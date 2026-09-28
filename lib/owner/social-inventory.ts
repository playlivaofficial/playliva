import { dailyJobId, eligibleGenerationGames, generationDate, type GenerationGame } from './automation-model'
import type { Creative } from './model'

export function isReadyVideo(item: Creative) {
  return item.availability === 'READY' && item.renderStatus === 'rendered' && item.qc?.passed === true && item.media.video && item.media.thumbnail && (item.mediaBytes ?? 0) > 0 && item.duration > 0
}
export function dailyInventory(games: GenerationGame[], creatives: Creative[], now = new Date().toISOString()) {
  const date = generationDate(now)
  const items = eligibleGenerationGames(games).map(game => {
    const creative = creatives.find(item => item.id === dailyJobId(game, date))
    return { id: game.id ?? game.slug, slug: game.slug, title: game.title, creativeId: creative?.id,
      status: creative && isReadyVideo(creative) ? 'READY' : creative?.availability === 'READY' ? 'MISSING_MEDIA' : creative?.availability ?? 'MISSING_MEDIA',
      duration: creative?.duration, bytes: creative?.mediaBytes ?? 0 }
  })
  return { date, timezone: 'Asia/Tbilisi', expected: items.length, ready: items.filter(item => item.status === 'READY').length, items }
}
