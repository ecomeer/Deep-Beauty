import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getActiveFlashDiscount, applyDiscount } from '@/lib/flash-sale'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '4')
    
    const supabase = await createServerSupabaseClient()

    // Real bestsellers ranking based on order_items, falling back to
    // is_featured products when there's no order history yet.
    const { data: products, error } = await supabase.rpc('get_bestseller_products', { p_limit: limit })

    if (error) {
      console.error('Bestsellers error:', error)
      return NextResponse.json(
        { error: 'فشل في جلب الأكثر مبيعاً' },
        { status: 500 }
      )
    }

    const flashDiscount = await getActiveFlashDiscount()
    const withSalePrice = (products || []).map((p: Record<string, unknown> & { price: number }) => ({
      ...p,
      sale_price: applyDiscount(p.price, flashDiscount),
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
