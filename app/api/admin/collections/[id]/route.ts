import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { revalidateCollection } from '@/lib/revalidate-storefront'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const { id } = await params

  const { data: collection, error } = await supabaseAdmin
    .from('collections')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  const { data: links } = await supabaseAdmin
    .from('collection_products')
    .select('id, product_id, sort_order, products(id, name_ar, name_en, slug, images, price, is_active, stock_quantity)')
    .eq('collection_id', id)
    .order('sort_order')

  return NextResponse.json({ collection, products: links || [] })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const { id } = await params
  const body = await req.json()

  const allowed = ['name_ar', 'name_en', 'slug', 'description_ar', 'description_en', 'image_url', 'status', 'is_featured', 'sort_order']
  const updateFields: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updateFields[key] = body[key]
  }

  const { data, error } = await supabaseAdmin
    .from('collections')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidateCollection(data?.slug)
  return NextResponse.json({ data })
}

// Soft delete — collections may be referenced by past marketing links/SEO;
// hiding it (deleted_at + inactive) instead of a hard DELETE keeps history
// intact while making it disappear from the storefront immediately.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('collections')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', id)
    .select('slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidateCollection(data?.slug)
  return NextResponse.json({ ok: true })
}
