import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { revalidateStorefront } from '@/lib/revalidate-storefront'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr

  const { data, error } = await supabaseAdmin
    .from('collections')
    .select('*, collection_products(count)')
    .is('deleted_at', null)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const collections = (data || []).map((c) => {
    const { collection_products, ...rest } = c as typeof c & { collection_products: { count: number }[] }
    return { ...rest, product_count: collection_products?.[0]?.count ?? 0 }
  })

  return NextResponse.json({ collections })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const body = await req.json()

  if (!body.name_ar || !body.name_en || !body.slug) {
    return NextResponse.json({ error: 'الاسم والـ slug مطلوبة' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('collections')
    .insert({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      description_ar: body.description_ar || null,
      description_en: body.description_en || null,
      image_url: body.image_url || null,
      status: body.status === 'inactive' ? 'inactive' : 'active',
      is_featured: !!body.is_featured,
      sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  revalidateStorefront()
  return NextResponse.json({ data })
}
