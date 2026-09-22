import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'
import ffmpegPath from 'ffmpeg-static'
import content from '../../lib/social/content.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const MANIFEST_PATH = resolve(ROOT, 'social/content/youtube-shorts-br.json')
const OUTPUT_ROOT = resolve(ROOT, 'social/output')
const BASE_URL = process.env.SOCIAL_CAPTURE_BASE_URL ?? 'http://127.0.0.1:3101'
const CAPTURE_WIDTH = 1440
const CAPTURE_HEIGHT = 2560
const RECORDING_FPS = 25
const selectedId = process.argv.find(value => value.startsWith('--id='))?.slice(5)
const selectedGame = process.argv.find(value => value.startsWith('--game='))?.slice(7)
const reuseRaw = process.argv.includes('--reuse-raw')
const candidates = [
  process.env.SOCIAL_CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)
const executablePath = candidates.find(path => existsSync(path))

if (!executablePath) throw new Error('Set SOCIAL_CHROME_PATH to a Chrome or Edge executable')
if (!ffmpegPath || !existsSync(ffmpegPath)) throw new Error('ffmpeg-static is unavailable; run pnpm install')

const manifest = content.validateManifest(JSON.parse(await readFile(MANIFEST_PATH, 'utf8')))
const items = manifest.items.filter(item => (!selectedId || item.contentId === selectedId) && (!selectedGame || item.gameSlug === selectedGame))
if (!items.length) throw new Error(`No manifest item matched id=${selectedId ?? '*'} game=${selectedGame ?? '*'}`)

const [playlivaLogo, livaSportsLogo] = await Promise.all([
  readFile(resolve(ROOT, 'social/brand/playliva-lockup.svg'), 'utf8'),
  readFile(resolve(ROOT, 'social/brand/livasports-lockup.svg'), 'utf8'),
])

