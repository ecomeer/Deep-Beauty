import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const requireUser = vi.fn()
const maybeSingle = vi.fn()
const productIn = vi.fn()

vi.mock('@/lib/supabase-server', () => ({ requireUser }))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'orders') return { select: vi.fn(() => ({ eq: vi.fn(() => ({ or: vi.fn(() => ({ maybeSingle })) })) })) }
      if (table === 'products') return { select: vi.fn(() => ({ in: productIn })) }
      throw new Error(`Unexpected table ${table}`)
    }),
  },
}))

async function loadPOST() {
  return (await import('./route')).POST
}

const params = { params: Promise.resolve({ id: 'order-1' }) }

describe('customer account reorder API', () => {
  beforeEach(() => {
    vi.resetModules()
    requireUser.mockReset()
    maybeSingle.mockReset()
    productIn.mockReset()
  })

  it('rejects anonymous users', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    requireUser.mockResolvedValue({ error: authResponse })
    const POST = await loadPOST()

    const res = await POST(new Request('http://test.local/api/account/orders/order-1/reorder', { method: 'POST' }) as never, params)

    expect(res.status).toBe(401)
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it('does not reveal another customer order', async () => {
    requireUser.mockResolvedValue({ user: { id: 'customer-a', email: 'a@example.test' } })
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const POST = await loadPOST()

    const res = await POST(new Request('http://test.local/api/account/orders/order-1/reorder', { method: 'POST' }) as never, params)

    expect(res.status).toBe(404)
  })

  it('uses current product state and returns skipped reasons', async () => {
    requireUser.mockResolvedValue({ user: { id: 'customer-a', email: 'a@example.test' } })
    maybeSingle.mockResolvedValue({
      data: {
        id: 'order-1',
        order_items: [
          { product_id: 'p1', product_name_ar: 'منتج 1', quantity: 2 },
          { product_id: 'p1', product_name_ar: 'منتج 1', quantity: 3 },
          { product_id: 'inactive', product_name_ar: 'غير نشط', quantity: 1 },
          { product_id: 'deleted', product_name_ar: 'محذوف', quantity: 1 },
          { product_id: 'empty', product_name_ar: 'نفد', quantity: 1 },
        ],
      },
    })
    productIn.mockResolvedValue({ data: [
      { id: 'p1', name_ar: 'منتج 1 الحالي', name_en: 'Product', slug: 'product', price: 6.75, images: ['/p1.jpg'], stock_quantity: 4, is_active: true },
      { id: 'inactive', name_ar: 'غير نشط', name_en: 'Inactive', slug: 'inactive', price: 1, stock_quantity: 2, is_active: false },
      { id: 'empty', name_ar: 'نفد', name_en: 'Empty', slug: 'empty', price: 1, stock_quantity: 0, is_active: true },
    ] })
    const POST = await loadPOST()

    const res = await POST(new Request('http://test.local/api/account/orders/order-1/reorder', { method: 'POST' }) as never, params)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.added).toEqual([{ id: 'p1', name_ar: 'منتج 1 الحالي', name_en: 'Product', slug: 'product', price: 6.75, image: '/p1.jpg', quantity: 4 }])
    expect(json.skipped.map((item: { reason: string }) => item.reason)).toEqual([
      'تمت إضافة 4 فقط حسب المخزون الحالي',
      'المنتج غير نشط حالياً',
      'المنتج لم يعد متوفراً',
      'المنتج غير متوفر بالمخزون',
    ])
  })
})
