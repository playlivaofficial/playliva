import { requireOwner } from '@/lib/owner/server/gate'
import { OwnerShell } from '@/components/owner/shell'
import { headers } from 'next/headers'
import { ownerGeoStatus } from '@/lib/owner/server/geo-preview'
import { OwnerGeoPreview } from '@/components/owner/geo-preview'
export default async function GrowthLayout({ children }: { children: React.ReactNode }) {
  await requireOwner()
  return <OwnerShell><OwnerGeoPreview status={await ownerGeoStatus(await headers())} />{children}</OwnerShell>
}
