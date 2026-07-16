import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock, type QueryResult } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  admin: null as unknown as { from: unknown; rpc: unknown },
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    { get: (_t, prop) => (holders.admin as unknown as Record<PropertyKey, unknown>)[prop] }
  ),
}))

const verifyPayment = vi.hoisted(() => vi.fn())
vi.mock('@/lib/payment', () => ({ verifyPayment }))

import { GET } from './route'

function setDb(ordersResults: QueryResult | QueryResult[]) {
  const mock = createSupabaseMock({ tables: { orders: ordersResults } })
  holders.admin = mock.client
  return mock
}

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/payment/callback${query}`))

function redirectPath(res: Response) {
  return new URL(res.headers.get('location')!).pathname + new URL(res.headers.get('location')!).search
}

beforeEach(() => {
  verifyPayment.mockReset()
  verifyPayment.mockResolvedValue({ success: true, orderId: 'o1' })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
  setDb([{}, { data: { order_number: 'DB-1', customer_name: 'سارة', total: 25.5 } }])
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('GET /api/payment/callback', () => {
  it('redirects to payment-failed when paymentId is missing', async () => {
    const res = await get('')
    expect(redirectPath(res)).toBe('/payment-failed?reason=missing_id')
    expect(verifyPayment).not.toHaveBeenCalled()
  })

  it('redirects to payment-failed when gateway verification fails', async () => {
    verifyPayment.mockResolvedValue({ success: false })
    const res = await get('?paymentId=pay-1')
    expect(redirectPath(res)).toBe('/payment-failed?reason=verification_failed')
  })

  it('redirects to payment-failed when the order update fails', async () => {
    setDb({ error: { message: 'db down' } })
    const res = await get('?paymentId=pay-1')
    expect(redirectPath(res)).toBe('/payment-failed?reason=database_error')
  })

  it('marks the order paid and redirects to order-success with the order number', async () => {
    const mock = setDb([{}, { data: { order_number: 'DB-1', customer_name: 'سارة', total: 25.5 } }])
    const res = await get('?paymentId=pay-1')

    const update = mock.queries.find((q) => q.table === 'orders')!
    const payload = update.calls.find((c) => c.method === 'update')!.args[0] as Record<string, unknown>
    expect(payload).toMatchObject({ payment_status: 'paid', status: 'confirmed' })
    expect(update.calls.filter((c) => c.method === 'eq').map((c) => c.args)).toContainEqual([
      'id',
      'o1',
    ])

    expect(redirectPath(res)).toBe('/order-success?id=o1&num=DB-1&paid=true')
  })

  it('still succeeds when the push-notification lookup fails', async () => {
    setDb([{}, { error: { message: 'not found' } }])
    const res = await get('?paymentId=pay-1')
    expect(redirectPath(res)).toBe('/order-success?id=o1&paid=true')
  })

  it('redirects to payment-failed when verification throws', async () => {
    verifyPayment.mockRejectedValue(new Error('network'))
    const res = await get('?paymentId=pay-1')
    expect(redirectPath(res)).toBe('/payment-failed?reason=error')
  })
})
