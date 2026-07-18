import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { revalidateCollection } from '@/lib/revalidate-storefront'

async function collectionSlug(id: string) {
  const { data } = await supabaseAdmin.from('collections').select('slug').eq('id', id).maybeSingle()
  return data?.slug as string | undefined
}

// Add a product to the collection (appended to the end unless sort_order given).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const { id } = await params
  const body = await req.json()

  if (!body.product_id) return NextResponse.json({ error: 'product_id مطلوب' }, { status: 400 })

  let sortOrder = body.sort_order
  if (!Number.isFinite(sortOrder)) {
    const { count } = await supabaseAdmin
      .from('collection_products')
      .select('id', { count: 'exact', head: true })
      .eq('collection_id', id)
    sortOrder = count ?? 0
  }

  const { data, error } = await supabaseAdmin
    .from('collection_products')
    .insert({ collection_id: id, product_id: body.product_id, sort_order: sortOrder })
    .select()
    .single()

  if (error) {
    const message = error.code === '23505' ? 'هذا المنتج مضاف بالفعل للمجموعة' : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }
  revalidateCollection(await collectionSlug(id))
  return NextResponse.json({ data })
}

// Bulk reorder: body { items: [{ id: collection_products.id, sort_order }] }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const { id } = await params
  const body = await req.json()
  const items: { id: string; sort_order: number }[] = Array.isArray(body.items) ? body.items : []

  if (items.length === 0) return NextResponse.json({ error: 'لا توجد عناصر لإعادة ترتيبها' }, { status: 400 })

  const results = await Promise.all(
    items.map((item) =>
      supabaseAdmin
        .from('collection_products')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('collection_id', id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 400 })

  revalidateCollection(await collectionSlug(id))
  return NextResponse.json({ ok: true })
}

// Remove a product from the collection: ?linkId=<collection_products.id>
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const { id } = await params
  const linkId = new URL(req.url).searchParams.get('linkId')
  if (!linkId) return NextResponse.json({ error: 'linkId مطلوب' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('collection_products')
    .delete()
    .eq('id', linkId)
    .eq('collection_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidateCollection(await collectionSlug(id))
  return NextResponse.json({ ok: true })
}
