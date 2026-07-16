import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import { createSupabaseMock } from '@/test/helpers/supabase-mock'

const holders = vi.hoisted(() => ({
  getUser: undefined as unknown as ReturnType<typeof vi.fn>,
  from: undefined as unknown,
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: holders.getUser },
    from: holders.from,
  }),
}))

import { proxy } from './proxy'

const ORIGINAL_ENV = { ...process.env }

const user = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  app_metadata: {},
  user_metadata: {},
  ...overrides,
})

function setAuth(u: Record<string, unknown> | null, dbRole: string | null = null) {
  holders.getUser = vi.fn().mockResolvedValue({ data: { user: u } })
  holders.from = createSupabaseMock({
    tables: { users: { data: dbRole ? { role: dbRole } : null } },
  }).client.from
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  delete process.env.NEXT_PUBLIC_DEV_BYPASS
  delete process.env.ADMIN_EMAILS
  delete process.env.ADMIN_EMAIL
  setAuth(null)
})

afterAll(() => {
  process.env = { ...ORIGINAL_ENV }
})

const req = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost${path}`, { headers })

function expectRedirect(res: Response, to: string) {
  expect(res.status).toBeGreaterThanOrEqual(300)
  expect(res.status).toBeLessThan(400)
  expect(res.headers.get('location')).toContain(to)
}

describe('proxy (admin gating middleware)', () => {
  it('redirects admin routes to login when Supabase env is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const res = await proxy(req('/admin/dashboard'))
    expectRedirect(res, '/admin/login')
  })

  it('still serves the login page itself when Supabase env is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const res = await proxy(req('/admin/login'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects unauthenticated visitors off admin routes', async () => {
    const res = await proxy(req('/admin/orders'))
    expectRedirect(res, '/admin/login')
  })

  it('redirects authenticated non-admin users off admin routes', async () => {
    setAuth(user())
    const res = await proxy(req('/admin/orders'))
    expectRedirect(res, '/admin/login')
  })

  it('lets a metadata admin through', async () => {
    setAuth(user({ app_metadata: { role: 'admin' } }))
    const res = await proxy(req('/admin/orders'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('lets an allowlisted email through', async () => {
    process.env.ADMIN_EMAILS = 'user@example.com'
    setAuth(user())
    const res = await proxy(req('/admin/orders'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('lets a staff account (DB role) through', async () => {
    setAuth(user(), 'staff')
    const res = await proxy(req('/admin/orders'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('does not treat a plain customer DB role as staff', async () => {
    setAuth(user(), 'customer')
    const res = await proxy(req('/admin/orders'))
    expectRedirect(res, '/admin/login')
  })

  it('bounces an already-signed-in admin from the login page to the dashboard', async () => {
    setAuth(user({ app_metadata: { role: 'admin' } }))
    const res = await proxy(req('/admin/login'))
    expectRedirect(res, '/admin/dashboard')
  })

  it('serves the login page to anonymous visitors', async () => {
    const res = await proxy(req('/admin/login'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('breaks a login redirect loop by clearing session cookies', async () => {
    const res = await proxy(
      req('/admin/login', { referer: 'http://localhost/admin/login' })
    )
    expect(res.headers.get('location')).toBeNull()
    const setCookies = res.headers.getSetCookie().join(';')
    expect(setCookies).toContain('sb-access-token=')
    expect(setCookies).toContain('sb-refresh-token=')
  })

  it('bypasses the gate entirely in dev-bypass mode', async () => {
    process.env.NEXT_PUBLIC_DEV_BYPASS = 'true'
    const res = await proxy(req('/admin/orders'))
    expect(res.headers.get('location')).toBeNull()
  })
})
