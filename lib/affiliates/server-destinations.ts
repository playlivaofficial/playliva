import { privateCommercialDestination } from '../commercial/server'

/** Imported only by the server redirect. Missing/invalid secrets fail closed.
 * Environment values are never returned to page props or analytics. */
export function serverDestination(reference: string): string | null {
  return privateCommercialDestination(reference)
}
