import { describe, expect, it } from 'vitest'
import { resolveCheckoutUserId } from './checkout-identity'

describe('resolveCheckoutUserId', () => {
  it('uses the authenticated session identity', () => {
    expect(resolveCheckoutUserId('session-user')).toBe('session-user')
  })

  it('returns null for guest checkout', () => {
    expect(resolveCheckoutUserId(null)).toBeNull()
  })

  it('never accepts a browser-supplied identity', () => {
    const browserSuppliedUserId = 'victim-user'
    expect(resolveCheckoutUserId(null, browserSuppliedUserId)).toBeNull()
    expect(resolveCheckoutUserId('session-user', browserSuppliedUserId)).toBe('session-user')
  })
})
