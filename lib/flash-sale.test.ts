import { describe, it, expect } from 'vitest'
import { applyDiscount, bestDiscountForProduct, type ActiveFlashSale } from './flash-sale'

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

describe('bestDiscountForProduct', () => {
  it('applies a storewide sale to every product', () => {
    const sales: ActiveFlashSale[] = [
      { discount_percentage: 15, apply_to: 'all', category_name: null, product_ids: [] },
    ]
    expect(bestDiscountForProduct({ id: 'p1', category: 'مكياج' }, sales)).toBe(15)
  })

  it('only applies a category sale to matching-category products', () => {
    const sales: ActiveFlashSale[] = [
      { discount_percentage: 20, apply_to: 'category', category_name: 'مكياج', product_ids: [] },
    ]
    expect(bestDiscountForProduct({ id: 'p1', category: 'مكياج' }, sales)).toBe(20)
    expect(bestDiscountForProduct({ id: 'p2', category: 'عناية بالبشرة' }, sales)).toBe(0)
  })

  it('only applies a product-scoped sale to listed product ids', () => {
    const sales: ActiveFlashSale[] = [
      { discount_percentage: 30, apply_to: 'products', category_name: null, product_ids: ['p1'] },
    ]
    expect(bestDiscountForProduct({ id: 'p1' }, sales)).toBe(30)
    expect(bestDiscountForProduct({ id: 'p2' }, sales)).toBe(0)
  })

  it('picks the highest discount when multiple sales apply', () => {
    const sales: ActiveFlashSale[] = [
      { discount_percentage: 10, apply_to: 'all', category_name: null, product_ids: [] },
      { discount_percentage: 25, apply_to: 'products', category_name: null, product_ids: ['p1'] },
    ]
    expect(bestDiscountForProduct({ id: 'p1' }, sales)).toBe(25)
  })
})
