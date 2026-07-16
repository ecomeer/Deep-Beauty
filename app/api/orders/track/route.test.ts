import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock, queriesFor, type QueryResult } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  admin: null as unknown as { from: unknown; rpc: unknown },
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    { get: (_t, prop) => (holders.admin as unknown as Record<PropertyKey, unknown>)[prop] }
  ),
}))

import { GET } from './route'

const order = { id: 'o1', order_number: 'DB-1', status: 'shipped', customer_phone: '51234567' }

function setDb(orders: QueryResult, tracking: QueryResult = { data: [] }) {
  const mock = createSupabaseMock({
    tables: { orders, order_tracking: tracking },
  })
  holders.admin = mock.client
  return mock
}

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/orders/track${query}`))

beforeEach(() => {
  setDb({ data: order })
})

describe('GET /api/orders/track', () => {
  it('requires both order number and phone', async () => {
    expect((await get('')).status).toBe(400)
    expect((await get('?order=DB-1')).status).toBe(400)
    expect((await get('?phone=51234567')).status).toBe(400)
  })

  it('filters by BOTH order number and phone so orders cannot be enumerated', async () => {
    const mock = setDb({ data: order })
    await get('?order=DB-1&phone=51234567')

    const [query] = queriesFor(mock.queries, 'orders')
    const eqArgs = query.calls.filter((c) => c.method === 'eq').map((c) => c.args)
    expect(eqArgs).toContainEqual(['order_number', 'DB-1'])
    expect(eqArgs).toContainEqual(['customer_phone', '51234567'])
  })

  it('returns 404 when the pair does not match', async () => {
    setDb({ data: null, error: { message: 'No rows' } })
    const res = await get('?order=DB-1&phone=00000000')
    expect(res.status).toBe(404)
  })

  it('returns the order with only customer-visible tracking entries', async () => {
    const tracking = [{ id: 't1', status: 'shipped', note: null, location: 'الكويت', created_at: 'now' }]
    const mock = setDb({ data: order }, { data: tracking })
    const res = await get('?order=DB-1&phone=51234567')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.order).toEqual(order)
    expect(body.tracking).toEqual(tracking)

    const [trackQuery] = queriesFor(mock.queries, 'order_tracking')
    expect(trackQuery.calls.filter((c) => c.method === 'eq').map((c) => c.args)).toContainEqual([
      'is_customer_visible',
      true,
    ])
  })
})
