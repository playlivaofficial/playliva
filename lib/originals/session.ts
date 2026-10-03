import { CREDIT_SCALE, INITIAL_CREDIT_UNITS, MAX_CREDIT_UNITS } from './credits'
export const DEMO_STORAGE_KEY = 'playliva.originals.session'
export const DEMO_SCHEMA_VERSION = 2
// API method/field names remain stable; all amounts in v2 are integer hundredths.
export { INITIAL_CREDIT_UNITS, MAX_CREDIT_UNITS } from './credits'
export const HISTORY_LIMIT = 50

export interface GameSettings { sound: boolean; haptics: boolean; music?: boolean; sfx?: boolean; turbo?: boolean }
export const audioPreferences = (settings: GameSettings) => ({ music: settings.music ?? settings.sound, sfx: settings.sfx ?? settings.sound })
const validPreferences = (settings: GameSettings) => ['music', 'sfx', 'turbo'].every(key => settings[key as keyof GameSettings] === undefined || typeof settings[key as keyof GameSettings] === 'boolean')
function cleanSettings(settings: GameSettings): GameSettings {
  return { sound: settings.sound, haptics: settings.haptics,
    ...(settings.music === undefined ? {} : { music: settings.music }),
    ...(settings.sfx === undefined ? {} : { sfx: settings.sfx }),
    ...(settings.turbo === undefined ? {} : { turbo: settings.turbo }) }
}
export interface DemoTransaction {
  sequence: number
  kind: 'debit' | 'credit' | 'reset'
  amount: number
  balance: number
  at: number
  gameId?: string
  roundId?: string
}
export interface DemoSession {
  version: typeof DEMO_SCHEMA_VERSION
  balance: number
  sequence: number
  settings: GameSettings
  transactions: DemoTransaction[]
  /** Server receipt cursor, persisted atomically with its credit/debit. No authentication material. */
  aviaReceipt?: { guestId: string; sequence: number }
  aviaReceipts?: Record<string, number>
}
export type TransactionContext = Pick<DemoTransaction, 'gameId' | 'roundId'>
export type WalletResult = { ok: true } | {
  ok: false
  reason: 'invalid-amount' | 'insufficient-credits' | 'balance-limit' | 'invalid-context' | 'history-limit' | 'round-active'
}
export type StorageStatus = 'loading' | 'persistent' | 'memory-only' | 'recovered'
export interface DemoSnapshot { session: DemoSession; storageStatus: StorageStatus }
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'> | null

export function initialSession(): DemoSession {
  return { version: DEMO_SCHEMA_VERSION, balance: INITIAL_CREDIT_UNITS, sequence: 0,
    settings: { sound: false, haptics: false }, transactions: [] }
}

const integer = (value: unknown, max = MAX_CREDIT_UNITS): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max
export const isDemoIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value)
const validContext = (context: TransactionContext) =>
  context !== null && typeof context === 'object' &&
  (context.gameId === undefined || isDemoIdentifier(context.gameId)) &&
  (context.roundId === undefined || isDemoIdentifier(context.roundId))

/** Validate the complete original ledger BEFORE converting v1 whole credits.
 * Only this known migration is supported; v2 never receives another scale-up. */
