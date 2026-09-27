import { requireOwner } from '@/lib/owner/server/gate'
import { OwnerShell } from '@/components/owner/shell'
export default async function GrowthLayout({ children }: { children: React.ReactNode }) { await requireOwner(); return <OwnerShell>{children}</OwnerShell> }
