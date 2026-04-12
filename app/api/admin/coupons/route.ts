import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, discount_type, discount_value, min_order_amount, max_usage, expires_at, is_active } = body

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert([{
        code: code.toUpperCase().trim(),
        discount_type,
        discount_value,
        min_order_amount: min_order_amount || 0,
        max_usage: max_usage || null,
        expires_at: expires_at || null,
        is_active: is_active ?? true,
        usage_count: 0,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
