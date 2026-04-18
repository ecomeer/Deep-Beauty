import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json({ product: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  try {
    const { id } = await params

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body', details: String(parseError) }, { status: 400 })
    }

    const allowed = [
      'name_ar','name_en','slug','category','price','compare_price',
      'stock_quantity','weight_grams','is_active','is_featured',
      'description_ar','description_en','ingredients_ar','ingredients_en','images',
    ]
    const updateFields: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updateFields[key] = body[key]
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { id } = await params
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
