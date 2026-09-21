/**
 * Round-boundary trigger and per-session frequency cap for the Originals
 * engagement offer. Pure logic so the rules are unit-testable:
 *
 *   play → N completed rounds → current round fully settles → offer opens
 *   once per browser session, never over live gameplay, and a dismissed
 *   offer stays dismissed.
 *
 * A "completed round" is a `roundActive` transition from true to false, which
 * every Original already reports to the shared shell; engines are untouched.
 */

export const ENGAGEMENT_STORAGE_PREFIX = 'playliva.betsson.engagement.'

type SessionStore = Pick<Storage, 'getItem' | 'setItem'>

export function engagementStorageKey(promoId: string): string {
  return `${ENGAGEMENT_STORAGE_PREFIX}${promoId}`
}

/** Number of times this promo has been offered in the current browser session. */
export function readOfferCount(storage: SessionStore | null | undefined, promoId: string): number {
  try {
    const raw = storage?.getItem(engagementStorageKey(promoId))
    const value = raw === null || raw === undefined ? 0 : Number(raw)
    return Number.isSafeInteger(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

export function recordOffer(storage: SessionStore | null | undefined, promoId: string): number {
  const next = readOfferCount(storage, promoId) + 1
  try { storage?.setItem(engagementStorageKey(promoId), String(next)) } catch { /* memory only */ }
  return next
}

export function isOfferCapped(storage: SessionStore | null | undefined, promoId: string, max: number): boolean {
  return readOfferCount(storage, promoId) >= Math.max(0, max)
}

export interface EngagementTriggerOptions {
  promoId: string
  roundsBeforeOffer: number
  delayMs: number
  max: number
  storage: SessionStore | null | undefined
  /** Called when the offer should open. */
  open: () => void
  /** Called when a round starts while the offer is open. */
  close: () => void
  schedule?: (fn: () => void, ms: number) => number
  cancel?: (id: number) => void
}

/**
 * Feed `observe(roundActive)` on every render. The offer opens `delayMs` after
 * the N-th completed round only if no new round started in the meantime, is
 * recorded before opening so a reload never repeats it, and never opens
 * twice in one session.
 */
export function createEngagementTrigger(options: EngagementTriggerOptions) {
  const schedule = options.schedule ?? ((fn, ms) => setTimeout(fn, ms) as unknown as number)
  const cancel = options.cancel ?? ((id) => clearTimeout(id))
  let previousActive = false
  let completed = 0
  let opened = false
  let pending: number | null = null
  let active = false
  const clear = () => { if (pending !== null) { cancel(pending); pending = null } }
  return {
    get completedRounds() { return completed },
    get isOpen() { return opened },
    observe(roundActive: boolean) {
      active = roundActive
      if (roundActive) {
        clear()
        if (opened) { opened = false; options.close() }
      } else if (previousActive) {
        completed += 1
        if (completed >= options.roundsBeforeOffer && pending === null && !opened &&
          !isOfferCapped(options.storage, options.promoId, options.max)) {
          pending = schedule(() => {
            pending = null
            if (active || opened || isOfferCapped(options.storage, options.promoId, options.max)) return
            recordOffer(options.storage, options.promoId)
            opened = true
            options.open()
          }, options.delayMs)
        }
      }
      previousActive = roundActive
    },
    dismiss() { clear(); opened = false },
    dispose() { clear() },
  }
}
