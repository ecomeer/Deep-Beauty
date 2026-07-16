import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock, type QueryResult } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  signInWithPassword: undefined as unknown as ReturnType<typeof vi.fn>,
  signOut: undefined as unknown as ReturnType<typeof vi.fn>,
  admin: null as unknown as Record<string, unknown>,
}))
const applyCookies = vi.hoisted(() => vi.fn((res: Response) => res))

vi.mock('@/lib/supabase-server', () => ({
  createWritableServerClient: () => ({
    supabase: { auth: { signInWithPassword: holders.signInWithPassword, signOut: holders.signOut } },
    applyCookies,
  }),
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy({}, { get: (_t, prop) => holders.admin[prop as string] }),
}))

import { POST } from './route'

const ORIGINAL_ENV = { ...process.env }

const updateUserById = vi.hoisted(() => vi.fn(async () => ({ data: {}, error: null })))

function setDb(usersResults: QueryResult | QueryResult[]) {
  const mock = createSupabaseMock({ tables: { users: usersResults } })
  holders.admin = {
    from: mock.client.from,
    rpc: mock.client.rpc,
    auth: { admin: { updateUserById } },
  }
  return mock
}

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

const creds = { email: 'Admin@Example.com', password: 'secret' }

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  delete process.env.ADMIN_EMAILS
  delete process.env.ADMIN_EMAIL
  applyCookies.mockClear()
  updateUserById.mockClear()
  holders.signOut = vi.fn(async () => ({ error: null }))
  holders.signInWithPassword = vi.fn().mockResolvedValue({
    data: { user: { id: 'u1', email: 'admin@example.com', app_metadata: {}, user_metadata: {} } },
    error: null,
  })
  setDb([{ data: null }, {}]) // no users row; upsert succeeds
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('POST /api/auth/admin/login', () => {
  it('returns 500 when Supabase env is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect((await post(creds)).status).toBe(500)
  })

  it('requires email and password', async () => {
    expect((await post({ email: 'a@b.com' })).status).toBe(400)
  })

  it('returns 401 on wrong credentials', async () => {
    holders.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } })
    expect((await post(creds)).status).toBe(401)
  })

  it('signs out and rejects a deactivated staff account', async () => {
    setDb({ data: { role: 'staff', is_active: false } })
    const res = await post(creds)
    expect(res.status).toBe(403)
    expect(holders.signOut).toHaveBeenCalled()
  })

  it('lets active staff in without touching admin metadata', async () => {
    setDb({ data: { role: 'staff', is_active: true } })
    const res = await post(creds)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(updateUserById).not.toHaveBeenCalled()
    expect(applyCookies).toHaveBeenCalledOnce()
  })

  it('signs out and rejects a non-admin outside the allowlist', async () => {
    process.env.ADMIN_EMAILS = 'boss@example.com'
    const res = await post(creds)
    expect(res.status).toBe(403)
    expect(holders.signOut).toHaveBeenCalled()
  })

  it('accepts an allowlisted email (normalized) and syncs the admin role', async () => {
    process.env.ADMIN_EMAILS = 'ADMIN@example.com'
    const res = await post(creds)
    expect(res.status).toBe(200)
    expect(updateUserById).toHaveBeenCalledWith('u1', {
      app_metadata: { role: 'admin' },
      user_metadata: { role: 'admin' },
    })
  })

  it('accepts a user who already has admin metadata without re-syncing', async () => {
    process.env.ADMIN_EMAILS = 'boss@example.com' // not allowlisted — metadata wins
    holders.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'admin@example.com', app_metadata: { role: 'admin' }, user_metadata: {} },
      },
      error: null,
    })
    const res = await post(creds)
    expect(res.status).toBe(200)
    expect(updateUserById).not.toHaveBeenCalled()
  })

  it('still succeeds when the metadata sync fails (best-effort)', async () => {
    updateUserById.mockRejectedValueOnce(new Error('admin API down'))
    const res = await post(creds) // empty allowlist = allow all
    expect(res.status).toBe(200)
  })
})