export function decodeSession(raw: string | null): DemoSession | null {
  if (!raw || raw.length > 32_768) return null
  try {
    const value = JSON.parse(raw)
    const scale = value?.version === 1 ? CREDIT_SCALE : 1
    const maximum = MAX_CREDIT_UNITS / scale, initial = INITIAL_CREDIT_UNITS / scale
    if (![1, DEMO_SCHEMA_VERSION].includes(value?.version) || !integer(value.balance, maximum) ||
      !integer(value.sequence, Number.MAX_SAFE_INTEGER) ||
      typeof value.settings?.sound !== 'boolean' || typeof value.settings?.haptics !== 'boolean' || !validPreferences(value.settings) ||
      !Array.isArray(value.transactions) || value.transactions.length !== Math.min(value.sequence, HISTORY_LIMIT)) return null
    const transactions: DemoTransaction[] = []
    for (const item of value.transactions) {
      if (!item || !['debit', 'credit', 'reset'].includes(item.kind) ||
        !integer(item.amount, maximum) || !integer(item.balance, maximum) || !integer(item.at, Number.MAX_SAFE_INTEGER) ||
        !integer(item.sequence, Number.MAX_SAFE_INTEGER) || item.sequence < 1 || !validContext(item) ||
        (item.kind !== 'reset' && item.amount === 0) ||
        (item.kind === 'reset' && (item.balance !== initial || item.amount !== initial))) return null
      const previous = transactions.at(-1) ?? (item.sequence === 1 ? { balance: initial, sequence: 0 } : undefined)
      if (previous && (item.sequence !== previous.sequence + 1 ||
        (item.kind === 'debit' && item.balance !== previous.balance - item.amount) ||
        (item.kind === 'credit' && item.balance !== previous.balance + item.amount))) return null
      transactions.push({ sequence: item.sequence, kind: item.kind, amount: item.amount,
        balance: item.balance, at: item.at,
        ...(item.gameId === undefined ? {} : { gameId: item.gameId }),
        ...(item.roundId === undefined ? {} : { roundId: item.roundId }) })
    }
    const last = transactions.at(-1)
    if (value.aviaReceipt !== undefined && (!/^[a-f0-9]{64}$/.test(value.aviaReceipt?.guestId) || !integer(value.aviaReceipt?.sequence, Number.MAX_SAFE_INTEGER))) return null
    if (value.aviaReceipts !== undefined && (!value.aviaReceipts || typeof value.aviaReceipts !== 'object' || Array.isArray(value.aviaReceipts) || Object.keys(value.aviaReceipts).length > 64 || !Object.entries(value.aviaReceipts).every(([id, sequence]) => /^[a-f0-9]{64}$/.test(id) && integer(sequence, Number.MAX_SAFE_INTEGER)))) return null
    if (last ? last.sequence !== value.sequence || last.balance !== value.balance
      : value.sequence !== 0 || value.balance !== initial) return null
    return { version: DEMO_SCHEMA_VERSION, balance: value.balance * scale, sequence: value.sequence,
      settings: cleanSettings(value.settings),
      transactions: transactions.map(item => ({ ...item, amount: item.amount * scale, balance: item.balance * scale })),
      ...(value.aviaReceipt === undefined ? {} : { aviaReceipt: { guestId: value.aviaReceipt.guestId, sequence: value.aviaReceipt.sequence } }),
      ...(value.aviaReceipts === undefined ? {} : { aviaReceipts: { ...value.aviaReceipts } }) }
  } catch { return null }
}

function freeze(snapshot: DemoSnapshot): DemoSnapshot {
  snapshot.session.transactions.forEach(Object.freeze)
  Object.freeze(snapshot.session.transactions)
  Object.freeze(snapshot.session.settings)
  if (snapshot.session.aviaReceipt) Object.freeze(snapshot.session.aviaReceipt)
  if (snapshot.session.aviaReceipts) Object.freeze(snapshot.session.aviaReceipts)
  Object.freeze(snapshot.session)
  return Object.freeze(snapshot)
}

