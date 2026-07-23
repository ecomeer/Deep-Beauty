import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { escapeOrFilterValue } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'orders')
  if (_authErr) return _authErr
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''
  const dateFrom = searchParams.get('from') // YYYY-MM-DD
  const dateTo = searchParams.get('to')     // YYYY-MM-DD
  // Export mode returns the whole filtered set (capped) for CSV.
  const exportAll = searchParams.get('all') === '1'
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit = exportAll ? 5000 : Math.min(200, parseInt(searchParams.get('limit') || '100'))
  const from  = exportAll ? 0 : (page - 1) * limit
  const to    = from + limit - 1

  let query = supabaseAdmin
    .from('orders')
    .select('id,order_number,created_at,customer_name,customer_phone,address_area,total,status,payment_method,payment_status', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (dateFrom) {
    query = query.gte('created_at', new Date(dateFrom + 'T00:00:00').toISOString())
  }
  if (dateTo) {
    query = query.lte('created_at', new Date(dateTo + 'T23:59:59.999').toISOString())
  }

  if (search) {
    const pattern = escapeOrFilterValue(`%${search}%`)
    query = query.or(
      `order_number.ilike.${pattern},customer_name.ilike.${pattern},customer_phone.ilike.${pattern}`
    )
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    orders: data || [],
    total: count ?? 0,
    page,
    limit,
    // The orders page reads `totalPages` to drive its pager; without it the
    // pager was permanently hidden and only the first page was reachable.
    totalPages: exportAll ? 1 : Math.max(1, Math.ceil((count ?? 0) / limit)),
  })
}
