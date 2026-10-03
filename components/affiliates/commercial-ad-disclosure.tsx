'use client'

import { useCountry } from '@/components/country-context'
import { ResponsibleNotice } from '@/components/notices'

/** Only configured, server-validated commercial statements may name legal status. */
export function CommercialAdDisclosure({ operatorId }: { operatorId: string }) {
  const { commercial, marketCode } = useCountry()
  const operator = commercial.operators.find(item => item.id === operatorId && item.countries.includes(marketCode!))
  if (!operator || commercial.geo !== marketCode) return null
  const legal = operator.commercialLegal
  return <div className="col-span-full mt-1 min-w-0 w-full basis-full space-y-1 break-words text-xs text-muted-foreground" data-commercial-disclosure="" data-geo={marketCode}>
    <ResponsibleNotice />
    {legal?.status === 'verified' && legal.statement && <p>{legal.statement}</p>}
    {legal?.responsibleGambling && <p>{legal.responsibleGambling}</p>}
    {legal?.disclosure && <p>{legal.disclosure}</p>}
  </div>
}
