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

const createUPaymentsCharge = vi.hoisted(() => vi.fn())
const initiatePayment = vi.hoisted(() => vi.fn())
vi.mock('@/lib/upayments', () => ({
  isUPaymentsConfigured: () => Boolean(process.env.UPAYMENTS_TOKEN),
  createUPaymentsCharge,
}))
vi.mock('@/lib/payment', () => ({ initiatePayment }))

import { POST } from './route'

const ORIGINAL_ENV = { ...process.env }

const order = {
  id: 'o1',
  order_number: 'DB-1',
  total: '25.5',
  customer_name: 'سارة',
  customer_phone: '51234567',
  customer_email: null,
  payment_status: 'unpaid',
}

function setDb(ordersResults: QueryResult | QueryResult[]) {
  const mock = createSupabaseMock({ tables: { orders: ordersResults } })
  holders.admin = mock.client
  return mock
}

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/payment/initiate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

beforeEach(() => {
  delete process.env.UPAYMENTS_TOKEN
  delete process.env.MYFATOORAH_TOKEN
  createUPaymentsCharge.mockReset()
  createUPaymentsCharge.mockResolvedValue({ paymentUrl: 'https://upay.example/pay' })
  initiatePayment.mockReset()
  initiatePayment.mockResolvedValue({ paymentUrl: 'https://mf.example/pay', paymentId: 'mf-1' })
  setDb([{ data: order }, {}])
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('POST /api/payment/initiate', () => {
  it('requires orderId', async () => {
    expect((await post({})).status).toBe(400)
  })

  it('returns 404 for an unknown order', async () => {
    setDb({ data: null })
    expect((await post({ orderId: 'ghost' })).status).toBe(404)
  })

  it('refuses to re-charge an already-paid order', async () => {
    setDb({ data: { ...order, payment_status: 'paid' } })
    expect((await post({ orderId: 'o1' })).status).toBe(409)
  })

  it('builds the charge from DB values, never the client body', async () => {
    process.env.UPAYMENTS_TOKEN = 'token'
    await post({ orderId: 'o1', amount: 0.001, customerName: 'attacker' })
    expect(createUPaymentsCharge).toHaveBeenCalledWith({
      orderId: 'o1',
      orderNumber: 'DB-1',
      amount: 25.5,
      customerName: 'سارة',
      customerPhone: '51234567',
      customerEmail: undefined,
    })
  })

  it('prefers UPayments when configured', async () => {
    process.env.UPAYMENTS_TOKEN = 'token'
    process.env.MYFATOORAH_TOKEN = 'mf-token'
    const res = await post({ orderId: 'o1' })
    expect(await res.json()).toEqual({ paymentUrl: 'https://upay.example/pay', gateway: 'upayments' })
    expect(initiatePayment).not.toHaveBeenCalled()
  })

  it('falls back to MyFatoorah when only it is configured', async () => {
    process.env.MYFATOORAH_TOKEN = 'mf-token'
    const res = await post({ orderId: 'o1' })
    expect(await res.json()).toEqual({
      paymentUrl: 'https://mf.example/pay',
      paymentId: 'mf-1',
      gateway: 'myfatoorah',
    })
  })

  it('returns 503 when no gateway is configured', async () => {
    expect((await post({ orderId: 'o1' })).status).toBe(503)
  })

  it('returns 500 when the gateway call throws', async () => {
    process.env.UPAYMENTS_TOKEN = 'token'
    createUPaymentsCharge.mockRejectedValue(new Error('gateway down'))
    expect((await post({ orderId: 'o1' })).status).toBe(500)
  })
})
