import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'
import { escapeOrFilterValue } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface ProductRow {
  id: string
  category?: string | null
  price: number
  name_ar?: string
  name_en?: string
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')      // category slug
    const featured  = searchParams.get('featured')     // 'true' | null
    const search    = searchParams.get('search')       // text search
    const rawLimit  = parseInt(searchParams.get('limit') || '20')
    // FIXED: clamp limit to protect query performance.
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('products')
      .select('id, name_ar, name_en, slug, description_ar, description_en, price, compare_price, images, category, stock_quantity, is_active, is_featured, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    if (search) {
      // Values are quoted/escaped so a comma or paren in `search` can't
      // truncate the pattern or inject extra filter clauses.
      const pattern = escapeOrFilterValue(`%${search}%`)
      query = query.or(`name_ar.ilike.${pattern},name_en.ilike.${pattern}`)
    }

    // FIXED: fetch flash discount in parallel with products query.
    const [{ data: products, error }, flashSales] = await Promise.all([
      query,
      getActiveFlashSales(),
    ])

    if (error) {
      console.error('Products API error:', error)
      return NextResponse.json({ error: 'فشل في جلب المنتجات' }, { status: 500 })
    }

    let normalizedCategory: string | null = null
    if (category) {
      // FIXED: resolve category slug -> Arabic/English names to match product.category text field.
      const { data: categoryRow } = await supabase
        .from('categories')
        .select('name_ar, name_en, slug')
        .eq('slug', category)
        .maybeSingle()
      normalizedCategory = categoryRow?.name_ar || categoryRow?.name_en || categoryRow?.slug || category
    }

    const filtered = normalizedCategory
      ? (products || []).filter((p: ProductRow) => {
          const c = (p.category || '').toLowerCase()
          const n = normalizedCategory!.toLowerCase()
          return c === n
        })
      : (products || [])

    const withSalePrice = filtered.map((p: ProductRow) => ({
      ...p,
      sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
    }))

    return NextResponse.json(
      { products: withSalePrice, total: withSalePrice.length },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('Products API exception:', err)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
