import { describe, expect, it } from 'vitest'
import { normalizeCustomerProfileUpdate } from './profile-updates'

describe('normalizeCustomerProfileUpdate', () => {
  it('allows only customer-editable name and phone fields', () => {
    expect(normalizeCustomerProfileUpdate({ name: '  فاطمة  ', phone: ' 96550000000 ' })).toEqual({
      name: 'فاطمة',
      phone: '96550000000',
    })
  })

  it('drops privileged and identity fields supplied by the browser', () => {
    expect(normalizeCustomerProfileUpdate({
      name: 'Customer',
      role: 'admin',
      permissions: ['orders', 'staff'],
      is_active: false,
      loyalty_points: 999999,
      email: 'attacker@example.com',
      id: 'another-user',
    })).toEqual({ name: 'Customer' })
  })

  it('rejects empty updates after normalization', () => {
    expect(() => normalizeCustomerProfileUpdate({ role: 'admin' })).toThrow('NO_PROFILE_FIELDS')
  })
})
