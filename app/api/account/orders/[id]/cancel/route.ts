import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireUser()
  if (authError) return authError

  const { id } = await params

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, user_id, payment_status, payment_method')
    .eq('id', id)
    .single()

  if (fetchErr || !order) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })
  if (order.user_id !== user.id) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  if (order.status !== 'pending') {
    return NextResponse.json(
      { error: 'لا يمكن إلغاء الطلب بعد تأكيده. تواصل معنا عبر واتساب' },
      { status: 400 }
    )
  }

  // Condition the update on the order still being pending (re-checked
  // atomically here, not just in the read above) and check whether a row
  // actually flipped — Postgres serializes concurrent UPDATEs on the same
  // row, so only the first of two racing cancel requests will see `data`
  // back and restock, closing a double-restock race.
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'لا يمكن إلغاء الطلب بعد تأكيده. تواصل معنا عبر واتساب' }, { status: 400 })

  const { error: restockErr } = await supabaseAdmin.rpc('restock_order_atomic', { p_order_id: id })
  if (restockErr) {
    // The cancellation itself succeeded and must not be rolled back here —
    // surface the restock failure so it isn't silently lost to server logs.
    console.error('Failed to restock cancelled order:', restockErr)
    return NextResponse.json({ ok: true, restockWarning: true })
  }

  return NextResponse.json({ ok: true })
}
