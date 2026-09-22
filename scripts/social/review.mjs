import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import content from '../../lib/social/content.ts'

const path = resolve(import.meta.dirname, '../../social/content/youtube-shorts-br.json')
const manifest = content.validateManifest(JSON.parse(await readFile(path, 'utf8')))
const approve = process.argv.find(value => value.startsWith('--approve='))?.slice(10)
if (approve) {
  const item = manifest.items.find(entry => entry.contentId === approve)
  if (!item) throw new Error(`Unknown content id: ${approve}`)
  if (item.publishStatus !== 'needs_review') throw new Error(`${approve}: only needs_review content can be approved`)
  item.publishStatus = 'approved'
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Approved ${approve} for a private/unlisted upload. This does not upload or publish it.`)
}
if (process.argv.includes('--json')) console.log(JSON.stringify(manifest.items.map(item => ({ ...item, trackedUrl: content.trackedTargetUrl(item), metadata: content.youtubeMetadata(item) })), null, 2))
else {
  for (const item of manifest.items) {
    const metadata = content.youtubeMetadata(item)
    console.log(`\n[${item.publishStatus}] ${item.contentId}\n  Preview: ${item.videoFile}\n  Game: ${item.gameName}\n  Hook: ${item.hook}\n  Title: ${metadata.title}\n  Target: ${content.trackedTargetUrl(item)}\n  Planned: ${item.scheduledAt ?? 'not scheduled'}`)
  }
}
