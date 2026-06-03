import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json()
  if (!code) return NextResponse.json({ error: 'كود مطلوب' }, { status: 400 })

  const { data, error } = await supabaseAdmin.rpc('validate_and_use_coupon', {
    p_code: code.trim().toUpperCase(),
    p_subtotal: subtotal ?? 0,
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('INVALID_CODE')) return NextResponse.json({ error: 'كود غير صحيح' }, { status: 404 })
    if (msg.includes('EXPIRED')) return NextResponse.json({ error: 'الكود منتهي الصلاحية' }, { status: 400 })
    if (msg.includes('LIMIT_REACHED')) return NextResponse.json({ error: 'تجاوز هذا الكود الحد الأقصى للاستخدام' }, { status: 400 })
    if (msg.includes('MIN_AMOUNT:')) {
      const min = msg.split('MIN_AMOUNT:')[1]?.trim()
      return NextResponse.json({ error: `الحد الأدنى للطلب ${min}` }, { status: 400 })
    }
    return NextResponse.json({ error: 'كود غير صحيح' }, { status: 400 })
  }

  if (!data) return NextResponse.json({ error: 'كود غير صحيح' }, { status: 404 })

  return NextResponse.json(data as { code: string; discount: number; type: string; value: number })
}
