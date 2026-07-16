import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  getUser: undefined as unknown as ReturnType<typeof vi.fn>,
  admin: null as unknown as { from: unknown; rpc: unknown },
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: holders.getUser } }),
}))

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    { get: (_t, prop) => (holders.admin as unknown as Record<PropertyKey, unknown>)[prop] }
  ),
}))

import { requireAdmin } from './auth-admin'

const ORIGINAL_ENV = { ...process.env }

const user = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  app_metadata: {},
  user_metadata: {},
  ...overrides,
})

/** Configures the DB rows the two role lookups return. */
function setDbRoles(usersRow: Record<string, unknown> | null, profilesRow: Record<string, unknown> | null = null) {
  holders.admin = createSupabaseMock({
    tables: {
      users: { data: usersRow },
      profiles: { data: profilesRow },
    },
  }).client
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  delete process.env.NEXT_PUBLIC_DEV_BYPASS
  delete process.env.ADMIN_EMAILS
  delete process.env.ADMIN_EMAIL
  holders.getUser = vi.fn().mockResolvedValue({ data: { user: user() }, error: null })
  setDbRoles(null)
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

const req = () => new NextRequest('http://localhost/api/admin/orders')

describe('requireAdmin', () => {
  it('allows everything under the dev bypass', async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS = 'true'
    expect(await requireAdmin(req())).toBeNull()
  })

  it('returns 500 when Supabase env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const res = await requireAdmin(req())
    expect(res?.status).toBe(500)
  })

  it('returns 401 when there is no authenticated user', async () => {
    holders.getUser.mockResolvedValue({ data: { user: null }, error: null })
    const res = await requireAdmin(req())
    expect(res?.status).toBe(401)
  })

  it('returns 401 when getUser errors', async () => {
    holders.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } })
    const res = await requireAdmin(req())
    expect(res?.status).toBe(401)
  })

  it('returns 403 for an authenticated non-admin user', async () => {
    setDbRoles({ role: 'customer', is_active: true, permissions: [] })
    const res = await requireAdmin(req())
    expect(res?.status).toBe(403)
  })

  it('allows a full admin via the users table role', async () => {
    setDbRoles({ role: 'admin', is_active: true, permissions: [] })
    expect(await requireAdmin(req(), 'orders')).toBeNull()
  })

  it('allows a full admin via the profiles table role', async () => {
    setDbRoles(null, { role: 'admin' })
    expect(await requireAdmin(req())).toBeNull()
  })

  it('allows a full admin via auth metadata', async () => {
    holders.getUser.mockResolvedValue({
      data: { user: user({ app_metadata: { role: 'admin' } }) },
      error: null,
    })
    expect(await requireAdmin(req())).toBeNull()
  })

  it('allows a full admin via the email allowlist', async () => {
    process.env.ADMIN_EMAILS = 'boss@example.com, user@example.com'
    expect(await requireAdmin(req())).toBeNull()
  })

  it('rejects a deactivated account even when it has the admin role', async () => {
    setDbRoles({ role: 'admin', is_active: false, permissions: [] })
    const res = await requireAdmin(req())
    expect(res?.status).toBe(403)
  })

  it('allows staff holding the required permission', async () => {
    setDbRoles({ role: 'staff', is_active: true, permissions: ['orders'] })
    expect(await requireAdmin(req(), 'orders')).toBeNull()
  })

  it('rejects staff missing the required permission', async () => {
    setDbRoles({ role: 'staff', is_active: true, permissions: ['products'] })
    const res = await requireAdmin(req(), 'orders')
    expect(res?.status).toBe(403)
  })

  it('allows staff when the route requires no specific permission', async () => {
    setDbRoles({ role: 'staff', is_active: true, permissions: [] })
    expect(await requireAdmin(req())).toBeNull()
  })

  it("never delegates the 'staff' scope to staff themselves", async () => {
    setDbRoles({ role: 'staff', is_active: true, permissions: ['orders', 'products', 'settings'] })
    const res = await requireAdmin(req(), 'staff')
    expect(res?.status).toBe(403)
  })

  it("allows full admins through the 'staff' scope", async () => {
    setDbRoles({ role: 'admin', is_active: true, permissions: [] })
    expect(await requireAdmin(req(), 'staff')).toBeNull()
  })

  it('returns 500 when the role lookup throws', async () => {
    holders.admin = {
      from: () => {
        throw new Error('db down')
      },
      rpc: vi.fn(),
    }
    const res = await requireAdmin(req())
    expect(res?.status).toBe(500)
  })
})
