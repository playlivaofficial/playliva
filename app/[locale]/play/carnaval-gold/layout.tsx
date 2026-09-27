import type { ReactNode } from 'react'
import { CrossDiscovery } from '@/components/discovery/related'
export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{locale:string}> }) {
  return <>{children}<CrossDiscovery slug="carnaval-gold" segment={(await params).locale} original /></>
}
