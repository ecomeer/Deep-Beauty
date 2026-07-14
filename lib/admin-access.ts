import type { Permission } from './admin-permissions'

export type AdminIdentity = {
  role?: string | null
  isActive?: boolean
  permissions?: readonly string[] | null
  hasAdminMetadata?: boolean
  isEmailAllowListed?: boolean
}

export type AdminAccess = 'admin' | 'staff' | 'forbidden' | 'unauthenticated'

/** Shared authorization decision used by the proxy and API guards. */
export function resolveAdminAccess(
  identity: AdminIdentity | null,
  permission?: Permission | 'staff'
): AdminAccess {
  if (!identity) return 'unauthenticated'
  if (identity.isActive === false) return 'forbidden'

  const isFullAdmin = identity.role === 'admin' || identity.hasAdminMetadata === true || identity.isEmailAllowListed === true
  if (isFullAdmin) return 'admin'
  if (identity.role !== 'staff' || !permission || permission === 'staff') return 'forbidden'

  return identity.permissions?.includes(permission) ? 'staff' : 'forbidden'
}
