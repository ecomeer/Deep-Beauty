import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const signInWithPassword = vi.hoisted(() => vi.fn())
const applyCookies = vi.hoisted(() => vi.fn((res: Response) => res))

vi.mock('@/lib/supabase-server', () => ({
  createWritableServerClient: () => ({
    supabase: { auth: { signInWithPassword } },
    applyCookies,
  }),
}))

import { POST } from './route'

const post = (body: unknown) =>
  POST(
    new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )

beforeEach(() => {
  signInWithPassword.mockReset()
  applyCookies.mockClear()
  signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })
})

describe('POST /api/auth/login', () => {
  it('requires email and password', async () => {
    expect((await post({ email: 'a@b.com' })).status).toBe(400)
    expect((await post({ password: 'x' })).status).toBe(400)
  })

  it('returns 401 on wrong credentials without leaking details', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    const res = await post({ email: 'a@b.com', password: 'wrong' })
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('بيانات الدخول غير صحيحة')
  })

  it('returns the user and applies session cookies on success', async () => {
    const res = await post({ email: 'a@b.com', password: 'secret' })
    expect(res.status).toBe(200)
    expect((await res.json()).user).toEqual({ id: 'u1', email: 'a@b.com' })
    expect(applyCookies).toHaveBeenCalledOnce()
  })

  it('returns 500 on malformed JSON', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/auth/login', { method: 'POST', body: '{not json' })
    )
    expect(res.status).toBe(500)
  })
})
