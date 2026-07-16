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

const getUPaymentsStatus = vi.hoisted(() => vi.fn())
vi.mock('@/lib/upayments', () => ({ getUPaymentsStatus }))

import { GET } from './route'

const order = {
  id: 'o1',
  order_number: 'DB-1',
  total: 25.5,
  status: 'pending',
  payment_status: 'unpaid',
}

function setDb(ordersResults: QueryResult | QueryResult[]) {
  const mock = createSupabaseMock({ tables: { orders: ordersResults } })
  holders.admin = mock.client
  return mock
}

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/payment/upayments/callback${query}`))

function redirectReason(res: Response) {
  const url = new URL(res.headers.get('location')!)
  return `${url.pathname}?${url.searchParams}`
}

beforeEach(() => {
  getUPaymentsStatus.mockReset()
  getUPaymentsStatus.mockResolvedValue({
    success: true,
    orderId: 'o1',
    orderNumber: 'DB-1',
    amount: 25.5,
  })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
  setDb([{ data: order }, { data: { id: 'o1' } }])
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('GET /api/payment/upayments/callback', () => {
  it('redirects with reason=cancelled when the customer cancelled', async () => {
    const res = await get('?cancelled=1&track_id=t-1')
    expect(redirectReason(res)).toBe('/payment-failed?reason=cancelled')
    expect(getUPaymentsStatus).not.toHaveBeenCalled()
  })

  it('redirects with reason=missing_id without a track_id', async () => {
    expect(redirectReason(await get(''))).toBe('/payment-failed?reason=missing_id')
  })

  it('fails verification when the gateway reports no success/orderId/amount', async () => {
    getUPaymentsStatus.mockResolvedValue({ success: false })
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/payment-failed?reason=verification_failed'
    )
  })

  it('fails verification when the order is unknown', async () => {
    setDb({ data: null })
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/payment-failed?reason=verification_failed'
    )
  })

  it('never revives a cancelled order from a stale payment link', async () => {
    setDb({ data: { ...order, status: 'cancelled' } })
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/payment-failed?reason=order_cancelled'
    )
  })

  it('fails verification on an amount mismatch', async () => {
    getUPaymentsStatus.mockResolvedValue({ success: true, orderId: 'o1', amount: 1 })
    const mock = setDb({ data: order })
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/payment-failed?reason=verification_failed'
    )
    expect(mock.queries.filter((q) => q.table === 'orders')).toHaveLength(1) // no update
  })

  it('fails verification on an order-number mismatch', async () => {
    getUPaymentsStatus.mockResolvedValue({
      success: true,
      orderId: 'o1',
      orderNumber: 'DB-OTHER',
      amount: 25.5,
    })
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/payment-failed?reason=verification_failed'
    )
  })

  it('is idempotent: an already-paid order goes straight to order-success', async () => {
    const mock = setDb({ data: { ...order, payment_status: 'paid', status: 'confirmed' } })
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/order-success?id=o1&num=DB-1&paid=true'
    )
    expect(mock.queries.filter((q) => q.table === 'orders')).toHaveLength(1) // fetch only
  })

  it('marks the order paid+confirmed and redirects to order-success', async () => {
    const mock = setDb([{ data: order }, { data: { id: 'o1' } }])
    const res = await get('?track_id=t-1')

    const update = mock.queries.filter((q) => q.table === 'orders')[1]
    const payload = update.calls.find((c) => c.method === 'update')!.args[0] as Record<string, unknown>
    expect(payload).toMatchObject({ payment_status: 'paid', status: 'confirmed' })
    expect(update.calls.map((c) => `${c.method}:${(c.args as unknown[])[1]}`)).toContain(
      'neq:cancelled'
    )
    expect(redirectReason(res)).toBe('/order-success?id=o1&num=DB-1&paid=true')
  })

  it('reports order_cancelled when the guarded update matched no row', async () => {
    setDb([{ data: order }, { data: null }])
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/payment-failed?reason=order_cancelled'
    )
  })

  it('reports database_error when the update fails', async () => {
    setDb([{ data: order }, { error: { message: 'db down' } }])
    expect(redirectReason(await get('?track_id=t-1'))).toBe(
      '/payment-failed?reason=database_error'
    )
  })

  it('redirects with reason=error when the status check throws', async () => {
    getUPaymentsStatus.mockRejectedValue(new Error('timeout'))
    expect(redirectReason(await get('?track_id=t-1'))).toBe('/payment-failed?reason=error')
  })
})
