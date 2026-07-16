import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = readFileSync(
  join(root, 'supabase/migrations/20260717010000_security_authorization_hardening.sql'),
  'utf8'
)
const checkoutRoute = readFileSync(join(root, 'app/api/checkout/route.ts'), 'utf8')

describe('security hardening migration contract', () => {
  it('adds a versioned secure checkout RPC without dropping the live legacy RPC', () => {
    expect(migration).toContain('CREATE FUNCTION public.create_order_atomic_secure(')
    expect(migration).not.toContain('DROP FUNCTION IF EXISTS public.create_order_atomic(jsonb, jsonb, text)')
    expect(migration).toContain(
      'REVOKE ALL ON FUNCTION public.create_order_atomic(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;'
    )
  })

  it('routes new checkout traffic through the secure atomic RPC', () => {
    expect(checkoutRoute).toContain(".rpc('create_order_atomic_secure'")
  })

  it('removes direct privilege-bearing profile writes from browser roles', () => {
    expect(migration).toContain(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER\n  ON TABLE public.users FROM anon, authenticated;'
    )
    expect(migration).toContain('DROP POLICY IF EXISTS admin_all_flash_sales ON public.flash_sales;')
  })
})
