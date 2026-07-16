import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMock, tableCalled, type QueryResult } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  requireUserResult: null as unknown,
}))

vi.mock('@/lib/supabase-server', () => ({
  requireUser: async () => holders.requireUserResult,
}))

import { GET, POST } from './route'

function setUser(wishlists: QueryResult | QueryResult[]) {
  const mock = createSupabaseMock({ tables: { wishlists } })
  holders.requireUserResult = { user: { id: 'u1' }, supabase: mock.client, error: null }
  return mock
}

function setUnauthenticated() {
  holders.requireUserResult = {
    user: null,
    supabase: null,
    error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  }
}

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/wishlist', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

beforeEach(() => {
  setUser({ data: [] })
})

describe('GET /api/wishlist', () => {
  it('returns the auth error for anonymous users', async () => {
    setUnauthenticated()
    expect((await GET()).status).toBe(401)
  })

  it('filters out rows whose product is inactive or deleted', async () => {
    setUser({
      data: [
        { id: 'w1', products: { id: 'p1', is_active: true } },
        { id: 'w2', products: { id: 'p2', is_active: false } },
        { id: 'w3', products: null },
      ],
    })
    const res = await GET()
    const { items } = await res.json()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('w1')
  })

  it('maps a fetch error to 500', async () => {
    setUser({ error: { message: 'boom' } })
    expect((await GET()).status).toBe(500)
  })
})

describe('POST /api/wishlist (toggle)', () => {
  it('returns the auth error for anonymous users', async () => {
    setUnauthenticated()
    expect((await post({ product_id: 'p1' })).status).toBe(401)
  })

  it('requires product_id', async () => {
    expect((await post({})).status).toBe(400)
  })

  it('adds when the product is not in the wishlist', async () => {
    const mock = setUser([{ data: null }, {}]) // lookup: absent; insert ok
    const res = await post({ product_id: 'p1' })
    expect(await res.json()).toEqual({ action: 'added' })
    expect(tableCalled(mock.queries, 'wishlists', 'insert')).toBe(true)
  })

  it('removes when the product is already in the wishlist', async () => {
    const mock = setUser([{ data: { id: 'w1' } }, {}]) // lookup: present; delete ok
    const res = await post({ product_id: 'p1' })
    expect(await res.json()).toEqual({ action: 'removed' })
    expect(tableCalled(mock.queries, 'wishlists', 'delete')).toBe(true)
  })

  it('maps insert/delete failures to 500', async () => {
    setUser([{ data: null }, { error: { message: 'fk violation' } }])
    expect((await post({ product_id: 'p1' })).status).toBe(500)

    setUser([{ data: { id: 'w1' } }, { error: { message: 'locked' } }])
    expect((await post({ product_id: 'p1' })).status).toBe(500)
  })
})
