import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
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

const authMocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAuthenticatedUserId: vi.fn(),
}))
vi.mock('@/lib/auth-admin', () => authMocks)

import { GET, PATCH } from './route'

const ctx = { params: Promise.resolve({ id: 'o1' }) }

function setDb(config: {
  orders?: QueryResult | QueryResult[]
  rpc?: Record<string, QueryResult>
} = {}) {
  const mock = createSupabaseMock({
    tables: {
      orders: config.orders ?? { data: { id: 'o1' } },
      order_items: { data: [] },
      order_tracking: { data: [] },
    },
    rpc: {
      transition_order_with_tracking: { data: { id: 'o1' } },
      restock_order_atomic: {},
      increment_loyalty_points: {},
      ...config.rpc,
    },
  })
  holders.admin = mock.client
  return mock
}

const patch = (body: unknown) =>
  PATCH(
    new NextRequest('http://localhost/api/admin/orders/o1', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    ctx
  )

beforeEach(() => {
  authMocks.requireAdmin.mockReset()
  authMocks.requireAdmin.mockResolvedValue(null)
  authMocks.getAuthenticatedUserId.mockReset()
  authMocks.getAuthenticatedUserId.mockResolvedValue('admin-1')
  setDb()
})

describe('GET /api/admin/orders/[id]', () => {
  it("gates on requireAdmin with the 'orders' permission", async () => {
    authMocks.requireAdmin.mockResolvedValue(NextResponse.json({ error: 'x' }, { status: 403 }))
    const res = await GET(new NextRequest('http://localhost/api/admin/orders/o1'), ctx)
    expect(res.status).toBe(403)
    expect(authMocks.requireAdmin).toHaveBeenCalledWith(expect.anything(), 'orders')
  })

  it('returns 404 for an unknown order', async () => {
    setDb({ orders: { data: null, error: { message: 'No rows' } } })
    const res = await GET(new NextRequest('http://localhost/api/admin/orders/o1'), ctx)
    expect(res.status).toBe(404)
  })

  it('returns order, items, and tracking', async () => {
    setDb({ orders: { data: { id: 'o1', status: 'pending' } } })
    const res = await GET(new NextRequest('http://localhost/api/admin/orders/o1'), ctx)
    expect(await res.json()).toEqual({
      order: { id: 'o1', status: 'pending' },
      items: [],
      tracking: [],
    })
  })
})

describe('PATCH /api/admin/orders/[id] — status transitions', () => {
  it('rejects an invalid transition (pending → delivered)', async () => {
    setDb({ orders: [{ data: { status: 'pending' } }] })
    const res = await patch({ status: 'delivered' })
    expect(res.status).toBe(400)
  })

  it('rejects any transition out of a terminal status', async () => {
    setDb({ orders: [{ data: { status: 'delivered' } }] })
    expect((await patch({ status: 'pending' })).status).toBe(400)

    setDb({ orders: [{ data: { status: 'cancelled' } }] })
    expect((await patch({ status: 'confirmed' })).status).toBe(400)
  })

  it('returns 404 when the order does not exist', async () => {
    setDb({ orders: [{ data: null }] })
    expect((await patch({ status: 'confirmed' })).status).toBe(404)
  })

  it('applies a valid transition atomically with the previous status and actor', async () => {
    const mock = setDb({
      orders: [{ data: { status: 'pending' } }],
      rpc: {
        transition_order_with_tracking: { data: { id: 'o1', status: 'confirmed' } },
      },
    })
    const res = await patch({ status: 'confirmed' })
    expect(res.status).toBe(200)
    expect(authMocks.getAuthenticatedUserId).toHaveBeenCalled()
    expect(mock.rpcCalls).toContainEqual({
      fn: 'transition_order_with_tracking',
      args: {
        p_order_id: 'o1',
        p_expected_status: 'pending',
        p_new_status: 'confirmed',
        p_created_by: 'admin-1',
      },
    })
  })

  it('returns 409 when a concurrent change won the race', async () => {
    setDb({
      orders: [{ data: { status: 'pending' } }],
      rpc: { transition_order_with_tracking: { data: null } },
    })
    expect((await patch({ status: 'confirmed' })).status).toBe(409)
  })

  it('restocks and reverses loyalty points when cancelling', async () => {
    const mock = setDb({
      orders: [{ data: { status: 'pending' } }],
      rpc: {
        transition_order_with_tracking: {
          data: {
            id: 'o1',
            status: 'cancelled',
            user_id: 'u1',
            loyalty_points_redeemed: 10,
            loyalty_points_earned: 3,
          },
        },
      },
    })
    const res = await patch({ status: 'cancelled' })
    expect(res.status).toBe(200)
    expect(mock.rpcCalls).toContainEqual({ fn: 'restock_order_atomic', args: { p_order_id: 'o1' } })
    expect(mock.rpcCalls).toContainEqual({
      fn: 'increment_loyalty_points',
      args: { p_user_id: 'u1', p_delta: 7 },
    })
  })

  it('surfaces a restock failure as restockWarning without rolling back', async () => {
    setDb({
      orders: [{ data: { status: 'pending' } }],
      rpc: {
        transition_order_with_tracking: { data: { id: 'o1', status: 'cancelled' } },
        restock_order_atomic: { error: { message: 'stock row locked' } },
      },
    })
    const res = await patch({ status: 'cancelled' })
    expect(res.status).toBe(200)
    expect((await res.json()).restockWarning).toBe(true)
  })

  it('updates payment_status without a status transition check', async () => {
    const mock = setDb({ orders: [{ data: { id: 'o1' } }] })
    const res = await patch({ payment_status: 'paid' })
    expect(res.status).toBe(200)

    const update = mock.queries.filter((q) => q.table === 'orders')[0]
    const payload = update.calls.find((c) => c.method === 'update')!.args[0]
    expect(payload).toEqual({ payment_status: 'paid' })
  })
})
