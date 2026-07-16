import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const requireUser = vi.fn()
const maybeSingle = vi.fn()
const productIn = vi.fn()

vi.mock('@/lib/supabase-server', () => ({ requireUser }))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'orders') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ or: vi.fn(() => ({ maybeSingle })) })) })) }
      }
      if (table === 'products') {
        return { select: vi.fn(() => ({ in: productIn })) }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
  },
}))

async function loadGET() {
  return (await import('./route')).GET
}

const params = { params: Promise.resolve({ id: 'order-1' }) }

describe('customer account order detail API', () => {
  beforeEach(() => {
    vi.resetModules()
    requireUser.mockReset()
    maybeSingle.mockReset()
    productIn.mockReset()
  })

  it('rejects anonymous users before querying order data', async () => {
    const authResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    requireUser.mockResolvedValue({ error: authResponse })
    const GET = await loadGET()

    const res = await GET(new Request('http://test.local/api/account/orders/order-1') as never, params)

    expect(res.status).toBe(401)
    expect(maybeSingle).not.toHaveBeenCalled()
  })

  it('returns 404 when another customer owns the order', async () => {
    requireUser.mockResolvedValue({ user: { id: 'customer-a', email: 'a@example.test' } })
    maybeSingle.mockResolvedValue({ data: null, error: null })
    const GET = await loadGET()

    const res = await GET(new Request('http://test.local/api/account/orders/order-1') as never, params)

    expect(res.status).toBe(404)
  })

  it('returns only the authenticated customer order with quantity totals and image fallback order', async () => {
    requireUser.mockResolvedValue({ user: { id: 'customer-a', email: 'a@example.test' } })
    maybeSingle.mockResolvedValue({
      error: null,
      data: {
        id: 'order-1',
        order_number: 'DB-1',
        order_items: [
          { id: 'i1', product_id: 'p1', quantity: 2, total_price: 10, product_image_url: '/snapshot.jpg' },
          { id: 'i2', product_id: 'p2', quantity: 3, total_price: 12, product_image_url: null },
          { id: 'i3', product_id: null, quantity: 4, total_price: 8, product_image_url: null },
        ],
        order_tracking: [
          { id: 'hidden', created_at: '2026-07-16T10:00:00Z', is_customer_visible: false },
          { id: 'later', created_at: '2026-07-16T12:00:00Z', is_customer_visible: true },
          { id: 'earlier', created_at: '2026-07-16T11:00:00Z', is_customer_visible: true },
        ],
      },
    })
    productIn.mockResolvedValue({ data: [{ id: 'p2', images: ['/current.jpg'] }], error: null })
    const GET = await loadGET()

    const res = await GET(new Request('http://test.local/api/account/orders/order-1') as never, params)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.order.item_count).toBe(9)
    expect(json.order.items.map((item: { image: string }) => item.image)).toEqual(['/snapshot.jpg', '/current.jpg', '/images/product-placeholder.svg'])
    expect(json.order.tracking.map((event: { id: string }) => event.id)).toEqual(['earlier', 'later'])
  })
})
