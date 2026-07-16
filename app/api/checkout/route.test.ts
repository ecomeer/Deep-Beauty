import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock, type QueryResult } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  admin: null as unknown as { from: unknown; rpc: unknown },
  limiterAllows: true,
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    { get: (_t, prop) => (holders.admin as unknown as Record<PropertyKey, unknown>)[prop] }
  ),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkoutLimiter: () => holders.limiterAllows,
}))

const sendEmail = vi.hoisted(() => vi.fn(async () => ({ sent: true })))
vi.mock('@/lib/email', () => ({
  sendEmail,
  orderConfirmationEmail: () => ({ subject: 'تأكيد الطلب', html: '<p>ok</p>' }),
}))

vi.mock('@/lib/shipping', () => ({
  calculateShipping: () => ({ rate: 2 }),
}))

import { POST } from './route'

const ORIGINAL_ENV = { ...process.env }

const product = { id: 'p1', price: 10, is_active: true, name_ar: 'كريم', name_en: 'Cream' }

function setDb(overrides: {
  products?: QueryResult
  rpc?: Record<string, QueryResult | ((args: Record<string, unknown>) => QueryResult)>
  users?: QueryResult | QueryResult[]
  settings?: QueryResult
} = {}) {
  const mock = createSupabaseMock({
    tables: {
      products: overrides.products ?? { data: [product] },
      shipping_zones: { data: [] },
      abandoned_carts: {},
      settings: overrides.settings ?? { data: null },
      ...(overrides.users ? { users: overrides.users } : {}),
    },
    rpc: {
      create_order_atomic: { data: { id: 'order-1', order_number: 'DB-1' } },
      increment_loyalty_points: {},
      ...overrides.rpc,
    },
  })
  holders.admin = mock.client
  return mock
}

const validBody = {
  orderNumber: 'DB-1',
  customer_name: 'سارة',
  customer_phone: '51234567',
  address_line1: 'شارع 1',
  address_area: 'السالمية',
  address_block: '2',
  address_street: '3',
  address_house: '4',
  payment_method: 'cod',
  items: [{ id: 'p1', quantity: 2 }],
}

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

beforeEach(() => {
  holders.limiterAllows = true
  sendEmail.mockClear()
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
  setDb()
})

afterAll(() => {
  vi.unstubAllGlobals()
  process.env = { ...ORIGINAL_ENV }
})

describe('POST /api/checkout — validation', () => {
  it('returns 429 when the rate limiter denies the IP', async () => {
    holders.limiterAllows = false
    const res = await post(validBody)
    expect(res.status).toBe(429)
  })

  it('requires a customer name', async () => {
    const res = await post({ ...validBody, customer_name: '  ' })
    expect(res.status).toBe(400)
  })

  it('requires a phone number', async () => {
    const res = await post({ ...validBody, customer_phone: '' })
    expect(res.status).toBe(400)
  })

  it('rejects an empty cart', async () => {
    const res = await post({ ...validBody, items: [] })
    expect(res.status).toBe(400)
  })

  it('rejects more than 50 items', async () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ id: `p${i}`, quantity: 1 }))
    const res = await post({ ...validBody, items })
    expect(res.status).toBe(400)
  })

  it('rejects non-integer or non-positive quantities', async () => {
    expect((await post({ ...validBody, items: [{ id: 'p1', quantity: 0 }] })).status).toBe(400)
    expect((await post({ ...validBody, items: [{ id: 'p1', quantity: 1.5 }] })).status).toBe(400)
    expect((await post({ ...validBody, items: [{ quantity: 1 }] })).status).toBe(400)
  })

  it('rejects inactive or unknown products', async () => {
    setDb({ products: { data: [{ ...product, is_active: false }] } })
    expect((await post(validBody)).status).toBe(400)

    setDb({ products: { data: [] } })
    expect((await post(validBody)).status).toBe(400)
  })
})

