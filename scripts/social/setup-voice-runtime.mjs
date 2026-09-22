import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '../..')
const TARGET = resolve(ROOT, 'social/output/python-deps')
const candidates = [
  process.env.PLAYLIVA_SOCIAL_PYTHON,
  'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  'python',
].filter(Boolean)
const python = candidates.find(value => value === 'python' || existsSync(value))
if (!python) throw new Error('Python 3 is required. Set PLAYLIVA_SOCIAL_PYTHON to its executable.')

function run(args) {
  return new Promise((success, failure) => {
    const child = spawn(python, args, { stdio: 'inherit' })
    child.on('error', failure)
    child.on('exit', code => code === 0 ? success() : failure(new Error(`Python exited ${code}`)))
  })
}

await mkdir(TARGET, { recursive: true })
await run(['-m', 'pip', 'install', '--disable-pip-version-check', '--target', TARGET, '--upgrade', '--no-deps', 'kokoro==0.9.4', 'misaki==0.9.4'])
await run(['-m', 'pip', 'install', '--disable-pip-version-check', '--target', TARGET, '--upgrade',
  'torch==2.9.1', 'transformers==4.57.3', 'huggingface-hub<1', 'loguru', 'numpy',
  'soundfile==0.13.1', 'espeakng-loader==0.2.4', 'phonemizer-fork==3.3.2', 'regex',
  'addict', 'num2words==0.5.14', 'spacy==3.8.16'])
console.log(`PT-BR voice runtime installed outside Git at ${TARGET}`)
