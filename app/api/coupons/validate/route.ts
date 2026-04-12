import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json()
  if (!code) return NextResponse.json({ error: 'كود مطلوب' }, { status: 400 })

  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !coupon) return NextResponse.json({ error: 'كود غير صحيح' }, { status: 404 })
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return NextResponse.json({ error: 'الكود منتهي الصلاحية' }, { status: 400 })
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit)
    return NextResponse.json({ error: 'تجاوز هذا الكود الحد الأقصى للاستخدام' }, { status: 400 })
  if (subtotal < coupon.min_order_amount)
    return NextResponse.json({ error: `الحد الأدنى للطلب ${coupon.min_order_amount}` }, { status: 400 })

  let discount = coupon.type === 'percentage'
    ? (subtotal * coupon.value) / 100
    : coupon.value
  if (coupon.max_discount_amount) discount = Math.min(discount, coupon.max_discount_amount)

  return NextResponse.json({ code: coupon.code, discount, type: coupon.type, value: coupon.value })
}
