import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      image_url: body.image_url || null,
      is_active: body.is_active ?? true,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
