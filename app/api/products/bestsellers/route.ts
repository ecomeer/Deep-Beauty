import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getActiveFlashSales, bestDiscountForProduct, applyDiscount } from '@/lib/flash-sale'
import { getProductRatings } from '@/lib/recommendations'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '4', 10)
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(24, Math.max(1, requestedLimit))
      : 4

    // The aggregation reads order history and therefore stays private. The
    // public route exposes only the returned active product rows.
    const { data: products, error } = await supabaseAdmin.rpc('get_bestseller_products', {
      p_limit: limit,
    })

    if (error) {
      console.error('Bestsellers error:', error)
      return NextResponse.json(
        { error: 'فشل في جلب الأكثر مبيعاً' },
        { status: 500 }
      )
    }

    const rows = (products || []) as (Record<string, unknown> & { id: string; price: number; category?: string | null })[]
    const [flashSales, ratings] = await Promise.all([
      getActiveFlashSales(),
      getProductRatings(rows.map((p) => p.id)),
    ])
    const withSalePrice = rows.map((p) => ({
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
    console.error('Bestsellers API error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    )
  }
}
