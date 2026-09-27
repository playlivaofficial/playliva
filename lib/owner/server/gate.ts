import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { allowedOrigin, ownerCookie, validSession } from './auth'
import { PRIVATE_HEADERS } from '../private-headers'
export { PRIVATE_HEADERS } from '../private-headers'

export async function requireOwner() {
  if (!await validSession((await cookies()).get(ownerCookie())?.value)) redirect('/owner/login')
}
export async function apiAuthorized(request: Request, mutation = false) {
  if (mutation && !allowedOrigin(request)) return false
  return validSession((await cookies()).get(ownerCookie())?.value)
}
export function ownerJson(body: unknown, status = 200) { return Response.json(body, { status, headers: PRIVATE_HEADERS }) }
