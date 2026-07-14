import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { escapeOrFilterValue } from '@/lib/utils'
import { getKuwaitDateRange } from '@/lib/kuwait-time'
import { ORDER_STATUSES } from '@/lib/order-status'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'orders')
  if (_authErr) return _authErr
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const exporting = searchParams.get('export') === 'true'
  const page  = Math.max(1, Number.parseInt(searchParams.get('page')  || '1', 10) || 1)
  const limit = Math.min(200, Math.max(1, Number.parseInt(searchParams.get('limit') || '100', 10) || 100))
  const from  = (page - 1) * limit
  const to    = from + limit - 1

  let query = supabaseAdmin
    .from('orders')
    .select('id,order_number,created_at,customer_name,customer_phone,address_area,total,status,payment_method,payment_status', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (!exporting) query = query.range(from, to)

  if (status && status !== 'all') {
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'حالة طلب غير صحيحة' }, { status: 400 })
    }
    query = query.eq('status', status)
  }

  try {
    const range = getKuwaitDateRange(dateFrom, dateTo)
    if (range.from) query = query.gte('created_at', range.from)
    if (range.to) query = query.lte('created_at', range.to)
  } catch {
    return NextResponse.json({ error: 'نطاق التاريخ غير صحيح' }, { status: 400 })
  }

  if (search) {
    const pattern = escapeOrFilterValue(`%${search}%`)
    query = query.or(
      `order_number.ilike.${pattern},customer_name.ilike.${pattern},customer_phone.ilike.${pattern}`
    )
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const total = count ?? 0
  return NextResponse.json({ orders: data || [], total, page, limit, totalPages: exporting ? 1 : Math.max(1, Math.ceil(total / limit)) })
}
