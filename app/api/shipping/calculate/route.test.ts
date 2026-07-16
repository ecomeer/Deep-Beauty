import { describe, it, expect, vi, beforeEach } from 'vitest'
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

const calculateShipping = vi.hoisted(() => vi.fn())
vi.mock('@/lib/shipping', () => ({ calculateShipping }))

import { POST } from './route'

const zone = {
  id: 'z1',
  name_ar: 'الكويت',
  name_en: 'Kuwait',
  free_shipping_threshold: 20,
  estimated_days_min: 1,
  estimated_days_max: 3,
}

function setDb(zonesResult: QueryResult) {
  const mock = createSupabaseMock({ tables: { shipping_zones: zonesResult } })
  holders.admin = mock.client
  return mock
}

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/shipping/calculate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

beforeEach(() => {
  calculateShipping.mockReset()
  calculateShipping.mockReturnValue({ rate: 2, isFree: false, zone })
  setDb({ data: [zone] })
})

describe('POST /api/shipping/calculate', () => {
  it('requires countryCode and a numeric subtotal', async () => {
    expect((await post({ subtotalKWD: 10 })).status).toBe(400)
    expect((await post({ countryCode: 'KW' })).status).toBe(400)
    expect((await post({ countryCode: 'KW', subtotalKWD: '10' })).status).toBe(400)
  })

  it('queries only active zones and delegates to calculateShipping', async () => {
    const mock = setDb({ data: [zone] })
    await post({ countryCode: 'SA', subtotalKWD: 15 })

    const query = mock.queries.find((q) => q.table === 'shipping_zones')!
    expect(query.calls.filter((c) => c.method === 'eq').map((c) => c.args)).toContainEqual([
      'is_active',
      true,
    ])
    expect(calculateShipping).toHaveBeenCalledWith('SA', 15, [zone])
  })

  it('returns the shaped shipping result', async () => {
    const res = await post({ countryCode: 'KW', subtotalKWD: 15 })
    expect(await res.json()).toEqual({
      cost: 2,
      isFree: false,
      freeThresholdKWD: 20,
      zone: {
        id: 'z1',
        name_ar: 'الكويت',
        name_en: 'Kuwait',
        estimated_days_min: 1,
        estimated_days_max: 3,
      },
    })
  })

  it('returns a null zone when no zone matched', async () => {
    calculateShipping.mockReturnValue({ rate: 0, isFree: false, zone: null })
    const res = await post({ countryCode: 'KW', subtotalKWD: 15 })
    expect(await res.json()).toEqual({ cost: 0, isFree: false, freeThresholdKWD: null, zone: null })
  })

  it('maps a zones query failure to 500', async () => {
    setDb({ error: { message: 'db down' } })
    expect((await post({ countryCode: 'KW', subtotalKWD: 15 })).status).toBe(500)
  })
})