describe('POST /api/checkout — pricing and order creation', () => {
  it('creates the order with server-computed subtotal, shipping, and total', async () => {
    const mock = setDb()
    const res = await post(validBody)
    expect(res.status).toBe(200)
    expect((await res.json()).order).toEqual({ id: 'order-1', order_number: 'DB-1' })

    const rpcCall = mock.rpcCalls.find((c) => c.fn === 'create_order_atomic')!
    const order = rpcCall.args.p_order as Record<string, unknown>
    expect(order.subtotal).toBe(20) // 2 × 10, from DB price — not client input
    expect(order.shipping_cost).toBe(2)
    expect(order.total).toBe(22)
    expect(order.status).toBe('pending')
    expect(order.payment_status).toBe('unpaid')

    const items = rpcCall.args.p_items as Array<Record<string, unknown>>
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ product_id: 'p1', quantity: 2, unit_price: 10, total_price: 20 })
  })

  it('applies a valid coupon to the total', async () => {
    const mock = setDb({
      rpc: { validate_and_use_coupon: { data: { code: 'SAVE5', discount: 5 } } },
    })
    const res = await post({ ...validBody, coupon_code: 'save5' })
    expect(res.status).toBe(200)

    const order = mock.rpcCalls.find((c) => c.fn === 'create_order_atomic')!
      .args.p_order as Record<string, unknown>
    expect(order.coupon_code).toBe('SAVE5')
    expect(order.coupon_discount).toBe(5)
    expect(order.total).toBe(17) // 20 - 5 + 2
  })

  it.each([
    ['INVALID_CODE', 'كود الخصم غير صحيح'],
    ['EXPIRED', 'كود الخصم منتهي الصلاحية'],
    ['LIMIT_REACHED', 'تجاوز كود الخصم الحد الأقصى للاستخدام'],
  ])('rejects a coupon failing with %s', async (rpcMessage, expected) => {
    setDb({ rpc: { validate_and_use_coupon: { error: { message: rpcMessage } } } })
    const res = await post({ ...validBody, coupon_code: 'X' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe(expected)
  })

  it('surfaces the coupon minimum amount', async () => {
    setDb({ rpc: { validate_and_use_coupon: { error: { message: 'MIN_AMOUNT: 30' } } } })
    const res = await post({ ...validBody, coupon_code: 'BIG' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('30')
  })

  it('maps an insufficient-stock RPC failure to a 400', async () => {
    setDb({ rpc: { create_order_atomic: { error: { message: 'Insufficient stock for p1' } } } })
    const res = await post(validBody)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('غير متوفر بالكمية')
  })

  it('maps a coupon-limit race in the atomic RPC to a 400', async () => {
    setDb({ rpc: { create_order_atomic: { error: { message: 'COUPON_LIMIT_REACHED' } } } })
    const res = await post(validBody)
    expect(res.status).toBe(400)
  })

  it('returns 500 on other order-creation failures', async () => {
    setDb({ rpc: { create_order_atomic: { error: { message: 'deadlock' } } } })
    const res = await post(validBody)
    expect(res.status).toBe(500)
  })

  it('emails a confirmation when the customer gave an email', async () => {
    const res = await post({ ...validBody, customer_email: 'sara@example.com' })
    expect(res.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'sara@example.com' })
    )
  })

  it('skips the confirmation email without an address', async () => {
    await post(validBody)
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('POST /api/checkout — loyalty points', () => {
  const loggedInBody = { ...validBody, user_id: 'user-1', redeem_points: 5 }

  it('redeems points, capped by balance, and discounts the total', async () => {
    // Balance 5, default 0.01 KWD/point → 0.05 discount; claim succeeds.
    const mock = setDb({
      users: [{ data: { loyalty_points: 5 } }, { data: { id: 'user-1' } }],
    })
    const res = await post(loggedInBody)
    expect(res.status).toBe(200)

    const order = mock.rpcCalls.find((c) => c.fn === 'create_order_atomic')!
      .args.p_order as Record<string, unknown>
    expect(order.loyalty_points_redeemed).toBe(5)
    expect(order.total).toBe(21.95) // 20 - 0.05 + 2
  })

  it('redeems nothing when the conditional claim loses the race', async () => {
    // Claim update matches no row (balance changed concurrently).
    const mock = setDb({
      users: [{ data: { loyalty_points: 5 } }, { data: null }],
    })
    const res = await post(loggedInBody)
    expect(res.status).toBe(200)

    const order = mock.rpcCalls.find((c) => c.fn === 'create_order_atomic')!
      .args.p_order as Record<string, unknown>
    expect(order.loyalty_points_redeemed).toBe(0)
    expect(order.total).toBe(22)
  })

  it('refunds claimed points when order creation fails', async () => {
    const mock = setDb({
      users: [{ data: { loyalty_points: 5 } }, { data: { id: 'user-1' } }],
      rpc: { create_order_atomic: { error: { message: 'boom' } } },
    })
    const res = await post(loggedInBody)
    expect(res.status).toBe(500)
    expect(mock.rpcCalls).toContainEqual({
      fn: 'increment_loyalty_points',
      args: { p_user_id: 'user-1', p_delta: 5 },
    })
  })

  it('awards earned points only to logged-in customers', async () => {
    const guest = setDb()
    await post(validBody)
    expect(guest.rpcCalls.some((c) => c.fn === 'increment_loyalty_points')).toBe(false)

    const member = setDb({ users: [{ data: { loyalty_points: 0 } }] })
    await post({ ...validBody, user_id: 'user-1' })
    expect(member.rpcCalls).toContainEqual({
      fn: 'increment_loyalty_points',
      args: { p_user_id: 'user-1', p_delta: 20 },
    })
  })
})
