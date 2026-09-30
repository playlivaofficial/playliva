import { timingSafeEqual } from 'node:crypto'
import { ingestSearch } from '@/lib/owner/server/search-ingestion'
import { evaluateAutopilot } from '@/lib/owner/server/search-autopilot'
import { refreshSearchTitles } from '@/lib/owner/server/search-metadata'
import { PRIVATE_HEADERS } from '@/lib/owner/private-headers'
import { ensureSearchSchema } from '@/lib/owner/server/search-store'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=300
export async function GET(request:Request) {
  const expected=process.env.CRON_SECRET, received=request.headers.get('authorization')??''
  const value=expected?`Bearer ${expected}`:''
  if(process.env.VERCEL_ENV!=='production' || !expected || expected.length<32 || Buffer.byteLength(received)!==Buffer.byteLength(value) || !timingSafeEqual(Buffer.from(received),Buffer.from(value))) return Response.json({error:'Unauthorized'},{status:401,headers:PRIVATE_HEADERS})
  try {
    await ensureSearchSchema()
    const sync=await ingestSearch()
    if(sync.skipped||sync.error) return Response.json(sync,{status:sync.error?503:200,headers:PRIVATE_HEADERS})
    const evaluation=await evaluateAutopilot()
    refreshSearchTitles(evaluation.changedPages)
    return Response.json({sync,evaluation},{headers:PRIVATE_HEADERS})
  } catch { return Response.json({error:'Search pipeline unavailable; existing data preserved.'},{status:503,headers:PRIVATE_HEADERS}) }
}
