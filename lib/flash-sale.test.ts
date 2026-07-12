import { describe, it, expect } from 'vitest'
import { applyDiscount } from './flash-sale'

describe('applyDiscount', () => {
  it('returns null when there is no discount', () => {
    expect(applyDiscount(10, 0)).toBeNull()
  })

  it('applies a percentage discount, rounded to 3 decimals', () => {
    expect(applyDiscount(10, 20)).toBe(8)
    expect(applyDiscount(9.999, 10)).toBe(8.999)
  })

  it('applies a 100% discount down to zero', () => {
    expect(applyDiscount(10, 100)).toBe(0)
  })

  it('does not clamp a negative percentage (admin-trusted input only — not reachable from customer-facing code)', () => {
    expect(applyDiscount(10, -10)).toBe(11)
  })
})
