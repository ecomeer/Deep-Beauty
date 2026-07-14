import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'customers')
  if (_authErr) return _authErr
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  // Aggregate + paginate customers entirely in SQL (see get_admin_customers)
  const { data, error } = await supabaseAdmin.rpc('get_admin_customers', {
    p_search: search || null,
    p_page: page,
    p_page_size: PAGE_SIZE,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = data as { customers: unknown[]; total: number } | null
  const total = result?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return NextResponse.json({ customers: result?.customers ?? [], total, page, pageSize: PAGE_SIZE, totalPages })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'customers')
  if (_authErr) return _authErr
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
