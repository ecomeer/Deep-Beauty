import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock, tableCalled, type QueryResult } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  admin: null as unknown as { from: unknown; rpc: unknown },
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    { get: (_t, prop) => (holders.admin as unknown as Record<PropertyKey, unknown>)[prop] }
  ),
}))

const upaymentsMocks = vi.hoisted(() => ({
  getUPaymentsStatus: vi.fn(),
  isTerminalUPaymentsFailure: vi.fn(),
}))
vi.mock('@/lib/upayments', () => upaymentsMocks)

import { POST } from './route'

const order = {
  id: 'o1',
  order_number: 'DB-1',
  total: 25.5,
  status: 'pending',
  payment_status: 'unpaid',
}

function setDb(ordersResults: QueryResult | QueryResult[]) {
  const mock = createSupabaseMock({
    tables: { orders: ordersResults },
    rpc: { restock_order_atomic: {} },
  })
  holders.admin = mock.client
  return mock
}

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/payment/upayments/webhook', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  )

beforeEach(() => {
  upaymentsMocks.getUPaymentsStatus.mockReset()
  upaymentsMocks.getUPaymentsStatus.mockResolvedValue({
    success: true,
    orderId: 'o1',
    orderNumber: 'DB-1',
    amount: 25.5,
  })
  upaymentsMocks.isTerminalUPaymentsFailure.mockReset()
  upaymentsMocks.isTerminalUPaymentsFailure.mockReturnValue(false)
  setDb({ data: order })
})

describe('POST /api/payment/upayments/webhook', () => {
  it('acknowledges but ignores a payload without track_id', async () => {
    const res = await post({ foo: 'bar' })
    expect(res.status).toBe(200)
    expect(upaymentsMocks.getUPaymentsStatus).not.toHaveBeenCalled()
  })

  it('accepts form-encoded payloads', async () => {
    await post('track_id=t-123&order_id=attacker-controlled')
    expect(upaymentsMocks.getUPaymentsStatus).toHaveBeenCalledWith('t-123')
  })

  it('re-derives the order from the status check, never from the webhook body', async () => {
    const mock = setDb({ data: order })
    await post({ track_id: 't-123', order_id: 'spoofed-order' })

    const orderQuery = mock.queries.find((q) => q.table === 'orders')!
    expect(orderQuery.calls.filter((c) => c.method === 'eq').map((c) => c.args)).toContainEqual([
      'id',
      'o1',
    ])
  })

  it('marks a pending order paid when the verified amount matches', async () => {
    const mock = setDb([{ data: order }, {}])
    const res = await post({ track_id: 't-123' })

    expect(res.status).toBe(200)
    expect(tableCalled(mock.queries, 'orders', 'update')).toBe(true)
    const update = mock.queries.filter((q) => q.table === 'orders')[1]
    const payload = update.calls.find((c) => c.method === 'update')!.args[0] as Record<string, unknown>
    expect(payload.payment_status).toBe('paid')
    expect(payload.status).toBe('confirmed')
    expect(update.calls.map((c) => `${c.method}:${(c.args as unknown[])[1]}`)).toContain(
      'neq:cancelled'
    )
  })

  it('refuses to mark paid on an amount mismatch', async () => {
    upaymentsMocks.getUPaymentsStatus.mockResolvedValue({ success: true, orderId: 'o1', amount: 1.0 })
    const mock = setDb({ data: order })
    await post({ track_id: 't-123' })
    expect(tableCalled(mock.queries, 'orders', 'update')).toBe(false)
  })

  it('refuses to mark paid on a reference mismatch', async () => {
    upaymentsMocks.getUPaymentsStatus.mockResolvedValue({
      success: true,
      orderId: 'o1',
      orderNumber: 'DB-OTHER',
      amount: 25.5,
    })
    const mock = setDb({ data: order })
    await post({ track_id: 't-123' })
    expect(tableCalled(mock.queries, 'orders', 'update')).toBe(false)
  })

  it('is idempotent for an already-paid order', async () => {
    const mock = setDb({ data: { ...order, payment_status: 'paid', status: 'shipped' } })
    const res = await post({ track_id: 't-123' })
    expect(res.status).toBe(200)
    expect(tableCalled(mock.queries, 'orders', 'update')).toBe(false)
  })

  it('cancels and restocks a pending order on an explicit terminal payment failure', async () => {
    upaymentsMocks.getUPaymentsStatus.mockResolvedValue({
      success: false,
      orderId: 'o1',
      result: 'DECLINED',
    })
    upaymentsMocks.isTerminalUPaymentsFailure.mockReturnValue(true)
    const mock = setDb([{ data: order }, { data: { id: 'o1' } }])
    await post({ track_id: 't-123' })

    expect(upaymentsMocks.isTerminalUPaymentsFailure).toHaveBeenCalledWith('DECLINED')
    const update = mock.queries.filter((q) => q.table === 'orders')[1]
    const payload = update.calls.find((c) => c.method === 'update')!.args[0] as Record<string, unknown>
    expect(payload.status).toBe('cancelled')
    expect(update.calls.filter((c) => c.method === 'eq').map((c) => c.args)).toContainEqual([
      'status',
      'pending',
    ])
    expect(mock.rpcCalls).toContainEqual({ fn: 'restock_order_atomic', args: { p_order_id: 'o1' } })
  })

  it('does not restock when a terminal failure races with a non-pending order', async () => {
    upaymentsMocks.getUPaymentsStatus.mockResolvedValue({
      success: false,
      orderId: 'o1',
      result: 'DECLINED',
    })
    upaymentsMocks.isTerminalUPaymentsFailure.mockReturnValue(true)
    const mock = setDb([{ data: { ...order, status: 'confirmed' } }, { data: null }])
    await post({ track_id: 't-123' })
    expect(mock.rpcCalls.some((c) => c.fn === 'restock_order_atomic')).toBe(false)
  })

  it('returns 200 even when processing throws, so the gateway stops retrying', async () => {
    upaymentsMocks.getUPaymentsStatus.mockRejectedValue(new Error('gateway timeout'))
    const res = await post({ track_id: 't-123' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })
})
