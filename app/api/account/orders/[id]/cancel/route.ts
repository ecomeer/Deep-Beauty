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
    .select('id, status, user_id')
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

  // Only the first racing request can transition pending -> cancelled.
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'لا يمكن إلغاء الطلب بعد تأكيده. تواصل معنا عبر واتساب' }, { status: 400 })

  // Restock, release coupon usage, refund redeemed points, and reverse only
  // points that were actually awarded. The RPC is idempotent.
  const { error: reverseError } = await supabaseAdmin.rpc('cancel_order_effects_atomic', {
    p_order_id: id,
  })
  if (reverseError) {
    console.error('Failed to reverse cancelled order effects:', reverseError)
    return NextResponse.json({ ok: true, reversalWarning: true })
  }

  return NextResponse.json({ ok: true })
}
