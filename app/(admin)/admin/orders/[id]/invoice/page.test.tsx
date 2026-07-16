import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'

const requireAdmin = vi.fn()
const maybeSingle = vi.fn()
const productIn = vi.fn()
const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })

vi.mock('next/navigation', () => ({ notFound }))
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ getAll: () => [{ name: 'sb', value: 'token' }] })) }))
vi.mock('@/lib/auth-admin', () => ({ requireAdmin }))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      if (table === 'orders') return { select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })) }
      if (table === 'products') return { select: vi.fn(() => ({ in: productIn })) }
      throw new Error(`Unexpected table ${table}`)
    }),
  },
}))

async function renderInvoice() {
  const Page = (await import('./page')).default
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'order-1' }) }))
}

describe('admin invoice authorization and rendering', () => {
  beforeEach(() => {
    vi.resetModules()
    requireAdmin.mockReset()
    maybeSingle.mockReset()
    productIn.mockReset()
    notFound.mockClear()
  })

  it('requires the orders permission', async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
    await expect(renderInvoice()).rejects.toThrow('NEXT_NOT_FOUND')
    expect(requireAdmin).toHaveBeenCalledWith(expect.any(Request), 'orders')
  })

  it('renders totals, Kuwait timestamps, safe reference, and no sensitive payment values for permitted admins', async () => {
    requireAdmin.mockResolvedValue(null)
    maybeSingle.mockResolvedValue({ data: {
      id: 'order-1', order_number: 'DB-20260716-0001', customer_name: 'Customer A', customer_phone: '50000000', customer_email: 'a@example.test',
      address_area: 'السالمية', address_block: '1', address_street: '2', address_house: '3',
      subtotal: 10, shipping_cost: 1, coupon_discount: 2, coupon_code: 'SAVE', total: 9,
      status: 'confirmed', payment_method: 'card', payment_status: 'paid', created_at: '2026-07-15T21:30:00.000Z', paid_at: '2026-07-15T21:35:00.000Z', confirmed_at: '2026-07-15T22:00:00.000Z', processing_at: null, shipped_at: null, delivered_at: null, cancelled_at: null, refunded_at: null,
      order_items: [{ id: 'i1', product_id: 'p1', product_name_ar: 'سيروم', quantity: 2, unit_price: 5, total_price: 10, product_image_url: null }],
    } })
    productIn.mockResolvedValue({ data: [{ id: 'p1', images: ['/current.jpg'] }] })

    const html = await renderInvoice()

    expect(html).toContain('DB-20260716-0001')
    expect(html).toContain('٩.٠٠٠ د.ك')
    expect(html).toContain('/current.jpg')
    expect(html).toContain('توقيت الكويت')
    expect(html).toContain('Safe reference')
    expect(html).not.toMatch(/payment_id|secret|token/i)
  })
})
