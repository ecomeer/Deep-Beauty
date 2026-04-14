import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  // Read all customers from orders (includes guest checkout customers)
  let query = supabaseAdmin
    .from('orders')
    .select('customer_name, customer_phone, customer_email, total, created_at')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate by phone number
  const map = new Map<string, {
    full_name: string
    phone: string
    email: string | null
    orders_count: number
    total_spent: number
    last_order_at: string
  }>()

  for (const order of data || []) {
    const key = order.customer_phone || order.customer_email || order.customer_name
    const existing = map.get(key)
    if (existing) {
      existing.orders_count += 1
      existing.total_spent += Number(order.total)
      if (order.created_at > existing.last_order_at) existing.last_order_at = order.created_at
    } else {
      map.set(key, {
        full_name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        orders_count: 1,
        total_spent: Number(order.total),
        last_order_at: order.created_at,
      })
    }
  }

  const customers = Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent)

  return NextResponse.json({ customers, total: customers.length })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, full_name, phone, role = 'customer' } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        role,
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
