export const DEMO_STORAGE_KEY = 'playliva.originals.session'
export const DEMO_SCHEMA_VERSION = 1
export const INITIAL_CREDITS = 10_000
export const MAX_CREDITS = 1_000_000_000
export const HISTORY_LIMIT = 50

export interface GameSettings { sound: boolean; haptics: boolean }
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
}
export type TransactionContext = Pick<DemoTransaction, 'gameId' | 'roundId'>
export type WalletResult = { ok: true } | {
  ok: false
  reason: 'invalid-amount' | 'insufficient-credits' | 'balance-limit' | 'invalid-context' | 'history-limit'
}
export type StorageStatus = 'loading' | 'persistent' | 'memory-only' | 'recovered'
export interface DemoSnapshot { session: DemoSession; storageStatus: StorageStatus }
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'> | null

export function initialSession(): DemoSession {
  return { version: DEMO_SCHEMA_VERSION, balance: INITIAL_CREDITS, sequence: 0,
    settings: { sound: false, haptics: false }, transactions: [] }
}

const integer = (value: unknown, max = MAX_CREDITS): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max
export const isDemoIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value)
const validContext = (context: TransactionContext) =>
  context !== null && typeof context === 'object' &&
  (context.gameId === undefined || isDemoIdentifier(context.gameId)) &&
  (context.roundId === undefined || isDemoIdentifier(context.roundId))

/** Rebuild only known fields. Unsupported schemas are reset, never guessed/migrated. */
export function decodeSession(raw: string | null): DemoSession | null {
  if (!raw || raw.length > 32_768) return null
  try {
    const value = JSON.parse(raw)
    if (value?.version !== DEMO_SCHEMA_VERSION || !integer(value.balance) ||
      !integer(value.sequence, Number.MAX_SAFE_INTEGER) ||
      typeof value.settings?.sound !== 'boolean' || typeof value.settings?.haptics !== 'boolean' ||
      !Array.isArray(value.transactions) || value.transactions.length !== Math.min(value.sequence, HISTORY_LIMIT)) return null
    const transactions: DemoTransaction[] = []
    for (const item of value.transactions) {
      if (!item || !['debit', 'credit', 'reset'].includes(item.kind) ||
        !integer(item.amount) || !integer(item.balance) || !integer(item.at, Number.MAX_SAFE_INTEGER) ||
        !integer(item.sequence, Number.MAX_SAFE_INTEGER) || item.sequence < 1 || !validContext(item) ||
        (item.kind !== 'reset' && item.amount === 0) ||
        (item.kind === 'reset' && (item.balance !== INITIAL_CREDITS || item.amount !== INITIAL_CREDITS))) return null
      const previous = transactions.at(-1) ?? (item.sequence === 1 ? { balance: INITIAL_CREDITS, sequence: 0 } : undefined)
      if (previous && (item.sequence !== previous.sequence + 1 ||
        (item.kind === 'debit' && item.balance !== previous.balance - item.amount) ||
        (item.kind === 'credit' && item.balance !== previous.balance + item.amount))) return null
      transactions.push({ sequence: item.sequence, kind: item.kind, amount: item.amount,
        balance: item.balance, at: item.at,
        ...(item.gameId === undefined ? {} : { gameId: item.gameId }),
        ...(item.roundId === undefined ? {} : { roundId: item.roundId }) })
    }
    const last = transactions.at(-1)
    if (last ? last.sequence !== value.sequence || last.balance !== value.balance
      : value.sequence !== 0 || value.balance !== INITIAL_CREDITS) return null
    return { version: DEMO_SCHEMA_VERSION, balance: value.balance, sequence: value.sequence,
      settings: { sound: value.settings.sound, haptics: value.settings.haptics }, transactions }
  } catch { return null }
}

function freeze(snapshot: DemoSnapshot): DemoSnapshot {
  snapshot.session.transactions.forEach(Object.freeze)
  Object.freeze(snapshot.session.transactions)
  Object.freeze(snapshot.session.settings)
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
  function transact(kind: DemoTransaction['kind'], amount: number, context: TransactionContext = {}): WalletResult {
    hydrate()
    if (!integer(amount) || amount === 0) return { ok: false, reason: 'invalid-amount' }
    if (!validContext(context)) return { ok: false, reason: 'invalid-context' }
    const state = snapshot.session
    if (kind === 'debit' && amount > state.balance) return { ok: false, reason: 'insufficient-credits' }
    const balance = kind === 'reset' ? INITIAL_CREDITS : state.balance + (kind === 'debit' ? -amount : amount)
    if (!integer(balance)) return { ok: false, reason: 'balance-limit' }
    if (state.sequence === Number.MAX_SAFE_INTEGER) return { ok: false, reason: 'history-limit' }
    const sequence = state.sequence + 1
    const transaction: DemoTransaction = { sequence, kind, amount, balance,
      at: Math.max(0, Math.trunc(now())),
      ...(context.gameId === undefined ? {} : { gameId: context.gameId }),
      ...(context.roundId === undefined ? {} : { roundId: context.roundId }) }
    save({ ...state, balance, sequence,
      transactions: [...state.transactions, transaction].slice(-HISTORY_LIMIT) })
    return { ok: true }
  }
  return {
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
    reset: () => transact('reset', INITIAL_CREDITS),
    setSettings(settings: GameSettings): boolean {
      hydrate()
      if (typeof settings?.sound !== 'boolean' || typeof settings?.haptics !== 'boolean') return false
      save({ ...snapshot.session, settings: { sound: settings.sound, haptics: settings.haptics } })
      return true
    },
  }
}
export type DemoSessionStore = ReturnType<typeof createDemoSessionStore>
