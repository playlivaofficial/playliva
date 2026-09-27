import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import planner from '../../lib/owner/creative-planner.ts'
import model from '../../lib/owner/automation-model.ts'
import automation from '../../lib/owner/server/automation.ts'
import { renderMaster } from './render-master.mjs'
const attempt = process.argv.find(arg => arg.startsWith('--attempt='))?.slice(10) || 'native-v1'
if (!/^[a-z0-9-]+$/.test(attempt)) throw new Error('Invalid canary attempt name.')
const folder = resolve(`social/output/owner-growth/canary-${attempt}`)
if (existsSync(resolve(folder, 'master.mp4'))) throw new Error('Canary master already exists; preserve it.')
const game = automation.generationGames().find(game => game.slug === 'crash')
const job = planner.planCreative(game, 'wow', 'canary-local-v1', new Date().toISOString(), model.emptyAutomation())
const result = await renderMaster(job, folder)
console.log(JSON.stringify({ master: result.master, poster: result.poster, bytes: result.bytes, qc: result.qc }))
