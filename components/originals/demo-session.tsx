'use client'

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createDemoSessionStore, type DemoSessionStore } from '@/lib/originals/session'

const Context = createContext<DemoSessionStore | null>(null)

/** Mount once around the future localized play layout; never in the site root. */
export function DemoSessionProvider({ children, store: suppliedStore }: {
  children: ReactNode
  store?: DemoSessionStore
}) {
  const [store] = useState(() => suppliedStore ?? createDemoSessionStore())
  return <Context.Provider value={store}>{children}</Context.Provider>
}

export function useDemoSession() {
  const store = useContext(Context)
  if (!store) throw new Error('A DemoSessionProvider is required for Originals')
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  return { ...snapshot, wallet: store }
}
