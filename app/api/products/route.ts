import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getActiveFlashDiscount, applyDiscount } from '@/lib/flash-sale'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')      // category slug
    const featured  = searchParams.get('featured')     // 'true' | null
    const search    = searchParams.get('search')       // text search
    const limit     = parseInt(searchParams.get('limit') || '20')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('products')
      .select('*, categories(id, name_ar, name_en, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      query = query.ilike('name_ar', `%${search}%`)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Products API error:', error)
      return NextResponse.json({ error: 'فشل في جلب المنتجات' }, { status: 500 })
    }

    // Filter by category slug after join (Supabase doesn't support nested .eq on joined tables easily)
    const filtered = category
      ? (products || []).filter(
          (p: any) => p.categories?.slug === category
        )
      : (products || [])

    const flashDiscount = await getActiveFlashDiscount()
    const withSalePrice = filtered.map((p: any) => ({
      ...p,
      sale_price: applyDiscount(p.price, flashDiscount),
    }))

    return NextResponse.json({ products: withSalePrice, total: withSalePrice.length })
  } catch (err) {
    console.error('Products API exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