function run(command, args, { quiet = false } = {}) {
  return new Promise((success, failure) => {
    const child = spawn(command, args, { stdio: ['ignore', quiet ? 'ignore' : 'inherit', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
      if (!quiet) process.stderr.write(chunk)
    })
    child.on('error', failure)
    child.on('exit', code => code === 0 ? success(stderr) : failure(new Error(`${command} exited ${code}: ${stderr.slice(-3000)}`)))
  })
}

async function mediaDuration(path) {
  let output = ''
  try {
    output = await run(ffmpegPath, ['-hide_banner', '-i', path], { quiet: true })
  } catch (error) {
    output = String(error)
  }
  const match = output.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) throw new Error(`Could not read duration for ${path}`)
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

const soundProfiles = {
  crash: { root: 110, pulse: 880, interval: 1.35 },
  mines: { root: 98, pulse: 1320, interval: 1.1 },
  blackjack: { root: 130.81, pulse: 740, interval: 1.6 },
  roulette: { root: 123.47, pulse: 988, interval: 0.9 },
  'capybara-gold': { root: 146.83, pulse: 1174, interval: 1.25 },
}

async function encode(rawPath, item) {
  const voicePath = resolve(OUTPUT_ROOT, 'voice', `${item.contentId}.wav`)
  if (!existsSync(voicePath)) throw new Error(`Missing PT-BR narration: ${voicePath}. Run pnpm social:voice first.`)
  const output = resolve(ROOT, item.videoFile)
  const thumbnail = resolve(ROOT, item.thumbnailFile)
  const mixPath = resolve(OUTPUT_ROOT, 'audio-mix', `${item.contentId}.wav`)
  await Promise.all([mkdir(dirname(output), { recursive: true }), mkdir(dirname(thumbnail), { recursive: true }), mkdir(dirname(mixPath), { recursive: true })])
  const rawDuration = await mediaDuration(rawPath)
  const start = Math.max(0, rawDuration - item.duration - 0.15)
  const sound = soundProfiles[item.gameSlug]
  const bed = `aevalsrc=0.055*sin(2*PI*${sound.root}*t)+0.03*sin(2*PI*${sound.root * 1.5}*t)+0.018*sin(2*PI*${sound.root * 2}*t)*(0.55+0.45*sin(2*PI*0.25*t)):s=48000:d=${item.duration}`
  const sfx = `aevalsrc=0.16*sin(2*PI*${sound.pulse}*t)*pow(sin(PI*t/${sound.interval})\\,18):s=48000:d=${item.duration}`
  const mixFilter = [
    '[1:a]highpass=f=70,lowpass=f=9000,volume=0.72[bed]',
    '[2:a]highpass=f=180,volume=0.78[sfx]',
    `[3:a]adelay=520|520,volume=1.35,apad=pad_dur=${item.duration}[voice]`,
    `[bed][sfx][voice]amix=inputs=3:duration=longest:dropout_transition=0,atrim=0:${item.duration},aresample=48000[a]`,
  ].join(';')

  await run(ffmpegPath, ['-y', '-hide_banner', '-f', 'lavfi', '-i', bed, '-f', 'lavfi', '-i', sfx, '-i', voicePath,
    '-filter_complex', mixFilter.replaceAll('[1:a]', '[0:a]').replaceAll('[2:a]', '[1:a]').replaceAll('[3:a]', '[2:a]'),
    '-map', '[a]', '-c:a', 'pcm_s24le', mixPath], { quiet: true })
  const analysis = await run(ffmpegPath, ['-hide_banner', '-i', mixPath, '-af', `loudnorm=I=${item.audio.loudnessLufs}:TP=${item.audio.truePeakDb}:LRA=7:print_format=json`, '-f', 'null', '-'], { quiet: true })
  const measurements = [...analysis.matchAll(/\{\s*"input_i"[\s\S]*?\}/g)].at(-1)?.[0]
  if (!measurements) throw new Error(`${item.contentId}: loudness analysis did not return measurements`)
  const measured = JSON.parse(measurements)
  const loudnorm = `loudnorm=I=${item.audio.loudnessLufs}:TP=${item.audio.truePeakDb}:LRA=7:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`
  const finalFilter = `[0:v]trim=start=${start.toFixed(3)}:duration=${item.duration},setpts=PTS-STARTPTS,scale=${item.encoding.width}:${item.encoding.height}:flags=lanczos,fps=${item.encoding.fps},format=${item.encoding.pixelFormat}[v];[1:a]${loudnorm}[a]`

  await run(ffmpegPath, [
    '-y', '-hide_banner', '-i', rawPath,
    '-i', mixPath,
    '-filter_complex', finalFilter,
    '-map', '[v]', '-map', '[a]', '-t', String(item.duration),
    '-c:v', 'libx264', '-profile:v', item.encoding.videoProfile, '-level', '4.2',
    '-preset', 'slow', '-crf', String(item.encoding.crf), '-maxrate', '12M', '-bufsize', '24M',
    '-c:a', item.encoding.audioCodec, '-b:a', `${item.encoding.audioBitrateKbps}k`, '-ar', '48000',
    '-movflags', '+faststart', '-shortest', output,
  ], { quiet: true })
  await run(ffmpegPath, ['-y', '-hide_banner', '-i', output, '-ss', '1.0', '-frames:v', '1', '-q:v', '2', thumbnail], { quiet: true })
  return output
}

async function latestRawPath(item) {
  const rawDir = resolve(OUTPUT_ROOT, 'raw', item.contentId)
  const files = (await readdir(rawDir)).filter(name => name.endsWith('.webm'))
  if (!files.length) throw new Error(`${item.contentId}: no raw capture is available to reuse`)
  const candidates = await Promise.all(files.map(async name => ({ path: resolve(rawDir, name), modified: (await stat(resolve(rawDir, name))).mtimeMs })))
  return candidates.sort((a, b) => b.modified - a.modified)[0].path
}

export async function installStage(page, item) {
  await page.evaluate(({ item, playlivaLogo, livaSportsLogo }) => {
    const unit = document.querySelector('[data-game-unit]')
    if (!(unit instanceof HTMLElement)) throw new Error('Game unit not found')
    const stage = document.createElement('main')
    stage.id = 'playliva-short-stage'
    stage.dataset.game = item.gameSlug
    stage.innerHTML = `
      <div class="ambient ambient-a"></div><div class="ambient ambient-b"></div><div class="grain"></div>
      <header class="brand-row"><div class="playliva-brand">${playlivaLogo}</div><span class="network-label">DA REDE</span><div class="livasports-brand">${livaSportsLogo}</div></header>
      <section class="copy"><div class="eyebrow">PLAYLIVA ORIGINALS · JOGUE GRÁTIS</div><h1></h1><p></p></section>
      <section class="game-frame"><div class="game-glow"></div></section>
      <footer><div class="cta">JOGUE GRÁTIS NO PLAYLIVA</div><div class="legal">18+ · Liva Credits sem valor monetário · Jogue com responsabilidade</div></footer>
      <section class="end-card" aria-hidden="true"><div class="end-logo">${playlivaLogo}</div><h2></h2><p>Jogue grátis no PlayLiva</p><span>playliva.com</span></section>`
    stage.querySelector('h1').textContent = item.hook
    stage.querySelector('.copy p').textContent = item.body
    stage.querySelector('.end-card h2').textContent = item.gameName
    document.body.append(stage)
    stage.querySelector('.game-frame').append(unit)
    document.body.dataset.socialCapture = 'true'
    const style = document.createElement('style')
    style.textContent = `
      *{box-sizing:border-box} html,body{margin:0!important;width:1440px!important;height:2560px!important;overflow:hidden!important;background:#031713!important}
      body[data-social-capture=true]>:not(#playliva-short-stage){display:none!important}
      #playliva-short-stage{position:relative;width:1440px;height:2560px;overflow:hidden;color:#fff;font-family:Inter,Arial,sans-serif;background:radial-gradient(circle at 50% 43%,#123f35 0,#082a25 34%,#031713 77%)}
      .ambient{position:absolute;border-radius:999px;filter:blur(120px);opacity:.42}.ambient-a{width:780px;height:780px;left:-260px;top:720px;background:#27d99d}.ambient-b{width:760px;height:760px;right:-330px;top:110px;background:#ffbf38;opacity:.22}
      .grain{position:absolute;inset:0;opacity:.08;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")}
      .brand-row{position:absolute;z-index:3;top:530px;left:120px;right:210px;height:90px;display:flex;align-items:center;gap:38px}.playliva-brand svg{width:345px;height:auto}.livasports-brand svg{width:236px;height:auto}.network-label{margin-left:auto;font-size:22px;font-weight:800;letter-spacing:.24em;color:#9ac8ba}
      .copy{position:absolute;z-index:3;left:120px;right:220px;top:165px}.eyebrow{color:#61edb8;font-size:28px;font-weight:850;letter-spacing:.13em}.copy h1{max-width:1100px;margin:28px 0 12px;font-size:88px;line-height:.96;letter-spacing:-.045em;text-wrap:balance;text-shadow:0 10px 36px #0008}.copy p{margin:0;color:#d9eee7;font-size:36px;font-weight:600;line-height:1.2}
      .game-frame{position:absolute;z-index:2;left:76px;right:164px;top:650px;height:1080px;display:flex;align-items:center;justify-content:center}.game-glow{position:absolute;inset:60px 20px;border-radius:80px;background:#38efab22;filter:blur(70px)}
      [data-game-unit]{position:relative!important;width:1200px!important;max-width:none!important;margin:0!important;z-index:2;transform:translateZ(0)}
      [data-game-viewport]{border-radius:34px!important;border:2px solid #8ff5ce66!important;box-shadow:0 34px 100px #000a,0 0 0 12px #ffffff0a!important;overflow:hidden!important;background:#061b18!important}
      #playliva-short-stage[data-game=crash] [data-game-viewport]>div{height:760px!important;min-height:760px!important}
      #playliva-short-stage[data-game=mines] [data-mines-phase]{min-height:820px!important}
      #playliva-short-stage[data-game=blackjack] [data-blackjack-phase]{min-height:760px!important}
      #playliva-short-stage[data-game=roulette] [data-roulette-phase]{min-height:820px!important}
      #playliva-short-stage[data-game=capybara-gold] [data-slot-phase]{min-height:800px!important}
      footer{position:absolute;z-index:4;left:120px;right:220px;top:1810px;display:flex;align-items:center;gap:34px}.cta{display:inline-flex;align-items:center;height:82px;padding:0 38px;border-radius:999px;background:#b9ff5f;color:#08251c;font-size:29px;font-weight:950;letter-spacing:.02em;box-shadow:0 16px 55px #8cff4b3a}.legal{max-width:520px;color:#a9c8bf;font-size:22px;font-weight:650;line-height:1.3}
      .end-card{position:absolute;z-index:10;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 250px 330px;text-align:center;background:radial-gradient(circle at 50% 42%,#17634f 0,#082e27 36%,#031713 78%);opacity:0;transform:scale(1.035);pointer-events:none;transition:opacity .36s ease,transform .5s ease}.end-card[data-visible=true]{opacity:1;transform:scale(1)}.end-logo svg{width:520px;height:auto}.end-card h2{margin:76px 0 24px;font-size:84px;line-height:1;letter-spacing:-.04em}.end-card p{margin:0;padding:26px 54px;border-radius:999px;background:#b9ff5f;color:#09261d;font-size:38px;font-weight:950}.end-card span{margin-top:34px;color:#bde1d6;font-size:30px;font-weight:700;letter-spacing:.08em}
    `
    document.head.append(style)
    window.scrollTo(0, 0)
  }, { item, playlivaLogo, livaSportsLogo })
}

async function clickIfReady(page, selector) {
  const locator = page.locator(selector).first()
  try {
    if (await locator.isVisible() && await locator.isEnabled()) {
      await locator.click({ timeout: 1500 })
      return true
    }
  } catch {}
  return false
}

function actionPlan(item) {
  const v = item.captureVariant
  if (item.gameSlug === 'crash') return [[.8, '[data-action="start"]'], [4 + (v % 4) * .35, '[data-action="cashout"]'], [8.5, '[data-action="start"]']]
  if (item.gameSlug === 'mines') {
    const sequences = [[12, 7, 18], [0, 24, 11], [6, 13, 19], [4, 9, 21], [2, 17, 22]]
    const tiles = sequences[(v - 1) % sequences.length]
    return [[.8, '[data-mines-start]'], [2.3, `[data-tile="${tiles[0]}"]`], [4, `[data-tile="${tiles[1]}"]`], [5.8, `[data-tile="${tiles[2]}"]`], [7.5, '[data-mines-cash]'], [10.2, '[data-mines-start]']]
  }
  if (item.gameSlug === 'blackjack') return [[.8, '[data-blackjack-deal]'], [3.4, `[data-blackjack-action="${v % 3 === 0 ? 'double' : v % 2 === 0 ? 'stand' : 'hit'}"]`], [6.1, '[data-blackjack-action="stand"]'], [9.6, '[data-blackjack-deal]'], [11.8, '[data-blackjack-action="hit"]']]
  if (item.gameSlug === 'roulette') {
    const bets = ['red:red', 'black:black', 'even:even', 'odd:odd', `straight:${(v * 3) % 37}`]
    return [[.8, `[data-bet="${bets[(v - 1) % bets.length]}"]`], [1.6, `[data-bet="straight:${(v * 7) % 37}"]`], [2.4, '[data-roulette-spin]'], [10.8, '[data-roulette-repeat]'], [11.4, '[data-roulette-spin]']]
  }
  return [[.8, '[data-slot-spin]'], [6.4, '[data-slot-spin]'], [11.2, '[data-slot-spin]']]
}

async function recordItem(browser, item) {
  const rawDir = resolve(OUTPUT_ROOT, 'raw', item.contentId)
  await mkdir(rawDir, { recursive: true })
  const context = await browser.newContext({ viewport: { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT }, locale: 'pt-BR', colorScheme: 'dark', deviceScaleFactor: 1, recordVideo: { dir: rawDir, size: { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT } } })
  await context.addInitScript(() => {
    localStorage.setItem('playliva.cookie-consent', JSON.stringify({ necessary: true, analytics: false, marketing: false }))
    localStorage.removeItem('playliva.demo-session')
  })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}${new URL(item.targetUrl).pathname}`, { waitUntil: 'networkidle', timeout: 90_000 })
  await page.locator('[data-game-unit]').waitFor({ state: 'visible', timeout: 45_000 })
  await installStage(page, item)
  await page.waitForTimeout(700)
  const started = Date.now()
  const plan = actionPlan(item)
  let next = 0
  let endShown = false
  while ((Date.now() - started) / 1000 < item.duration + .25) {
    const elapsed = (Date.now() - started) / 1000
    while (next < plan.length && elapsed >= plan[next][0]) {
      await clickIfReady(page, plan[next][1])
      next += 1
    }
    if (!endShown && elapsed >= item.duration - 2.15) {
      await page.locator('.end-card').evaluate(element => { element.dataset.visible = 'true'; element.setAttribute('aria-hidden', 'false') })
      endShown = true
    }
    await page.waitForTimeout(60)
  }
  const video = page.video()
  await page.close()
  const rawPath = await video.path()
  await context.close()
  return rawPath
}

if (resolve(process.argv[1] ?? "") === import.meta.filename) {
  throw new Error("Bulk rendering paused pending creative approval. Use capture-crash-validation.mjs for the single validation Short.")
}

export async function legacyCaptureLibrary() {
console.log(`Renderer: ${CAPTURE_WIDTH}x${CAPTURE_HEIGHT} native ${RECORDING_FPS}fps capture -> 1080x1920 30fps master`)
console.log(`Source: ${BASE_URL}; items: ${items.length}`)
const browser = reuseRaw ? null : await chromium.launch({ executablePath, headless: true, args: ['--use-angle=swiftshader-webgl', '--enable-webgl', '--disable-background-timer-throttling'] })
try {
  for (const [index, item] of items.entries()) {
    console.log(`[${index + 1}/${items.length}] Capturing ${item.contentId}`)
    const rawPath = reuseRaw ? await latestRawPath(item) : await recordItem(browser, item)
    const output = await encode(rawPath, item)
    item.qualityStatus = 'generated'
    item.reviewStatus = 'needs_review'
    item.publishStatus = 'needs_review'
    item.qc = null
    console.log(`Rendered ${output}`)
  }
} finally {
  await browser?.close()
}

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)

}
