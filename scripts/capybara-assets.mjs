import sharp from 'sharp'
import { mkdir, stat } from 'node:fs/promises'
const source = new URL('../assets-source/capybara-gold/', import.meta.url)
const output = new URL('../public/originals/capybara-gold/', import.meta.url)
await mkdir(output, { recursive: true })
const symbols = ['wild', 'coconut', 'emerald', 'flower', 'toucan', 'pearl', 'acai', 'leaf', 'scatter']
for (const symbol of symbols) {
  const input = new URL(`${symbol}.png`, source)
  const meta = await sharp(input.pathname.replace(/^\/(\w:)/, '$1')).metadata()
  if (!meta.hasAlpha) throw Error(`Expected original transparency: ${symbol}`)
  await sharp(input.pathname.replace(/^\/(\w:)/, '$1')).resize(160, 160).webp({ quality: 82, alphaQuality: 100 }).toFile(new URL(`${symbol}.webp`, output).pathname.replace(/^\/(\w:)/, '$1'))
}
await sharp(new URL('wild.png', source).pathname.replace(/^\/(\w:)/, '$1')).resize(384, 384).webp({ quality: 85, alphaQuality: 100 }).toFile(new URL('mascot.webp', output).pathname.replace(/^\/(\w:)/, '$1'))
await sharp(new URL('river.png', source).pathname.replace(/^\/(\w:)/, '$1')).resize(1200).webp({ quality: 76 }).toFile(new URL('river.webp', output).pathname.replace(/^\/(\w:)/, '$1'))
let total = 0
for (const name of [...symbols, 'mascot', 'river']) { const { size } = await stat(new URL(`${name}.webp`, output)); total += size; console.log(`${name}: ${size} bytes`) }
console.log(`Total runtime artwork: ${total} bytes`)
