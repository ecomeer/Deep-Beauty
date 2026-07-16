/**
 * Checkout ownership must come from the verified Supabase session.
 * The second argument is accepted only to make the rejected browser value
 * explicit at call sites and in regression tests; it is never trusted.
 */
export function resolveCheckoutUserId(
  authenticatedUserId: string | null | undefined,
  _browserSuppliedUserId?: unknown
): string | null {
  if (typeof authenticatedUserId !== 'string') return null
  const value = authenticatedUserId.trim()
  return value || null
}
