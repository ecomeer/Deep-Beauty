import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const readText = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const migration = readText(
  join(root, 'supabase/migrations/20260717010000_security_authorization_hardening.sql')
)
const checkoutRoute = readText(join(root, 'app/api/checkout/route.ts'))
const bestsellersRoute = readText(join(root, 'app/api/products/bestsellers/route.ts'))
const staffRoute = readText(join(root, 'app/api/admin/staff/route.ts'))

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

  it('keeps the private bestseller RPC reachable only through trusted server code', () => {
    expect(migration).toContain(
      'REVOKE EXECUTE ON FUNCTION public.get_bestseller_products(integer) FROM PUBLIC, anon, authenticated;'
    )
    expect(bestsellersRoute).toContain("import { supabaseAdmin } from '@/lib/supabase-admin'")
    expect(bestsellersRoute).toContain("supabaseAdmin.rpc('get_bestseller_products'")
  })

  it('updates the auth-trigger-created staff row instead of inserting a duplicate', () => {
    expect(staffRoute).toContain(".from('users')\n    .update({")
    expect(staffRoute).not.toContain(".from('users')\n    .insert({")
  })

  it('removes direct privilege-bearing profile writes from browser roles', () => {
    expect(migration).toContain(
      'REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER\n  ON TABLE public.users FROM anon, authenticated;'
    )
    expect(migration).toContain('DROP POLICY IF EXISTS admin_all_flash_sales ON public.flash_sales;')
  })
})
