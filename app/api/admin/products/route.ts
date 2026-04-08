import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
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
