import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'

const requireUser = vi.fn()
const maybeSingle = vi.fn()
const productIn = vi.fn()
const notFound = vi.fn(() => { throw new Error('NEXT_NOT_FOUND') })

vi.mock('next/navigation', () => ({ notFound }))
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

async function renderInvoice() {
  const Page = (await import('./page')).default
  return renderToStaticMarkup(await Page({ params: Promise.resolve({ id: 'order-1' }) }))
}

describe('customer invoice page authorization and rendering', () => {
  beforeEach(() => {
    vi.resetModules()
    requireUser.mockReset()
    maybeSingle.mockReset()
    productIn.mockReset()
    notFound.mockClear()
  })

  it('rejects anonymous users server-side', async () => {
    requireUser.mockResolvedValue({ error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    await expect(renderInvoice()).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('rejects another customer by treating the order as not found', async () => {
    requireUser.mockResolvedValue({ user: { id: 'customer-a', email: 'a@example.test' } })
    maybeSingle.mockResolvedValue({ data: null, error: null })
    await expect(renderInvoice()).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders owner invoice totals, Kuwait timestamp, fallback image, and no raw payment secret', async () => {
    requireUser.mockResolvedValue({ user: { id: 'customer-a', email: 'a@example.test' } })
    maybeSingle.mockResolvedValue({ data: {
      id: 'order-1', order_number: 'DB-20260716-0001', customer_name: 'Customer A', customer_phone: '50000000', customer_email: 'a@example.test',
      address_area: 'السالمية', address_block: '1', address_street: '2', address_house: '3', notes: null,
      subtotal: 10, shipping_cost: 1, coupon_discount: 2, coupon_code: 'SAVE', total: 9,
      status: 'confirmed', payment_method: 'card', payment_status: 'paid', created_at: '2026-07-15T21:30:00.000Z', paid_at: '2026-07-15T21:35:00.000Z', confirmed_at: null, processing_at: null, shipped_at: null, delivered_at: null, cancelled_at: null, refunded_at: null,
      order_items: [{ id: 'i1', product_id: 'p1', product_name_ar: 'سيروم', quantity: 2, unit_price: 5, total_price: 10, product_image_url: null }],
    } })
    productIn.mockResolvedValue({ data: [{ id: 'p1', images: ['/current.jpg'] }] })

    const html = await renderInvoice()

    expect(html).toContain('DB-20260716-0001')
    expect(html).toContain('٩.٠٠٠ د.ك')
    expect(html).toContain('/current.jpg')
    expect(html).toContain('توقيت الكويت')
    expect(html).not.toMatch(/payment_id|secret|token/i)
  })
})
