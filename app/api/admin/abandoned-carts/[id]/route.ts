import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

// Dismiss a cart from the recovery list (e.g. the admin already contacted
// the customer, or recovered them manually) without deleting the record.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'marketing')
  if (_authErr) return _authErr
  const { id } = await params

  const { error } = await supabaseAdmin
    .from('abandoned_carts')
    .update({ recovered: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
