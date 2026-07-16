import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
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

const sendEmail = vi.hoisted(() => vi.fn(async () => ({ sent: true })))
vi.mock('@/lib/email', () => ({
  sendEmail,
  abandonedCartEmail: () => ({ subject: 'سلتك بانتظارك', html: '<p>reminder</p>' }),
}))

import { GET } from './route'

const ORIGINAL_ENV = { ...process.env }

const cart = (overrides: Record<string, unknown> = {}) => ({
  id: 'cart-1',
  customer_name: 'سارة',
  customer_email: 'sara@example.com',
  items: [{ id: 'p1', name_ar: 'كريم', price: 10, quantity: 1 }],
  ...overrides,
})

function setCarts(result: QueryResult) {
  const mock = createSupabaseMock({ tables: { abandoned_carts: [result, {}] } })
  holders.admin = mock.client
  return mock
}

const get = (headers: Record<string, string> = {}) =>
  GET(new NextRequest('http://localhost/api/cron/abandoned-cart-reminders', { headers }))

beforeEach(() => {
  process.env.CRON_SECRET = 'topsecret'
  sendEmail.mockClear()
  sendEmail.mockResolvedValue({ sent: true })
  setCarts({ data: [] })
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('GET /api/cron/abandoned-cart-reminders — auth', () => {
  it('rejects a missing Authorization header', async () => {
    expect((await get()).status).toBe(401)
  })

  it('rejects a wrong bearer token', async () => {
    expect((await get({ authorization: 'Bearer wrong' })).status).toBe(401)
  })

  it('accepts the configured bearer token', async () => {
    expect((await get({ authorization: 'Bearer topsecret' })).status).toBe(200)
  })
})

describe('GET /api/cron/abandoned-cart-reminders — reminders', () => {
  const authed = () => get({ authorization: 'Bearer topsecret' })

  it('queries only the 1–24h window of unrecovered, unreminded carts', async () => {
    const mock = setCarts({ data: [] })
    await authed()

    const [query] = mock.queries.filter((q) => q.table === 'abandoned_carts')
    const methods = query.calls.map((c) => `${c.method}(${(c.args as unknown[]).join(',')})`)
    expect(methods).toContain('eq(recovered,false)')
    expect(methods.some((m) => m.startsWith('is(reminded_at'))).toBe(true)
    expect(methods.some((m) => m.startsWith('lte(created_at'))).toBe(true)
    expect(methods.some((m) => m.startsWith('gte(created_at'))).toBe(true)
    expect(methods).toContain('limit(100)')
  })

  it('emails each eligible cart and stamps reminded_at', async () => {
    const mock = setCarts({ data: [cart(), cart({ id: 'cart-2', customer_email: 'b@example.com' })] })
    const res = await authed()

    expect(await res.json()).toEqual({ checked: 2, sent: 2 })
    expect(sendEmail).toHaveBeenCalledTimes(2)
    expect(tableCalled(mock.queries, 'abandoned_carts', 'update')).toBe(true)
  })

  it('skips carts with no items', async () => {
    setCarts({ data: [cart({ items: [] })] })
    const res = await authed()
    expect(await res.json()).toEqual({ checked: 1, sent: 0 })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does not stamp reminded_at when the send fails', async () => {
    sendEmail.mockResolvedValue({ sent: false })
    const mock = setCarts({ data: [cart()] })
    const res = await authed()
    expect(await res.json()).toEqual({ checked: 1, sent: 0 })
    expect(tableCalled(mock.queries, 'abandoned_carts', 'update')).toBe(false)
  })

  it('propagates a query failure as 500', async () => {
    setCarts({ error: { message: 'relation missing' } })
    expect((await authed()).status).toBe(500)
  })
})
