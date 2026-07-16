import { describe, expect, it } from 'vitest'
import { buildReorderCart, getOrderItemImage, getOrderItemQuantityTotal, ORDER_ITEM_IMAGE_FALLBACK } from './order-presentation'

describe('order presentation helpers', () => {
  it('falls back when a historical snapshot image is missing', () => {
    expect(getOrderItemImage(null)).toBe(ORDER_ITEM_IMAGE_FALLBACK)
    expect(getOrderItemImage('')).toBe(ORDER_ITEM_IMAGE_FALLBACK)
    expect(getOrderItemImage('/snap.jpg', '/current.jpg')).toBe('/snap.jpg')
    expect(getOrderItemImage(null, '/current.jpg')).toBe('/current.jpg')
  })

  it('counts total quantities, not order item rows', () => {
    expect(getOrderItemQuantityTotal([{ quantity: 2 }, { quantity: 3 }, { quantity: 0 }])).toBe(5)
  })

  it('builds reorder cart from current products and current prices', () => {
    const result = buildReorderCart(
      [{ product_id: 'p1', product_name_ar: 'قديم', quantity: 2 }],
      [{ id: 'p1', name_ar: 'حالي', name_en: 'Current', slug: 'current', price: 4.5, images: ['/now.jpg'], stock_quantity: 9, is_active: true }]
    )
    expect(result.added).toEqual([{ id: 'p1', name_ar: 'حالي', name_en: 'Current', slug: 'current', price: 4.5, image: '/now.jpg', quantity: 2 }])
    expect(result.skipped).toEqual([])
  })

  it('collapses duplicate historical products and caps quantity by current stock', () => {
    const result = buildReorderCart(
      [{ product_id: 'p1', product_name_ar: 'منتج', quantity: 2 }, { product_id: 'p1', product_name_ar: 'منتج', quantity: 3 }],
      [{ id: 'p1', name_ar: 'منتج', name_en: 'Product', slug: 'product', price: 1, images: [], stock_quantity: 4, is_active: true }]
    )
    expect(result.added[0].quantity).toBe(4)
    expect(result.skipped[0].reason).toContain('تمت إضافة 4 فقط')
  })

  it('skips deleted, inactive, out-of-stock, and unidentified historical products', () => {
    expect(buildReorderCart([{ product_id: null, product_name_ar: 'مجهول', quantity: 1 }], []).skipped[0].reason).toContain('لا يمكن ربط')

    const result = buildReorderCart(
      [
        { product_id: 'deleted', product_name_ar: 'محذوف', quantity: 1 },
        { product_id: 'inactive', product_name_ar: 'غير نشط', quantity: 1 },
        { product_id: 'empty', product_name_ar: 'نفد', quantity: 1 },
      ],
      [
        { id: 'inactive', name_ar: 'غير نشط', name_en: 'Inactive', slug: 'inactive', price: 1, stock_quantity: 5, is_active: false },
        { id: 'empty', name_ar: 'نفد', name_en: 'Empty', slug: 'empty', price: 1, stock_quantity: 0, is_active: true },
      ]
    )
    expect(result.added).toEqual([])
    expect(result.skipped.map((item) => item.reason)).toEqual(['المنتج لم يعد متوفراً', 'المنتج غير نشط حالياً', 'المنتج غير متوفر بالمخزون'])
  })
})
