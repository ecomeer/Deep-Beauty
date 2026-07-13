import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'
import { escapeOrFilterValue } from '@/lib/utils'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()
  const category = searchParams.get('category')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabaseAdmin
    .from('products')
    .select('id,name_ar,name_en,slug,category,price,compare_price,stock_quantity,images,is_active,is_featured,created_at', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (search) {
    const pattern = escapeOrFilterValue(`%${search}%`)
    query = query.or(`name_ar.ilike.${pattern},name_en.ilike.${pattern}`)
  }
  if (category) {
    query = query.eq('category', category)
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    products: data || [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req, 'products')
  if (_authErr) return _authErr
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name_ar: body.name_ar,
      name_en: body.name_en,
      slug: body.slug,
      category: body.category || null,
      price: body.price,
      compare_price: body.compare_price || null,
      stock_quantity: body.stock_quantity,
      weight_grams: body.weight_grams || null,
      is_active: body.is_active,
      is_featured: body.is_featured,
      description_ar: body.description_ar || null,
      description_en: body.description_en || null,
      ingredients_ar: body.ingredients_ar || null,
      ingredients_en: body.ingredients_en || null,
      images: body.images || [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
