import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import content from '../../lib/social/content.ts'

const path = resolve(import.meta.dirname, '../../social/content/youtube-shorts-br.json')
const manifest = content.validateManifest(JSON.parse(await readFile(path, 'utf8')))
const approve = process.argv.find(value => value.startsWith('--approve='))?.slice(10)
const reject = process.argv.find(value => value.startsWith('--reject='))?.slice(9)

if (approve || reject) {
  const contentId = approve ?? reject
  const item = manifest.items.find(entry => entry.contentId === contentId)
  if (!item) throw new Error(`Unknown content id: ${contentId}`)
  if (approve) {
    if (item.qualityStatus !== 'needs_review' || !item.qc?.passed) throw new Error(`${contentId}: automated QC must pass before human approval`)
    if (item.reviewStatus !== 'needs_review' || item.publishStatus !== 'needs_review') throw new Error(`${contentId}: only a pending item can be approved`)
    item.reviewStatus = 'approved'
    item.publishStatus = 'approved'
    console.log(`Approved ${contentId} for a separately authorized upload. Nothing was uploaded or published.`)
  } else {
    item.reviewStatus = 'rejected'
    item.qualityStatus = 'rejected'
    item.publishStatus = 'needs_review'
    console.log(`Rejected ${contentId}. Regenerate it before approval.`)
  }
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
}

const rows = manifest.items.map(item => ({
  id: item.contentId, game: item.gameName, archetype: item.archetype, hook: item.hook,
  duration: `${item.duration}s`, title: content.youtubeMetadata(item).title,
  description: content.youtubeMetadata(item).description, utm: content.trackedTargetUrl(item),
  video: item.videoFile, thumbnail: item.thumbnailFile, videoExists: existsSync(resolve(import.meta.dirname, '../..', item.videoFile)),
  quality: item.qualityStatus, review: item.reviewStatus, publishing: item.publishStatus,
}))
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2))
else for (const row of rows) console.log(`\n[${row.game} · ${row.archetype}] ${row.id}\n  ${row.hook} · ${row.duration}\n  ${row.title}\n  Output: ${row.video} (${row.videoExists ? 'ready' : 'missing'})\n  UTM: ${row.utm}\n  State: quality=${row.quality} review=${row.review} publish=${row.publishing}`)