/** One guest wallet per mounted play platform; no storage/network access until hydration. */
export function createDemoSessionStore(
  storage: StorageAccess = () => typeof window === 'undefined' ? null : window.localStorage,
  now: () => number = Date.now,
) {
  const serverSnapshot = freeze({ session: initialSession(), storageStatus: 'loading' })
  let snapshot = serverSnapshot
  let hydrated = false
  let persistedRaw: string | null = null
  let detached = false
  // Transient only: interrupted rounds are never restored or refunded.
  let activeRound: string | null = null
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach(listener => listener())
  function hydrate() {
    if (hydrated) return
    hydrated = true
    let session = initialSession()
    let storageStatus: StorageStatus = 'memory-only'
    try {
      const target = storage()
      if (target) {
        const raw = target.getItem(DEMO_STORAGE_KEY)
        const decoded = decodeSession(raw)
        session = decoded ?? session
        storageStatus = raw !== null && !decoded ? 'recovered' : 'persistent'
        persistedRaw = JSON.stringify(session)
        target.setItem(DEMO_STORAGE_KEY, persistedRaw)
      }
    } catch { storageStatus = 'memory-only' }
    snapshot = freeze({ session, storageStatus })
    notify()
  }
  function save(session: DemoSession) {
    let storageStatus = snapshot.storageStatus
    try {
      const target = storage()
      if (!target || detached) storageStatus = 'memory-only'
      // Avoid overwriting a detected change from another tab. Continue locally until reload.
      else if (target.getItem(DEMO_STORAGE_KEY) !== persistedRaw) {
        detached = true
        storageStatus = 'memory-only'
      }
      else {
        const raw = JSON.stringify(session)
        target.setItem(DEMO_STORAGE_KEY, raw)
        persistedRaw = raw
        storageStatus = 'persistent'
      }
    } catch { storageStatus = 'memory-only' }
    snapshot = freeze({ session, storageStatus })
    notify()
  }
  function transact(kind: DemoTransaction['kind'], amount: number, context: TransactionContext = {}, aviaReceipt?: DemoSession['aviaReceipt']): WalletResult {
    hydrate()
    if (activeRound && (kind === 'reset' || context?.roundId !== activeRound)) return { ok: false, reason: 'round-active' }
    if (!integer(amount) || amount === 0) return { ok: false, reason: 'invalid-amount' }
    if (!validContext(context)) return { ok: false, reason: 'invalid-context' }
    const state = snapshot.session
    if (kind === 'debit' && amount > state.balance) return { ok: false, reason: 'insufficient-credits' }
    const balance = kind === 'reset' ? INITIAL_CREDIT_UNITS : state.balance + (kind === 'debit' ? -amount : amount)
    if (!integer(balance)) return { ok: false, reason: 'balance-limit' }
    if (state.sequence === Number.MAX_SAFE_INTEGER) return { ok: false, reason: 'history-limit' }
    const sequence = state.sequence + 1
    const transaction: DemoTransaction = { sequence, kind, amount, balance,
      at: Math.max(0, Math.trunc(now())),
      ...(context.gameId === undefined ? {} : { gameId: context.gameId }),
      ...(context.roundId === undefined ? {} : { roundId: context.roundId }) }
    save({ ...state, balance, sequence, ...(aviaReceipt ? { aviaReceipt, aviaReceipts: { ...state.aviaReceipts, ...(state.aviaReceipt ? { [state.aviaReceipt.guestId]: state.aviaReceipt.sequence } : {}), [aviaReceipt.guestId]: aviaReceipt.sequence } } : {}),
      transactions: [...state.transactions, transaction].slice(-HISTORY_LIMIT) })
    return { ok: true }
  }
  return {
    /** Caller serializes across tabs with Web Locks. The server alone decides the outcome;
     * this method mirrors its receipt into the existing, deliberately local demo wallet. */
    applyAviaReceipt(guestId: string, receipt: { sequence: number; kind: 'debit' | 'credit'; amount: number; roundId: string }): WalletResult {
      hydrate()
      if (!/^[a-f0-9]{64}$/.test(guestId) || !Number.isSafeInteger(receipt.sequence) || receipt.sequence < 1 || !['debit', 'credit'].includes(receipt.kind)) return { ok: false, reason: 'invalid-context' }
      // Reconcile another tab's latest ledger before checking the cursor.
      try {
        const raw = storage()?.getItem(DEMO_STORAGE_KEY) ?? null
        if (raw && raw !== persistedRaw) {
          const latest = decodeSession(raw)
          if (!latest) return { ok: false, reason: 'invalid-context' }
          snapshot = freeze({ session: latest, storageStatus: 'persistent' }); persistedRaw = raw; detached = false
        }
      } catch { return { ok: false, reason: 'invalid-context' } }
      const cursor = snapshot.session.aviaReceipt
      const sequence = snapshot.session.aviaReceipts?.[guestId] ?? (cursor?.guestId === guestId ? cursor.sequence : 0)
      if (receipt.sequence <= sequence) return { ok: true }
      if (!sequence && Object.keys(snapshot.session.aviaReceipts ?? {}).length >= 64) return { ok: false, reason: 'history-limit' }
      if (receipt.sequence !== sequence + 1) return { ok: false, reason: 'invalid-context' }
      return transact(receipt.kind, receipt.amount, { gameId: 'avia-de-janeiro', roundId: receipt.roundId }, { guestId, sequence: receipt.sequence })
    },
    acquireRound(roundId: string) {
      if (activeRound || !isDemoIdentifier(roundId)) return false
      activeRound = roundId
      return true
    },
    releaseRound(roundId: string) {
      if (activeRound === roundId) activeRound = null
    },
    hydrate,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      hydrate()
      return () => { listeners.delete(listener) }
    },
    debit: (amount: number, context?: TransactionContext) => transact('debit', amount, context),
    credit: (amount: number, context?: TransactionContext) => transact('credit', amount, context),
    reset: () => transact('reset', INITIAL_CREDIT_UNITS),
    setSettings(settings: GameSettings): boolean {
      hydrate()
      if (typeof settings?.sound !== 'boolean' || typeof settings?.haptics !== 'boolean' || !validPreferences(settings)) return false
      save({ ...snapshot.session, settings: cleanSettings(settings) })
      return true
    },
  }
}
export type DemoSessionStore = ReturnType<typeof createDemoSessionStore>
