import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''

  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit = Math.min(200, parseInt(searchParams.get('limit') || '100'))
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  let query = supabaseAdmin
    .from('orders')
    .select('id,order_number,created_at,customer_name,customer_phone,address_area,total,status,payment_method,payment_status', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data || [], total: count ?? 0, page, limit })
}
