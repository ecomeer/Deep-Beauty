import { describe, expect, it } from 'vitest'
import { resolveAdminAccess, type AdminIdentity } from './admin-access'

const base: AdminIdentity = { role: 'customer', isActive: true, permissions: [] }

describe('resolveAdminAccess', () => {
  it.each([
    ['full admin', { ...base, role: 'admin' }, 'orders', 'admin'],
    ['staff with orders permission', { ...base, role: 'staff', permissions: ['orders'] }, 'orders', 'staff'],
    ['staff without orders permission', { ...base, role: 'staff', permissions: ['products'] }, 'orders', 'forbidden'],
    ['inactive staff', { ...base, role: 'staff', isActive: false, permissions: ['orders'] }, 'orders', 'forbidden'],
    ['customer', base, 'orders', 'forbidden'],
  ] as const)('%s', (_name, identity, permission, expected) => {
    expect(resolveAdminAccess(identity, permission)).toBe(expected)
  })

  it('rejects anonymous visitors', () => {
    expect(resolveAdminAccess(null, 'orders')).toBe('unauthenticated')
  })

  it('does not let a staff member treat missing permission as full access', () => {
    expect(resolveAdminAccess({ ...base, role: 'staff', permissions: [] })).toBe('forbidden')
  })
})
