import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({
    customers: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  })
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
