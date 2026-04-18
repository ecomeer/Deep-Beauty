import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-admin'

export async function GET(req: NextRequest) {
  const _authErr = await requireAdmin(req)
  if (_authErr) return _authErr
  const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data || [] })
}

export async function POST(req: NextRequest) {
  const _authErr = await requireAdmin(req)
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
