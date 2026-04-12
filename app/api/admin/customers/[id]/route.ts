import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (customerError) return NextResponse.json({ error: customerError.message }, { status: 500 })

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, total_amount, status, created_at')
    .eq('customer_email', customer.email)
    .order('created_at', { ascending: false })
    .limit(10)

  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 })

  return NextResponse.json({
    customer,
    orders: orders || []
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json()
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
