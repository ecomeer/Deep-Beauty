import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  signUp: undefined as unknown as ReturnType<typeof vi.fn>,
  from: undefined as unknown,
}))
const applyCookies = vi.hoisted(() => vi.fn((res: Response) => res))

vi.mock('@/lib/supabase-server', () => ({
  createWritableServerClient: () => ({
    supabase: { auth: { signUp: holders.signUp }, from: holders.from },
    applyCookies,
  }),
}))

import { POST } from './route'

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

const validBody = { name: 'سارة', email: 'sara@example.com', phone: '51234567', password: 'secret1' }

function setDb(usersResult: { error?: { message: string } } = {}) {
  const mock = createSupabaseMock({ tables: { users: usersResult } })
  holders.from = mock.client.from
  return mock
}

beforeEach(() => {
  applyCookies.mockClear()
  holders.signUp = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  setDb()
})

describe('POST /api/auth/register', () => {
  it('requires name, email, and password', async () => {
    expect((await post({ email: 'a@b.com', password: 'x' })).status).toBe(400)
    expect((await post({ name: 'x', password: 'x' })).status).toBe(400)
    expect((await post({ name: 'x', email: 'a@b.com' })).status).toBe(400)
  })

  it('surfaces signUp errors as 400', async () => {
    holders.signUp.mockResolvedValue({ data: {}, error: { message: 'User already registered' } })
    const res = await post(validBody)
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('User already registered')
  })

  it('creates the customer profile row and returns 201 with cookies applied', async () => {
    const mock = setDb()
    const res = await post(validBody)
    expect(res.status).toBe(201)
    expect(applyCookies).toHaveBeenCalledOnce()

    const insert = mock.queries.find((q) => q.table === 'users')!
    const row = insert.calls.find((c) => c.method === 'insert')!.args[0] as Record<string, unknown>
    expect(row).toMatchObject({ id: 'u1', role: 'customer', is_active: true })
  })

  it('still registers (201) when the profile insert fails — auth user exists', async () => {
    setDb({ error: { message: 'duplicate key' } })
    const res = await post(validBody)
    expect(res.status).toBe(201)
  })

  it('passes name and phone as signUp metadata', async () => {
    await post(validBody)
    expect(holders.signUp).toHaveBeenCalledWith({
      email: 'sara@example.com',
      password: 'secret1',
      options: { data: { name: 'سارة', phone: '51234567' } },
    })
  })
})
