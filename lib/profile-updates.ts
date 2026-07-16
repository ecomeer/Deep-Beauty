export interface CustomerProfileUpdate {
  name?: string
  phone?: string
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

  if (Object.keys(updates).length === 0) {
    throw new Error('NO_PROFILE_FIELDS')
  }

  return updates
}
