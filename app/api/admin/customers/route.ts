import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req, 'customers')
  if (authError) return authError
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  // Export mode returns the whole filtered set (capped) for CSV.
  const exportAll = searchParams.get('all') === '1'
  const page = exportAll ? 1 : Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = exportAll ? 100000 : PAGE_SIZE

  const { data, error } = await supabaseAdmin.rpc('get_admin_customers', {
    p_search: search || null,
    p_page: page,
    p_page_size: pageSize,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = data as { customers: unknown[]; total: number } | null
  const total = result?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return NextResponse.json({
    customers: result?.customers ?? [],
    total,
    page,
    pageSize,
    totalPages,
  })
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req, 'customers')
  if (authError) return authError

  try {
    const body = await req.json()
    const rawName = typeof body.name === 'string' ? body.name : body.full_name
    const name = typeof rawName === 'string' ? rawName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (!name || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'البريد والاسم الكامل مطلوبان' }, { status: 400 })
    }

    // Creating a customer must create an Auth identity first. The trusted
    // auth.users trigger creates public.users with role=customer; request-body
    // role/permissions values are intentionally ignored.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name, phone: phone || null },
      redirectTo: `${siteUrl}/auth/callback?next=/account`,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const invitedUser = data.user
    if (!invitedUser) {
      return NextResponse.json({ error: 'تعذر إنشاء دعوة العميل' }, { status: 500 })
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('users')
      .update({ name, phone: phone || null, role: 'customer', is_active: true, permissions: [] })
      .eq('id', invitedUser.id)
      .select('id,email,name,phone,role,is_active,created_at')
      .maybeSingle()

    if (customerError) return NextResponse.json({ error: customerError.message }, { status: 500 })

    return NextResponse.json(
      customer ?? {
        id: invitedUser.id,
        email: invitedUser.email,
        name,
        phone: phone || null,
        role: 'customer',
        is_active: true,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
