import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr

  const { data, error } = await supabaseAdmin
    .from('abandoned_carts')
    .select('id, customer_name, customer_phone, customer_email, items, subtotal, recovered, created_at, updated_at')
    .eq('recovered', false)
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ carts: data ?? [] })
}
