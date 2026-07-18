import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'
import { getProductRatings } from '@/lib/recommendations'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')

    const supabase = await createServerSupabaseClient()

    const [{ data: products, error }, flashSales] = await Promise.all([
      supabase
        .from('products')
        .select('id, name_ar, name_en, slug, description_ar, description_en, price, compare_price, images, category, stock_quantity, is_active, is_featured, created_at')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit),
      getActiveFlashSales(),
    ])

    if (error) {
      console.error('Featured products error:', error)
      return NextResponse.json({ error: 'فشل في جلب المنتجات المميزة' }, { status: 500 })
    }

    const ratings = await getProductRatings((products || []).map(p => p.id))

    const withSalePrice = (products || []).map(p => ({
      ...p,
      sale_price: applyDiscount(p.price, bestDiscountForProduct(p, flashSales)),
      rating: ratings[p.id]?.average_rating ?? null,
      review_count: ratings[p.id]?.review_count ?? 0,
    }))

    return NextResponse.json(
      { products: withSalePrice },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
    )
  } catch (error) {
    console.error('Featured products API error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
