import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  admin: null as unknown as { from: unknown; rpc: unknown },
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    { get: (_t, prop) => (holders.admin as unknown as Record<PropertyKey, unknown>)[prop] }
  ),
}))

import { POST } from './route'

function setRpc(result: { data?: unknown; error?: { message: string } }) {
  const mock = createSupabaseMock({ rpc: { validate_and_use_coupon: result } })
  holders.admin = mock.client
  return mock
}

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

beforeEach(() => {
  setRpc({ data: null })
})

describe('POST /api/coupons/validate', () => {
  it('requires a code', async () => {
    const res = await post({ subtotal: 10 })
    expect(res.status).toBe(400)
  })

  it('normalizes the code to trimmed uppercase before the RPC', async () => {
    const mock = setRpc({ data: { code: 'SAVE10', discount: 1 } })
    await post({ code: '  save10 ', subtotal: 20 })
    expect(mock.rpcCalls[0]).toEqual({
      fn: 'validate_and_use_coupon',
      args: { p_code: 'SAVE10', p_subtotal: 20 },
    })
  })

  it('defaults subtotal to 0', async () => {
    const mock = setRpc({ data: { code: 'X', discount: 0 } })
    await post({ code: 'X' })
    expect(mock.rpcCalls[0].args.p_subtotal).toBe(0)
  })

  it('maps INVALID_CODE to 404', async () => {
    setRpc({ error: { message: 'INVALID_CODE' } })
    const res = await post({ code: 'NOPE' })
    expect(res.status).toBe(404)
  })

  it('maps EXPIRED to 400 with the Arabic expiry message', async () => {
    setRpc({ error: { message: 'EXPIRED' } })
    const res = await post({ code: 'OLD' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('الكود منتهي الصلاحية')
  })

  it('maps LIMIT_REACHED to 400', async () => {
    setRpc({ error: { message: 'LIMIT_REACHED' } })
    const res = await post({ code: 'MAXED' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('الحد الأقصى')
  })

  it('maps MIN_AMOUNT and surfaces the threshold', async () => {
    setRpc({ error: { message: 'MIN_AMOUNT: 15' } })
    const res = await post({ code: 'BIG', subtotal: 5 })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('15')
  })

  it('treats unknown RPC errors as an invalid code', async () => {
    setRpc({ error: { message: 'connection reset' } })
    const res = await post({ code: 'ANY' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when the RPC yields no data', async () => {
    setRpc({ data: null })
    const res = await post({ code: 'GHOST' })
    expect(res.status).toBe(404)
  })

  it('returns the coupon on success', async () => {
    setRpc({ data: { code: 'SAVE10', discount: 2.5, type: 'percent', value: 10 } })
    const res = await post({ code: 'SAVE10', subtotal: 25 })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ code: 'SAVE10', discount: 2.5, type: 'percent', value: 10 })
  })
})
