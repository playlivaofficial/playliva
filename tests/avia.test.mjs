import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import engine from '../lib/originals/avia/engine.ts'
import crash from '../lib/originals/crash/engine.ts'
import session from '../lib/originals/session.ts'
import engagement from '../lib/affiliates/betsson-engagement.ts'
import catalog from '../lib/discovery/catalog.ts'
import query from '../lib/discovery/query.ts'
import help from '../lib/originals/game-help.ts'
import copy from '../lib/originals/avia/copy.ts'
import sitemap from '../app/sitemap.ts'
import owner from '../lib/owner/server/catalog.ts'
import automation from '../lib/owner/server/automation.ts'
import policy from '../lib/owner/video-production.ts'
import promo from '../lib/affiliates/betsson-promo.ts'

const random = point => ({ uint32: () => Math.floor((1 - 97 / (point + .5)) * 2 ** 32) })
const round = (point = 300) => engine.newAviaRound(10000, 'round-1', random(point))
const bet = (s, auto = null, at = s.opensAt) => engine.actAvia(s, { type: 'bet', roundId: s.id, stake: 1000, auto }, at)
const cash = (s, at, id = s.id) => engine.actAvia(s, { type: 'cashout', roundId: id }, at)

test('Avia automatically counts down, flies and ends; no client deadline or crash-point disclosure', () => {
  const s = round()
  assert.equal(s.point, 300)
  engine.advanceAvia(s, s.flightAt - 1); assert.equal(s.phase, 'betting')
  engine.advanceAvia(s, s.flightAt); assert.equal(s.phase, 'flying')
  const publicState = engine.publicAvia(s, s.flightAt + 100)
  assert.equal(publicState.point, undefined); assert.equal(publicState.crashAt, undefined); assert.equal(publicState.resultAt, null)
  engine.advanceAvia(s, s.crashAt); assert.equal(s.phase, 'result'); assert.equal(s.history.length, 1)
  engine.advanceAvia(s, s.crashAt + 10000); assert.equal(s.history.length, 1)
  assert.equal(engine.actAvia(s, { type: 'next', roundId: s.id }, s.crashAt + engine.RESULT_MS - 1), 'round-active')
  assert.equal(engine.actAvia(s, { type: 'next', roundId: s.id }, s.crashAt + engine.RESULT_MS), null)
  const next = engine.newAviaRound(s.crashAt + engine.RESULT_MS, 'round-2', random(200), s)
  assert.equal(next.number, 2); assert.equal(next.wager, null); assert.equal(next.phase, 'betting')
})
test('manual cashout settles once, flight continues; stale/wrong ids and late requests never credit', () => {
  const s = round(); assert.equal(bet(s), null); assert.equal(bet(s), null); assert.equal(s.receipts.length, 1)
  const at = s.flightAt + crash.timeToMultiplier(150)
  assert.equal(cash(s, at, 'wrong-round'), 'stale-round'); assert.equal(s.receipts.length, 1)
  assert.equal(cash(s, at), null); const payout = s.wager.payout
  for (let i = 0; i < 20; i++) cash(s, at + i)
  assert.equal(s.receipts.length, 2); assert.equal(s.wager.payout, payout); assert.equal(s.phase, 'flying')
  engine.advanceAvia(s, s.crashAt); assert.equal(s.wager.status, 'won'); assert.equal(s.wager.payout, payout)
  assert.equal(cash(s, s.crashAt), 'not-active'); assert.equal(s.receipts.length, 2)
})
test('cashout/crash equality loses; before deadline wins; auto equality loses', () => {
  for (const delta of [-.01, 0, .01]) {
    const s = round(); bet(s); cash(s, s.crashAt + delta)
    assert.equal(s.wager.status, delta < 0 ? 'won' : 'lost')
  }
  for (const auto of [299, 300, 301]) {
    const s = round(); bet(s, auto); engine.advanceAvia(s, s.crashAt + 50000)
    assert.equal(s.wager.status, auto < 300 ? 'won' : 'lost')
    assert.equal(s.wager.payout, auto < 300 ? crash.payoutFor(1000, auto) : 0)
  }
})
test('auto/manual ordering uses event deadlines, including delayed reconnect and instant crashes', () => {
  const s = round(); bet(s, 150)
  cash(s, s.flightAt + crash.timeToMultiplier(200)); assert.equal(s.wager.multiplier, 150)
  const restored = JSON.parse(JSON.stringify(s)); engine.advanceAvia(restored, s.crashAt + 60000)
  assert.equal(restored.receipts.length, 2); assert.equal(restored.wager.multiplier, 150)
  const instant = round(100); bet(instant, 101); cash(instant, instant.flightAt)
  assert.equal(instant.wager.status, 'lost'); assert.equal(instant.wager.payout, 0)
})
test('betting closes at takeoff; bounds/nonfinite/string/stale inputs do not debit', () => {
  for (const stake of [0, 99, 5001, NaN, Infinity, '100', 100.1]) {
    const s = round(); assert.equal(engine.actAvia(s, { type: 'bet', roundId: s.id, stake, auto: null }, s.opensAt), 'invalid-stake'); assert.equal(s.receipts.length, 0)
  }
  for (const auto of [0, 100, 10001, NaN, Infinity, '200', 150.5]) { const s = round(); assert.equal(bet(s, auto), 'invalid-auto'); assert.equal(s.receipts.length, 0) }
  const s = round(); assert.equal(bet(s, null, s.flightAt), 'betting-closed'); assert.equal(s.receipts.length, 0)
})
test('shared demo receipts survive reload atomically; duplicates do not debit or credit again', () => {
  const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const id = 'a'.repeat(64), s = round(), w = session.createDemoSessionStore(() => storage)
  bet(s, 150); engine.advanceAvia(s, s.crashAt + 10)
  const before = w.getSnapshot().session.balance
  for (const receipt of s.receipts) assert.equal(w.applyAviaReceipt(id, receipt).ok, true)
  const expected = before - 1000 + 1500
  assert.equal(w.getSnapshot().session.balance, expected)
  const reloaded = session.createDemoSessionStore(() => storage)
  for (const receipt of s.receipts) assert.equal(reloaded.applyAviaReceipt(id, receipt).ok, true)
  assert.equal(reloaded.getSnapshot().session.balance, expected); assert.equal(reloaded.getSnapshot().session.transactions.length, 2)
  reloaded.reset(); const reset = reloaded.getSnapshot().session.balance
  for (const receipt of s.receipts) reloaded.applyAviaReceipt(id, receipt)
  assert.equal(reloaded.getSnapshot().session.balance, reset)
  assert.equal(reloaded.applyAviaReceipt(id, { ...s.receipts[0], sequence: 4 }).ok, false)
  const secondGuest = 'b'.repeat(64)
  for (const receipt of s.receipts) reloaded.applyAviaReceipt(secondGuest, receipt)
  const both = reloaded.getSnapshot().session.balance
  // Two initial tabs may race to obtain a guest cookie. Each channel keeps its own cursor.
  for (const guest of [id, secondGuest, id]) for (const receipt of s.receipts) reloaded.applyAviaReceipt(guest, receipt)
  assert.equal(reloaded.getSnapshot().session.balance, both)
})
test('existing offer holds only settled 3/6/9 boundaries; dismissal resumes without cancelling future exposure', () => {
  const opens = [], timers = [], holds = []
  const trigger = engagement.createEngagementTrigger({ cycleMultiple: 3, delayMs: 650, open: m => opens.push(m.completedCycleNumber), close() {}, hold: held => holds.push(held), schedule(fn) { timers.push(fn); return timers.length }, cancel(id) { timers[id - 1] = () => {} } })
  for (let cycle = 1; cycle <= 9; cycle++) {
    trigger.observe(true); assert.equal(holds.at(-1), false); assert.equal(trigger.isOpen, false)
    trigger.observe(false); timers.splice(0).forEach(fn => fn())
    assert.equal(trigger.isOpen, cycle % 3 === 0)
    if (trigger.isOpen) { assert.equal(holds.at(-1), true); trigger.dismiss(); assert.equal(holds.at(-1), false) }
  }
  assert.deepEqual(opens, [3, 6, 9])
  for (const country of ['GE', 'MX', 'US']) assert.equal(promo.getBetssonPromo(country, 'pt-BR', promo.BETSSON_PROMO_PLACEMENTS.originalsEngagement, { pageSlug: 'avia-de-janeiro' }), null)
  assert.ok(promo.getBetssonPromo('BR', 'pt-BR', promo.BETSSON_PROMO_PLACEMENTS.originalsEngagement, { pageSlug: 'avia-de-janeiro' }))
})
test('instant 1.00x flights count once at the same shared offer cadence, including spectators', () => {
  const opens = [], timers = []
  const trigger = engagement.createEngagementTrigger({ cycleMultiple: 3, delayMs: 0, open: m => opens.push(m.completedCycleNumber), close() {}, schedule(fn) { timers.push(fn); return timers.length }, cancel() {} })
  for (let i = 0; i < 9; i++) {
    const s = round(100)
    trigger.observe(s.phase !== 'result')
    engine.advanceAvia(s, s.flightAt)
    assert.equal(s.phase, 'result')
    trigger.observe(s.phase !== 'result'); trigger.observe(s.phase !== 'result')
    timers.splice(0).forEach(fn => fn())
    assert.equal(trigger.isOpen, (i + 1) % 3 === 0)
    if (trigger.isOpen) trigger.dismiss()
  }
  assert.deepEqual(opens, [3, 6, 9])
})
test('all locales: discovery search, crash relations, localized help, sitemap and Owner Growth', async () => {
  for (const locale of ['pt-BR', 'en', 'es-MX']) {
    const entries = catalog.discoveryEntries(locale)
    for (const q of ['Avia', 'Janeiro', 'Avia de Janeiro']) assert.equal(query.queryDirectory(entries, { q }).items[0].slug, 'avia-de-janeiro')
    const avia = entries.find(row => row.slug === 'avia-de-janeiro')
    assert.equal(avia.category, 'crash')
    assert.ok(catalog.relatedDiscovery(avia, entries, 'original').some(row => ['crash', 'liva-ginga', 'skuptu-levanta'].includes(row.slug)))
    const rules = await help.loadGameHelp('avia-de-janeiro', locale)
    assert.ok(rules.sections.flatMap(s => s.items).length >= 6); assert.ok(copy.aviaCopy(locale).paragraphs.join(' ').length > 600)
    assert.equal(sitemap.default().filter(row => row.url.endsWith(`/${locale.toLowerCase()}/play/avia-de-janeiro`)).length, 1)
  }
  assert.equal(owner.ownerGames.filter(row => row.slug === 'avia-de-janeiro').length, 1)
  assert.equal(owner.publishedInventory().filter(row => row.route.endsWith('/play/avia-de-janeiro')).length, 3)
})
test('video shutdown is unchanged and Avia never enters even the dormant video generation catalog', () => {
  assert.equal(automation.generationGames().length, 12)
  assert.ok(!automation.generationGames().some(row => row.slug === 'avia-de-janeiro'))
  assert.throws(() => policy.videoProductionPolicy.assertEnabled(), /disabled/i)
})
test('server storage fails closed in production and does not use owner state or browser outcomes', async () => {
  const server = await readFile('lib/originals/avia/server.ts', 'utf8'), api = await readFile('app/api/originals/avia/route.ts', 'utf8')
  assert.match(server, /AND revision=/); assert.match(server, /clock_timestamp/)
  assert.doesNotMatch(server, /updateOwnerState|readOwnerState|CREATE TABLE.*state\s*\(/)
  assert.match(api, /httpOnly: true/); assert.match(api, /sameSite: 'strict'/)
  assert.match(api, /no-store/); assert.match(api, /noindex/)
})
