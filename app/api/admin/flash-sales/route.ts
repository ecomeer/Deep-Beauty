import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { data, error } = await supabaseAdmin
    .from('flash_sales')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sales: data || [] })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { name_ar, discount_percentage, starts_at, ends_at, apply_to, is_active } = body

    if (!name_ar || !discount_percentage || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('flash_sales')
      .insert([{ name_ar, discount_percentage, starts_at, ends_at, apply_to: apply_to || 'all', is_active: is_active ?? true }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sale: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const body = await req.json()
    const { id, ...updates } = body

    const { data, error } = await supabaseAdmin
      .from('flash_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ sale: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('flash_sales').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
