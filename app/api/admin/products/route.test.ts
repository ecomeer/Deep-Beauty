import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMock, type QueryResult } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  admin: null as unknown as { from: unknown; rpc: unknown },
  authError: null as Response | null,
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    { get: (_t, prop) => (holders.admin as unknown as Record<PropertyKey, unknown>)[prop] }
  ),
}))

const requireAdmin = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth-admin', () => ({ requireAdmin }))

import { GET, POST } from './route'

function setDb(productsResult: QueryResult & { count?: number | null }) {
  const mock = createSupabaseMock({ tables: { products: productsResult } })
  holders.admin = mock.client
  return mock
}

beforeEach(() => {
  requireAdmin.mockReset()
  requireAdmin.mockResolvedValue(null)
  setDb({ data: [] })
})

describe('GET /api/admin/products', () => {
  it("gates on requireAdmin with the 'products' permission", async () => {
    const denied = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    requireAdmin.mockResolvedValue(denied)
    const res = await GET(new NextRequest('http://localhost/api/admin/products'))
    expect(res.status).toBe(403)
    expect(requireAdmin).toHaveBeenCalledWith(expect.anything(), 'products')
  })

  it('returns paginated products with totals', async () => {
    setDb({ data: [{ id: 'p1' }], count: 41 } as QueryResult)
    const res = await GET(new NextRequest('http://localhost/api/admin/products?page=2'))
    expect(await res.json()).toEqual({
      products: [{ id: 'p1' }],
      total: 41,
      page: 2,
      pageSize: 20,
      totalPages: 3,
    })
  })

  it('clamps invalid page numbers to 1', async () => {
    const mock = setDb({ data: [] })
    await GET(new NextRequest('http://localhost/api/admin/products?page=-4'))
    const query = mock.queries.find((q) => q.table === 'products')!
    expect(query.calls.find((c) => c.method === 'range')!.args).toEqual([0, 19])
  })

  it('escapes the search term before building the or-filter', async () => {
    const mock = setDb({ data: [] })
    await GET(new NextRequest('http://localhost/api/admin/products?search=a%2Cb(c'))
    const query = mock.queries.find((q) => q.table === 'products')!
    const orArg = query.calls.find((c) => c.method === 'or')!.args[0] as string
    // escapeOrFilterValue quotes the pattern so `,` and `(` can't break out
    // of the PostgREST or() filter.
    expect(orArg).toContain('name_ar.ilike."%a,b(c%"')
    expect(orArg).toContain('name_en.ilike."%a,b(c%"')
  })

  it('filters by category when given', async () => {
    const mock = setDb({ data: [] })
    await GET(new NextRequest('http://localhost/api/admin/products?category=skincare'))
    const query = mock.queries.find((q) => q.table === 'products')!
    expect(query.calls.filter((c) => c.method === 'eq').map((c) => c.args)).toContainEqual([
      'category',
      'skincare',
    ])
  })

  it('maps a query error to 500', async () => {
    setDb({ error: { message: 'boom' } })
    const res = await GET(new NextRequest('http://localhost/api/admin/products'))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/admin/products', () => {
  const post = (body: unknown) =>
    POST(
      new NextRequest('http://localhost/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    )

  it('gates on requireAdmin', async () => {
    requireAdmin.mockResolvedValue(NextResponse.json({ error: 'x' }, { status: 401 }))
    expect((await post({})).status).toBe(401)
  })

  it('inserts the product with null/[] fallbacks and returns it', async () => {
    const mock = setDb({ data: { id: 'p-new' } })
    const res = await post({
      name_ar: 'كريم',
      name_en: 'Cream',
      slug: 'cream',
      price: 10,
      stock_quantity: 5,
      is_active: true,
      is_featured: false,
    })
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({ id: 'p-new' })

    const insert = mock.queries.find((q) => q.table === 'products')!
    const row = insert.calls.find((c) => c.method === 'insert')!.args[0] as Record<string, unknown>
    expect(row).toMatchObject({ category: null, compare_price: null, images: [] })
  })

  it('maps an insert error to 400', async () => {
    setDb({ error: { message: 'duplicate slug' } })
    expect((await post({ name_ar: 'x', slug: 'dup', price: 1 })).status).toBe(400)
  })
})
