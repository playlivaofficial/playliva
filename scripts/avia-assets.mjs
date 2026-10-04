// Deterministic poster derivative of the fictional coastal scene and preserved aircraft master.
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import art from '../components/originals/avia/art.tsx'
const background = renderToStaticMarkup(React.createElement(art.RioArt)).replace('<svg ', '<svg width="1200" height="720" ')
await mkdir('public/originals/avia-de-janeiro', { recursive: true })
const master = await readFile('assets-source/avia-de-janeiro/aircraft-ipanema.png')
if (!process.argv.includes('--poster-only')) await sharp(master).webp({ quality: 94, alphaQuality: 100, effort: 6 }).toFile('public/originals/avia-de-janeiro/aircraft-ipanema.webp')
const posterPlane = await sharp(master).resize({ width: 600 }).png().toBuffer()
const aircraft = `<image x="430" y="270" width="700" height="400" href="data:image/png;base64,${posterPlane.toString('base64')}"/>`
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">${background}<defs><linearGradient id="poster-shade"><stop stop-color="#13273e" stop-opacity=".8"/><stop offset="1" stop-color="#182d40" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="720" fill="url(#poster-shade)"/><path d="M0 550L580 451" stroke="#e8fbd6" stroke-width="3" opacity=".4"/>${aircraft}<g font-family="Arial,sans-serif" fill="#fff3d6"><text x="70" y="73" font-size="16" letter-spacing="5">PLAYLIVA ORIGINAL</text><text x="60" y="227" font-size="125" font-weight="900" font-style="italic" letter-spacing="-4">SKYLINE</text><text x="72" y="277" font-size="37" font-weight="700" letter-spacing="9">LIVA</text><path d="M72 311H267" stroke="#f3ca86" stroke-width="3"/><text x="74" y="651" font-size="14" letter-spacing="4">CRASH</text></g></svg>`
await mkdir('public/originals/avia-de-janeiro', { recursive: true })
await writeFile('public/originals/avia-de-janeiro/poster.svg', svg)
await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile('public/originals/avia-de-janeiro/poster.webp')
console.log('Liva Skyline 1200×720 poster generated')
