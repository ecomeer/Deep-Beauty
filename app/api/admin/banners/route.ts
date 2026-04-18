import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { data, error } = await supabaseAdmin.from('banners').select('*').order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banners: data || [] })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('banners')
    .insert({
      title_ar: body.title_ar,
      subtitle_ar: body.subtitle_ar || null,
      image_url: body.image_url,
      link_url: body.link_url || '/products',
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
