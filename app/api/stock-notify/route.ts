import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { stockNotifyLimiter, getClientIp } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  if (!stockNotifyLimiter(getClientIp(req))) {
    return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 })
  }

  const body = await req.json()
  const { productId, email } = body as { productId?: string; email?: string }

  if (!productId) return NextResponse.json({ error: 'المنتج مطلوب' }, { status: 400 })
  if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: 'بريد إلكتروني غير صحيح' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('stock_notifications')
    .upsert(
      { product_id: productId, email: email.trim().toLowerCase(), notified: false },
      { onConflict: 'product_id,email' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
