import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '../..')
const candidates = [
  process.env.PLAYLIVA_SOCIAL_PYTHON,
  'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  'python',
].filter(Boolean)
const python = candidates.find(value => value === 'python' || existsSync(value))
if (!python) throw new Error('Python 3 is required. Set PLAYLIVA_SOCIAL_PYTHON to its executable.')

const child = spawn(python, [resolve(ROOT, 'scripts/social/generate-voices.py'), ...process.argv.slice(2)], { stdio: 'inherit' })
child.on('error', error => { throw error })
child.on('exit', code => { process.exitCode = code ?? 1 })
