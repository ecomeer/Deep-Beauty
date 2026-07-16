export interface CustomerProfileUpdate {
  name?: string
  phone?: string
  default_address?: Record<string, unknown> | null
}

export interface AdminCustomerUpdate {
  name?: string
  phone?: string
  is_active?: boolean
}

/**
 * Normalizes the only profile fields a customer may edit.
 * Privileged, identity, and loyalty fields are intentionally ignored.
 */
export function normalizeCustomerProfileUpdate(input: unknown): CustomerProfileUpdate {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('NO_PROFILE_FIELDS')
  }

  const body = input as Record<string, unknown>
  const updates: CustomerProfileUpdate = {}
  const rawName = typeof body.name === 'string'
    ? body.name
    : typeof body.full_name === 'string'
      ? body.full_name
      : undefined

  if (rawName !== undefined) {
    const name = rawName.trim()
    if (name) updates.name = name
  }

  if (typeof body.phone === 'string') {
    const phone = body.phone.trim()
    if (phone) updates.phone = phone
  }

  if (body.default_address === null) {
    updates.default_address = null
  } else if (
    body.default_address &&
    typeof body.default_address === 'object' &&
    !Array.isArray(body.default_address)
  ) {
    updates.default_address = body.default_address as Record<string, unknown>
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('NO_PROFILE_FIELDS')
  }

  return updates
}

/**
 * Customer-management staff may edit contact and activation fields only.
 * Role, permissions, identity, and loyalty balances stay server-managed.
 */
export function normalizeAdminCustomerUpdate(input: unknown): AdminCustomerUpdate {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('NO_CUSTOMER_FIELDS')
  }

  const body = input as Record<string, unknown>
  const updates: AdminCustomerUpdate = {}
  const rawName = typeof body.name === 'string'
    ? body.name
    : typeof body.full_name === 'string'
      ? body.full_name
      : undefined

  if (rawName !== undefined) {
    const name = rawName.trim()
    if (name) updates.name = name
  }

  if (typeof body.phone === 'string') {
    const phone = body.phone.trim()
    if (phone) updates.phone = phone
  }

  if (typeof body.is_active === 'boolean') {
    updates.is_active = body.is_active
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('NO_CUSTOMER_FIELDS')
  }

  return updates
}
