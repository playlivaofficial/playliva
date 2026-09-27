import type { ReactNode } from 'react'
import { CrossDiscovery } from '@/components/discovery/related'
export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{locale:string}> }) {
  return <>{children}<CrossDiscovery slug="blackjack" segment={(await params).locale} original /></>
}
