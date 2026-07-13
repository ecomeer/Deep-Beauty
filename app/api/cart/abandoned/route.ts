import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isKuwaitPhone } from '@/lib/utils'
import { abandonedCartLimiter, getClientIp } from '@/lib/rate-limit'

interface CartItem {
  id: string
  name_ar: string
  price: number
  quantity: number
}

// Called from the checkout page once the customer has entered a valid
// phone number and has items in the cart — debounced client-side, not on
// every keystroke. Upserts against the most recent non-recovered snapshot
// for that phone within the last 24h, rather than inserting a new row per
// call, so a customer editing the checkout form doesn't spam the table.
export async function POST(req: NextRequest) {
  if (!abandonedCartLimiter(getClientIp(req))) {
    return NextResponse.json({ error: 'طلبات كثيرة' }, { status: 429 })
  }

  const body = await req.json()
  const { customer_name, customer_phone, customer_email, items, subtotal } = body as {
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    items?: CartItem[]
    subtotal?: number
  }

  if (!customer_phone || !isKuwaitPhone(customer_phone)) {
    return NextResponse.json({ error: 'رقم هاتف غير صحيح' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 })
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabaseAdmin
    .from('abandoned_carts')
    .select('id')
    .eq('customer_phone', customer_phone)
    .eq('recovered', false)
    .gte('created_at', dayAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const row = {
    customer_name: customer_name?.trim() || null,
    customer_phone,
    customer_email: customer_email?.trim() || null,
    items,
    subtotal: subtotal ?? 0,
    updated_at: new Date().toISOString(),
  }

  const { error } = existing
    ? await supabaseAdmin.from('abandoned_carts').update(row).eq('id', existing.id)
    : await supabaseAdmin.from('abandoned_carts').insert(row)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
